import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';
import { getNextStudentId, getNextRollNumber } from '@/utils/student-utils';

export async function POST(req: NextRequest) {
    let body: any = {};
    try {
        body = await req.json();
        let { name, phone, email, instituteId, metadata, guardianName, guardianPhone, guardianPassword, password: studentPassword } = body;

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        // Use studentPhone from metadata if top-level phone is missing (fallback)
        if (!phone && metadata?.studentPhone) phone = metadata.studentPhone;

        if (!phone) {
            return NextResponse.json({ message: 'শিক্ষার্থীর মোবাইল নম্বর অবশ্যই দিতে হবে।' }, { status: 400 });
        }

        // --- Rigorous Duplicate Checks ---
        const studentId = metadata?.studentId || phone;

        // Check Student ID, Phone, Email
        const studentChecks: any[] = [{ phone: phone }];
        if (studentId) studentChecks.push({ "metadata.studentId": studentId });
        if (email && email.trim() !== '') studentChecks.push({ email: email.trim() });

        const existingStudent = await prisma.user.findFirst({
            where: {
                instituteIds: { has: instituteId },
                role: 'STUDENT',
                OR: studentChecks
            }
        });

        if (existingStudent) {
            let field = 'mobile';
            if (existingStudent.email === email?.trim()) field = 'email';
            if ((existingStudent.metadata as any)?.studentId === studentId) field = 'Student ID';

            return NextResponse.json({
                message: `এই ${field} দিয়ে ইতোমধ্যে একটি শিক্ষার্থী অ্যাকাউন্ট আছে। দয়া করে ভিন্ন তথ্য ব্যবহার করুন।`,
                duplicateField: field
            }, { status: 400 });
        }

        // Check Guardian duplicate phone/email
        const gPhone = guardianPhone?.trim();
        const gEmail = metadata?.guardianEmail?.trim();

        if (gPhone) {
            // Check if this guardian already exists but with a DIFFERENT role (unlikely but possible)
            // Or just check for general user with this phone
            const existingUser = await prisma.user.findFirst({
                where: { phone: gPhone }
            });

            if (existingUser && existingUser.role !== 'GUARDIAN') {
                return NextResponse.json({
                    message: 'এই অভিভাবক মোবাইল নম্বরটি ইতোমধ্যে অন্য একটি অ্যাকাউন্টে (যেমন: শিক্ষক বা স্টাফ) ব্যবহার করা হয়েছে।',
                    duplicateField: 'guardianPhone'
                }, { status: 400 });
            }
        }

        // --- Auto-assign Student ID & Roll Number ---
        const finalMetadata = { ...(metadata || {}) };
        finalMetadata.studentId = studentId;

        if (!finalMetadata.rollNumber && finalMetadata.classId) {
            finalMetadata.rollNumber = await getNextRollNumber(instituteId, finalMetadata.classId);
        }

        const password = studentPassword || finalMetadata.studentId; // Default student password
        const instIds = [instituteId];

        // Create Student
        const newStudent = await prisma.user.create({
            data: {
                name: String(name || ''),
                phone: String(phone),
                email: email && email.trim() !== '' ? email.trim() : null,
                password: String(password),
                role: 'STUDENT',
                instituteIds: instIds,
                metadata: {
                    ...finalMetadata,
                    admissionStatus: 'PENDING'
                }
            }
        });

        // --- Guardian Handling ---
        if (gPhone && guardianName) {
            try {
                let guardian = await prisma.user.findFirst({
                    where: { phone: gPhone }
                });

                if (!guardian) {
                    // Create NEW Guardian
                    guardian = await prisma.user.create({
                        data: {
                            name: String(guardianName),
                            phone: String(gPhone),
                            password: String(guardianPassword || gPhone),
                            role: 'GUARDIAN',
                            instituteIds: instIds,
                            metadata: { childrenIds: [newStudent.id] }
                        }
                    });
                } else {
                    // Update EXISTING Guardian
                    const currentChildren = (guardian.metadata as any)?.childrenIds || [];
                    const updatedInstituteIds = Array.from(new Set([...guardian.instituteIds, instituteId]));

                    guardian = await prisma.user.update({
                        where: { id: guardian.id },
                        data: {
                            instituteIds: updatedInstituteIds,
                            metadata: {
                                ...(guardian.metadata as any),
                                childrenIds: Array.from(new Set([...currentChildren, newStudent.id]))
                            }
                        }
                    });
                }

                // Link Student to Guardian
                await prisma.user.update({
                    where: { id: newStudent.id },
                    data: {
                        metadata: {
                            ...(newStudent.metadata as any),
                            guardianId: guardian.id
                        }
                    }
                });

            } catch (gErr) {
                console.error("Public Admission Guardian Error", gErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'আবেদন সফলভাবে জমা দেওয়া হয়েছে।',
            credentials: {
                studentId: finalMetadata.studentId,
                password: password
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Public Admission CRITICAL Error:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            body: body // Log body to see what data caused the crash
        });
        return NextResponse.json({
            message: 'সার্ভার ত্রুটি। দয়া করে আবার চেষ্টা করুন।',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 500 });
    }
}

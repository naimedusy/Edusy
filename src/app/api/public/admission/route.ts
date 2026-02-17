import { NextResponse } from 'next/server';
import prisma from '@/utils/db';
import { getNextStudentId, getNextRollNumber } from '@/utils/student-utils';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        let { name, phone, email, instituteId, metadata } = body;

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        if (!phone && metadata?.phone) phone = metadata.phone;
        if (!phone) {
            return NextResponse.json({ message: 'Phone number is required' }, { status: 400 });
        }

        if ((!email || email?.trim() === '') && (!phone || phone?.trim() === '')) {
            return NextResponse.json({ message: 'ইমেইল অথবা মোবাইল নম্বর - যেকোনো একটি অবশ্যই দিতে হবে।' }, { status: 400 });
        }

        // Check if student already exists
        const studentCheckRaw = await (prisma as any).$runCommandRaw({
            find: 'User',
            filter: {
                $or: [
                    { email: email && email?.trim() !== '' ? email.trim() : 'never_match_this_val' },
                    { phone: phone }
                ]
            },
            limit: 1
        });
        const studentExists = studentCheckRaw.cursor?.firstBatch?.[0];

        if (studentExists) {
            const isEmail = studentExists.email === email?.trim();
            return NextResponse.json({
                message: `এই ${isEmail ? 'ইমেইল' : 'মোবাইল নম্বর'} দিয়ে ইতোমধ্যে একটি শিক্ষার্থী অ্যাকাউন্ট আছে। দয়া করে ভিন্ন ${isEmail ? 'ইমেইল' : 'নম্বর'} ব্যবহার করুন অথবা লগইন করুন।`,
                duplicateField: isEmail ? 'email' : 'phone'
            }, { status: 400 });
        }

        // Check for Guardian duplicate email
        if (metadata?.guardianEmail && metadata?.guardianEmail?.trim() !== '') {
            const guardianEmailCheck = await prisma.user.findFirst({
                where: { email: metadata.guardianEmail.trim() }
            });
            if (guardianEmailCheck) {
                return NextResponse.json({
                    message: 'এই অভিভাবক ইমেইলটি ইতোমধ্যে ব্যবহার করা হয়েছে। দয়া করে ভিন্ন ইমেইল ব্যবহার করুন।',
                    duplicateField: 'guardianEmail'
                }, { status: 400 });
            }
        }

        // Check for Guardian duplicate phone
        if (metadata?.guardianPhone && metadata?.guardianPhone?.trim() !== '') {
            const guardianPhoneCheck = await prisma.user.findFirst({
                where: { phone: metadata.guardianPhone.trim() }
            });
            if (guardianPhoneCheck) {
                return NextResponse.json({
                    message: 'এই অভিভাবক মোবাইল নম্বরটি ইতোমধ্যে ব্যবহার করা হয়েছে। দয়া করে ভিন্ন মোবাইল নম্বর ব্যবহার করুন।',
                    duplicateField: 'guardianPhone'
                }, { status: 400 });
            }
        }

        // --- Auto-assign Student ID & Roll Number BEFORE password ---
        const finalMetadata = { ...(metadata || {}) };

        if (!finalMetadata.studentId) {
            // In public admission, the registered 'phone' is treated as the student's primary mobile
            // So we use it as Student ID
            finalMetadata.studentId = phone;
        }

        if (!finalMetadata.rollNumber && finalMetadata.classId) {
            finalMetadata.rollNumber = await getNextRollNumber(instituteId, finalMetadata.classId);
        }

        // Default password to Student ID
        const password = finalMetadata.studentId;

        // Create Student
        const instIds = [{ $oid: instituteId }];

        const userDoc: any = {
            name: String(name || ''),
            password: String(password || ''),
            role: 'STUDENT',
            instituteIds: instIds,
            metadata: {
                ...finalMetadata,
                admissionStatus: 'PENDING'
            },
            createdAt: { $date: new Date().toISOString() },
            updatedAt: { $date: new Date().toISOString() }
        };

        if (email && email.trim() !== '') {
            userDoc.email = email.trim();
        }
        if (phone) {
            userDoc.phone = String(phone);
        }

        await (prisma as any).$runCommandRaw({
            insert: 'User',
            documents: [userDoc]
        });

        // Copy logic for Guardian Automation from Admin API (Simplified)
        if (metadata?.guardianPhone && metadata?.guardianName) {
            try {
                const guardianPhone = metadata.guardianPhone.trim();

                const existingGuardianRaw = await (prisma as any).$runCommandRaw({
                    find: 'User',
                    filter: { phone: guardianPhone },
                    limit: 1
                });
                const existingGuardian = existingGuardianRaw.cursor?.firstBatch?.[0];
                let guardianId = existingGuardian ? (existingGuardian._id?.$oid || existingGuardian._id?.toString()) : null;

                if (!existingGuardian) {
                    const guardianEmail = null;
                    const guardianPassword = metadata.guardianPassword || guardianPhone;

                    await (prisma as any).$runCommandRaw({
                        insert: 'User',
                        documents: [
                            {
                                name: String(metadata.guardianName || ''),
                                email: guardianEmail,
                                phone: String(guardianPhone || ''),
                                password: String(guardianPassword || ''),
                                role: 'GUARDIAN',
                                instituteIds: instIds,
                                metadata: { childrenIds: [] },
                                createdAt: { $date: new Date().toISOString() },
                                updatedAt: { $date: new Date().toISOString() }
                            }
                        ]
                    });

                    // Fetch newly created guardian
                    const createdGuardianRaw = await (prisma as any).$runCommandRaw({
                        find: 'User',
                        filter: { phone: guardianPhone },
                        limit: 1
                    });
                    const createdGuardian = createdGuardianRaw.cursor?.firstBatch?.[0];
                    if (createdGuardian) guardianId = createdGuardian._id?.$oid || createdGuardian._id?.toString();

                } else {
                    // Update existing guardian to add institute
                    await (prisma as any).$runCommandRaw({
                        update: 'User',
                        updates: [
                            {
                                q: { _id: { $oid: guardianId } },
                                u: { $addToSet: { instituteIds: { $each: instIds.map((i: any) => i.$oid) } } }
                            }
                        ]
                    });
                }

                // Link Student to Guardian
                // Fetch newly created student
                const studentRaw = await (prisma as any).$runCommandRaw({
                    find: 'User',
                    filter: { phone: phone },
                    limit: 1
                });
                const student = studentRaw.cursor?.firstBatch?.[0];

                if (student && guardianId) {
                    const studentId = student._id?.$oid || student._id?.toString();

                    await (prisma as any).$runCommandRaw({
                        update: 'User',
                        updates: [
                            {
                                q: { _id: { $oid: studentId } },
                                u: { $set: { "metadata.guardianId": guardianId } }
                            }
                        ]
                    });

                    await (prisma as any).$runCommandRaw({
                        update: 'User',
                        updates: [
                            {
                                q: { _id: { $oid: guardianId } },
                                u: { $addToSet: { "metadata.childrenIds": studentId } }
                            }
                        ]
                    });
                }

            } catch (gErr) {
                console.error("Public Admission Guardian Error", gErr);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Application submitted successfully',
            credentials: {
                studentId: finalMetadata.studentId,
                password: password
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Public Admission Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

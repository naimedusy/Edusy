import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

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

        // Default password and email if missing
        const password = phone;
        if (!email || email.trim() === '') {
            email = `${phone}@edusy.local`;
        }

        // Check if user already exists
        const existingUserRaw = await (prisma as any).$runCommandRaw({
            find: 'User',
            filter: {
                $or: [
                    { email: email },
                    { phone: phone }
                ]
            },
            limit: 1
        });
        const existingUser = existingUserRaw.cursor?.firstBatch?.[0];

        if (existingUser) {
            return NextResponse.json({ message: 'User with this phone/email already exists.' }, { status: 400 });
        }

        // Create Student
        const instIds = [{ $oid: instituteId }];

        await (prisma as any).$runCommandRaw({
            insert: 'User',
            documents: [
                {
                    name: name || '',
                    email: email.trim(),
                    phone: phone,
                    password: password,
                    role: 'STUDENT',
                    instituteIds: instIds,
                    metadata: metadata || null,
                    createdAt: { $date: new Date().toISOString() },
                    updatedAt: { $date: new Date().toISOString() }
                }
            ]
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
                    const guardianEmail = `guardian_${guardianPhone}@edusy.local`;
                    const guardianPassword = guardianPhone;

                    await (prisma as any).$runCommandRaw({
                        insert: 'User',
                        documents: [
                            {
                                name: metadata.guardianName,
                                email: guardianEmail,
                                phone: guardianPhone,
                                password: guardianPassword,
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

        return NextResponse.json({ success: true, message: 'Application submitted successfully' }, { status: 201 });

    } catch (error) {
        console.error('Public Admission Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

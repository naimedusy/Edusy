import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: NextRequest) {
    try {
        const { studentId, instituteId, classId, dateString, status, method, remarks } = await req.json();

        if (!studentId || !instituteId || !dateString) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Create update object
        const updateDoc: any = {
            $set: {
                studentId: { $oid: studentId },
                instituteId: { $oid: instituteId },
                dateString,
                status: status || 'PRESENT',
                method: method || 'FRS',
                updatedAt: new Date()
            }
        };

        if (classId) updateDoc.$set.classId = { $oid: classId };
        if (remarks) updateDoc.$set.remarks = remarks;

        // Robust command execution logic
        const runCommand = async (collection: string) => {
            return (prisma as any).$runCommandRaw({
                update: collection,
                updates: [
                    {
                        q: { studentId: { $oid: studentId }, dateString },
                        u: updateDoc,
                        upsert: true
                    }
                ]
            });
        };

        // Upsert attendance using raw MongoDB command
        try {
            await runCommand('Attendance');
        } catch (rawError: any) {
            console.error('Raw MongoDB update (Attendance) failed:', rawError);
            try {
                await runCommand('attendance');
            } catch (secondError: any) {
                console.error('Fallback update (attendance) also failed:', secondError);
                throw rawError;
            }
        }

        // Trigger Guardian Notification for FRS/QR methods if status is PRESENT
        if (status === 'PRESENT' && (method === 'FRS' || method === 'QR')) {
            try {
                // Fetch student and their guardian phone from metadata
                const student = await prisma.user.findUnique({
                    where: { id: studentId },
                    select: {
                        name: true,
                        metadata: true,
                        institutes: {
                            where: { id: instituteId },
                            select: { name: true }
                        }
                    }
                });

                const guardianPhone = (student?.metadata as any)?.guardianPhone;
                if (student && guardianPhone) {
                    // Find guardian user by phone
                    const guardian = await prisma.user.findFirst({
                        where: {
                            phone: guardianPhone,
                            instituteIds: { has: instituteId }
                        }
                    });

                    if (guardian) {
                        const time = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                        const date = new Date().toLocaleDateString('bn-BD');
                        const instName = student.institutes?.[0]?.name || 'প্রতিষ্ঠানের নাম পাওয়া যায়নি';

                        await prisma.notification.create({
                            data: {
                                userId: guardian.id,
                                type: 'SYSTEM',
                                title: 'হাজিরা নিশ্চিতকরণ',
                                message: `নাম: ${student.name}, সময়: ${time}, তারিখ: ${date}, প্রতিষ্ঠান: ${instName}`,
                                metadata: {
                                    studentId,
                                    type: 'ATTENDANCE_ALERT'
                                }
                            }
                        });
                        console.log(`Notification sent to guardian for ${student.name}`);
                    }
                }
            } catch (notifyError) {
                console.error('Failed to send guardian notification:', notifyError);
            }
        }

        return NextResponse.json({ success: true, message: 'Attendance marked successfully' });
    } catch (error: any) {
        console.error('Error marking attendance:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const assignmentId = searchParams.get('assignmentId');
        const studentId = searchParams.get('studentId');
        const instituteId = searchParams.get('instituteId');
        const teacherId = searchParams.get('teacherId');

        let where: any = {};
        if (assignmentId) where.assignmentId = assignmentId;
        if (studentId) where.studentId = studentId;

        // Filter by institute or teacher if provided
        if (instituteId || teacherId) {
            where.assignment = {};
            if (instituteId) where.assignment.instituteId = instituteId;
            if (teacherId) where.assignment.teacherId = teacherId;
        }

        const submissions = await prisma.submission.findMany({
            where,
            include: {
                student: {
                    select: { name: true, phone: true, metadata: true }
                },
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        createdAt: true,
                        book: { select: { name: true } },
                        teacher: { select: { id: true, name: true } },
                        class: { select: { id: true, name: true } },
                        group: { select: { id: true, name: true } },
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(submissions);
    } catch (error) {
        console.error('Submissions GET Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            assignmentId,
            studentId,
            content,
            attachments
        } = body;

        if (!assignmentId || !studentId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const submission = await prisma.submission.upsert({
            where: {
                assignmentId_studentId: {
                    assignmentId,
                    studentId
                }
            },
            update: {
                content,
                attachments,
                status: 'SUBMITTED',
                submittedAt: new Date()
            },
            create: {
                assignmentId,
                studentId,
                content,
                attachments,
                status: 'SUBMITTED',
                submittedAt: new Date()
            },
            include: {
                student: { select: { name: true } },
                assignment: {
                    include: {
                        teacher: { select: { id: true } },
                        book: { select: { name: true } }
                    }
                }
            }
        });

        // Notify Stakeholders
        if (submission.assignment && submission.student) {
            const assignmentName = submission.assignment.book?.name || (submission.assignment as any).title;
            const studentName = submission.student.name;
            const instituteId = (submission.assignment as any).instituteId;

            // 1. Notify Teacher
            if (submission.assignment.teacherId) {
                await (prisma as any).notification.create({
                    data: {
                        userId: submission.assignment.teacherId,
                        type: 'ASSIGNMENT_SUBMITTED',
                        title: 'ক্লাস ডাইরি জমা হয়েছে',
                        message: `${studentName} "${assignmentName}" ক্লাস ডাইরিটি জমা দিয়েছেন।`,
                        metadata: { assignmentId, studentId, instituteId }
                    }
                });
            }

            // 2. Notify Owner (Admins)
            const staffProfiles = await prisma.teacherProfile.findMany({
                where: { instituteId, isAdmin: true, status: 'ACTIVE' },
                select: { userId: true }
            });
            for (const profile of staffProfiles) {
                await (prisma as any).notification.create({
                    data: {
                        userId: profile.userId,
                        type: 'ASSIGNMENT_SUBMITTED',
                        title: 'শিক্ষার্থীর ক্লাস ডাইরি',
                        message: `${studentName} "${assignmentName}" ক্লাস ডাইরিটি জমা দিয়েছেন।`,
                        metadata: { assignmentId, studentId, instituteId }
                    }
                });
            }

            // 3. Notify Guardian
            const studentDoc = await prisma.user.findUnique({
                where: { id: studentId },
                select: { name: true, metadata: true }
            }) as any;

            if (studentDoc?.metadata?.guardianId) {
                const guardian = await prisma.user.findUnique({
                    where: { id: studentDoc.metadata.guardianId },
                    select: { id: true }
                });

                if (guardian) {
                    await (prisma as any).notification.create({
                        data: {
                            userId: guardian.id,
                            type: 'ASSIGNMENT_SUBMITTED',
                            title: 'সন্তানের ক্লাস ডাইরি আপডেট',
                            message: `আপনার সন্তান ${studentName} "${assignmentName}" ক্লাস ডাইরিটি জমা দিয়েছে।`,
                            metadata: { assignmentId, studentId, instituteId }
                        }
                    });
                }
            }
        }

        return NextResponse.json(submission);
    } catch (error) {
        console.error('Submissions POST Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, ids, status, grade, feedback, taskId, taskStatus, action } = body;

        if (!id && (!ids || !Array.isArray(ids) || ids.length === 0)) {
            return NextResponse.json({ message: 'Submission ID or IDs array is required' }, { status: 400 });
        }

        const targetIds = ids || [id];
        const results = [];

        for (const targetId of targetIds) {
            const existingSubmission = await (prisma as any).submission.findUnique({
                where: { id: targetId },
                include: {
                    assignment: {
                        select: { title: true, book: { select: { name: true } } }
                    }
                }
            });

            if (action === 'REVERT') {
                await (prisma as any).submission.delete({
                    where: { id: targetId }
                });
                results.push({ id: targetId, action: 'REVERTED' });
                continue;
            }

            let data: any = {
                updatedAt: new Date()
            };

            if (status) data.status = status;
            if (grade !== undefined) data.grade = grade;
            if (feedback !== undefined) data.feedback = feedback;

            // Granular Task Update
            if (taskId && taskStatus) {
                let taskProgress = (existingSubmission.taskProgress as any) || {};
                if (taskProgress[taskId]) {
                    taskProgress[taskId].status = taskStatus;
                    taskProgress[taskId].reviewedAt = new Date();
                    if (feedback) taskProgress[taskId].feedback = feedback;
                    data.taskProgress = taskProgress;

                    if (!status && (taskStatus === 'RETRY' || taskStatus === 'REJECTED')) {
                        data.status = 'SUBMITTED';
                    }
                }
            }

            const submission = await (prisma as any).submission.update({
                where: { id: targetId },
                data,
                include: {
                    assignment: {
                        select: { title: true, book: { select: { name: true } } }
                    }
                }
            });

            // Notification Logic
            if (status === 'APPROVED' || (taskId && taskStatus)) {
                const studentDoc = await (prisma as any).user.findUnique({
                    where: { id: submission.studentId },
                    select: { id: true, name: true, metadata: true }
                });

                const assignmentName = submission.assignment?.book?.name || submission.assignment?.title;
                let notifTitle = 'ডায়েরি আপডেট';
                let notifMessage = `তোমার "${assignmentName}" ডায়েরিতে আপডেট এসেছে।`;
                let guardMessage = `আপনার সন্তানের "${assignmentName}" ডায়েরিতে আপডেট এসেছে।`;

                if (status === 'APPROVED') {
                    notifTitle = 'ডায়েরি অনুমোদিত';
                    notifMessage = `তোমার "${assignmentName}" ডায়েরিটি শিক্ষক অনুমোদন করেছেন।`;
                    guardMessage = `আপনার সন্তানের "${assignmentName}" ডায়েরিটি শিক্ষক অনুমোদন করেছেন।`;
                } else if (taskId && taskStatus === 'APPROVED') {
                    notifTitle = 'টাস্ক অনুমোদিত';
                    notifMessage = `তোমার "${assignmentName}"-এর একটি টাস্ক শিক্ষক অনুমোদন করেছেন।`;
                    guardMessage = `আপনার সন্তানের "${assignmentName}"-এর একটি টাস্ক শিক্ষক অনুমোদন করেছেন।`;
                } else if (taskId && taskStatus === 'RETRY') {
                    notifTitle = 'আবার চেষ্টা করো';
                    notifMessage = `তোমার "${assignmentName}"-এর একটি টাস্ক পুনরায় করার জন্য শিক্ষক অনুরোধ করেছেন।`;
                    guardMessage = `আপনার সন্তানের "${assignmentName}"-এর একটি টাস্ক পুনরায় করার জন্য শিক্ষক অনুরোধ করেছেন।`;
                } else if (taskId && taskStatus === 'REJECTED') {
                    notifTitle = 'টাস্ক বাতিল';
                    notifMessage = `তোমার "${assignmentName}"-এর একটি টাস্ক শিক্ষক গ্রহণ করেননি।`;
                    guardMessage = `আপনার সন্তানের "${assignmentName}"-এর একটি টাস্ক শিক্ষক গ্রহণ করেননি।`;
                }

                await (prisma as any).notification.create({
                    data: {
                        userId: submission.studentId,
                        type: 'SUBMISSION_REVIEWED',
                        title: notifTitle,
                        message: notifMessage,
                        metadata: { submissionId: targetId, taskId, taskStatus }
                    }
                });

                if (studentDoc?.metadata?.guardianId) {
                    const guardian = await prisma.user.findUnique({
                        where: { id: studentDoc.metadata.guardianId },
                        select: { id: true }
                    });

                    if (guardian) {
                        await (prisma as any).notification.create({
                            data: {
                                userId: guardian.id,
                                type: 'SUBMISSION_REVIEWED',
                                title: notifTitle,
                                message: guardMessage,
                                metadata: {
                                    submissionId: targetId,
                                    studentId: submission.studentId,
                                    studentName: studentDoc.name,
                                    taskId,
                                    taskStatus
                                }
                            }
                        });
                    }
                }
            }
            results.push(submission);
        }

        return NextResponse.json(results.length === 1 && id ? results[0] : results);
    } catch (error) {
        console.error('Submissions PATCH Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

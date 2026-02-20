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
                    select: { name: true, phone: true }
                },
                assignment: {
                    include: {
                        book: { select: { name: true } },
                        teacher: { select: { id: true, name: true } },
                        class: { select: { id: true, name: true } },
                        group: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
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
                status: 'SUBMITTED'
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
                        title: 'অ্যাসাইনমেন্ট জমা হয়েছে',
                        message: `${studentName} "${assignmentName}" অ্যাসাইনমেন্টটি জমা দিয়েছেন।`,
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
                        title: 'শিক্ষার্থীর অ্যাসাইনমেন্ট',
                        message: `${studentName} "${assignmentName}" অ্যাসাইনমেন্টটি জমা দিয়েছেন।`,
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
                            title: 'সন্তানের অ্যাসাইনমেন্ট আপডেট',
                            message: `আপনার সন্তান ${studentName} "${assignmentName}" অ্যাসাইনমেন্টটি জমা দিয়েছে।`,
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
        const { id, status, grade, feedback, taskId, taskStatus } = body;

        if (!id) {
            return NextResponse.json({ message: 'Submission ID is required' }, { status: 400 });
        }

        const existingSubmission = await (prisma as any).submission.findUnique({
            where: { id },
            include: {
                assignment: {
                    select: { title: true, book: { select: { name: true } } }
                }
            }
        });

        if (!existingSubmission) {
            return NextResponse.json({ message: 'Submission not found' }, { status: 404 });
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
                if (feedback) taskProgress[taskId].feedback = feedback; // Add feedback to subtask
                data.taskProgress = taskProgress;

                // Auto-update global status if needed
                // If any task is rejected or needs retry, keep it SUBMITTED to indicate it's still being worked on
                // Only if the whole assignment isn't already being approved
                if (!status && (taskStatus === 'RETRY' || taskStatus === 'REJECTED')) {
                    data.status = 'SUBMITTED';
                }
            }
        }

        const submission = await (prisma as any).submission.update({
            where: { id },
            data,
            include: {
                assignment: {
                    select: { title: true, book: { select: { name: true } } }
                }
            }
        });

        // Notification Logic
        if (status === 'APPROVED' || (taskId && taskStatus)) {
            // Fetch student and guardians separately to avoid complex nested includes in update
            const studentDoc = await (prisma as any).user.findUnique({
                where: { id: submission.studentId },
                select: { id: true, name: true, metadata: true }
            });

            const assignmentName = submission.assignment?.book?.name || submission.assignment?.title;
            let notifTitle = 'অ্যাসাইনমেন্ট আপডেট';
            let notifMessage = `আপনার "${assignmentName}" অ্যাসাইনমেন্টটিতে আপডেট এসেছে।`;
            let guardMessage = `আপনার সন্তানের "${assignmentName}" অ্যাসাইনমেন্টটিতে আপডেট এসেছে।`;

            if (status === 'APPROVED') {
                notifTitle = 'অ্যাসাইনমেন্ট অনুমোদিত';
                notifMessage = `আপনার "${assignmentName}" অ্যাসাইনমেন্টটি শিক্ষক অনুমোদন করেছেন।`;
                guardMessage = `আপনার সন্তানের "${assignmentName}" অ্যাসাইনমেন্টটি শিক্ষক অনুমোদন করেছেন।`;
            } else if (taskId && taskStatus === 'APPROVED') {
                notifTitle = 'টাস্ক অনুমোদিত';
                notifMessage = `আপনার "${assignmentName}"-এর একটি টাস্ক শিক্ষক অনুমোদন করেছেন।`;
                guardMessage = `আপনার সন্তানের "${assignmentName}"-এর একটি টাস্ক শিক্ষক অনুমোদন করেছেন।`;
            } else if (taskId && taskStatus === 'RETRY') {
                notifTitle = 'আবার চেষ্টা করুন (Retry)';
                notifMessage = `আপনার "${assignmentName}"-এর একটি টাস্ক পুনরায় করার জন্য শিক্ষক অনুরোধ করেছেন।`;
                guardMessage = `আপনার সন্তানের "${assignmentName}"-এর একটি টাস্ক পুনরায় করার জন্য শিক্ষক অনুরোধ করেছেন।`;
            } else if (taskId && taskStatus === 'REJECTED') {
                notifTitle = 'টাস্ক বাতিল';
                notifMessage = `আপনার "${assignmentName}"-এর একটি টাস্ক শিক্ষক গ্রহণ করেননি।`;
                guardMessage = `আপনার সন্তানের "${assignmentName}"-এর একটি টাস্ক শিক্ষক গ্রহণ করেননি।`;
            }

            // 1. Notify Student
            await (prisma as any).notification.create({
                data: {
                    userId: submission.studentId,
                    type: 'SUBMISSION_REVIEWED',
                    title: notifTitle,
                    message: notifMessage,
                    metadata: { submissionId: id, taskId, taskStatus }
                }
            });

            // 2. Notify Guardian
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
                                submissionId: id,
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

        return NextResponse.json(submission);
    } catch (error) {
        console.error('Submissions PATCH Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

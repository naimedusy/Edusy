import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            assignmentId,
            studentId,
            taskId,
            attachments,
            content, // Optional text note
            completed = true, // Default to true if not provided for backward compatibility
            skipNotification = false // Default to false
        } = body;

        if (!assignmentId || !studentId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get or Create Submission
        const existingSubmission = await (prisma as any).submission.findUnique({
            where: {
                assignmentId_studentId: { assignmentId, studentId }
            }
        });

        let taskProgress: any = existingSubmission?.taskProgress || {};

        // 2. Update task progress if taskId provided
        if (taskId) {
            taskProgress[taskId] = {
                status: completed ? 'DONE' : 'PENDING',
                submittedAt: new Date(),
                attachments: attachments || [],
                content: content || ''
            };
        }

        const newStatus = (existingSubmission?.status === 'APPROVED' || existingSubmission?.status === 'GRADED')
            ? existingSubmission.status
            : 'SUBMITTED';

        const submission = await (prisma as any).submission.upsert({
            where: {
                assignmentId_studentId: { assignmentId, studentId }
            },
            update: {
                taskProgress,
                status: newStatus,
                updatedAt: new Date(),
                submittedAt: existingSubmission?.submittedAt || new Date()
            },
            create: {
                assignmentId,
                studentId,
                taskProgress,
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

        // 3. Notify Stakeholders
        if (!skipNotification && submission.assignment && submission.student) {
            const assignmentName = submission.assignment.book?.name || submission.assignment.title;
            const studentName = submission.student.name;
            const instituteId = (submission.assignment as any).instituteId;

            // 1. Notify Teacher
            if (submission.assignment.teacherId) {
                await (prisma as any).notification.create({
                    data: {
                        userId: submission.assignment.teacherId,
                        type: 'TASK_COMPLETED',
                        title: completed ? 'টাস্ক সম্পন্ন হয়েছে' : 'টাস্ক আপডেট করা হয়েছে',
                        message: `${studentName} "${assignmentName}"-এর একটি টাস্ক ${completed ? 'সম্পন্ন করেছেন' : 'অসম্পূর্ণ হিসেবে পরিবর্তন করেছেন'}।`,
                        metadata: { assignmentId, studentId, taskId, instituteId }
                    }
                });
            }

            // 2. Notify Owner (Admins of the institute)
            const staffProfiles = await prisma.teacherProfile.findMany({
                where: { instituteId: instituteId as string, isAdmin: true, status: 'ACTIVE' },
                select: { userId: true }
            });

            for (const profile of staffProfiles) {
                await (prisma as any).notification.create({
                    data: {
                        userId: profile.userId,
                        type: 'TASK_COMPLETED',
                        title: 'শিক্ষার্থীর আপডেট',
                        message: `${studentName} "${assignmentName}"-এর একটি টাস্ক আপডেট করেছেন।`,
                        metadata: { assignmentId, studentId, taskId, instituteId }
                    }
                });
            }

            // 3. Notify Guardian
            const studentDoc = await prisma.user.findUnique({
                where: { id: studentId },
                select: { name: true, metadata: true }
            }) as any;

            const guardianId = studentDoc?.metadata?.guardianId;
            if (guardianId) {
                await (prisma as any).notification.create({
                    data: {
                        userId: guardianId,
                        type: 'TASK_COMPLETED',
                        title: 'সন্তানের পড়া আপডেট',
                        message: `আপনার সন্তান ${studentName} "${assignmentName}"-এর একটি টাস্ক আপডেট করেছে।`,
                        metadata: { assignmentId, studentId, taskId, instituteId }
                    }
                });
            }
        }

        return NextResponse.json({ success: true, submission });
    } catch (error) {
        console.error('Mark Done API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

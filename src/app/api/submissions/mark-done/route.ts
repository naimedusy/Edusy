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
            content // Optional text note
        } = body;

        if (!assignmentId || !studentId || !taskId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get or Create Submission
        const existingSubmission = await (prisma as any).submission.findUnique({
            where: {
                assignmentId_studentId: { assignmentId, studentId }
            }
        });

        let taskProgress: any = existingSubmission?.taskProgress || {};

        // 2. Update task progress
        taskProgress[taskId] = {
            status: 'DONE',
            submittedAt: new Date(),
            attachments: attachments || [],
            content: content || ''
        };

        const submission = await (prisma as any).submission.upsert({
            where: {
                assignmentId_studentId: { assignmentId, studentId }
            },
            update: {
                taskProgress,
                status: 'SUBMITTED',
                updatedAt: new Date()
            },
            create: {
                assignmentId,
                studentId,
                taskProgress,
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

        // 3. Notify Stakeholders
        if (submission.assignment && submission.student) {
            const assignmentName = submission.assignment.book?.name || submission.assignment.title;
            const studentName = submission.student.name;
            const instituteId = submission.assignment.instituteId;

            // 1. Notify Teacher
            if (submission.assignment.teacherId) {
                await (prisma as any).notification.create({
                    data: {
                        userId: submission.assignment.teacherId,
                        type: 'TASK_COMPLETED',
                        title: 'টাস্ক সম্পন্ন হয়েছে',
                        message: `${studentName} "${assignmentName}"-এর একটি টাস্ক সম্পন্ন করেছেন।`,
                        metadata: { assignmentId, studentId, taskId, instituteId }
                    }
                });
            }

            // 2. Notify Owner (Admins of the institute)
            const staffProfiles = await prisma.teacherProfile.findMany({
                where: { instituteId, isAdmin: true, status: 'ACTIVE' },
                select: { userId: true }
            });

            for (const profile of staffProfiles) {
                await (prisma as any).notification.create({
                    data: {
                        userId: profile.userId,
                        type: 'TASK_COMPLETED',
                        title: 'শিক্ষার্থীর আপডেট',
                        message: `${studentName} "${assignmentName}"-এর একটি টাস্ক সম্পন্ন করেছেন।`,
                        metadata: { assignmentId, studentId, taskId, instituteId }
                    }
                });
            }

            // 3. Notify Guardian
            const student = await prisma.user.findUnique({
                where: { id: studentId },
                select: {
                    metadata: true,
                    // Note: If using a link table as seen in some parts of code
                    // But schema.prisma shows User.submissions, doesn't show guardians relation directly on User
                    // Looking at route.ts for /api/submissions (PATCH), it uses student.guardians
                }
            }) as any;

            // Attempting to find guardians via metadata or relations if they exist
            // Based on previous view of submissions/route.ts, it uses submission.student.guardians
            const studentWithGuardians = await prisma.user.findUnique({
                where: { id: studentId },
                include: {
                    // @ts-ignore - guardians might be a relation or in metadata
                    guardians: {
                        include: {
                            // @ts-ignore
                            guardian: { select: { userId: true } }
                        }
                    }
                }
            }) as any;

            if (studentWithGuardians?.guardians?.length > 0) {
                for (const gLink of studentWithGuardians.guardians) {
                    if (gLink.guardian?.userId) {
                        await (prisma as any).notification.create({
                            data: {
                                userId: gLink.guardian.userId,
                                type: 'TASK_COMPLETED',
                                title: 'সন্তানের পড়া আপডেট',
                                message: `আপনার সন্তান ${studentName} "${assignmentName}"-এর একটি টাস্ক সম্পন্ন করেছে।`,
                                metadata: { assignmentId, studentId, taskId, instituteId }
                            }
                        });
                    }
                }
            }
        }

        return NextResponse.json({ success: true, submission });
    } catch (error) {
        console.error('Mark Done API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

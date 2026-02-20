import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const { assignmentId, assignmentIds } = body;

        let where: any = { instituteId, status: 'DRAFT' };

        if (assignmentId) {
            where.id = assignmentId;
        } else if (assignmentIds && Array.isArray(assignmentIds) && assignmentIds.length > 0) {
            where.id = { in: assignmentIds };
        } else {
            // Fallback to "Today" logic for bulk release
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);

            where.scheduledDate = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        // Find assignments to release
        const pendingAssignments = await (prisma as any).assignment.findMany({
            where,
            include: {
                teacher: { select: { name: true } },
                class: { select: { name: true } }
            }
        });

        if (pendingAssignments.length === 0) {
            return NextResponse.json({ message: 'No assignments found to release for today' });
        }

        const releasedCount = pendingAssignments.length;
        let notificationCount = 0;

        for (const assignment of pendingAssignments) {
            // A. Update status to RELEASED
            await (prisma as any).assignment.update({
                where: { id: assignment.id },
                data: { status: 'RELEASED' }
            });

            // B. Find relevant students in the class
            const students = await (prisma as any).user.findMany({
                where: {
                    instituteIds: { has: instituteId },
                    role: 'STUDENT',
                    metadata: {
                        path: ['classId'],
                        equals: assignment.classId
                    }
                }
            });

            // If findMany with path fails or returns empty, try a fallback for different Prisma/Mongo versions
            // Some versions might need the nested object syntax
            let finalStudents = students;
            if (finalStudents.length === 0) {
                finalStudents = await (prisma as any).user.findMany({
                    where: {
                        instituteIds: { has: instituteId },
                        role: 'STUDENT'
                    }
                });
                // Filter manually as a fallback
                finalStudents = finalStudents.filter((s: any) => s.metadata?.classId === assignment.classId);
            }

            // Parse assignment structure if available
            let structuredData: any = null;
            try {
                if (assignment.description) {
                    const parsed = JSON.parse(assignment.description);
                    if (parsed.version === '2.0') {
                        structuredData = parsed;
                    }
                }
            } catch (e) {
                // Not JSON
            }

            // C. Create Notifications
            for (const student of finalStudents) {
                // Determine personalized message if structured data exists
                let personalizedMessage = `${assignment.teacher?.name} আপনার জন্য একটি নতুন ${assignment.title} যুক্ত করেছেন।`;

                if (structuredData) {
                    const personalTasks: string[] = [];
                    structuredData.sections.forEach((section: any) => {
                        section.tasks.forEach((task: any) => {
                            // If targeted specifically to this student
                            if (task.targetStudents?.includes(student.id)) {
                                const mainValue = task.segments.find((s: any) => s.type === 'text')?.value || 'Task';
                                personalTasks.push(mainValue);
                            }
                        });
                    });

                    if (personalTasks.length > 0) {
                        const taskSummary = personalTasks.slice(0, 2).join(', ') + (personalTasks.length > 2 ? '...' : '');
                        personalizedMessage = `${assignment.teacher?.name} আপনার জন্য বিশেষ কাজ (${taskSummary}) সহ আজকের লেসন যুক্ত করেছেন।`;
                    }
                }

                // Student Notification
                await (prisma as any).notification.create({
                    data: {
                        userId: student.id,
                        type: 'ASSIGNMENT_RELEASED',
                        title: 'নতুন অ্যাসাইনমেন্ট!',
                        message: personalizedMessage,
                        metadata: {
                            assignmentId: assignment.id,
                            classId: assignment.classId,
                            instituteId
                        }
                    }
                });
                notificationCount++;

                // Guardian Notification
                const guardianId = student.metadata?.guardianId;
                if (guardianId) {
                    await (prisma as any).notification.create({
                        data: {
                            userId: guardianId,
                            type: 'ASSIGNMENT_RELEASED',
                            title: 'আপনার সন্তানের নতুন অ্যাসাইনমেন্ট',
                            message: `${student.name}-এর জন্য একটি নতুন ${assignment.title} যুক্ত করা হয়েছে।`,
                            metadata: {
                                assignmentId: assignment.id,
                                studentId: student.id,
                                instituteId
                            }
                        }
                    });
                    notificationCount++;
                }
            }
        }

        return NextResponse.json({
            message: 'Assignments released successfully',
            releasedCount,
            notificationCount
        });

    } catch (error) {
        console.error('Release API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

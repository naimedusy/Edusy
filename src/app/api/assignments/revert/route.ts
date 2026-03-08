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

        if (!assignmentId && (!assignmentIds || !Array.isArray(assignmentIds) || assignmentIds.length === 0)) {
            return NextResponse.json({ message: 'Assignment ID(s) required' }, { status: 400 });
        }

        const ids = assignmentId ? [assignmentId] : assignmentIds;

        // 1. Find the assignments to revert
        const assignments = await prisma.assignment.findMany({
            where: {
                id: { in: ids },
                instituteId,
                status: { in: ['RELEASED', 'PUBLISHED'] }
            },
            include: {
                teacher: { select: { name: true } }
            }
        });

        if (assignments.length === 0) {
            return NextResponse.json({ message: 'No released assignments found to revert' });
        }

        let revertedCount = 0;
        let notificationCount = 0;

        for (const assignment of assignments) {
            // 2. Update status back to DRAFT
            await prisma.assignment.update({
                where: { id: assignment.id },
                data: { status: 'DRAFT' }
            });
            revertedCount++;

            // 3. Find students in the class
            const students = await prisma.user.findMany({
                where: {
                    instituteIds: { has: instituteId },
                    role: 'STUDENT',
                }
            });

            // Filter by classId in memory as a safe fallback
            const classStudents = students.filter((s: any) => s.metadata?.classId === assignment.classId);

            // 4. Send "Sorry" notifications
            for (const student of classStudents) {
                const studentMessage = `দুঃখিত, "${assignment.title}" ক্লাস ডাইরিটি প্রত্যাহার করা হয়েছে। এটি বর্তমানে আপনার ডায়েরিতে দৃশ্যমান হবে না।`;

                await prisma.notification.create({
                    data: {
                        userId: student.id,
                        type: 'ASSIGNMENT_REVERTED',
                        title: 'ক্লাস ডাইরি প্রত্যাহার!',
                        message: studentMessage,
                        metadata: {
                            assignmentId: assignment.id,
                            instituteId
                        }
                    }
                });
                notificationCount++;

                // Guardian Notification
                const guardianId = (student.metadata as any)?.guardianId;
                if (guardianId) {
                    const guardianMessage = `দুঃখিত, আপনার সন্তান ${student.name}-এর "${assignment.title}" ক্লাস ডাইরিটি প্রত্যাহার করা হয়েছে।`;
                    await prisma.notification.create({
                        data: {
                            userId: guardianId,
                            type: 'ASSIGNMENT_REVERTED',
                            title: 'ক্লাস ডাইরি প্রত্যাহার',
                            message: guardianMessage,
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
            message: 'Assignments reverted and notifications sent',
            revertedCount,
            notificationCount
        });

    } catch (error) {
        console.error('Revert API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

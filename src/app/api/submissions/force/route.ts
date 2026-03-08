import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const teacherId = searchParams.get('teacherId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        // 1. Determine date range for assignments
        let dateFilter: any = {};
        if (startDate && endDate) {
            const [sY, sM, sD] = startDate.split('-').map(Number);
            const [eY, eM, eD] = endDate.split('-').map(Number);
            dateFilter = {
                gte: new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0, 0)),
                lte: new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999))
            };
        } else if (startDate) {
            const [y, m, d] = startDate.split('-').map(Number);
            dateFilter = {
                gte: new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0)),
                lte: new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999))
            };
        } else {
            // Default: last 2 days
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
            dateFilter = { gte: twoDaysAgo };
        }

        const assignments = await (prisma as any).assignment.findMany({
            where: {
                instituteId,
                status: { in: ['PUBLISHED', 'RELEASED'] }, // Broaden to include all active assignments
                scheduledDate: dateFilter, // Filter by scheduled date (work day) instead of release time
                ...(teacherId ? { teacherId } : {})
            },
            include: {
                class: { select: { id: true, name: true } },
                group: { select: { id: true, name: true } }
            }
        });

        if (assignments.length === 0) {
            console.log(`[ForceSubmit] No assignments found for instituteId: ${instituteId}, dateFilter:`, dateFilter);
            return NextResponse.json({
                message: 'No assignments found scheduled for the selected date(s).',
                createdCount: 0,
                assignmentsProcessed: 0
            });
        }

        // 2. Fetch all students for this institute once to avoid repeated DB calls
        const allStudents = await (prisma as any).user.findMany({
            where: {
                instituteIds: { has: instituteId },
                role: 'STUDENT'
            },
            select: { id: true, name: true, metadata: true }
        });

        let createdCount = 0;

        // 3. Process each assignment
        for (const assignment of assignments) {
            // Find students who belong to this assignment's class/group
            const targetStudents = allStudents.filter((student: any) => {
                const sMeta = student.metadata || {};
                // Compare IDs as strings to avoid type mismatch issues
                const matchesClass = String(sMeta.classId) === String(assignment.classId);
                const matchesGroup = !assignment.groupId || String(sMeta.groupId) === String(assignment.groupId);
                return matchesClass && matchesGroup;
            });

            if (targetStudents.length === 0) continue;

            // Find existing submissions for this assignment to identify who HASN'T submitted
            const existingSubmissions = await (prisma as any).submission.findMany({
                where: {
                    assignmentId: assignment.id,
                    studentId: { in: targetStudents.map((s: any) => s.id) }
                },
                select: { studentId: true }
            });

            const submittedStudentIds = new Set(existingSubmissions.map((s: any) => String(s.studentId)));
            const pendingStudents = targetStudents.filter((s: any) => !submittedStudentIds.has(String(s.id)));

            // Create submissions for pending students
            for (const student of pendingStudents) {
                try {
                    await (prisma as any).submission.create({
                        data: {
                            assignmentId: assignment.id,
                            studentId: student.id,
                            status: 'SUBMITTED',
                            content: 'Force submitted by Teacher/Admin',
                            submittedAt: new Date()
                        }
                    });
                    createdCount++;
                } catch (err) {
                    // Silently fail if duplicate (shouldn't happen with the check above but good for safety)
                    console.error('[ForceSubmit] Error creating submission:', err);
                }
            }
        }

        return NextResponse.json({
            message: `Force submission completed. Created ${createdCount} submissions across ${assignments.length} assignments.`,
            createdCount,
            assignmentsProcessed: assignments.length
        });

    } catch (error: any) {
        console.error('Force Submit API Error:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

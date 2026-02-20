import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const role = searchParams.get('role');
        const userId = searchParams.get('userId');
        const classId = searchParams.get('classId');
        const groupId = searchParams.get('groupId');
        const date = searchParams.get('date'); // YYYY-MM-DD
        const startDate = searchParams.get('startDate'); // YYYY-MM-DD
        const endDate = searchParams.get('endDate'); // YYYY-MM-DD

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        let where: any = { instituteId };

        if (startDate && endDate) {
            const [sY, sM, sD] = startDate.split('-').map(Number);
            const [eY, eM, eD] = endDate.split('-').map(Number);
            where.scheduledDate = {
                gte: new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0, 0)),
                lte: new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999))
            };
        } else if (date) {
            // Robust date filtering that handles UTC/Local mismatches better
            const [year, month, day] = date.split('-').map(Number);
            const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

            where.scheduledDate = {
                gte: startOfDay,
                lte: endOfDay
            };
        }

        const ownOnly = searchParams.get('ownOnly') === 'true';

        if (role === 'TEACHER' && userId && ownOnly) {
            where.teacherId = userId;
        } else if (role === 'STUDENT') {
            if (classId) where.classId = classId;
            if (groupId) where.groupId = groupId;
            where.status = { in: ['PUBLISHED', 'RELEASED'] };
            // For students, only show assignments where releaseAt <= now
            where.OR = [
                { releaseAt: null },
                { releaseAt: { lte: new Date() } }
            ];
        } else if (role === 'GUARDIAN' && userId) {
            // Find children from guardian metadata
            const guardian = await prisma.user.findUnique({
                where: { id: userId },
                select: { metadata: true }
            });
            const metadata = guardian?.metadata as any;
            const childrenIds = metadata?.childrenIds || (metadata?.studentId ? [metadata.studentId] : []);

            if (childrenIds.length > 0) {
                const children = await prisma.user.findMany({
                    where: { id: { in: childrenIds } },
                    select: { metadata: true }
                });

                const childrenClassIds = children.map(c => (c.metadata as any)?.classId).filter(Boolean);
                const childrenGroupIds = children.map(c => (c.metadata as any)?.groupId).filter(Boolean);

                where.OR = [
                    { classId: { in: childrenClassIds } },
                    { groupId: { in: childrenGroupIds } }
                ];
                where.status = { in: ['PUBLISHED', 'RELEASED'] };
                // Also apply releaseAt filter for guardians
                where.AND = [
                    {
                        OR: [
                            { releaseAt: null },
                            { releaseAt: { lte: new Date() } }
                        ]
                    }
                ];
            } else {
                // No children linked, return nothing
                return NextResponse.json([]);
            }
        }

        const assignments = await prisma.assignment.findMany({
            where,
            include: {
                teacher: {
                    select: { name: true, metadata: true }
                },
                class: {
                    select: { name: true }
                },
                group: {
                    select: { name: true }
                },
                book: {
                    select: { name: true }
                },
                _count: {
                    select: { submissions: true }
                },
                submissions: {
                    where: role === 'STUDENT' && userId ? { studentId: userId } : { status: 'SUBMITTED' as any },
                    select: { id: true, status: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const formattedAssignments = assignments.map(a => {
            const studentSubmission = role === 'STUDENT' ? a.submissions?.[0] : null;
            return {
                ...a,
                userStatus: studentSubmission?.status || 'NOT_STARTED',
                pendingCount: role === 'STUDENT' ? (a.submissions?.length || 0) : (a.submissions?.filter((s: any) => s.status === 'SUBMITTED').length || 0),
                submissions: undefined
            };
        });

        return NextResponse.json(formattedAssignments);
    } catch (error: any) {
        console.error('Assignments GET Error Details:', error);
        return NextResponse.json({
            message: 'Internal server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            title,
            description,
            type,
            deadline,
            scheduledDate,
            instituteId,
            teacherId,
            classId,
            groupId,
            bookId,
            resources,
            releaseAt
        } = body;

        if (!instituteId || !teacherId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Normalize IDs: ensure they are valid hex strings or null
        const isValidId = (id: any) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

        const finalClassId = isValidId(classId) ? classId : null;
        const finalGroupId = isValidId(groupId) ? groupId : null;
        const finalBookId = isValidId(bookId) ? bookId : null;
        const finalTeacherId = isValidId(teacherId) ? teacherId : null;
        const finalInstituteId = isValidId(instituteId) ? instituteId : null;

        if (!finalTeacherId || !finalInstituteId) {
            return NextResponse.json({
                message: 'Invalid Teacher ID or Institute ID format',
                received: { teacherId, instituteId }
            }, { status: 400 });
        }

        // Auto-compute deadline from the class's startTime if not explicitly provided
        let computedDeadline: Date | null = deadline ? new Date(deadline) : null;
        if (!computedDeadline && finalClassId) {
            const classData = await (prisma as any).class.findUnique({
                where: { id: finalClassId },
                select: { startTime: true, name: true }
            });
            if (classData?.startTime) {
                const [hours, minutes] = classData.startTime.split(':').map(Number);
                const now = new Date();
                const todayDeadline = new Date();
                todayDeadline.setHours(hours, minutes, 0, 0);
                // If class already started today, set deadline to tomorrow
                if (todayDeadline <= now) {
                    todayDeadline.setDate(todayDeadline.getDate() + 1);
                }
                computedDeadline = todayDeadline;
            }
        }

        // Auto-generate title from book/class if not provided
        let finalTitle = title || null;

        const assignment = await (prisma as any).assignment.create({
            data: {
                title: finalTitle,
                description,
                type,
                status: 'DRAFT',
                deadline: computedDeadline,
                scheduledDate: scheduledDate ? (() => {
                    if (typeof scheduledDate !== 'string') return new Date();
                    const parts = scheduledDate.split('-');
                    if (parts.length !== 3) return new Date();
                    const [y, m, d] = parts.map(Number);
                    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
                })() : new Date(),
                instituteId: finalInstituteId,
                teacherId: finalTeacherId,
                classId: finalClassId,
                groupId: finalGroupId,
                bookId: finalBookId,
                resources: resources || [],
                releaseAt: null // Set by release API from institute global setting
            }
        });

        return NextResponse.json(assignment);
    } catch (error: any) {
        console.error('Assignments POST Error:', error);
        return NextResponse.json({
            message: 'Failed to create assignment',
            error: error.message,
            code: error.code,
            details: typeof error === 'object' ? { ...error, message: error.message } : error
        }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const {
            id,
            title,
            description,
            type,
            deadline,
            scheduledDate,
            instituteId,
            classId,
            groupId,
            bookId,
            resources,
            releaseAt
        } = body;

        if (!id) {
            return NextResponse.json({ message: 'Assignment ID is required' }, { status: 400 });
        }

        // Optional: Check status before update if needed (e.g. only DRAFT can be edited)
        /*
        const existing = await prisma.assignment.findUnique({ where: { id } });
        if (existing?.status !== 'DRAFT') {
            return NextResponse.json({ message: 'Only DRAFT assignments can be edited' }, { status: 400 });
        }
        */

        const assignment = await (prisma as any).assignment.update({
            where: { id },
            data: {
                title,
                description,
                type,
                deadline: deadline ? new Date(deadline) : undefined,
                scheduledDate: scheduledDate ? (() => {
                    if (typeof scheduledDate !== 'string') return undefined;
                    const parts = scheduledDate.split('-');
                    if (parts.length !== 3) return undefined;
                    const [y, m, d] = parts.map(Number);
                    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
                })() : undefined,
                classId: classId === null || /^[0-9a-fA-F]{24}$/.test(classId) ? classId : undefined,
                groupId: groupId === null || /^[0-9a-fA-F]{24}$/.test(groupId) ? groupId : undefined,
                bookId: bookId === null || /^[0-9a-fA-F]{24}$/.test(bookId) ? bookId : undefined,
                resources: resources || [],
                releaseAt: releaseAt ? new Date(releaseAt) : (releaseAt === null ? null : undefined)
            }
        });

        return NextResponse.json(assignment);
    } catch (error: any) {
        console.error('Assignments PATCH Error:', error);
        return NextResponse.json({
            message: 'Failed to update assignment',
            error: error.message
        }, { status: 500 });
    }
}

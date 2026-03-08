import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const classId = searchParams.get('classId');
        const startDate = searchParams.get('startDate'); // e.g., '2023-01-01'
        const endDate = searchParams.get('endDate');     // e.g., '2023-12-31'

        if (!instituteId) {
            return NextResponse.json({ error: 'Missing instituteId' }, { status: 400 });
        }

        const filter: any = { instituteId: { $oid: instituteId } };
        if (classId && classId !== 'all' && classId !== '') {
            filter.classId = { $oid: classId };
        }
        if (startDate && endDate) {
            filter.dateString = { $gte: startDate, $lte: endDate };
        }

        // 1. Overall Attendance Stats
        const statsResult = await (prisma as any).$runCommandRaw({
            aggregate: 'Attendance',
            pipeline: [
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        totalCount: { $sum: 1 },
                        present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
                        absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
                        late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } },
                        leave: { $sum: { $cond: [{ $eq: ['$status', 'LEAVE'] }, 1, 0] } }
                    }
                }
            ],
            cursor: {}
        });

        // 2. Daily Trends
        const dailyResult = await (prisma as any).$runCommandRaw({
            aggregate: 'Attendance',
            pipeline: [
                { $match: filter },
                {
                    $group: {
                        _id: '$dateString',
                        present: { $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] } },
                        absent: { $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] } },
                        late: { $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] } }
                    }
                },
                { $sort: { _id: 1 } }
            ],
            cursor: {}
        });

        // 3. Class breakdown (if not filtering by specific class)
        const classBreakdown: any[] = [];
        if (!classId || classId === 'all' || classId === '') {
            const classResult = await (prisma as any).$runCommandRaw({
                aggregate: 'Attendance',
                pipeline: [
                    { $match: filter },
                    {
                        $group: {
                            _id: '$classId',
                            total: { $sum: 1 },
                            present: { $sum: { $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0] } }
                        }
                    }
                ],
                cursor: {}
            });

            const rawClasses = classResult.cursor?.firstBatch || [];

            // Get class names
            const classesFound = await prisma.class.findMany({
                where: { instituteId },
                select: { id: true, name: true }
            });
            const classNameMap = new Map(classesFound.map(c => [c.id, c.name]));

            rawClasses.forEach((item: any) => {
                const cid = item._id?.$oid || String(item._id);
                classBreakdown.push({
                    className: classNameMap.get(cid) || 'Unknown',
                    rate: Math.round((item.present / item.total) * 100)
                });
            });
        }

        return NextResponse.json({
            summary: statsResult.cursor?.firstBatch[0] || { present: 0, absent: 0, late: 0, leave: 0, totalCount: 0 },
            dailyTrends: dailyResult.cursor?.firstBatch.map((d: any) => ({
                date: d._id,
                present: d.present,
                absent: d.absent,
                late: d.late
            })) || [],
            classBreakdown
        });

    } catch (error: any) {
        console.error('Error fetching attendance summary:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

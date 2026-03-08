import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const classId = searchParams.get('classId');

        if (!instituteId) {
            return NextResponse.json({ error: 'Missing instituteId' }, { status: 400 });
        }

        const filter: any = { instituteId: { $oid: instituteId } };
        if (classId && classId !== 'all' && classId !== '') {
            filter.classId = { $oid: classId };
        }

        // Aggregate attendance stats per student using raw MongoDB
        // We want to count total records per student and how many of them are PRESENT/LATE
        const result = await (prisma as any).$runCommandRaw({
            aggregate: 'Attendance',
            pipeline: [
                { $match: filter },
                {
                    $group: {
                        _id: '$studentId',
                        totalDays: { $sum: 1 },
                        presentDays: {
                            $sum: {
                                $cond: [{ $in: ['$status', ['PRESENT', 'LATE']] }, 1, 0]
                            }
                        }
                    }
                }
            ],
            cursor: {}
        });

        const stats = result.cursor?.firstBatch || [];
        const formattedStats = stats.map((s: any) => ({
            studentId: s._id?.$oid || String(s._id),
            totalDays: s.totalDays,
            presentDays: s.presentDays,
            percentage: s.totalDays > 0 ? Math.round((s.presentDays / s.totalDays) * 100) : 0
        }));

        return NextResponse.json(formattedStats);
    } catch (error: any) {
        console.error('Error fetching attendance stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

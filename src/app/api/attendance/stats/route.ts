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
        const result = await (prisma as any).$runCommandRaw({
            aggregate: 'Attendance',
            pipeline: [
                { $match: filter },
                {
                    $group: {
                        _id: '$studentId',
                        totalDays: { $sum: 1 },
                        presentDays: {
                            $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] }
                        },
                        lateDays: {
                            $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] }
                        },
                        absentDays: {
                            $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] }
                        }
                    }
                }
            ],
            cursor: { batchSize: 5000 }
        });

        const stats = result.cursor?.firstBatch || [];
        const formattedStats = stats.map((s: any) => ({
            studentId: s._id?.$oid || String(s._id),
            totalDays: s.totalDays,
            presentDays: s.presentDays,
            lateDays: s.lateDays,
            absentDays: s.absentDays,
            percentage: s.totalDays > 0 ? Math.round(((s.presentDays + s.lateDays) / s.totalDays) * 100) : 0
        }));

        return NextResponse.json(formattedStats);
    } catch (error: any) {
        console.error('Error fetching attendance stats:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

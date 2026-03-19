import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!instituteId) return NextResponse.json({ error: 'Institute ID is required' }, { status: 400 });

        // Aggregate stats using batchId with recipient details
        const notificationsRaw = await (prisma as any).$runCommandRaw({
            aggregate: 'Notification',
            pipeline: [
                { $match: { 'metadata.instituteId': instituteId } },
                {
                    $lookup: {
                        from: 'User',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: '$batchId',
                        type: { $first: '$type' },
                        message: { $first: '$message' },
                        title: { $first: '$title' },
                        createdAt: { $first: '$createdAt' },
                        reach: { $sum: 1 },
                        seen: { $sum: { $cond: [{ $in: ['$status', ['READ', 'CLICKED']] }, 1, 0] } },
                        clicks: { $sum: { $cond: [{ $eq: ['$status', 'CLICKED'] }, 1, 0] } },
                        recipients: {
                            $push: {
                                name: '$user.name',
                                phone: '$user.phone',
                                status: '$status',
                                seenAt: '$seenAt',
                                clickedAt: '$clickedAt'
                            }
                        }
                    }
                },
                { $match: { _id: { $ne: null } } }, // Only track batch notifications
                { $sort: { createdAt: -1 } },
                { $limit: 20 }
            ],
            cursor: {}
        });

        const recentEvents = notificationsRaw.cursor?.firstBatch || [];
        
        const totalSent = recentEvents.reduce((acc: number, curr: any) => acc + curr.reach, 0);
        const totalSeen = recentEvents.reduce((acc: number, curr: any) => acc + curr.seen, 0);
        const totalClicked = recentEvents.reduce((acc: number, curr: any) => acc + curr.clicks, 0);
        const ctr = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;
        const seenRate = totalSent > 0 ? Math.round((totalSeen / totalSent) * 100) : 0;

        return NextResponse.json({
            totalSent,
            totalSeen,
            totalClicked,
            reachRate: seenRate, // Use seen rate as practical reach
            ctr,
            recentEvents: recentEvents.map((e: any) => ({
                batchId: e._id,
                title: e.title,
                type: e.type,
                message: e.message,
                reach: e.reach,
                seen: e.seen,
                clicks: e.clicks,
                createdAt: e.createdAt?.$date || e.createdAt,
                recipients: e.recipients
            }))
        });
    } catch (error) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

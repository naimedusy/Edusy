import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET() {
    try {
        const [totalUsers, totalInstitutes, roles] = await Promise.all([
            prisma.user.count(),
            prisma.institute.count(),
            prisma.user.groupBy({
                by: ['role'],
                _count: true,
            }),
        ]);

        const roleCounts = roles.reduce((acc: any, curr: any) => {
            acc[curr.role] = curr._count;
            acc.total += curr._count;
            return acc;
        }, { total: 0 });

        return NextResponse.json({
            users: totalUsers,
            institutes: totalInstitutes,
            roleBreakdown: roleCounts,
        });
    } catch (error) {
        console.error('Admin Stats API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

// GET /api/submissions/review?instituteId=...&teacherId=...&limit=20
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const teacherId = searchParams.get('teacherId');
        const limit = parseInt(searchParams.get('limit') || '30');

        if (!instituteId) {
            return NextResponse.json({ message: 'instituteId is required' }, { status: 400 });
        }

        const where: any = {
            status: 'SUBMITTED',
            assignment: {
                instituteId,
                ...(teacherId ? { teacherId } : {})
            }
        };

        const submissions = await (prisma as any).submission.findMany({
            where,
            include: {
                student: {
                    select: { id: true, name: true, metadata: true }
                },
                assignment: {
                    include: {
                        book: { select: { id: true, name: true } },
                        class: { select: { id: true, name: true } },
                        group: { select: { id: true, name: true } },
                        teacher: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { submittedAt: 'desc' },
            take: limit
        });

        return NextResponse.json(submissions);
    } catch (error: any) {
        console.error('Review GET Error:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

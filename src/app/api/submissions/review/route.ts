import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

// GET /api/submissions/review?instituteId=...&teacherId=...&limit=20
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const teacherId = searchParams.get('teacherId');
        const limit = parseInt(searchParams.get('limit') || '30');

        console.log('Submissions Review GET hit:', { instituteId, teacherId, limit });

        if (!instituteId || instituteId === 'undefined' || instituteId.length !== 24) {
            console.log('Invalid instituteId provided');
            return NextResponse.json({ message: 'Valid instituteId is required' }, { status: 400 });
        }

        const where: any = {
            status: 'SUBMITTED'
        };

        const assignmentFilter: any = { instituteId };
        if (teacherId && teacherId !== 'undefined' && teacherId.length === 24) {
            assignmentFilter.teacherId = teacherId;
        }
        where.assignment = assignmentFilter;

        console.log('Final where clause for review:', JSON.stringify(where, null, 2));

        const submissions = await prisma.submission.findMany({
            where,
            include: {
                student: {
                    select: { id: true, name: true, metadata: true }
                },
                assignment: true
            },
            orderBy: { submittedAt: 'desc' },
            take: limit
        });

        return NextResponse.json(submissions);
    } catch (error: any) {
        console.error('Review GET Error Detailed:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            code: error.code
        });
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

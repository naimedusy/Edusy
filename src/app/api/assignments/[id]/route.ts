import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!id) {
            return NextResponse.json({ message: 'Assignment ID is required' }, { status: 400 });
        }

        const assignment = await prisma.assignment.findUnique({
            where: { id },
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
                }
            }
        });

        if (!assignment) {
            return NextResponse.json({ message: 'Assignment not found' }, { status: 404 });
        }

        // Optional: verify instituteId if provided
        if (instituteId && assignment.instituteId !== instituteId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(assignment);
    } catch (error) {
        console.error('Assignment GET Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

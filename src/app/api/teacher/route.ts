
import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const instituteId = searchParams.get('instituteId');

    if (!instituteId) {
        return NextResponse.json({ error: 'Institute ID is required' }, { status: 400 });
    }

    try {
        const teachers = await (prisma as any).teacherProfile.findMany({
            where: {
                instituteId: instituteId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        // image: true // if exists
                    }
                }
            }
        });

        return NextResponse.json(teachers);
    } catch (error) {
        console.error('Fetch teachers error:', error);
        return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
    }
}

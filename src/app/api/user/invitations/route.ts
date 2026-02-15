import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        const invitations = await (prisma as any).teacherProfile.findMany({
            where: {
                userId: userId,
                status: 'PENDING'
            },
            include: {
                institute: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        logo: true,
                        address: true
                    }
                }
            }
        });

        return NextResponse.json(invitations);
    } catch (error) {
        console.error('Fetch invitations error:', error);
        return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }
}

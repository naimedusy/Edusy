import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const instituteId = searchParams.get('instituteId');

    if (!query) {
        return NextResponse.json({ users: [] });
    }

    try {
        const platformUsers = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { name: { contains: query, mode: 'insensitive' } },
                ],
                NOT: {
                    role: {
                        in: ['STUDENT', 'GUARDIAN']
                    }
                },
            },
            take: 10,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                // Do not select password
            },
        });

        // We can rename variable back to users or keep it. Let's return as 'users' in JSON.
        return NextResponse.json({ users: platformUsers });
    } catch (error) {
        console.error('Search users error:', error);
        return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }
}

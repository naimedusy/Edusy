import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';

        if (query.length < 2) {
            return NextResponse.json([]);
        }

        const institutes = await prisma.institute.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { address: { contains: query, mode: 'insensitive' } }
                ]
            },
            select: {
                id: true,
                name: true,
                address: true,
                type: true,
                logo: true,
                coverImage: true
            },
            take: 20
        });

        return NextResponse.json(institutes);

    } catch (error: any) {
        console.error('Institute Search Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        const classes = await prisma.class.findMany({
            where: { instituteId },
            include: {
                groups: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json(classes);
    } catch (error) {
        console.error('Fetch classes error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, names, instituteId, order } = body;

        if (!instituteId || (!name && !names)) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        if (names && Array.isArray(names)) {
            const newClasses = await prisma.class.createMany({
                data: names.map((item: any) => ({
                    name: typeof item === 'string' ? item : item.name,
                    order: typeof item === 'string' ? 0 : (item.order || 0),
                    instituteId
                }))
            });
            return NextResponse.json(newClasses, { status: 201 });
        }

        const newClass = await prisma.class.create({
            data: {
                name,
                order: order || 0,
                instituteId
            }
        });

        return NextResponse.json(newClass, { status: 201 });
    } catch (error) {
        console.error('Create class error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

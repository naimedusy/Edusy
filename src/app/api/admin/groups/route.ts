import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');

        if (!classId) {
            return NextResponse.json({ message: 'Class ID is required' }, { status: 400 });
        }

        const groups = await prisma.group.findMany({
            where: { classId },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error('Fetch groups error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, classId, order } = body;

        if (!name || !classId) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        const newGroup = await prisma.group.create({
            data: {
                name,
                order: order || 0,
                classId
            }
        });

        return NextResponse.json(newGroup, { status: 201 });
    } catch (error) {
        console.error('Create group error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!instituteId) return NextResponse.json({ error: 'Institute ID is required' }, { status: 400 });

        const institute = await (prisma.institute as any).findUnique({
            where: { id: instituteId },
            select: { notificationSettings: true }
        });

        return NextResponse.json(institute?.notificationSettings || {});
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { instituteId, settings } = body;

        if (!instituteId) return NextResponse.json({ error: 'Institute ID is required' }, { status: 400 });

        await (prisma.institute as any).update({
            where: { id: instituteId },
            data: { notificationSettings: settings }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

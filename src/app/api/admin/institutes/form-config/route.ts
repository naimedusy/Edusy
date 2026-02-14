import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        const institute = await (prisma as any).$runCommandRaw({
            find: 'Institute',
            filter: { _id: { $oid: instituteId } },
            limit: 1
        });

        const inst = institute.cursor?.firstBatch?.[0];
        if (!inst) {
            return NextResponse.json({ message: 'Institute not found' }, { status: 404 });
        }

        return NextResponse.json(inst.studentFormConfig || []);
    } catch (error) {
        console.error('Fetch Form Config Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { instituteId, studentFormConfig } = body;

        if (!instituteId || !studentFormConfig) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await (prisma as any).$runCommandRaw({
            update: 'Institute',
            updates: [
                {
                    q: { _id: { $oid: instituteId } },
                    u: { $set: { studentFormConfig } }
                }
            ]
        });

        return NextResponse.json({ success: true, message: 'Form configuration updated' });
    } catch (error) {
        console.error('Update Form Config Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

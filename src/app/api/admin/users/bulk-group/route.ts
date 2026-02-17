import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userIds, groupId } = body;

        if (!userIds || !Array.isArray(userIds)) {
            return NextResponse.json({ message: 'User IDs are required' }, { status: 400 });
        }

        // Prepare bulk update operations
        const updates = userIds.map((id: string) => ({
            q: { _id: { $oid: id } },
            u: { $set: { 'metadata.groupId': groupId } }
        }));

        await (prisma as any).$runCommandRaw({
            update: 'User',
            updates
        });

        return NextResponse.json({ success: true, message: `${userIds.length} students updated` });
    } catch (error) {
        console.error('Bulk group assignment error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

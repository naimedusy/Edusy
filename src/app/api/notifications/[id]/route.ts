import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

// PATCH - Mark notification as read
export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const notificationId = params.id;

        if (!notificationId) {
            return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
        }

        await (prisma as any).$runCommandRaw({
            update: 'Notification',
            updates: [{
                q: { _id: { $oid: notificationId } },
                u: { $set: { read: true } }
            }]
        });

        return NextResponse.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Update Notification Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

// GET - Fetch a single notification
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        if (!prisma) {
            return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
        }

        const notification = await prisma.notification.findUnique({
            where: { id }
        });

        if (!notification) {
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        return NextResponse.json(notification);
    } catch (error: any) {
        console.error('Fetch Notification Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

// PATCH - Update a notification status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        if (!prisma) {
            return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
        }

        console.log('PATCH Notification Request - ID:', id);
        
        let body;
        try {
            body = await req.json();
        } catch (e) {
            // If body is empty, default to mark as read
            body = { status: 'READ' };
        }
        
        const { status } = body;
        console.log('PATCH Notification Status Update:', status);

        const updateData: any = { read: true };
        if (status === 'CLICKED') {
            updateData.status = 'CLICKED';
            updateData.clickedAt = new Date();
        } else if (status === 'READ') {
            updateData.status = 'READ';
            updateData.seenAt = new Date();
        }

        // Use updateMany to prevent throwing if record is missing
        const result = await prisma.notification.updateMany({
            where: { id },
            data: updateData
        });

        if (result.count === 0) {
            console.warn('No notification found with ID:', id);
            return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
        }

        console.log('Notification update successful for ID:', id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update Notification Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}

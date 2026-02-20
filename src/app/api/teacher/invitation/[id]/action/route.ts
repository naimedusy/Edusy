import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const invitationId = id;
    const body = await request.json();
    const { action } = body; // 'ACCEPT' or 'REJECT'

    if (!invitationId || !action) {
        return NextResponse.json({ error: 'Invitation ID and action are required' }, { status: 400 });
    }

    try {
        if (action === 'ACCEPT') {
            const updatedProfile = await (prisma as any).teacherProfile.update({
                where: { id: invitationId },
                data: { status: 'ACTIVE' }
            });
            return NextResponse.json({ success: true, profile: updatedProfile });
        }
        else if (action === 'REJECT') {
            // Option 1: Delete the profile (cleaner)
            // Option 2: Set status to 'REJECTED' (history)
            // Let's delete it so they can be re-invited easily if it was a mistake, 
            // or keep it as REJECTED to prevent spam? 
            // User request usually implies "Delete/Ignore". Let's delete for simplicity in this MVP flow.
            // Actually, if we delete, they disappear from "Pending" list.

            await (prisma as any).teacherProfile.delete({
                where: { id: invitationId }
            });
            return NextResponse.json({ success: true, message: 'Invitation rejected and removed' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Invitation action error:', error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { name, order } = body;

        const updatedGroup = await prisma.group.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(order !== undefined && { order })
            }
        });

        return NextResponse.json(updatedGroup);
    } catch (error) {
        console.error('Update group error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.group.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ message: 'Group deleted' });
    } catch (error) {
        console.error('Delete group error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

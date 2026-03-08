import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, order, startTime, endTime, tiffinStart, tiffinEnd, schedule, fees, lateThreshold } = body;

        const updatedClass = await prisma.class.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(order !== undefined && { order }),
                ...(startTime !== undefined && { startTime }),
                ...(endTime !== undefined && { endTime }),
                ...(tiffinStart !== undefined && { tiffinStart }),
                ...(tiffinEnd !== undefined && { tiffinEnd }),
                ...(schedule !== undefined && { schedule }),
                ...(fees !== undefined && { fees: parseInt(fees) || 0 }),
                ...(lateThreshold !== undefined && { lateThreshold: parseInt(lateThreshold) || 0 })
            }
        });

        return NextResponse.json(updatedClass);
    } catch (error) {
        console.error('Update class error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        // Find if there are students associated with this class in metadata
        // For simplicity in this demo, we'll just delete the class
        // but in a real app, we should check for students.

        // First delete all groups associated with this class
        await prisma.group.deleteMany({
            where: { classId: id }
        });

        await prisma.class.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Class deleted successfully' });
    } catch (error: any) {
        console.error('Delete class error:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const { name, order } = body;

        const updatedClass = await prisma.class.update({
            where: { id: params.id },
            data: {
                name,
                order: order !== undefined ? order : undefined
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
    { params }: { params: { id: string } }
) {
    try {
        // Find if there are students associated with this class in metadata
        // For simplicity in this demo, we'll just delete the class
        // but in a real app, we should check for students.

        await prisma.class.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: 'Class deleted successfully' });
    } catch (error) {
        console.error('Delete class error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

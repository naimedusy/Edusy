import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
    try {
        const { userId, role } = await req.json();

        if (!userId || !role) {
            return NextResponse.json({ message: 'Missing userId or role' }, { status: 400 });
        }

        const validRoles = ['ADMIN', 'TEACHER', 'STUDENT', 'GUARDIAN'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: { id: true, email: true, phone: true, role: true, name: true }
        });

        return NextResponse.json({
            message: 'Role updated successfully',
            user: updatedUser
        });

    } catch (error: any) {
        console.error('Update Role Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

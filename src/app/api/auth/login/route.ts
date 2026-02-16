import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const identifier = (body.email || body.phone || body.username || '').trim();
        const password = body.password; // Don't trim password as spaces can be valid

        if (!identifier || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone: identifier }
                ]
            },
            include: {
                institutes: {
                    select: { id: true, name: true, type: true }
                },
                teacherProfiles: true
            }
        });

        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        if (user.password !== password) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                defaultInstituteId: user.defaultInstituteId,
                institutes: user.institutes,
                teacherProfiles: user.teacherProfiles
            }
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }


}


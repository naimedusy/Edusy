import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = body.email?.trim();
        const password = body.password; // Don't trim password as spaces can be valid



        if (!email || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }


        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                institutes: {
                    select: { id: true, name: true, type: true }
                }
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
                institutes: user.institutes
            }
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }


}


import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, password } = body;
        const email = body.email?.trim();

        if (!name || !email || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }


        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }


        const user = await prisma.user.create({
            data: {
                name,
                email,
                password,
                role: 'ADMIN',
            },
        });

        return NextResponse.json({ message: 'User created successfully', user: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
    } catch (error: any) {
        console.error('Signup error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }


}


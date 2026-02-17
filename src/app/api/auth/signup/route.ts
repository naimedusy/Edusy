import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

const toEnglishNumerals = (str: string) => {
    const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return str.split('').map(c => {
        const index = bengaliNumerals.indexOf(c);
        return index !== -1 ? index.toString() : c;
    }).join('');
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, password } = body;
        let identifier = toEnglishNumerals(body.email?.trim() || body.phone?.trim() || '');

        if (!name || !identifier || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        const isEmail = identifier.includes('@');

        // Phone normalization (Match Login behavior)
        if (!isEmail) {
            if (identifier.startsWith('+88')) identifier = identifier.slice(3);
            else if (identifier.startsWith('88')) identifier = identifier.slice(2);
        }

        // Robust check for existing user (Parity with Login logic)
        let existingUser = await prisma.user.findFirst({
            where: isEmail ? { email: identifier } : { phone: identifier }
        });

        // If not found by string phone, try numeric phone
        if (!existingUser && !isEmail && /^\d+$/.test(identifier)) {
            const numPhone = parseInt(identifier, 10);
            const rawResults: any = await (prisma as any).user.findRaw({
                filter: { phone: numPhone }
            });
            if (rawResults && rawResults.length > 0) {
                existingUser = rawResults[0];
            }
        }

        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                name,
                email: isEmail ? identifier : undefined,
                phone: !isEmail ? identifier : undefined,
                password,
                role: 'ADMIN',
            },
        });

        return NextResponse.json({ message: 'User created successfully', user: { id: user.id || (user as any)._id?.toString(), email: user.email, phone: user.phone, role: user.role, name: user.name } }, { status: 201 });
    } catch (error: any) {
        console.error('Signup error details:', error);

        // Handle Prisma Unique Constraint error
        if (error.code === 'P2002') {
            const field = error.meta?.target || 'identifier';
            return NextResponse.json({
                message: `${field === 'email' ? 'ইমেইল' : 'ফোন'}টি ইতোমধ্যে ব্যবহৃত হচ্ছে।`,
                error: error.message
            }, { status: 400 });
        }

        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }


}


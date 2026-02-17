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
        let identifier = (String(body.email || '') || String(body.phone || '') || String(body.username || '') || '').trim();
        let password = String(body.password || '').trim();

        // --- NORMALIZATION ---
        identifier = toEnglishNumerals(identifier);
        password = toEnglishNumerals(password);

        // Remove +88 or 88 from mobile if present (assuming internal numbers don't store them)
        if (identifier.startsWith('+88')) identifier = identifier.slice(3);
        else if (identifier.startsWith('88')) identifier = identifier.slice(2);

        if (!identifier || !password) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        console.log('🔍 [DEBUG LOGIN] Normalised Identifier:', identifier);

        let user: any = null;

        // --- STEP 1: Search by Email (Case Insensitive) ---
        if (identifier.includes('@')) {
            try {
                user = await prisma.user.findFirst({
                    where: { email: { equals: identifier, mode: 'insensitive' } },
                    include: {
                        institutes: { select: { id: true, name: true, type: true, logo: true, coverImage: true } },
                        teacherProfiles: true
                    }
                });
            } catch (e) {
                console.error('⚠️ Email search error:', (e as Error).message);
            }
        }

        // --- STEP 2: Search by Phone (STRING) ---
        if (!user) {
            try {
                user = await prisma.user.findFirst({
                    where: { phone: identifier },
                    include: {
                        institutes: { select: { id: true, name: true, type: true, logo: true, coverImage: true } },
                        teacherProfiles: true
                    }
                });
            } catch (e) {
                console.error('⚠️ Phone search error:', (e as Error).message);
            }
        }

        // --- STEP 3: Search by Phone (NUMBER) ---
        if (!user && /^\d+$/.test(identifier)) {
            try {
                const numPhone = parseInt(identifier, 10);
                const rawResults = await (prisma as any).user.findRaw({
                    filter: { phone: numPhone }
                });

                if (rawResults && Array.isArray(rawResults) && rawResults.length > 0) {
                    const id = rawResults[0]._id?.$oid || rawResults[0]._id?.toString();
                    if (id) {
                        user = await prisma.user.findUnique({
                            where: { id },
                            include: {
                                institutes: { select: { id: true, name: true, type: true, logo: true, coverImage: true } },
                                teacherProfiles: true
                            }
                        });
                    }
                }
            } catch (e) {
                console.error('⚠️ Raw phone search error:', (e as Error).message);
            }
        }

        // --- STEP 4: Search by Student ID (Metadata) ---
        if (!user && !identifier.includes('@')) {
            try {
                // Try String ID
                let rawResults = await (prisma as any).user.findRaw({
                    filter: { "metadata.studentId": identifier }
                });

                // Try Numeric ID
                if ((!rawResults || rawResults.length === 0) && /^\d+$/.test(identifier)) {
                    rawResults = await (prisma as any).user.findRaw({
                        filter: { "metadata.studentId": parseInt(identifier, 10) }
                    });
                }

                if (rawResults && Array.isArray(rawResults) && rawResults.length > 0) {
                    const id = rawResults[0]._id?.$oid || rawResults[0]._id?.toString();
                    if (id) {
                        user = await prisma.user.findUnique({
                            where: { id },
                            include: {
                                institutes: { select: { id: true, name: true, type: true, logo: true, coverImage: true } },
                                teacherProfiles: true
                            }
                        });
                    }
                }
            } catch (e) {
                console.error('⚠️ Metadata search error:', (e as Error).message);
            }
        }

        if (!user) {
            console.log('❌ [LOGIN FAIL] ID not found in DB:', identifier);
            // DEBUG: Log first 2 users to see data format (REMOVE IN PROD)
            const sampleUsers = await prisma.user.findMany({ take: 2 });
            console.log('📊 [DATA SAMPLE] Format check:', JSON.stringify(sampleUsers, null, 2));

            return NextResponse.json({
                message: 'আপনার প্রদত্ত আইডি বা ইমেইল পাওয়া যায়নি।',
                debugHint: 'Check if phone starts with 0 or 88'
            }, { status: 401 });
        }

        // --- STEP 5: Validate Password (Robust comparison) ---
        const storedPassword = String(user.password || '').trim();
        const storedPhone = String(user.phone || '').trim();
        const storedStudentId = String((user.metadata as any)?.studentId || '').trim();
        const inputPassword = password;

        const isPasswordValid =
            storedPassword === inputPassword ||
            (user.role === 'STUDENT' && storedStudentId === inputPassword) ||
            (storedPhone === inputPassword);

        if (!isPasswordValid) {
            console.log('❌ [LOGIN FAIL] Password mismatch for:', identifier);
            return NextResponse.json({ message: 'আপনার পাসওয়ার্ড সঠিক নয়।' }, { status: 401 });
        }

        console.log('🎉 [LOGIN SUCCESS] User type:', user.role);

        return NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id || user._id?.toString(),
                email: user.email,
                role: user.role,
                name: user.name,
                phone: user.phone,
                metadata: user.metadata,
                defaultInstituteId: user.defaultInstituteId,
                institutes: user.institutes || [],
                teacherProfiles: user.teacherProfiles || []
            }
        });

    } catch (error: any) {
        console.error('CRITICAL LOGIN ERROR:', error);
        return NextResponse.json({
            message: 'Internal server error',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

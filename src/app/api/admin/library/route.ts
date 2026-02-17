import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const role = searchParams.get('role'); // 'ADMIN' or 'SUPER_ADMIN'
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category');

        if (!role) {
            return new NextResponse('Role is required', { status: 400 });
        }

        const whereClause: any = {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        };

        if (category && category !== 'All') {
            whereClause.category = category;
        }

        if (role === 'SUPER_ADMIN') {
            // Super Admin sees ALL books
            // No strict institute filter, or maybe filter by institute if provided in query for drill-down
            if (instituteId) {
                whereClause.instituteId = instituteId;
            }
        } else if (role === 'ADMIN' || role === 'TEACHER') { // Teachers might also view library
            if (!instituteId) {
                return new NextResponse('Institute ID is required for Admin', { status: 400 });
            }
            // Admin sees Own Institute Books + Global Books (instituteId: null)
            whereClause.AND = [
                {
                    OR: [
                        { instituteId: instituteId },
                        { instituteId: null }
                    ]
                }
            ];
        }

        const books = await prisma.book.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                institute: {
                    select: { name: true }
                },
                class: {
                    select: { name: true }
                }
            }
        });

        // Separate into "My Institute" vs "Global" for frontend if needed, 
        // or just return plain list.
        // Let's return categorized for clarity if requested, otherwise flat.
        // For Admin Dashboard, flat list with columns is often better.

        return NextResponse.json(books);

    } catch (error) {
        console.error('Admin Library API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

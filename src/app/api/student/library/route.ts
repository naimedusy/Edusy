import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const classId = searchParams.get('classId');
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category');

        if (!instituteId) {
            return new NextResponse('Institute ID is required', { status: 400 });
        }

        // Base where clause
        const whereClause: any = {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ],
            // Include books from this institute OR global books (instituteId: null)
            // Prisma AND/OR logic
            AND: [
                {
                    OR: [
                        { instituteId: instituteId },
                        { instituteId: null }
                    ]
                }
            ]
        };

        if (category && category !== 'All') {
            whereClause.category = category;
        }

        // Fetch Academic Books (Class specific)
        const academicBooks = classId ? await prisma.book.findMany({
            where: {
                ...whereClause,
                classId: classId
            },
            orderBy: { createdAt: 'desc' }
        }) : [];

        // Fetch General Books (No class assigned)
        // Note: We might want to include books that are explicitly categorized as 'General' or have no classId
        // For strict separation: classId: null
        const generalBooks = await prisma.book.findMany({
            where: {
                ...whereClause,
                classId: null
            },
            orderBy: { createdAt: 'desc' }
        });

        // Get unique categories for filter
        // This is a bit expensive if many books, but useful. 
        // Ideally we aggregate, but let's just get distinct categories from a separate lightweight query or predefined list.
        // For now, let's just return the books.

        return NextResponse.json({
            academic: academicBooks,
            general: generalBooks
        });

    } catch (error) {
        console.error('Library API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

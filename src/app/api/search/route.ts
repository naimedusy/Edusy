import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
        return NextResponse.json([]);
    }

    try {
        // 1. Search for Users (Students/Teachers)
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } }
                ],
                role: { in: ['STUDENT', 'TEACHER'] }
            },
            take: 30,
            select: { id: true, name: true, role: true, phone: true, metadata: true }
        });

        // 2. Search for Books
        const books = await (prisma as any).book.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { nameBangla: { contains: query, mode: 'insensitive' } },
                    { nameEnglish: { contains: query, mode: 'insensitive' } },
                    { author: { contains: query, mode: 'insensitive' } }
                ]
            },
            take: 20,
            include: {
                class: { select: { name: true } }
            }
        });

        const userResults = users.map(user => {
            const meta: any = user.metadata || {};
            return {
                id: user.id,
                name: user.name || 'Unknown',
                type: user.role,
                phone: user.phone,
                studentId: meta.studentId,
                rollNumber: meta.rollNumber,
                category: 'User' as const
            };
        });

        const bookResults = (books as any[]).map(book => ({
            id: book.id,
            name: book.name || book.nameBangla || book.nameEnglish || 'Untitled Book',
            type: 'BOOK',
            author: book.author,
            className: book.class?.name,
            category: 'Book' as const
        }));

        const results = [...userResults, ...bookResults];

        // 3. Deep In-Memory Filter
        const filteredResults = results.filter(item => {
            const q = query.toLowerCase();
            if (item.category === 'User') {
                const user = item as any;
                return (
                    user.name.toLowerCase().includes(q) ||
                    (user.phone && user.phone.includes(q)) ||
                    (user.studentId && user.studentId.toString().toLowerCase().includes(q)) ||
                    (user.rollNumber && user.rollNumber.toString().toLowerCase().includes(q))
                );
            } else {
                const book = item as any;
                return (
                    book.name.toLowerCase().includes(q) ||
                    (book.author && book.author.toLowerCase().includes(q))
                );
            }
        });

        return NextResponse.json(filteredResults.slice(0, 15));
    } catch (error) {
        console.error('Search API Error:', error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}

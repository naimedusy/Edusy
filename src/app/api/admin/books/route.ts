import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const classId = searchParams.get('classId');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        const books = await prisma.book.findMany({
            where: {
                instituteId,
                ...(classId && classId !== 'all' ? { classId } : {})
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json(books);
    } catch (error) {
        console.error('Fetch books error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { names, classId, instituteId, books: booksData } = body;

        // Support both simple names array and full book objects
        if (booksData && Array.isArray(booksData)) {
            const createdBooks = await Promise.all(
                booksData.map(book =>
                    (prisma.book as any).create({
                        data: {
                            name: book.name,
                            coverImage: book.coverImage,
                            author: book.author || null,
                            classId: book.classId || classId,
                            instituteId: book.instituteId || instituteId,
                        }
                    })
                )
            );
            return NextResponse.json({ message: 'Books created successfully', count: createdBooks.length });
        }

        if (!names || !Array.isArray(names) || !classId || !instituteId) {
            return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
        }

        const createdBooks = await Promise.all(
            names.map(name =>
                (prisma.book as any).create({
                    data: {
                        name,
                        coverImage: body.coverImage || null,
                        author: body.author || null,
                        classId,
                        instituteId,
                    }
                })
            )
        );

        return NextResponse.json({ message: 'Books created successfully', count: createdBooks.length });
    } catch (error) {
        console.error('Create books error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: 'ID is required' }, { status: 400 });
        }

        await prisma.book.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Delete book error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

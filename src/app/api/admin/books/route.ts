import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const classId = searchParams.get('classId');
        const groupId = searchParams.get('groupId');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        const match: any = { instituteId: { $oid: instituteId } };
        if (classId && classId !== 'all') {
            match.classId = { $oid: classId };
        }

        if (groupId && groupId !== 'all') {
            match.$or = [
                { groupId: { $oid: groupId } },
                { groupId: null }
            ];
        }

        const pipeline: any[] = [
            { $match: match },
            {
                $lookup: {
                    from: 'Group',
                    localField: 'groupId',
                    foreignField: '_id',
                    as: 'groupData'
                }
            },
            {
                $addFields: {
                    group: { $arrayElemAt: ['$groupData', 0] }
                }
            },
            { $sort: { createdAt: 1 } }
        ];

        const booksRaw = await (prisma as any).$runCommandRaw({
            aggregate: 'Book',
            pipeline,
            cursor: {}
        });

        const books = (booksRaw.cursor?.firstBatch || []).map((book: any) => ({
            id: book._id?.$oid || book._id?.toString(),
            name: book.name || '',
            nameBangla: book.nameBangla || null,
            nameEnglish: book.nameEnglish || null,
            nameArabic: book.nameArabic || null,
            description: book.description || null,
            coverImage: book.coverImage || null,
            author: book.author || null,
            totalMarks: book.totalMarks || 100,
            gradingRules: book.gradingRules || null,
            pdfUrl: book.pdfUrl || null,
            readLink: book.readLink || null,
            bookmarks: book.bookmarks || [],
            classId: book.classId?.$oid || book.classId?.toString(),
            groupId: book.groupId?.$oid || book.groupId?.toString() || null,
            group: book.group ? { name: book.group.name } : null
        }));

        return NextResponse.json(books);
    } catch (error) {
        console.error('Fetch books error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { names, classId, instituteId, books: booksData, groupId } = body;

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        const commonData = {
            instituteId: { $oid: instituteId },
            classId: classId ? { $oid: classId } : null,
            groupId: groupId ? { $oid: groupId } : null,
            description: body.description || null,
            pdfUrl: body.pdfUrl || null,
            readLink: body.readLink || null,
            bookmarks: body.bookmarks || [],
            createdAt: { $date: new Date().toISOString() },
            updatedAt: { $date: new Date().toISOString() }
        };

        const documents: any[] = [];

        if (booksData && Array.isArray(booksData)) {
            booksData.forEach(book => {
                documents.push({
                    name: book.name,
                    nameBangla: book.nameBangla || null,
                    nameEnglish: book.nameEnglish || null,
                    nameArabic: book.nameArabic || null,
                    description: book.description || commonData.description,
                    coverImage: book.coverImage || null,
                    author: book.author || null,
                    pdfUrl: book.pdfUrl || commonData.pdfUrl,
                    readLink: book.readLink || commonData.readLink,
                    bookmarks: book.bookmarks || commonData.bookmarks,
                    instituteId: commonData.instituteId,
                    classId: book.classId ? { $oid: book.classId } : commonData.classId,
                    groupId: book.groupId ? { $oid: book.groupId } : commonData.groupId,
                    totalMarks: 100,
                    createdAt: commonData.createdAt,
                    updatedAt: commonData.updatedAt
                });
            });
        } else if (names && Array.isArray(names)) {
            names.forEach(name => {
                documents.push({
                    name,
                    description: commonData.description,
                    coverImage: body.coverImage || null,
                    author: body.author || null,
                    pdfUrl: commonData.pdfUrl,
                    readLink: commonData.readLink,
                    bookmarks: commonData.bookmarks,
                    instituteId: commonData.instituteId,
                    classId: commonData.classId,
                    groupId: commonData.groupId,
                    totalMarks: 100,
                    createdAt: commonData.createdAt,
                    updatedAt: commonData.updatedAt
                });
            });
        }

        if (documents.length === 0) {
            return NextResponse.json({ message: 'No data to create' }, { status: 400 });
        }

        await (prisma as any).$runCommandRaw({
            insert: 'Book',
            documents
        });

        return NextResponse.json({ message: 'Books created successfully', count: documents.length });
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

        await (prisma as any).$runCommandRaw({
            delete: 'Book',
            deletes: [{ q: { _id: { $oid: id } }, limit: 1 }]
        });

        return NextResponse.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Delete book error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

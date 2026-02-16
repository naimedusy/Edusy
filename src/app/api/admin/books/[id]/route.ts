import { NextResponse } from 'next/server';
import prisma from '@/utils/db';
import fs from 'fs';
import path from 'path';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const ratingValue = body.rating !== undefined && body.rating !== null ? Number(body.rating) : undefined;

        const updateData: any = {
            name: body.name,
            nameBangla: body.nameBangla,
            nameEnglish: body.nameEnglish,
            nameArabic: body.nameArabic,
            description: body.description,
            author: body.author,
            coverImage: body.coverImage,
            pdfUrl: body.pdfUrl,
            readLink: body.readLink,
            rating: isNaN(ratingValue as number) ? undefined : ratingValue,
            totalMarks: body.totalMarks !== undefined ? Number(body.totalMarks) : undefined,
            gradingRules: body.gradingRules || undefined,
        };

        const updatedBook = await (prisma.book as any).update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updatedBook);
    } catch (error: any) {
        const { id } = await params;
        console.error('Update book error detail:', {
            id,
            errorMessage: error.message,
            errorStack: error.stack
        });

        return NextResponse.json({
            message: 'Internal Server Error',
            error: error.message
        }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.book.delete({
            where: { id }
        });
        return NextResponse.json({ message: 'Book deleted successfully' });
    } catch (error: any) {
        const { id } = await params;
        console.error('Delete book error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

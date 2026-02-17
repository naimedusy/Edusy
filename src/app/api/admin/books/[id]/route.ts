import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const update: any = {};
        if (body.name !== undefined) update.name = body.name;
        if (body.nameBangla !== undefined) update.nameBangla = body.nameBangla;
        if (body.nameEnglish !== undefined) update.nameEnglish = body.nameEnglish;
        if (body.nameArabic !== undefined) update.nameArabic = body.nameArabic;
        if (body.description !== undefined) update.description = body.description;
        if (body.author !== undefined) update.author = body.author;
        if (body.coverImage !== undefined) update.coverImage = body.coverImage;
        if (body.pdfUrl !== undefined) update.pdfUrl = body.pdfUrl;
        if (body.readLink !== undefined) update.readLink = body.readLink;
        if (body.bookmarks !== undefined) update.bookmarks = body.bookmarks;
        if (body.totalMarks !== undefined) update.totalMarks = Number(body.totalMarks);
        if (body.gradingRules !== undefined) update.gradingRules = body.gradingRules;
        if (body.groupId !== undefined) update.groupId = body.groupId ? { $oid: body.groupId } : null;
        if (body.classId !== undefined) update.classId = body.classId ? { $oid: body.classId } : undefined;

        update.updatedAt = { $date: new Date().toISOString() };

        await (prisma as any).$runCommandRaw({
            update: 'Book',
            updates: [
                {
                    q: { _id: { $oid: id } },
                    u: { $set: update }
                }
            ]
        });

        return NextResponse.json({ success: true, message: 'Book updated successfully' });
    } catch (error: any) {
        console.error('Update book error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await (prisma as any).$runCommandRaw({
            delete: 'Book',
            deletes: [{ q: { _id: { $oid: id } }, limit: 1 }]
        });
        return NextResponse.json({ message: 'Book deleted successfully' });
    } catch (error: any) {
        console.error('Delete book error:', error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

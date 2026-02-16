import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { guardianId, studentId, relationship } = body;

        if (!guardianId || !studentId) {
            return NextResponse.json({ message: 'Guardian ID and Student ID are required' }, { status: 400 });
        }

        // 1. Update Student Metadata
        await (prisma as any).$runCommandRaw({
            update: 'User',
            updates: [
                {
                    q: { _id: { $oid: studentId } },
                    u: {
                        $set: {
                            "metadata.guardianId": guardianId,
                            "metadata.guardianRelation": relationship || "অন্যান্য"
                        }
                    }
                }
            ]
        });

        // 2. Update Guardian Metadata (Add to childrenIds)
        await (prisma as any).$runCommandRaw({
            update: 'User',
            updates: [
                {
                    q: { _id: { $oid: guardianId } },
                    u: {
                        $addToSet: {
                            "metadata.childrenIds": studentId
                        }
                    }
                }
            ]
        });

        return NextResponse.json({ success: true, message: 'Student linked successfully' });
    } catch (error) {
        console.error('Guardian Linking Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const guardianId = searchParams.get('guardianId');
        const studentId = searchParams.get('studentId');

        if (!guardianId || !studentId) {
            return NextResponse.json({ message: 'Guardian ID and Student ID are required' }, { status: 400 });
        }

        // 1. Clear Student Guardian Metadata
        await (prisma as any).$runCommandRaw({
            update: 'User',
            updates: [
                {
                    q: { _id: { $oid: studentId } },
                    u: {
                        $unset: {
                            "metadata.guardianId": "",
                            "metadata.guardianRelation": ""
                        }
                    }
                }
            ]
        });

        // 2. Update Guardian Metadata (Remove from childrenIds)
        await (prisma as any).$runCommandRaw({
            update: 'User',
            updates: [
                {
                    q: { _id: { $oid: guardianId } },
                    u: {
                        $pull: {
                            "metadata.childrenIds": studentId
                        }
                    }
                }
            ]
        });

        return NextResponse.json({ success: true, message: 'Student unlinked successfully' });
    } catch (error) {
        console.error('Guardian Unlinking Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

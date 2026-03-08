import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: NextRequest) {
    try {
        const { studentId, dateString } = await req.json();

        if (!studentId || !dateString) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Helper to validate and format MongoDB ObjectId
        const toOid = (id: string) => {
            if (/^[0-9a-fA-F]{24}$/.test(id)) {
                return { $oid: id };
            }
            return id;
        };

        const filter = {
            studentId: toOid(studentId),
            dateString
        };

        console.log('Unmarking attendance with filter:', JSON.stringify(filter));

        // Use raw MongoDB command to delete the document
        try {
            await (prisma as any).$runCommandRaw({
                delete: 'Attendance',
                deletes: [
                    {
                        q: filter,
                        limit: 1
                    }
                ]
            });
        } catch (rawError: any) {
            console.error('Raw MongoDB delete (Attendance) failed:', rawError);

            // Fallback: Try lowercase collection name
            try {
                await (prisma as any).$runCommandRaw({
                    delete: 'attendance',
                    deletes: [
                        {
                            q: filter,
                            limit: 1
                        }
                    ]
                });
            } catch (secondError: any) {
                console.error('Fallback delete (attendance) also failed:', secondError);
                throw rawError;
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('CRITICAL: Error unmarking attendance:', error);
        return NextResponse.json({
            error: error.message,
            name: error.name,
            code: error.code
        }, { status: 500 });
    }
}

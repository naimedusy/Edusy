import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get('classId');
        const instituteId = searchParams.get('instituteId');
        const dateString = searchParams.get('date');

        if ((!classId && !instituteId) || !dateString) {
            return NextResponse.json({ error: 'Missing classId/instituteId or date' }, { status: 400 });
        }

        // Helper to validate and format MongoDB ObjectId
        const toOid = (id: string) => {
            if (/^[0-9a-fA-F]{24}$/.test(id)) {
                return { $oid: id };
            }
            return id; // Return as is if not a valid OID hex string
        };

        // Build native MongoDB filter
        const filter: any = { dateString };
        if (classId && classId !== 'all' && classId !== '') {
            filter.classId = toOid(classId);
        }
        if (instituteId) {
            filter.instituteId = toOid(instituteId);
        }

        console.log('Fetching attendance with raw filter:', JSON.stringify(filter));

        // Use raw MongoDB command to fetch attendance
        let result: any;
        try {
            // Prisma's $runCommandRaw for MongoDB
            // Using aggregate instead of find as it's sometimes more reliable with $runCommandRaw
            result = await (prisma as any).$runCommandRaw({
                aggregate: 'Attendance',
                pipeline: [
                    { $match: filter }
                ],
                cursor: {}
            });
        } catch (rawError: any) {
            console.error('Raw MongoDB command (Attendance) failed:', rawError);

            // Fallback: Try lowercase collection name
            try {
                result = await (prisma as any).$runCommandRaw({
                    aggregate: 'attendance',
                    pipeline: [
                        { $match: filter }
                    ],
                    cursor: {}
                });
            } catch (secondError: any) {
                console.error('Fallback raw command (attendance) also failed:', secondError);
                throw rawError; // Throw the original error
            }
        }

        // Extract documents from cursor
        const documents = result.cursor?.firstBatch || [];
        console.log(`Found ${documents.length} attendance records.`);

        // Normalize OIDs for the frontend
        const normalized = documents.map((doc: any) => ({
            ...doc,
            id: doc._id?.$oid || String(doc._id),
            studentId: doc.studentId?.$oid || String(doc.studentId),
            classId: doc.classId?.$oid || String(doc.classId),
            instituteId: doc.instituteId?.$oid || String(doc.instituteId),
        }));

        return NextResponse.json(normalized);
    } catch (error: any) {
        console.error('CRITICAL: Error fetching attendance list:', error);

        // Return a very detailed error object for debugging
        return NextResponse.json({
            error: error.message,
            name: error.name,
            code: error.code,
            meta: error.meta,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 });
    }
}

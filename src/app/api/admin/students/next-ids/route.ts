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

        // --- Calculate Next Student ID (Institute Wide) ---
        const idMatch: any = {
            role: 'STUDENT',
            instituteIds: { $oid: instituteId },
            'metadata.studentId': { $exists: true, $ne: "" }
        };

        const maxIdResult = await (prisma as any).$runCommandRaw({
            aggregate: 'User',
            pipeline: [
                { $match: idMatch },
                {
                    $project: {
                        numericId: { $toInt: "$metadata.studentId" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        maxId: { $max: "$numericId" }
                    }
                }
            ],
            cursor: {}
        });

        const maxId = maxIdResult.cursor?.firstBatch?.[0]?.maxId || 0;
        const nextId = (maxId + 1).toString().padStart(4, '0');

        // --- Calculate Next Roll Number (Class Wide) ---
        let nextRoll = "1";
        if (classId) {
            const rollMatch: any = {
                role: 'STUDENT',
                instituteIds: { $oid: instituteId },
                'metadata.classId': classId,
                'metadata.rollNumber': { $exists: true, $ne: "" }
            };

            const maxRollResult = await (prisma as any).$runCommandRaw({
                aggregate: 'User',
                pipeline: [
                    { $match: rollMatch },
                    {
                        $project: {
                            numericRoll: { $toInt: "$metadata.rollNumber" }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            maxRoll: { $max: "$numericRoll" }
                        }
                    }
                ],
                cursor: {}
            });

            const maxRoll = maxRollResult.cursor?.firstBatch?.[0]?.maxRoll || 0;
            nextRoll = (maxRoll + 1).toString();
        }

        return NextResponse.json({
            nextStudentId: nextId,
            nextRollNumber: nextRoll
        });

    } catch (error) {
        console.error('Next IDs API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

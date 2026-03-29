import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        const [classes, userCountsRaw] = await Promise.all([
            prisma.class.findMany({
                where: { instituteId },
                include: {
                    groups: {
                        orderBy: { order: 'asc' }
                    }
                },
                orderBy: { order: 'asc' }
            }),
            (prisma as any).$runCommandRaw({
                aggregate: 'User',
                pipeline: [
                    { 
                        $match: { 
                            role: 'STUDENT', 
                            instituteIds: { $oid: instituteId } 
                        } 
                    },
                    {
                        $facet: {
                            classCounts: [
                                { $group: { _id: "$metadata.classId", count: { $sum: 1 } } }
                            ],
                            groupCounts: [
                                { $group: { _id: "$metadata.groupId", count: { $sum: 1 } } }
                            ]
                        }
                    }
                ],
                cursor: {}
            })
        ]);

        const classCounts = userCountsRaw.cursor?.firstBatch?.[0]?.classCounts || [];
        const groupCounts = userCountsRaw.cursor?.firstBatch?.[0]?.groupCounts || [];

        const processedClasses = classes.map((cls: any) => {
            const clsCount = classCounts.find((c: any) => c._id === cls.id)?.count || 0;
            return {
                ...cls,
                _count: { students: clsCount },
                groups: (cls.groups || []).map((grp: any) => ({
                    ...grp,
                    _count: { students: groupCounts.find((g: any) => g._id === grp.id)?.count || 0 }
                }))
            };
        });

        return NextResponse.json(processedClasses);
    } catch (error) {
        console.error('Fetch classes error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, names, instituteId, order } = body;

        if (!instituteId || (!name && !names)) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        if (names && Array.isArray(names)) {
            const newClasses = await prisma.class.createMany({
                data: names.map((item: any) => ({
                    name: typeof item === 'string' ? item : item.name,
                    order: typeof item === 'string' ? 0 : (item.order || 0),
                    instituteId
                }))
            });
            return NextResponse.json(newClasses, { status: 201 });
        }

        const newClass = await prisma.class.create({
            data: {
                name,
                order: order || 0,
                instituteId
            }
        });

        return NextResponse.json(newClass, { status: 201 });
    } catch (error) {
        console.error('Create class error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

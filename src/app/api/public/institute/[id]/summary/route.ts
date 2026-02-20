import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const instituteId = id;

    if (!instituteId) {
        return NextResponse.json({ error: 'Institute ID is required' }, { status: 400 });
    }

    try {
        // Fetch basic info
        const institute = await prisma.institute.findUnique({
            where: { id: instituteId },
            select: {
                id: true,
                name: true,
                type: true,
                logo: true,
                coverImage: true,
                address: true,
                website: true,
                email: true,
                phone: true,
                _count: {
                    select: {
                        classes: true,
                        teacherProfiles: true, // Total teachers including pending? We can filter later if needed but rough count is fine
                    }
                }
            }
        });

        if (!institute) {
            return NextResponse.json({ error: 'Institute not found' }, { status: 404 });
        }

        // Get student count (from User model where instituteIds contains instituteId AND role is STUDENT)
        const studentCount = await prisma.user.count({
            where: {
                role: 'STUDENT',
                instituteIds: {
                    has: instituteId
                }
            }
        });

        // Get ACTIVE teacher count
        const teacherCount = await (prisma as any).teacherProfile.count({
            where: {
                instituteId: instituteId,
                status: 'ACTIVE'
            }
        });

        return NextResponse.json({
            ...institute,
            stats: {
                students: studentCount,
                teachers: teacherCount,
                classes: (institute as any)._count.classes
            }
        });
    } catch (error) {
        console.error('Fetch institute summary error:', error);
        return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }
}

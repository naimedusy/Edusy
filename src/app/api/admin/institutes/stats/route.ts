import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        // --- Students Count ---
        const studentCount = await prisma.user.count({
            where: {
                role: 'STUDENT',
                instituteIds: {
                    has: instituteId
                }
            }
        });

        // --- Teachers Count ---
        const teacherCount = await prisma.user.count({
            where: {
                role: 'TEACHER',
                instituteIds: {
                    has: instituteId
                }
            }
        });

        // --- Revenue (Mock for now, can be expanded later) ---
        // In a real app, we would sum up successful transactions for this institute
        const totalRevenue = 0;

        // --- Attendance (Mock for now) ---
        const attendanceRate = "৯৫%";

        return NextResponse.json({
            students: studentCount,
            teachers: teacherCount,
            revenue: totalRevenue,
            attendance: attendanceRate
        });

    } catch (error) {
        console.error('Institute Stats API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

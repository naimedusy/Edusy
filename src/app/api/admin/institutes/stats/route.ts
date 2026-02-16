import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');

        if (!instituteId) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        // Fetch all students to calculate pending count (workaround for JSON filter limitations)
        const allStudents = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                instituteIds: {
                    has: instituteId
                }
            },
            select: {
                metadata: true
            }
        });

        const studentCount = allStudents.filter((s: any) => s.metadata?.admissionStatus !== 'PENDING').length;
        const pendingStudentCount = allStudents.filter((s: any) => s.metadata?.admissionStatus === 'PENDING').length;

        // --- Teachers Count ---
        const teacherCount = await (prisma as any).teacherProfile.count({
            where: {
                instituteId: instituteId
            }
        });

        // --- Revenue (Mock for now, can be expanded later) ---
        // In a real app, we would sum up successful transactions for this institute
        const totalRevenue = 0;

        // --- Attendance (Mock for now) ---
        const attendanceRate = "৯৫%";

        return NextResponse.json({
            students: studentCount,
            pendingStudents: pendingStudentCount,
            teachers: teacherCount,
            revenue: totalRevenue,
            attendance: attendanceRate
        });

    } catch (error) {
        console.error('Institute Stats API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

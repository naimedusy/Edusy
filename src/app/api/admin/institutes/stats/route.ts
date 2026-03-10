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

        // --- Admission Trends (Last 7 Days) ---
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentStudents = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                instituteIds: { has: instituteId },
                createdAt: { gte: sevenDaysAgo }
            },
            select: { createdAt: true }
        });

        const dayNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
        const trends = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = recentStudents.filter(s => s.createdAt.toISOString().split('T')[0] === dateStr).length;
            trends.push({
                name: dayNames[date.getDay()],
                value: count,
                date: dateStr
            });
        }

        // --- Attendance Rate (Today) ---
        const todayStr = new Date().toISOString().split('T')[0];
        const attendances = await prisma.attendance.findMany({
            where: {
                instituteId: instituteId,
                dateString: todayStr
            },
            select: { status: true }
        });

        const presentCount = attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
        const totalPossible = studentCount || 1; // Prevent division by zero
        const rate = Math.round((presentCount / totalPossible) * 100);
        const attendanceRate = rate; // Return as number

        // --- Revenue (Keep as 0 for now until Billing is implemented) ---
        const totalRevenue = 0;

        // --- Upcoming Assignments (Events) ---
        const upcomingAssignments = await prisma.assignment.findMany({
            where: {
                instituteId: instituteId,
                deadline: { gte: new Date() }
            },
            take: 3,
            orderBy: { deadline: 'asc' },
            select: {
                id: true,
                title: true,
                deadline: true,
                type: true
            }
        });

        // --- Profile Completeness ---
        const institute = await prisma.institute.findUnique({
            where: { id: instituteId }
        });

        const profileFields = ['logo', 'coverImage', 'address', 'phone', 'email', 'website', 'type'];
        const filledFields = profileFields.filter(f => (institute as any)?.[f]).length;
        const profileHealth = Math.round((filledFields / profileFields.length) * 100);

        return NextResponse.json({
            students: studentCount,
            pendingStudents: pendingStudentCount,
            teachers: teacherCount,
            revenue: totalRevenue,
            attendance: attendanceRate,
            presentCount,
            totalStudents: studentCount,
            admissionTrends: trends,
            upcomingAssignments,
            profileHealth,
            institute // Including full institute data to allow refreshing session in dashboard
        });

    } catch (error) {
        console.error('Institute Stats API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

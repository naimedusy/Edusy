import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const instituteId = searchParams.get('instituteId');
        const classId = searchParams.get('classId');
        const studentId = searchParams.get('studentId'); // The user's ID

        if (!instituteId || !classId) {
            return new NextResponse('Missing instituteId or classId', { status: 400 });
        }

        // 1. Fetch Class Details
        const classDetails = await prisma.class.findUnique({
            where: { id: classId },
            select: { name: true }
        });

        if (!classDetails) {
            return new NextResponse('Class not found', { status: 404 });
        }

        // 2. Fetch Classmates (Students in the same class)
        // We filter by role="STUDENT", instituteId, and metadata.classId matching
        // Note: metadata filter in Prisma with MongoDB can be tricky depending on version/schema.
        // Assuming we fetch specific fields and filter in memory if needed, or use raw query if complex.
        // For now, let's try finding users where instituteIds has instituteId AND role is STUDENT.
        // Then we filter by metadata.classId in JS if strict database filtering is hard with Json type.
        // However, for scalability, index on metadata.classId is recommended, but let's stick to simple first.

        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                instituteIds: { has: instituteId }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                metadata: true,
            }
        });

        const classmates = students.filter((s: any) =>
            s.metadata?.classId === classId && s.metadata?.admissionStatus === 'APPROVED' && s.id !== studentId
        ).map((s: any) => ({
            id: s.id,
            name: s.name,
            roll: s.metadata?.rollNumber || 'N/A',
            photo: s.metadata?.studentPhoto || null,
            phone: s.phone
        }));

        // 3. Fetch Books (Subjects)
        const books = await prisma.book.findMany({
            where: {
                instituteId: instituteId,
                classId: classId
            },
            select: {
                id: true,
                name: true,
                author: true,
                coverImage: true,
                description: true
            }
        });

        // 4. Fetch Teachers assigned to this class
        // TeacherProfile has assignedClassIds array
        const teacherProfiles = await prisma.teacherProfile.findMany({
            where: {
                instituteId: instituteId,
                assignedClassIds: { has: classId },
                status: 'ACTIVE'
            },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                        metadata: true // For photo if stored there? or usually no photo field in User for teachers yet? 
                        // Let's assume user.metadata might have photo or we just use name.
                        // Actually, let's keep it simple.
                    }
                }
            }
        });

        const teachers = teacherProfiles.map((tp: any) => ({
            id: tp.userId, // Use User ID for linking
            name: tp.user.name,
            designation: tp.designation,
            department: tp.department,
            phone: tp.user.phone,
            photo: (tp.user.metadata as any)?.teacherPhoto || null // Assuming potential photo
        }));


        return NextResponse.json({
            className: classDetails.name,
            classmates,
            books,
            teachers
        });

    } catch (error) {
        console.error('Classroom API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

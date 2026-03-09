import { PrismaClient, Role, AssignmentType, AssignmentStatus } from '@prisma/client'
// import prisma from '../src/utils/db' // Using local client for seeding to avoid alias issues

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    console.log('Connecting to database...');
    try {
        await prisma.$connect();
        console.log('Connected to database.');
    } catch (e) {
        console.error('Failed to connect to database:', e);
        throw e;
    }

    // 1. Create Demo Institute
    console.log('Creating Demo Institute...');
    const demoInstitute = await prisma.institute.upsert({
        where: { id: '65ea7b2e8c2d1b001d8e1234' }, // Fixed ID for consistency
        update: {},
        create: {
            id: '65ea7b2e8c2d1b001d8e1234',
            name: 'Edusy Demo Academy',
            type: 'Madrasa',
            address: 'Dhaka, Bangladesh',
            phone: '01711223344',
            email: 'demo@edusy.com',
            website: 'https://edusy.com',
            assignmentReleaseTime: '06:00',
        }
    });

    // 2. Create Classes
    console.log('Creating Classes...');
    const class1 = await prisma.class.upsert({
        where: { id: '65ea7b2e8c2d1b001d8e1111' },
        update: {},
        create: {
            id: '65ea7b2e8c2d1b001d8e1111',
            name: 'Class One',
            order: 1,
            startTime: '08:00',
            instituteId: demoInstitute.id,
        }
    });

    const class2 = await prisma.class.upsert({
        where: { id: '65ea7b2e8c2d1b001d8e2222' },
        update: {},
        create: {
            id: '65ea7b2e8c2d1b001d8e2222',
            name: 'Class Two',
            order: 2,
            startTime: '08:00',
            instituteId: demoInstitute.id,
        }
    });

    // 3. Create Groups
    console.log('Creating Groups...');
    const groupA = await prisma.group.upsert({
        where: { id: '65ea7b2e8c2d1b001d8e3333' },
        update: {},
        create: {
            id: '65ea7b2e8c2d1b001d8e3333',
            name: 'Group A',
            classId: class1.id,
        }
    });

    // 4. Create Books/Subjects
    console.log('Creating Books...');
    const mathBook = await prisma.book.upsert({
        where: { id: '65ea7b2e8c2d1b001d8e4444' },
        update: {},
        create: {
            id: '65ea7b2e8c2d1b001d8e4444',
            name: 'Mathematics',
            nameBangla: 'গণিত',
            classId: class1.id,
            instituteId: demoInstitute.id,
        }
    });

    const arabicBook = await prisma.book.upsert({
        where: { id: '65ea7b2e8c2d1b001d8e5555' },
        update: {},
        create: {
            id: '65ea7b2e8c2d1b001d8e5555',
            name: 'Arabic Grammar',
            nameArabic: 'النحو',
            classId: class1.id,
            instituteId: demoInstitute.id,
        }
    });

    // 5. Create Demo Users
    console.log('Seeding demo users...');
    const demoAdmin = await prisma.user.upsert({
        where: { email: 'demo@edusy.com' },
        update: {
            instituteIds: [demoInstitute.id],
            defaultInstituteId: demoInstitute.id,
            role: Role.ADMIN,
            password: 'demo_password', // Ensure password is set even on update
        },
        create: {
            email: 'demo@edusy.com',
            name: 'Demo Principal',
            password: 'demo_password',
            role: Role.ADMIN,
            phone: '01000000000',
            instituteIds: [demoInstitute.id],
            defaultInstituteId: demoInstitute.id,
        },
    });

    const demoTeacher = await prisma.user.upsert({
        where: { email: 'teacher_demo@edusy.com' },
        update: {
            instituteIds: [demoInstitute.id],
            defaultInstituteId: demoInstitute.id,
            password: 'demo_password', // Ensure password is set
        },
        create: {
            email: 'teacher_demo@edusy.com',
            name: 'Demo Teacher',
            password: 'demo_password',
            role: Role.TEACHER,
            phone: '01000000001',
            instituteIds: [demoInstitute.id],
            defaultInstituteId: demoInstitute.id,
        },
    });

    // Create Teacher Profile
    await prisma.teacherProfile.upsert({
        where: { userId_instituteId: { userId: demoTeacher.id, instituteId: demoInstitute.id } },
        update: { assignedClassIds: [class1.id, class2.id], status: 'ACTIVE' },
        create: {
            userId: demoTeacher.id,
            instituteId: demoInstitute.id,
            designation: 'Senior Teacher',
            status: 'ACTIVE',
            assignedClassIds: [class1.id, class2.id],
        }
    });

    const demoStudent = await prisma.user.upsert({
        where: { email: 'student_demo@edusy.com' },
        update: {
            instituteIds: [demoInstitute.id],
            defaultInstituteId: demoInstitute.id,
            password: 'demo_password', // Ensure password is set
        },
        create: {
            email: 'student_demo@edusy.com',
            name: 'Demo Student',
            password: 'demo_password',
            role: Role.STUDENT,
            phone: '01000000002',
            instituteIds: [demoInstitute.id],
            defaultInstituteId: demoInstitute.id,
            metadata: {
                studentId: 'DEMO123',
                classId: class1.id,
                groupId: groupA.id,
            }
        },
    });

    // 6. Sample Assignments
    console.log('Creating Sample Assignments...');
    await prisma.assignment.create({
        data: {
            title: 'Algebra Basics',
            description: 'Solve exercises 1-10 on page 45.',
            type: AssignmentType.HOMEWORK,
            status: AssignmentStatus.PUBLISHED,
            instituteId: demoInstitute.id,
            teacherId: demoTeacher.id,
            classId: class1.id,
            bookId: mathBook.id,
            scheduledDate: new Date(),
        }
    });

    console.log('Seeding completed successfully.');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

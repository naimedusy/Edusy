import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkStudentAssignments() {
    try {
        console.log("Finding student 'nafis'...");
        const student = await prisma.user.findFirst({
            where: {
                role: 'STUDENT',
                name: { contains: 'nafis', mode: 'insensitive' }
            }
        });

        if (!student) {
            console.log("Student not found.");
            // find by guardian instead
            const guardian = await prisma.user.findFirst({
                where: { role: 'GUARDIAN' }
            });
            console.log("Guardian ID:", guardian?.id);
            return;
        }

        console.log(`Student ID: ${student.id}, Name: ${student.name}`);

        const submissions = await prisma.submission.findMany({
            where: { studentId: student.id },
            include: { assignment: { include: { book: true } } }
        });

        console.log(`\nFound ${submissions.length} submissions for this student:`);
        submissions.forEach(sub => {
            console.log(`- Assignment ID: ${sub.assignmentId}`);
            console.log(`  Title: ${sub.assignment?.title}`);
            console.log(`  Book: ${sub.assignment?.book?.name}`);
            console.log(`  Status: ${sub.status}`);
        });

        console.log(`\nNow finding ALL assignments this student should have...`);
        // Basic check for assignments belonging to this student's class/group
        const studentProfile = await prisma.user.findUnique({
            where: { id: student.id },
            select: { metadata: true }
        }) as any;

        const classId = studentProfile?.metadata?.classId;
        const groupId = studentProfile?.metadata?.groupId;

        const allAssignments = await prisma.assignment.findMany({
            where: {
                OR: [
                    { groupId: groupId },
                    { AND: [{ classId: classId }, { groupId: null }] }
                ]
            },
            include: { book: true }
        });

        console.log(`Found ${allAssignments.length} total assignments assigned to this student's class/group:`);
        allAssignments.forEach(a => {
            console.log(`- Assignment ID: ${a.id}`);
            console.log(`  Title: ${a.title}`);
            console.log(`  Book: ${a.book?.name}`);
            const hasSub = submissions.some(s => s.assignmentId === a.id);
            console.log(`  Has Submission: ${hasSub}`);
        });

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkStudentAssignments();

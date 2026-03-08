import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAPI() {
    try {
        console.log("Finding all students...");
        const users = await prisma.user.findMany({
            where: { role: 'STUDENT' }
        });

        const child = users.find(u => u.name?.toLowerCase().includes('nafis'));
        if (!child) return console.log("Child not found among " + users.length + " students");

        console.log(`Child ID: ${child.id}`);

        const childProfile = await prisma.user.findUnique({
            where: { id: child.id },
            select: { metadata: true }
        }) as any;

        const classId = childProfile?.metadata?.classId;
        const groupId = childProfile?.metadata?.groupId;

        const assignments = await prisma.assignment.findMany({
            where: {
                OR: [
                    { groupId: groupId },
                    { AND: [{ classId: classId }, { groupId: null }] }
                ]
            },
            include: {
                submissions: {
                    where: { studentId: child.id },
                    select: { id: true, status: true }
                },
                book: true
            },
            orderBy: { createdAt: 'desc' }
        });

        assignments.forEach(a => {
            const studentSubmission = a.submissions?.[0];
            const userStatus = studentSubmission?.status || 'NOT_STARTED';
            console.log(`\nAssignment: ${a.title || a.book?.name} (ID: ${a.id})`);
            console.log(`- Submissions Array Length: ${a.submissions.length}`);
            console.log(`- Evaluated userStatus: ${userStatus}`);
        });

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkAPI();

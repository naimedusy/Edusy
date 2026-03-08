import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificAssignment() {
    try {
        console.log("Searching for assignment starting with 'meaning'...");

        const assignments = await prisma.assignment.findMany({
            where: {
                title: { contains: 'meaning', mode: 'insensitive' }
            },
            include: {
                submissions: {
                    include: {
                        student: { select: { name: true, role: true } }
                    }
                },
                class: true,
                book: true
            }
        });

        console.log(`Found ${assignments.length} matching assignments.`);

        assignments.forEach(a => {
            console.log(`\nAssignment ID: ${a.id}`);
            console.log(`Title: ${a.title}`);
            console.log(`Book: ${a.book?.name}`);
            console.log(`Class: ${a.class?.name}`);
            console.log(`Total Submissions: ${a.submissions.length}`);

            a.submissions.forEach(sub => {
                console.log(`  - Student: ${sub.student.name}`);
                console.log(`    Status: ${sub.status}`);
            });
        });

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecificAssignment();

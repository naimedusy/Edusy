import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function checkTasks() {
    try {
        const subs = await prisma.submission.findMany({
            include: { assignment: { include: { book: true } }, student: true }
        });

        let output = "";
        subs.forEach(sub => {
            output += `\nSubmission ID: ${sub.id} | Student: ${sub.student.name}\n`;
            output += `Assignment Title: ${sub.assignment?.title}\n`;
            output += `Book: ${sub.assignment?.book?.name}\n`;
            output += `Status: ${sub.status}\n`;
            output += `Task Progress JSON:\n`;
            output += JSON.stringify(sub.taskProgress, null, 2) + "\n";
        });

        fs.writeFileSync('test-tasks-output.json', output);
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkTasks();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Detailed Student Inspection ---');
    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        take: 10
    });

    students.forEach(s => {
        console.log(`\nStudent: ${s.name} (${s.id})`);
        console.log(`  Top-level Password: "${s.password}"`);
        console.log(`  Metadata Password: "${s.metadata?.password || 'N/A'}"`);
        console.log(`  Top-level Phone: "${s.phone}"`);
        console.log(`  Metadata studentId: "${s.metadata?.studentId || 'N/A'}"`);
        console.log(`  Metadata studentPhone: "${s.metadata?.studentPhone || 'N/A'}"`);
        console.log(`  Metadata password: "${s.metadata?.password || 'N/A'}"`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());

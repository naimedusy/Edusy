const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Students ---');
    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        take: 5
    });

    students.forEach(s => {
        console.log(`\nStudent: ${s.name}`);
        console.log(`  ID: ${s.id}`);
        console.log(`  Email: ${s.email}`);
        console.log(`  Phone: ${s.phone}`);
        console.log(`  Password: ${s.password}`);
        console.log(`  Metadata:`, JSON.stringify(s.metadata, null, 2));
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());

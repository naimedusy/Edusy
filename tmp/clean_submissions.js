const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanUp() {
    console.log('Fetching all submissions...');
    const submissions = await prisma.submission.findMany({ select: { id: true, studentId: true } });
    
    console.log(`Found ${submissions.length} submissions.`);
    
    let deleted = 0;
    for (const sub of submissions) {
        const user = await prisma.user.findUnique({ where: { id: sub.studentId } });
        if (!user) {
            console.log(`Orphaned submission found: ${sub.id} (Student: ${sub.studentId}). Deleting...`);
            await prisma.submission.delete({ where: { id: sub.id } });
            deleted++;
        }
    }
    
    console.log(`Cleanup complete. Deleted ${deleted} orphaned submissions.`);
}

cleanUp().catch(console.error).finally(() => prisma.$disconnect());

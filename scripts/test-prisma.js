const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Teacher Profiles ---');
    // Use any cast if needed in TS, but this is JS
    const teachers = await prisma.teacherProfile.findMany({
        include: {
            institute: true,
            user: true
        }
    });

    console.log(`Total Teachers: ${teachers.length}`);
    const byInstitute = {};

    teachers.forEach(t => {
        const instName = t.institute?.name || 'Unknown';
        if (!byInstitute[instName]) byInstitute[instName] = [];
        byInstitute[instName].push(t.user.name);
    });

    console.log('Teachers by Institute:');
    console.log(JSON.stringify(byInstitute, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });

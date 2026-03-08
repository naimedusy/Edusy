const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function run() {
    const users = await prisma.user.findMany({
        where: { role: { in: ['STUDENT', 'GUARDIAN'] } },
        select: { id: true, name: true, role: true, metadata: true, instituteIds: true }
    });

    fs.writeFileSync('diagnostic2.json', JSON.stringify(users, null, 2));
    process.exit();
}
run();

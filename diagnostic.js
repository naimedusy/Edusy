const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function run() {
    const students = await prisma.user.findMany({
        where: { role: 'STUDENT', name: { contains: 'naim' } }
    });

    const guardians = await prisma.user.findMany({
        where: { role: 'GUARDIAN' }
    });

    const classes = await prisma.class.findMany();

    const result = {
        students: students.map(s => ({ id: s.id, name: s.name, metadata: s.metadata })),
        guardians: guardians.map(g => ({ id: g.id, name: g.name, metadata: g.metadata })),
        classes: classes.map(c => ({ id: c.id, name: c.name }))
    };

    fs.writeFileSync('diagnostic.json', JSON.stringify(result, null, 2));
    process.exit();
}
run();

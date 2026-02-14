import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Diagnosis Start ---');
    try {
        const classes = await prisma.class.findMany({
            include: { groups: true }
        });
        console.log('Total Classes:', classes.length);
        console.log('Sample Class with Groups:', JSON.stringify(classes.slice(0, 1), null, 2));

        const groups = await prisma.group.findMany();
        console.log('Total Groups:', groups.length);
        console.log('Sample Group:', JSON.stringify(groups.slice(0, 1), null, 2));
    } catch (error: any) {
        console.error('Diagnosis Error:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

main();

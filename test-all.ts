import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAll() {
    try {
        console.log("Finding all students...");
        const users = await prisma.user.findMany({ select: { id: true, name: true, role: true } });

        users.forEach(u => {
            if (u.name?.toLowerCase().includes('naf')) {
                console.log(`FOUND KEYWORD: ${u.id} - ${u.name} - ${u.role}`);
            }
        });

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await prisma.$disconnect();
    }
}

checkAll();

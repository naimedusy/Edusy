import { PrismaClient } from '@prisma/client'

// Define Role locally to avoid import issues
const Role = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    ACCOUNTANT: 'ACCOUNTANT',
    TEACHER: 'TEACHER',
    GUARDIAN: 'GUARDIAN',
    STUDENT: 'STUDENT',
    DEMO: 'DEMO'
} as const;

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    const users = [
        { email: 'superadmin@edusy.com', name: 'Super Admin', role: Role.SUPER_ADMIN },
        { email: 'admin@edusy.com', name: 'Admin User', role: Role.ADMIN },
        { email: 'accountant@edusy.com', name: 'Accountant User', role: Role.ACCOUNTANT },
        { email: 'teacher@edusy.com', name: 'Teacher User', role: Role.TEACHER },
        { email: 'guardian@edusy.com', name: 'Guardian User', role: Role.GUARDIAN },
        { email: 'student@edusy.com', name: 'Student User', role: Role.STUDENT },
        { email: 'demo@edusy.com', name: 'Demo User', role: Role.DEMO },
    ]

    for (const u of users) {
        try {
            const existing = await prisma.user.findUnique({
                where: { email: u.email }
            });

            if (existing) {
                console.log(`User ${u.email} already exists.`);
                // Update check if needed, for now just skip
            } else {
                await prisma.user.create({
                    data: {
                        email: u.email,
                        name: u.name,
                        password: 'password123',
                        role: u.role
                    }
                });
                console.log(`Created user ${u.email}`);
            }
        } catch (e) {
            console.error(`Failed to process ${u.email}:`, e);
        }
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })

import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    console.log('Connecting to database...');
    try {
        await prisma.$connect();
        console.log('Connected to database.');
    } catch (e) {
        console.error('Failed to connect to database:', e);
        throw e;
    }

    const users = [
        { email: 'superadmin@edusy.com', name: 'Super Admin', role: Role.SUPER_ADMIN },
        { email: 'admin@edusy.com', name: 'Admin User', role: Role.ADMIN },
        { email: 'accountant@edusy.com', name: 'Accountant User', role: Role.ACCOUNTANT },
        { email: 'teacher@edusy.com', name: 'Teacher User', role: Role.TEACHER },
        { email: 'guardian@edusy.com', name: 'Guardian User', role: Role.GUARDIAN },
        { email: 'student@edusy.com', name: 'Student User', role: Role.STUDENT },
        { email: 'demo@edusy.com', name: 'Demo User', role: Role.DEMO },
    ]

    console.log('Seeding users...');

    for (const user of users) {
        try {
            const upsertedUser = await prisma.user.upsert({
                where: { email: user.email },
                update: {},
                create: {
                    email: user.email,
                    name: user.name,
                    password: 'password123', // In real app, hash this!
                    role: user.role,
                },
            })
            console.log(`Upserted user: ${upsertedUser.email}`)
        } catch (e) {
            console.error(`Error upserting user ${user.email}:`, e);
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

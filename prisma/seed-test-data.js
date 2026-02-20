const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INST_ID = "699098a96efcaf26224df245";
const CLS_ID = "6990cff15ee42088f73370b8";
const BOOK_ID = "69922066a4d192bdc0568cd7";
const TEACHER_ID = "6990835351ab03d764c14412";

async function main() {
    console.log('--- Seeding Default Test Data ---');

    // 1. Create Default Students
    const students = [
        { name: 'Naim User', email: 'naim@edusy.com', roll: '101' },
        { name: 'Minhaz User', email: 'minhaz@edusy.com', roll: '102' },
        { name: 'Developer User', email: 'dev@edusy.com', roll: '103' }
    ];

    const createdStudentIds = [];

    for (const s of students) {
        const user = await prisma.user.upsert({
            where: { email: s.email },
            update: {
                name: s.name,
                role: 'STUDENT',
                instituteIds: [INST_ID],
                metadata: {
                    classId: CLS_ID,
                    studentId: s.roll
                }
            },
            create: {
                email: s.email,
                name: s.name,
                password: 'password123',
                role: 'STUDENT',
                instituteIds: [INST_ID],
                metadata: {
                    classId: CLS_ID,
                    studentId: s.roll
                }
            }
        });
        console.log(`- Student: ${user.name} (${user.id})`);
        createdStudentIds.push(user.id);
    }

    // 2. Create a Test Assignment with Individualized Distribution (Version 2.0)
    const [naimId, minhazId, devId] = createdStudentIds;

    const structuredData = {
        version: '2.0',
        sections: [
            {
                title: 'ক্লাসের পড়া (Classwork)',
                tasks: [
                    { id: 'cw-1', segments: [{ id: 'seg-1', type: 'text', value: 'Chapter 1 Reading' }], targetStudents: [] }, // All
                    { id: 'cw-2', segments: [{ id: 'seg-2', type: 'text', value: 'Personal Reading Practice' }], targetStudents: [naimId] } // Only Naim
                ]
            },
            {
                title: 'বাড়ির কাজ (Homework)',
                tasks: [
                    { id: 'hw-1', segments: [{ id: 'seg-3', type: 'text', value: 'Solve Exercise 1.1' }], targetStudents: [] }, // All
                    { id: 'hw-2', segments: [{ id: 'seg-4', type: 'text', value: 'Special Math Challenge' }], targetStudents: [minhazId] } // Only Minhaz
                ]
            }
        ],
        fullMarkdown: "### ক্লাসের পড়া (Classwork)\n- Chapter 1 Reading\n- Personal Reading Practice (Naim only)\n\n### বাড়ির কাজ (Homework)\n- Solve Exercise 1.1\n- Special Math Challenge (Minhaz only)"
    };

    await prisma.assignment.create({
        data: {
            title: 'Seeded Test Assignment',
            description: JSON.stringify(structuredData),
            status: 'DRAFT',
            type: 'HOMEWORK',
            scheduledDate: new Date(),
            instituteId: INST_ID,
            classId: CLS_ID,
            bookId: BOOK_ID,
            teacherId: TEACHER_ID
        }
    });

    console.log('- Test Assignment Created');
    console.log('--- Seeding Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const instituteId = '699098a96efcaf26224df245';
    const teacherId = null;
    const limit = 30;

    console.log('Testing query with:', { instituteId, teacherId, limit });

    try {
        const submissions = await prisma.submission.findMany({
            where: {
                status: 'SUBMITTED',
                assignment: {
                    instituteId: instituteId
                }
            },
            take: 5
        });

        console.log('Minimal query successful! Count:', submissions.length);
        
        const submissionsFull = await prisma.submission.findMany({
            where: {
                status: 'SUBMITTED',
                assignment: {
                    instituteId: instituteId
                }
            },
            include: {
                student: {
                    select: { id: true, name: true, metadata: true }
                },
                assignment: {
                    include: {
                        book: { select: { id: true, name: true } },
                        class: { select: { id: true, name: true } },
                        group: { select: { id: true, name: true } },
                        teacher: { select: { id: true, name: true } }
                    }
                }
            },
            take: 5
        });
        console.log('Included query successful! Count:', submissionsFull.length);
        
        if (submissionsFull.length > 0) {
            try {
                const json = JSON.stringify(submissionsFull[0], null, 2);
                console.log('Serialization successful!');
                // console.log(json);
            } catch (jsonErr: any) {
                console.error('Serialization FAILED:', jsonErr.message);
            }
        }

    } catch (error: any) {
        console.error('Query failed!');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        if (error.code) console.error('Code:', error.code);
    } finally {
        await prisma.$disconnect();
    }
}

main();

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: NextRequest) {
    try {
        const { descriptor } = await req.json();

        if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
            return NextResponse.json({ error: 'Invalid face descriptor' }, { status: 400 });
        }

        // Fetch all students who have face data
        // Optimization: In a real production app with millions of users, 
        // you would use a Vector Database (like Pinecone, Milvus, or MongoDB Vector Search).
        // For thousands of students, a filtered linear scan is extremely fast in Node.js.
        const students = await prisma.user.findMany({
            where: {
                faceDescriptor: {
                    isEmpty: false
                },
                role: 'STUDENT'
            },
            select: {
                id: true,
                name: true,
                faceDescriptor: true
            }
        });

        const inputDescriptor = new Float32Array(descriptor);
        const THRESHOLD = 0.38; // Strict threshold for duplicate detection

        for (const student of students) {
            const studentDescriptor = new Float32Array(student.faceDescriptor);
            
            // Euclidean Distance Calculation
            let sum = 0;
            for (let i = 0; i < 128; i++) {
                const diff = inputDescriptor[i] - studentDescriptor[i];
                sum += diff * diff;
            }
            const distance = Math.sqrt(sum);

            if (distance < THRESHOLD) {
                return NextResponse.json({
                    isDuplicate: true,
                    studentId: student.id,
                    studentName: student.name
                });
            }
        }

        return NextResponse.json({ isDuplicate: false });
    } catch (error: any) {
        console.error('Collision Check Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

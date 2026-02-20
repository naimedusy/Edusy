import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { identifier, password } = body;

        if (!identifier || !password) {
            return NextResponse.json({ message: 'আইডি এবং পাসওয়ার্ড উভয়ই প্রয়োজন।' }, { status: 400 });
        }

        // Search for user with role STUDENT matching phone (identifier) or studentId (metadata.studentId)
        // Note: In public admission, phone is often used as studentId
        const userRaw = await (prisma as any).$runCommandRaw({
            find: 'User',
            filter: {
                role: 'STUDENT',
                $or: [
                    { phone: String(identifier) },
                    { "metadata.studentId": String(identifier) }
                ],
                password: String(password)
            },
            limit: 1
        });

        const user = userRaw.cursor?.firstBatch?.[0];

        if (!user) {
            return NextResponse.json({ message: 'ভুল আইডি অথবা পাসওয়ার্ড ব্যবহার করা হয়েছে।' }, { status: 401 });
        }

        // Get Institute Info
        const instId = user.instituteIds?.[0]?.$oid || user.instituteIds?.[0]?.toString();
        let instituteName = 'আপনার প্রতিষ্ঠান';
        if (instId) {
            const inst = await prisma.institute.findUnique({
                where: { id: instId },
                select: { name: true }
            });
            if (inst) instituteName = inst.name;
        }

        return NextResponse.json({
            success: true,
            status: {
                studentName: user.name,
                admissionStatus: user.metadata?.admissionStatus || 'PENDING',
                instituteName,
                studentId: user.metadata?.studentId || user.phone,
                classId: user.metadata?.classId
            }
        });

    } catch (error) {
        console.error('Admission Status API Error:', error);
        return NextResponse.json({ message: 'অভ্যন্তরীণ সার্ভার ত্রুটি।' }, { status: 500 });
    }
}

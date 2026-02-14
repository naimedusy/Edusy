import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const userId = '6990835251ab03d764c1440f';

        console.log('ATTEMPTING FIX V3 (RAW) for User:', userId);

        // Raw MongoDB update to bypass Prisma schema validation
        const result = await prisma.$runCommandRaw({
            update: "User",
            updates: [
                {
                    q: { _id: { "$oid": userId } },
                    u: { "$set": { instituteIds: [] } }
                }
            ]
        });

        console.log('Raw Update Result:', result);

        return new NextResponse(`User fixed via RAW command. Result: ${JSON.stringify(result)}`, { status: 200 });

    } catch (error: any) {
        console.error('FIX V3 ERROR:', error);
        return new NextResponse(`FIX V3 ERROR: ${error.message}`, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET() {
    try {
        const settings = await (prisma as any).siteSettings.findFirst();

        if (!settings) {
            return NextResponse.json({
                appName: 'Edusy',
                logo: null,
                coverImage: null,
                introduction: null,
                supportEmail: null,
                supportPhone: null
            });
        }

        return NextResponse.json(settings);

    } catch (error) {
        console.error('Site Settings API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { appName, logo, coverImage, introduction, supportEmail, supportPhone } = body;

        // Check if settings exist
        const existingSettings = await (prisma as any).siteSettings.findFirst();

        let settings;
        if (existingSettings) {
            settings = await (prisma as any).siteSettings.update({
                where: { id: existingSettings.id },
                data: {
                    appName,
                    logo,
                    coverImage,
                    introduction,
                    supportEmail,
                    supportPhone
                }
            });
        } else {
            settings = await (prisma as any).siteSettings.create({
                data: {
                    appName,
                    logo,
                    coverImage,
                    introduction,
                    supportEmail,
                    supportPhone
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Site Settings Update Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

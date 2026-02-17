import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { classes, instituteId } = body;

        if (!classes || !Array.isArray(classes) || !instituteId) {
            return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
        }

        await prisma.$transaction(
            classes.map((c: { id?: string, name: string, order: number }) => {
                const isNew = !c.id || c.id.startsWith('new-');
                if (!isNew) {
                    return prisma.class.update({
                        where: { id: c.id },
                        data: {
                            name: c.name,
                            order: c.order
                        }
                    });
                } else {
                    return prisma.class.create({
                        data: {
                            name: c.name,
                            order: c.order,
                            instituteId: instituteId
                        }
                    });
                }
            })
        );

        return NextResponse.json({ message: 'Classes reordered successfully' });
    } catch (error) {
        console.error('Reorder classes error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

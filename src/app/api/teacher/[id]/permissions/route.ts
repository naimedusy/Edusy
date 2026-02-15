
import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const { permissions, assignedClassIds, isAdmin, adminId, instituteId } = body;
        const teacherProfileId = params.id;

        // Verify the requester is an admin
        if (!adminId || !instituteId) {
            return NextResponse.json({ error: 'Admin ID and Institute ID are required' }, { status: 400 });
        }

        // Check if the requester is actually an admin of this institute
        const institute = await (prisma as any).institute.findUnique({
            where: { id: instituteId },
            select: { adminIds: true }
        });

        if (!institute || !institute.adminIds.includes(adminId)) {
            return NextResponse.json({ error: 'Unauthorized: Only admins can modify teacher permissions' }, { status: 403 });
        }

        const updatedProfile = await (prisma as any).teacherProfile.update({
            where: {
                id: teacherProfileId
            },
            data: {
                permissions,
                assignedClassIds,
                isAdmin
            }
        });

        return NextResponse.json(updatedProfile);
    } catch (error) {
        console.error('Update permission error:', error);
        return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 });
    }
}

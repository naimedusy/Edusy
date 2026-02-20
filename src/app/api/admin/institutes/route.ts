import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET() {
    try {
        // Use raw MongoDB to bypass Prisma client sync issues
        const institutesRaw = await (prisma as any).$runCommandRaw({
            find: 'Institute',
            filter: {},
            sort: { createdAt: -1 }
        });

        const firstBatchRaw = institutesRaw.cursor?.firstBatch || [];

        const firstBatch = firstBatchRaw.map((inst: any) => ({
            ...inst,
            id: inst._id?.$oid || inst._id?.toString()
        }));

        const instituteIdObjects = firstBatch.map((inst: any) => inst._id);

        // Fetch counts for TEACHER and STUDENT roles per institute using aggregation
        const userStatsRaw = await (prisma as any).$runCommandRaw({
            aggregate: 'User',
            pipeline: [
                { $unwind: '$instituteIds' },
                {
                    $match: {
                        instituteIds: { $in: instituteIdObjects },
                        role: { $in: ['TEACHER', 'STUDENT'] }
                    }
                },
                {
                    $group: {
                        _id: { instituteId: '$instituteIds', role: '$role' },
                        count: { $sum: 1 }
                    }
                }
            ],
            cursor: {}
        });

        const statsMap: Record<string, { teachers: number; students: number }> = {};
        (userStatsRaw.cursor?.firstBatch || []).forEach((stat: any) => {
            const instId = stat._id.instituteId?.$oid || stat._id.instituteId?.toString();
            const role = stat._id.role;
            if (!statsMap[instId]) statsMap[instId] = { teachers: 0, students: 0 };

            if (role === 'TEACHER') statsMap[instId].teachers = stat.count;
            if (role === 'STUDENT') statsMap[instId].students = stat.count;
        });

        // Fetch all unique admin IDs across all institutes
        const allAdminIdStrings = Array.from(new Set(
            firstBatch.flatMap((inst: any) =>
                (inst.adminIds || []).map((id: any) => id?.$oid || id?.toString())
            ).filter(Boolean)
        )) as string[];

        // Fetch user details for these admins
        let adminDetailsMap: Record<string, any> = {};
        if (allAdminIdStrings.length > 0) {
            const usersRaw = await (prisma as any).$runCommandRaw({
                find: 'User',
                filter: {
                    _id: {
                        $in: allAdminIdStrings.map(id => ({ $oid: id }))
                    }
                },
                projection: { _id: 1, name: 1, email: 1, role: 1 }
            });

            (usersRaw.cursor?.firstBatch || []).forEach((user: any) => {
                const id = user._id?.$oid || user._id?.toString();
                adminDetailsMap[id] = {
                    id: id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
            });
        }

        const institutes = firstBatch.map((inst: any, index: number) => {
            const instId = inst.id;
            const currentInstAdminIdStrings = (inst.adminIds || []).map((id: any) => id?.$oid || id?.toString());
            const instAdmins = currentInstAdminIdStrings
                .map((id: string) => adminDetailsMap[id])
                .filter(Boolean);

            const adminCount = instAdmins.filter((a: any) => a.role === 'ADMIN').length;
            const superAdminCount = instAdmins.filter((a: any) => a.role === 'SUPER_ADMIN').length;
            const teacherCount = statsMap[instId]?.teachers || 0;
            const studentCount = statsMap[instId]?.students || 0;

            return {
                id: instId,
                name: inst.name || '',
                type: inst.type || '',
                address: inst.address || '',
                phone: inst.phone || '',
                website: inst.website || '',
                logo: inst.logo || '',
                coverImage: inst.coverImage || '',
                assignmentReleaseTime: inst.assignmentReleaseTime || null,
                createdAt: inst.createdAt,
                updatedAt: inst.updatedAt,
                _count: {
                    admins: instAdmins.length,
                    onlyAdmins: adminCount,
                    superAdmins: superAdminCount,
                    teachers: teacherCount,
                    students: studentCount
                },
                admins: instAdmins
            };
        });

        return NextResponse.json(institutes);
    } catch (error) {
        console.error('Admin Institutes API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const body = await req.json();
        const { assignmentReleaseTime, name, logo, coverImage, address, phone, website, type } = body;

        if (!id) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        const updated = await (prisma as any).institute.update({
            where: { id },
            data: {
                ...(assignmentReleaseTime !== undefined && { assignmentReleaseTime }),
                ...(name !== undefined && { name }),
                ...(logo !== undefined && { logo }),
                ...(coverImage !== undefined && { coverImage }),
                ...(address !== undefined && { address }),
                ...(phone !== undefined && { phone }),
                ...(website !== undefined && { website }),
                ...(type !== undefined && { type }),
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Institute PATCH Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

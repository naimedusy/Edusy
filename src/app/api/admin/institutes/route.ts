import { NextResponse } from 'next/server';
import prisma from '@/utils/db';
import { getServerSession } from '@/utils/auth-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const rawCookies = req.headers.get('cookie');
    console.log('--- GET /api/admin/institutes ---');
    console.log('RAW COOKIES:', rawCookies);

    try {
        const { searchParams } = new URL(req.url);
        const roleQuery = searchParams.get('role');
        
        const session = await getServerSession();
        
        if (!session) {
            console.log('SESSION CHECK FAILED: getServerSession returned null');
            return new Response(JSON.stringify({ 
                message: 'Unauthorized', 
                debug: 'Session not found. Please log out and back in.',
                hasCookies: !!rawCookies 
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { id: userId, role: baseRole, instituteIds, teacherProfiles } = session.user as any;
        const activeRole = roleQuery || baseRole;

        const filter: any = {};

        // Role-based filtering:
        // Only skip filtering if the user is a SUPER_ADMIN AND they are actively in SUPER_ADMIN mode.
        if (baseRole !== 'SUPER_ADMIN' || activeRole !== 'SUPER_ADMIN') {
            const managedInstIds = (instituteIds || []).filter((id: any) => typeof id === 'string' && id.length === 24);
            const joinedInstIds = (teacherProfiles || [])
                .filter((p: any) => p.status === 'ACTIVE' && p.instituteId)
                .map((p: any) => p.instituteId)
                .filter((id: any) => typeof id === 'string' && id.length === 24);
            
            const allAllowedInstIds = Array.from(new Set([...managedInstIds, ...joinedInstIds]));

            // Build a robust $or filter that handles BOTH ObjectId and String formats
            const orConditions: any[] = [
                { adminIds: { $oid: userId } },
                { adminIds: userId }
            ];

            if (allAllowedInstIds.length > 0) {
                // ...
                orConditions.push({
                    _id: { $in: allAllowedInstIds.map(id => ({ $oid: id })) }
                });
                orConditions.push({
                    _id: { $in: allAllowedInstIds }
                });
            }
            
            filter.$or = orConditions;
        }

        // Use raw MongoDB to bypass Prisma client sync issues
        const institutesRaw = await (prisma as any).$runCommandRaw({
            find: 'Institute',
            filter: filter,
            sort: { createdAt: -1 }
        });
        
        const firstBatchRaw = (institutesRaw as any).cursor?.firstBatch || (institutesRaw as any).firstBatch || [];

        const firstBatch = firstBatchRaw.map((inst: any) => ({
            ...inst,
            id: inst._id?.$oid || inst._id?.toString()
        }));

        const statsMap: Record<string, { teachers: number; students: number }> = {};

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

            ((usersRaw as any).cursor?.firstBatch || []).forEach((user: any) => {
                const id = user._id?.$oid || user._id?.toString();
                adminDetailsMap[id] = {
                    id: id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                };
            });
        }

        const institutes = firstBatch.map((inst: any) => {
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

        console.log('--- GET /api/admin/institutes SUCCESS --- Final Institutes Length:', institutes.length);
        
        return new Response(JSON.stringify(institutes), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    } catch (error: any) {
        console.error('CRITICAL: Admin Institutes API Error:', error);
        return new Response(JSON.stringify({ message: 'Internal server error', error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { id: userId, role } = session.user as any;
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const body = await req.json();
        const { assignmentReleaseTime, name, logo, coverImage, address, phone, website, type } = body;

        if (!id) {
            return NextResponse.json({ message: 'Institute ID is required' }, { status: 400 });
        }

        // Authorization check
        if (role !== 'SUPER_ADMIN') {
            // Check if user is an admin of this specific institute
            const instituteRaw = await (prisma as any).$runCommandRaw({
                find: 'Institute',
                filter: {
                    _id: { $oid: id },
                    adminIds: { $oid: userId }
                }
            });

            const exists = (instituteRaw.cursor?.firstBatch || []).length > 0;
            if (!exists) {
                return NextResponse.json({ message: 'Forbidden: You do not have permission to edit this institute' }, { status: 403 });
            }
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

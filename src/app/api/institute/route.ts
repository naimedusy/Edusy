import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        console.log('GET /api/institute', { userId });

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        // Step 1: Raw Find User to get instituteIds (bypassing Client schema mismatch)
        const rawUserResponse: any = await prisma.$runCommandRaw({
            find: "User",
            filter: { _id: { "$oid": userId } },
            projection: { instituteIds: 1 },
            limit: 1
        });

        // Parse Raw Response (MongoDB returns { cursor: { firstBatch: [...] } })
        let instituteIds: string[] = [];

        if (
            rawUserResponse &&
            rawUserResponse.cursor &&
            rawUserResponse.cursor.firstBatch &&
            rawUserResponse.cursor.firstBatch.length > 0
        ) {
            const userDoc = rawUserResponse.cursor.firstBatch[0];
            const rawIds = userDoc.instituteIds; // likely [{ $oid: "..." }, ...] or strings

            if (Array.isArray(rawIds)) {
                instituteIds = rawIds.map((idObj: any) => {
                    if (typeof idObj === 'string') return idObj;
                    if (idObj && idObj.$oid) return idObj.$oid;
                    return null;
                }).filter(Boolean) as string[];
            }
        } else {
            console.log('User not found or no institutes via raw fetch');
            return NextResponse.json([]);
        }

        console.log(`GET /api/institute found ${instituteIds.length} IDs via RAW:`, instituteIds);

        if (instituteIds.length === 0) {
            return NextResponse.json([]);
        }

        // Step 2: Fetch Institutes using RAW command to ensure ALL fields (including coverImage) are returned
        // Prisma client might be out of sync, so we use raw MongoDB to bypass schema validation
        const rawInstitutesResponse: any = await prisma.$runCommandRaw({
            find: "Institute",
            filter: {
                _id: {
                    "$in": instituteIds.map(id => ({ "$oid": id }))
                }
            }
        });

        let institutes: any[] = [];
        if (
            rawInstitutesResponse &&
            rawInstitutesResponse.cursor &&
            rawInstitutesResponse.cursor.firstBatch
        ) {
            institutes = rawInstitutesResponse.cursor.firstBatch.map((doc: any) => ({
                id: doc._id.$oid || doc._id,
                name: doc.name,
                type: doc.type,
                address: doc.address,
                phone: doc.phone,
                email: doc.email,
                website: doc.website,
                logo: doc.logo,
                coverImage: doc.coverImage,  // CRITICAL: Ensure this is included
                adminIds: doc.adminIds?.map((id: any) => id.$oid || id) || [],
                createdAt: doc.createdAt?.$date || doc.createdAt,
                updatedAt: doc.updatedAt?.$date || doc.updatedAt
            }));
        }

        console.log(`✅ Returning ${institutes.length} institutes with full data including coverImage`);
        return NextResponse.json(institutes);

    } catch (error) {
        console.error('Fetch Institutes Error details:', error);
        return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 });
    }
}


export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('CREATE INSTITUTE BODY:', body);
        const { name, type, address, phone, website, logo, coverImage, userId } = body;

        if (!name || !userId) {
            console.log('MISSING FIELDS:', { name, userId });
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        // Verify user exists first
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!existingUser) {
            console.log('USER NOT FOUND:', userId);
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Create institute using Raw MongoDB command to bypass Prisma Client validation error
        // (Client seems out of sync with schema for adminIds/admins)

        const timestamp = Math.floor(Date.now() / 1000).toString(16);
        const random = 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16));
        const objectId = timestamp + random; // 24 hex chars

        const instituteDoc = {
            _id: { "$oid": objectId },
            name,
            type,
            address,
            phone,
            website,
            logo,
            coverImage,
            adminIds: [{ "$oid": userId }],
            createdAt: { "$date": new Date().toISOString() },
            updatedAt: { "$date": new Date().toISOString() }
        };

        console.log('Inserting Raw Institute:', instituteDoc);

        await prisma.$runCommandRaw({
            insert: "Institute",
            documents: [instituteDoc]
        });

        // Manually update the user to include this institute
        try {
            await prisma.$runCommandRaw({
                update: "User",
                updates: [
                    {
                        q: { _id: { "$oid": userId } },
                        u: { "$push": { instituteIds: { "$oid": objectId } } }
                    }
                ]
            });
            console.log('User linked to institute via RAW command');
        } catch (updateError) {
            console.error('Failed to link institute to user via Raw Command:', updateError);
        }

        // Return a mocked object closest to expected format for frontend to update state
        const responseInst = {
            id: objectId,
            name,
            type,
            address,
            phone,
            website,
            logo,          // Added logo
            coverImage,    // Added coverImage
            adminIds: [userId]
        };

        console.log('INSTITUTE CREATED (RAW):', responseInst);
        return NextResponse.json(responseInst);
    } catch (error) {
        console.error('Create Institute Error:', error);
        return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 });
    }
}


export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, name, type, address, phone, website, logo, coverImage, isDefault, userId } = body;

        if (!id) return NextResponse.json({ message: 'ID is required' }, { status: 400 });

        // Use Raw Command for Update to avoid any schema/client mismatch issues
        // Since POST required it, PATCH likely will too if we touch any fields Prisma is sensitive about.
        // Even for simple fields (name, type), using raw ensures consistency.

        console.log('PATCHING INSTITUTE RAW:', { id, name, type, address, phone, website, logo, coverImage }); // Added logo/cover log

        const updateFields: any = {};
        if (name !== undefined) updateFields.name = name;
        if (type !== undefined) updateFields.type = type;
        if (address !== undefined) updateFields.address = address;
        if (phone !== undefined) updateFields.phone = phone;
        if (website !== undefined) updateFields.website = website;
        if (logo !== undefined) updateFields.logo = logo;             // Use undefined check for empty strings
        if (coverImage !== undefined) updateFields.coverImage = coverImage; // Use undefined check for empty strings
        updateFields.updatedAt = { "$date": new Date().toISOString() };

        await prisma.$runCommandRaw({
            update: "Institute",
            updates: [
                {
                    q: { _id: { "$oid": id } },
                    u: { "$set": updateFields }
                }
            ]
        });

        if (isDefault && userId) {
            await prisma.$runCommandRaw({
                update: "User",
                updates: [
                    {
                        q: { _id: { "$oid": userId } },
                        u: { "$set": { defaultInstituteId: { "$oid": id } } }
                    }
                ]
            });
        }

        return NextResponse.json({ id, ...updateFields });
    } catch (error) {
        console.error('Update Institute Error:', error);
        return NextResponse.json({ message: 'Internal server error', error: String(error) }, { status: 500 });
    }
}

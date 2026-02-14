import { NextResponse } from 'next/server';
import prisma from '@/utils/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const search = searchParams.get('search');
        const classId = searchParams.get('classId');
        const groupId = searchParams.get('groupId');

        const pipeline: any[] = [];

        // Filter by role if provided
        const match: any = {};
        if (role) match.role = role;

        // Filter by metadata.classId or metadata.groupId
        if (classId) match['metadata.classId'] = classId;
        if (groupId) match['metadata.groupId'] = groupId;

        // Apply search filter if provided
        if (search) {
            match.$or = [
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        if (Object.keys(match).length > 0) {
            pipeline.push({ $match: match });
        }

        // Sort by creation date
        pipeline.push({ $sort: { createdAt: -1 } });

        // Lookup first institute for each user (since they can have multiple)
        pipeline.push(
            {
                $lookup: {
                    from: 'Institute',
                    localField: 'instituteIds',
                    foreignField: '_id',
                    as: 'institutes'
                }
            },
            {
                $addFields: {
                    institute: { $arrayElemAt: ['$institutes', 0] }
                }
            }
        );

        const usersRaw = await (prisma as any).$runCommandRaw({
            aggregate: 'User',
            pipeline,
            cursor: {}
        });

        const users = (usersRaw.cursor?.firstBatch || []).map((user: any) => ({
            id: user._id?.$oid || user._id?.toString(),
            name: user.name || '',
            email: user.email || '',
            role: user.role || 'USER',
            createdAt: user.createdAt,
            institute: user.institute ? { name: user.institute.name } : null
        }));

        return NextResponse.json(users);
    } catch (error) {
        console.error('Admin Users API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, role, instituteIds, metadata } = body;

        if (!email || !password || !role) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Convert instituteIds to ObjectIds for MongoDB
        const instIds = (instituteIds || []).map((id: string) => ({ $oid: id }));

        await (prisma as any).$runCommandRaw({
            insert: 'User',
            documents: [
                {
                    name: name || '',
                    email: email.trim(),
                    password, // In a real app, hash this!
                    role,
                    instituteIds: instIds,
                    metadata: metadata || null,
                    createdAt: { $date: new Date().toISOString() },
                    updatedAt: { $date: new Date().toISOString() }
                }
            ]
        });

        return NextResponse.json({ success: true, message: 'User created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Admin User Creation Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const { id, email, password, role, name, metadata } = body;

        if (!id) return NextResponse.json({ message: 'User ID is required' }, { status: 400 });

        const set: any = {};
        if (email) set.email = email;
        if (password) set.password = password;
        if (role) set.role = role;
        if (name) set.name = name;
        if (metadata) set.metadata = metadata;

        await (prisma as any).$runCommandRaw({
            update: 'User',
            updates: [
                {
                    q: { _id: { $oid: id } },
                    u: { $set: set }
                }
            ]
        });

        return NextResponse.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error('Admin User Update Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ message: 'User ID is required' }, { status: 400 });

        await (prisma as any).$runCommandRaw({
            delete: 'User',
            deletes: [
                {
                    q: { _id: { $oid: id } },
                    limit: 1
                }
            ]
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Admin User Delete Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

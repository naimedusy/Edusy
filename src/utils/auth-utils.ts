import { cookies } from 'next/headers';
import prisma from './db';

export async function getServerSession() {
    const cookieStore = await cookies();
    let token = cookieStore.get('edusy_auth_token')?.value;

    if (!token) {
        console.log('getServerSession - NO TOKEN FOUND in cookies');
        return null;
    }

    // Sanitize token (remove quotes or extra spaces if any)
    token = token.replace(/['"]+/g, '').trim();

    try {
        console.log(`getServerSession - Checking DB for sanitized token: [${token}] length: ${token.length}`);
        
        // MongoDB ObjectIDs must be 24-char hex
        if (token.length !== 24) {
            console.log('getServerSession - INVALID TOKEN LENGTH. Not a MongoDB ObjectId.');
            return null;
        }

        const user = await prisma.user.findUnique({
            where: { id: token },
            select: {
                id: true,
                email: true,
                role: true,
                instituteIds: true,
                name: true,
                teacherProfiles: {
                    select: {
                        instituteId: true,
                        status: true
                    }
                }
            }
        });
        
        console.log('getServerSession - db user result:', user ? `Found user: ${user.email || user.id}` : 'USER NOT FOUND IN DB');

        if (!user) return null;

        return {
            user: {
                ...user,
                id: user.id
            }
        };
    } catch (error: any) {
        console.error('CRITICAL: getServerSession DB Error:', error.message);
        return null;
    }
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * PUBLIC routes - accessible without any authentication.
 * Only exact path prefixes listed here are allowed through.
 * Everything else requires a valid session.
 */
const PUBLIC_PATH_PREFIXES = [
    '/',             // root (client-side will redirect)
    '/entrance',     // login
    '/signup',       // account creation
    '/admission',    // public admission form  e.g. /admission/[instituteId]
    '/roles',        // role selection (post-login used in some flows)
    '/api/auth/',    // login / signup / refresh API routes
    '/api/public/',  // public data endpoints (institute summary, etc.)
    '/_next/',       // Next.js internals
    '/favicon.ico',
    '/fonts/',
];

/**
 * Session token cookie name.
 * We set this from the login API so the middleware can
 * read it on the server side without access to localStorage.
 */
const SESSION_COOKIE = 'edusy_auth_token';

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Always allow public paths
    const isPublic = PUBLIC_PATH_PREFIXES.some((prefix) =>
        pathname === prefix || pathname.startsWith(prefix)
    );
    if (isPublic) return NextResponse.next();

    // 2. Check for auth token cookie
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (!token) {
        // Not authenticated — redirect to login, preserving the intended URL
        const loginUrl = new URL('/entrance', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 3. Token exists — allow request to proceed
    //    (deep validation happens in the API route / server component)
    return NextResponse.next();
}

export const config = {
    // Run middleware on all routes except static assets
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|fonts/).*)',
    ],
};

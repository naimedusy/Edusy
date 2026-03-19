import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async redirects() {
        return [
            {
                source: '/admin/users',
                destination: '/dashboard/admin/users',
                permanent: true,
            },
            {
                source: '/admin/institutes',
                destination: '/dashboard/admin/institutes',
                permanent: true,
            }
        ]
    }
};

export default nextConfig;

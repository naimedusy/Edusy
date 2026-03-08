'use client';

import React from 'react';
import { useSession } from './SessionProvider';

export function RoleThemeProvider({ children }: { children: React.ReactNode }) {
    const { activeRole } = useSession();

    // Mapping activeRole to theme class
    const themeClass = activeRole ? `theme-${activeRole}` : '';

    return (
        <div className={`${themeClass} min-h-screen transition-colors duration-500`}>
            {children}
        </div>
    );
}

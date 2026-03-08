'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const AttendanceDashboard = dynamic(() => import('@/components/AttendanceDashboard'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 border-4 border-[#045c84] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
        </div>
    )
});

export default function AttendancePage() {
    return <AttendanceDashboard />;
}

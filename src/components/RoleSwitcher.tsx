'use client';

import React from 'react';
import { useSession } from './SessionProvider';
import {
    Shield,
    User,
    GraduationCap,
    Users,
    Wallet,
    Eye,
    ChevronDown
} from 'lucide-react';

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'GUARDIAN' | 'STUDENT' | 'DEMO';

const roleMeta: Record<Role, { name: string; icon: any; color: string }> = {
    SUPER_ADMIN: { name: 'সুপার অ্যাডমিন', icon: Shield, color: 'text-red-600' },
    ADMIN: { name: 'অ্যাডমিন', icon: Shield, color: 'text-blue-600' },
    ACCOUNTANT: { name: 'হিসাবরক্ষক', icon: Wallet, color: 'text-emerald-600' },
    TEACHER: { name: 'শিক্ষক', icon: GraduationCap, color: 'text-sky-600' },
    GUARDIAN: { name: 'অভিভাবক', icon: Users, color: 'text-purple-600' },
    STUDENT: { name: 'শিক্ষার্থী', icon: Users, color: 'text-orange-600' },
    DEMO: { name: 'ডেমো ইউজার', icon: Eye, color: 'text-slate-500' },
};

export default function RoleSwitcher() {
    const { user, activeRole, switchRole } = useSession();

    if (user?.role !== 'SUPER_ADMIN') return null;

    return (
        <div className="mx-4 mb-4 p-4 bg-[#045c84]/5 rounded-2xl border border-[#045c84]/10">
            <div className="flex items-center gap-2 mb-3 text-[#045c84]">
                <Eye size={18} />
                <span className="text-xs font-bold uppercase tracking-wider">ভিউ মোড পরিবর্তন</span>
            </div>

            <div className="relative group">
                <select
                    value={activeRole || 'SUPER_ADMIN'}
                    onChange={(e) => switchRole(e.target.value as Role)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-[#045c84]/20 outline-none transition-all"
                >
                    {Object.entries(roleMeta).map(([role, meta]) => (
                        <option key={role} value={role}>
                            {meta.name}
                        </option>
                    ))}
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#045c84]">
                    {activeRole && React.createElement(roleMeta[activeRole].icon, { size: 18 })}
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={14} />
                </div>
            </div>
        </div>
    );
}

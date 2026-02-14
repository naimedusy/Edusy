'use client';

import React from 'react';
import { useSession } from './SessionProvider';
import {
    Building2,
    ChevronDown,
    Check
} from 'lucide-react';

export default function InstituteSwitcher() {
    const { user, activeInstitute, switchInstitute, activeRole } = useSession();

    // Only show for Admins (or anyone who has multiple institutes)
    if (!user || !user.institutes || user.institutes.length <= 1) return null;

    // Usually admins manage multiple, but we can show it for any role that has them
    if (activeRole !== 'ADMIN' && activeRole !== 'SUPER_ADMIN') return null;

    return (
        <div className="mx-4 mb-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
            <div className="flex items-center gap-2 mb-3 text-emerald-700">
                <Building2 size={18} />
                <span className="text-xs font-black uppercase tracking-wider font-bengali">প্রতিষ্ঠান পরিবর্তন</span>
            </div>

            <div className="relative group font-bengali">
                <select
                    value={activeInstitute?.id || ''}
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        const inst = user.institutes?.find(i => i.id === selectedId);
                        if (inst) switchInstitute(inst);
                    }}
                    className="w-full pl-3 pr-10 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-700 shadow-sm"
                >
                    {user.institutes.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                            {inst.name}
                        </option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none">
                    <ChevronDown size={16} />
                </div>
            </div>

            <p className="mt-2 text-[10px] text-emerald-600 font-bold uppercase tracking-tight opacity-70 px-1">
                বর্তমানে আপনি <span className="underline">{activeInstitute?.name}</span> এ আছেন
            </p>
        </div>
    );
}

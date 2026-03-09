'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/SessionProvider';
import {
    ShieldCheck,
    GraduationCap,
    Users,
    Briefcase,
    ChevronRight,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import AuthLayout from '../../components/AuthLayout';

export default function RoleSelectionPage() {
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const { user, login } = useSession();
    const router = useRouter();

    // Roles Configuration
    const roles = [
        {
            id: 'TEACHER',
            title: 'শিক্ষক (Teacher)',
            description: 'প্রতিষ্ঠানে যোগ দেওয়া বা ক্লাস পরিচালনা করার জন্য।',
            icon: Briefcase,
            color: 'teal',
            bg: 'bg-teal-50',
            text: 'text-teal-600',
            border: 'border-teal-100'
        },
        {
            id: 'STUDENT',
            title: 'শিক্ষার্থী (Student)',
            description: 'পড়ালেখা এবং পরীক্ষার ফলাফল দেখার জন্য।',
            icon: GraduationCap,
            color: 'indigo',
            bg: 'bg-indigo-50',
            text: 'text-indigo-600',
            border: 'border-indigo-100'
        },
        {
            id: 'GUARDIAN',
            title: 'অভিভাবক (Guardian)',
            description: 'সন্তানের শিক্ষা এবং ফি ম্যানেজমেন্ট দেখার জন্য।',
            icon: Users,
            color: 'amber',
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            border: 'border-amber-100'
        }
    ];

    const handleRoleSelect = async (roleId: string) => {
        if (!user?.id) return;

        setSelectedRole(roleId);
        setLoading(true);

        try {
            const res = await fetch('/api/auth/update-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, role: roleId }),
            });

            if (res.ok) {
                const data = await res.json();
                // Update session with new role
                login({ ...user, role: roleId as any });
                router.push('/dashboard');
            } else {
                alert('রোল আপডেট করা সম্ভব হয়নি। আবার চেষ্টা করুন।');
            }
        } catch (err) {
            console.error('Role update error:', err);
            alert('কিছু ভুল হয়েছে। ইন্টারনেটের সংযোগ চেক করুন।');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-[#045c84]" size={40} />
            </div>
        );
    }

    return (
        <AuthLayout title="আপনার রোল বেছে নিন" subtitle="এডুসি-তে আপনার যাত্রা শুরু করার জন্য নিচের পছন্দের রোলটি সিলেক্ট করুন">
            <div className="grid grid-cols-1 gap-4 font-bengali">
                {roles.map((role) => (
                    <button
                        key={role.id}
                        disabled={loading}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`group relative flex items-center gap-5 p-5 rounded-3xl border-2 transition-all text-left hover:shadow-xl hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:pointer-events-none ${selectedRole === role.id
                            ? 'bg-blue-50 border-[#045c84] shadow-lg ring-4 ring-blue-100/50'
                            : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                    >
                        <div className={`w-16 h-16 rounded-2xl ${role.bg} ${role.text} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            <role.icon size={32} />
                        </div>

                        <div className="flex-1">
                            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight mb-1">
                                {role.title}
                            </h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed">
                                {role.description}
                            </p>
                        </div>

                        <div className={`p-2 rounded-full transition-all ${selectedRole === role.id
                            ? 'bg-[#045c84] text-white rotate-90 scale-110'
                            : 'bg-slate-50 text-slate-400 group-hover:text-[#045c84] group-hover:translate-x-1'
                            }`}>
                            {selectedRole === role.id && loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : selectedRole === role.id ? (
                                <CheckCircle2 size={20} />
                            ) : (
                                <ChevronRight size={20} />
                            )}
                        </div>

                        {/* Subtle Background Glow */}
                        <div className={`absolute inset-0 -z-10 rounded-3xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity ${role.id === 'ADMIN' ? 'bg-blue-400' :
                            role.id === 'TEACHER' ? 'bg-teal-400' :
                                role.id === 'STUDENT' ? 'bg-indigo-400' : 'bg-amber-400'
                            }`} />
                    </button>
                ))}
            </div>

            <p className="mt-10 text-center text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                EDUSY &bull; Next Generation Education
            </p>
        </AuthLayout>
    );
}

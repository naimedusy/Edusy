'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { School, Briefcase } from 'lucide-react';
import InstituteOnboarding from '@/components/InstituteOnboarding';
import PublicInstituteSearch from '@/components/PublicInstituteSearch';

interface OnboardingRouterProps {
    role: string;
    user: any;
    onComplete: () => void;
}

export default function OnboardingRouter({ role, user, onComplete }: OnboardingRouterProps) {
    const [view, setView] = useState<'CHOICE' | 'CREATE' | 'SEARCH'>(
        role === 'ADMIN' ? 'CREATE' : (role === 'STUDENT' || role === 'GUARDIAN' ? 'SEARCH' : 'CHOICE')
    );
    const router = useRouter();

    if (view === 'CREATE') {
        return <InstituteOnboarding onComplete={onComplete} />;
    }

    if (view === 'SEARCH') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
                <PublicInstituteSearch
                    role={role}
                    onBack={role === 'TEACHER' ? () => setView('CHOICE') : undefined}
                    onSelect={(inst) => {
                        if (role === 'STUDENT' || role === 'GUARDIAN') {
                            router.push(`/admission/${inst.id}`);
                        } else if (role === 'TEACHER') {
                            router.push(`/admission/${inst.id}`);
                        }
                    }}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-bengali">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                <button
                    onClick={() => setView('CREATE')}
                    className="group bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl hover:shadow-2xl transition-all flex flex-col items-center text-center gap-6 hover:-translate-y-2 active:scale-95"
                >
                    <div className="w-24 h-24 bg-blue-50 text-[#045c84] rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-900/5">
                        <School size={48} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">নতুন প্রতিষ্ঠান তৈরি করুন</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">আপনার নিজের মাদরাসা বা স্কুলের জন্য একটি নতুন এডুসি প্রোফাইল খুলুন।</p>
                    </div>
                </button>

                <button
                    onClick={() => setView('SEARCH')}
                    className="group bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl hover:shadow-2xl transition-all flex flex-col items-center text-center gap-6 hover:-translate-y-2 active:scale-95"
                >
                    <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-teal-900/5">
                        <Briefcase size={48} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">প্রতিষ্ঠানে যোগ দিন</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">সার্চ করে আপনার পছন্দের প্রতিষ্ঠানে শিক্ষক বা স্টাফ হিসেবে যোগ দেওয়ার জন্য আবেদন করুন।</p>
                    </div>
                </button>
            </div>
        </div>
    );
}

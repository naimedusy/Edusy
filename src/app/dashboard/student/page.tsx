'use client';

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    ClipboardList,
    Calendar,
    Clock,
    Award,
    Building2,
    MapPin,
    Loader2
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { useUI } from '@/components/UIProvider';
import OnboardingRouter from '../../../components/OnboardingRouter';

export default function StudentDashboardPage() {
    const { user, activeInstitute, activeRole } = useSession();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeInstitute?.id || activeRole !== 'STUDENT') return;

        const fetchStudentData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/assignments?instituteId=${activeInstitute.id}&role=STUDENT&userId=${user?.id}&classId=${user?.metadata?.classId}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAssignments(data.slice(0, 5));
                }
            } catch (error) {
                console.error('Fetch student data error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [activeInstitute?.id, user?.id, activeRole, user?.metadata]);

    if (!activeInstitute) {
        return <OnboardingRouter role="STUDENT" user={user} onComplete={() => typeof window !== 'undefined' && window.location.reload()} />;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in-up font-bengali theme-STUDENT">
            {/* Header with Cover */}
            <div className="relative rounded-[32px] overflow-hidden shadow-lg bg-primary text-white group">
                <div className="h-48 md:h-64 bg-slate-700 relative overflow-hidden">
                    {activeInstitute?.coverImage ? (
                        <img
                            src={activeInstitute.coverImage}
                            alt="Cover"
                            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-r from-primary to-secondary opacity-90 relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30"></div>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-end gap-6">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-2xl p-1 shadow-2xl -mb-10 md:-mb-12 shrink-0 border-4 border-white/20 backdrop-blur-sm z-10 transition-transform hover:scale-105">
                        {activeInstitute?.logo ? (
                            <img src={activeInstitute.logo} alt="Logo" className="w-full h-full object-contain rounded-xl bg-white" />
                        ) : (
                            <div className="w-full h-full bg-slate-50 rounded-xl flex items-center justify-center text-slate-300">
                                <Building2 size={40} />
                            </div>
                        )}
                    </div>
                    <div className="mb-4 md:mb-6 z-10">
                        <h1 className="text-2xl md:text-3xl font-black mb-2 text-white shadow-sm tracking-tight">আমার ড্যাশবোর্ড</h1>
                        <p className="text-white/90 text-sm md:text-base font-medium flex items-center gap-2 drop-shadow-sm">
                            <MapPin size={16} className="text-red-400" />
                            {activeInstitute?.name || 'আপনার শিক্ষা প্রতিষ্ঠান'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-8 md:h-10" />

            {/* Student Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Clock size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">উপস্থিতি</h3>
                        <p className="text-emerald-600 font-black text-xl">৮৫%</p>
                    </div>
                </div>

                <a href="/dashboard/assignments" className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <ClipboardList size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">ক্লাস ডাইরি</h3>
                        <p className="text-slate-500 text-xs font-medium">৫টি জমা দেওয়া বাকি</p>
                    </div>
                </a>

                <a href="/dashboard/calendar" className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex items-center gap-5">
                    <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-sky-600 transition-colors">রুটিন</h3>
                        <p className="text-slate-500 text-xs font-medium">আজকের ক্লাস দেখুন</p>
                    </div>
                </a>
            </div>

            {/* Assignments List */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm">
                            <BookOpen size={24} />
                        </div>
                        <span>সাম্প্রতিক পড়া</span>
                    </h2>
                    <a href="/dashboard/assignments" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">সব দেখুন →</a>
                </div>

                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
                        <p className="text-slate-400 font-bold">লোড হচ্ছে...</p>
                    </div>
                ) : assignments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {assignments.map((assignment) => (
                            <div key={assignment.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 hover:bg-slate-100 transition-colors cursor-pointer group">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <Award size={20} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800 text-sm">{assignment.title}</h4>
                                    <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">{assignment.book?.name || 'বই'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-20 text-center text-slate-400">
                        <p>কোনো ক্লাস ডাইরি পাওয়া যায়নি</p>
                    </div>
                )}
            </div>
        </div>
    );
}

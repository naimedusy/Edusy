'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    BookOpen,
    ClipboardList,
    Calendar,
    GraduationCap,
    Clock,
    Building2,
    MapPin,
    Loader2
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { useUI } from '@/components/UIProvider';
import OnboardingRouter from '../../../components/OnboardingRouter';

export default function TeacherDashboardPage() {
    const { user, activeInstitute, activeRole, refreshInstitutes } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeInstitute?.id || activeRole !== 'TEACHER') return;

        const fetchTeacherStats = async () => {
            setLoading(true);
            try {
                // 1. Fetch general institute stats for assignments/etc.
                const statsRes = await fetch(`/api/admin/institutes/stats?instituteId=${activeInstitute.id}`);
                const statsData = await statsRes.json();

                // Refresh session with latest institute data (logo, cover, etc.)
                if (statsData.institute) {
                    refreshInstitutes(statsData.institute);
                }

                // 2. Fetch students to get a count filtered by the teacher's allowed classes
                // We use the same filter logic as in the students list page
                const allowedClassIds = user?.metadata?.allowedClasses || [];
                const isAllClasses = allowedClassIds.length === 0;

                const studentsRes = await fetch(`/api/admin/users?role=STUDENT&instituteId=${activeInstitute.id}`);
                const studentsData = await studentsRes.json();

                let filteredStudentCount = 0;
                if (Array.isArray(studentsData)) {
                    if (isAllClasses) {
                        filteredStudentCount = studentsData.length;
                    } else {
                        filteredStudentCount = studentsData.filter((s: any) =>
                            allowedClassIds.includes(s.metadata?.classId)
                        ).length;
                    }
                }

                setStats({
                    totalStudents: filteredStudentCount,
                    activeAssignments: statsData.upcomingAssignments?.length || 0,
                    pendingLeaves: 0
                });
            } catch (error) {
                console.error('Fetch teacher stats error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherStats();
    }, [activeInstitute?.id, activeRole]);

    if (!activeInstitute) {
        return <OnboardingRouter role="TEACHER" user={user} onComplete={() => typeof window !== 'undefined' && window.location.reload()} />;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in-up font-bengali theme-TEACHER">
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
                        <h1 className="text-2xl md:text-3xl font-black mb-2 text-white shadow-sm tracking-tight">শিক্ষক ড্যাশবোর্ড</h1>
                        <p className="text-white/90 text-sm md:text-base font-medium flex items-center gap-2 drop-shadow-sm">
                            <MapPin size={16} className="text-red-400" />
                            {activeInstitute?.name || 'আপনার শিক্ষা প্রতিষ্ঠান'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-8 md:h-10" />

            {/* Teacher Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Users size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">মোট শিক্ষার্থী</h3>
                        <p className="text-emerald-600 font-black text-xl">{stats?.totalStudents || 0}</p>
                    </div>
                </div>

                <a href="/dashboard/assignments" className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <ClipboardList size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">সক্রিয় ক্লাস ডাইরি</h3>
                        <p className="text-slate-500 text-xs font-medium">{stats?.activeAssignments || 0}টি চলমান</p>
                    </div>
                </a>

                <a href="/dashboard/calendar" className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex items-center gap-5">
                    <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Calendar size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-sky-600 transition-colors">খাতা মূল্যায়ন</h3>
                        <p className="text-slate-500 text-xs font-medium">রুটিন অনুযায়ী ক্লাস</p>
                    </div>
                </a>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">দ্রুত কাজ</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <a href="/dashboard/classroom" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center hover:bg-slate-100 transition-all font-bold text-sm text-slate-700">ক্লাস রুম</a>
                        <a href="/dashboard/notices" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center hover:bg-slate-100 transition-all font-bold text-sm text-slate-700">নোটিশ প্রদান</a>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm space-y-4 flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#045c84]/10 text-[#045c84] rounded-xl flex items-center justify-center shadow-sm">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">আমার প্রোফাইল</h4>
                            <p className="text-[10px] text-slate-500 font-medium">আপনার শিক্ষক প্রোফাইল দেখুন ও এডিট করুন</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    GraduationCap,
    ClipboardList,
    Clock,
    FileBarChart,
    ChevronRight,
    Loader2,
    Calendar,
    MessageCircle
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import OnboardingRouter from '@/components/OnboardingRouter';

export default function ChildrenPage() {
    const { user, activeInstitute } = useSession();
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!activeInstitute?.id || !user?.metadata) return;

        const fetchChildrenData = async () => {
            setLoading(true);
            try {
                const childrenIdsRaw = user?.metadata?.childrenIds || (user?.metadata?.studentId ? [user.metadata.studentId] : []);
                const childrenIds = Array.isArray(childrenIdsRaw) ? childrenIdsRaw : [];
                if (childrenIds.length > 0) {
                    const res = await fetch(`/api/admin/users?ids=${childrenIds.join(',')}`);
                    const data = await res.json();

                    if (Array.isArray(data)) {
                        // 1. Fetch ALL Assignments for this guardian once
                        const assignUrl = `/api/assignments?instituteId=${activeInstitute.id}&role=GUARDIAN&userId=${user.id}`;
                        const assignRes = await fetch(assignUrl);
                        const allAssignments = await assignRes.json();
                        const assignmentsList = Array.isArray(allAssignments) ? allAssignments : [];

                        // 2. Fetch stats for each child
                        const childrenWithStats = await Promise.all(data.map(async (child) => {
                            try {
                                const classId = child.metadata?.classId;
                                const groupId = child.metadata?.groupId;

                                // Filter assignments for this specific child
                                const childAssignments = assignmentsList.filter((a: any) =>
                                    (a.groupId === groupId && groupId) || (a.classId === classId && !a.groupId)
                                );

                                // Fetch Submissions for this child
                                const subRes = await fetch(`/api/submissions?studentId=${child.id}`);
                                const submissions = await subRes.json();
                                const submissionCount = Array.isArray(submissions) ? submissions.length : 0;

                                return {
                                    ...child,
                                    stats: {
                                        assignmentsCount: childAssignments.length,
                                        submissionsCount: submissionCount,
                                        attendanceRate: child.metadata?.attendanceRate || "৮৫%"
                                    }
                                };
                            } catch (err) {
                                console.error(`Error fetching stats for child ${child.id}:`, err);
                                return { ...child, stats: { assignmentsCount: 0, submissionsCount: 0, attendanceRate: "N/A" } };
                            }
                        }));
                        setChildren(childrenWithStats);
                    }
                }
            } catch (error) {
                console.error('Fetch children error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChildrenData();
    }, [activeInstitute?.id, user?.metadata]);

    if (!activeInstitute) {
        return <OnboardingRouter role="GUARDIAN" user={user} onComplete={() => typeof window !== 'undefined' && window.location.reload()} />;
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in-up font-bengali">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">আমার সন্তানসমূহ</h1>
                    <p className="text-slate-500 mt-1">আপনার সন্তানদের শিক্ষা কার্যক্রম ও অগ্রগতি এখান থেকে পর্যবেক্ষণ করুন।</p>
                </div>
                <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">{children.length} জন সক্রিয়</span>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 className="animate-spin text-primary mx-auto mb-4" size={40} />
                    <p className="text-slate-400 font-bold">সন্তানদের তথ্য লোড হচ্ছে...</p>
                </div>
            ) : children.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {children.map((child) => (
                        <div key={child.id} className="bg-white rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                            <div className="p-8 flex flex-col md:flex-row gap-6">
                                {/* Avatar & Primary Info */}
                                <div className="flex items-center gap-6 flex-1">
                                    <div className="w-20 h-20 bg-gradient-to-tr from-primary to-secondary rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                                        {child.name?.[0] || 'S'}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 group-hover:text-primary transition-colors">{child.name}</h2>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-1.5">
                                                <GraduationCap size={12} />
                                                {child.metadata?.className || 'শ্রেণী উল্লেখ নেই'}
                                            </span>
                                            {child.metadata?.groupName && (
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100 flex items-center gap-1.5">
                                                    <Users size={12} />
                                                    {child.metadata.groupName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div className="flex md:flex-col justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">উপস্থিতি</p>
                                        <p className="text-xl font-black text-emerald-600">{child.stats?.attendanceRate || '৮৫%'}</p>
                                    </div>
                                    <div className="text-center md:text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ক্লাস ডাইরি</p>
                                        <p className="text-xl font-black text-primary">{String(child.stats?.assignmentsCount || 0).padStart(2, '0')}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-4 pb-4 md:px-8 md:pb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                                <a
                                    href={`/dashboard/assignments?childId=${child.id}&role=GUARDIAN`}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-primary hover:text-white rounded-2xl transition-all border border-slate-100 hover:border-primary group/btn shadow-sm"
                                >
                                    <ClipboardList size={20} className="text-primary group-hover/btn:text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">ডায়েরি</span>
                                </a>
                                <div className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all border border-slate-100 hover:border-emerald-600 group/btn shadow-sm cursor-pointer">
                                    <Clock size={20} className="text-emerald-600 group-hover/btn:text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">উপস্থিতি</span>
                                </div>
                                <div className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all border border-slate-100 hover:border-indigo-600 group/btn shadow-sm cursor-pointer">
                                    <FileBarChart size={20} className="text-indigo-600 group-hover/btn:text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">রেজাল্ট</span>
                                </div>
                                <div className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-amber-500 hover:text-white rounded-2xl transition-all border border-slate-100 hover:border-amber-500 group/btn shadow-sm cursor-pointer">
                                    <MessageCircle size={20} className="text-amber-500 group-hover/btn:text-white" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">শিক্ষক</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-[40px] border border-slate-200 p-20 text-center max-w-2xl mx-auto shadow-sm">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                        <Users size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-600">কোনো সন্তানের তথ্য পাওয়া যায়নি</h3>
                    <p className="text-slate-400 font-bold mt-2">অনুগ্রহ করে আপনার শিক্ষা প্রতিষ্ঠানের সাথে যোগাযোগ করুন অথবা সঠিক আইডি দিয়ে প্রোফাইল আপডেট করুন।</p>
                </div>
            )}
        </div>
    );
}

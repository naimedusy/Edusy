'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    GraduationCap,
    Clock,
    ClipboardList,
    FileText,
    Building2,
    MapPin,
    Loader2,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Square,
    CheckSquare,
    Send,
    XCircle,
    ChevronDown,
    MessageSquare
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { useUI } from '@/components/UIProvider';
import OnboardingRouter from '../../../components/OnboardingRouter';
import AssignmentDetailsModal from '@/components/AssignmentDetailsModal';

export default function GuardianDashboardPage() {
    const { user, activeInstitute, activeRole } = useSession();
    const [children, setChildren] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
    const [progressPercentage, setProgressPercentage] = useState(0);

    // Modal state
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
    const [modalActiveIndex, setModalActiveIndex] = useState(0);

    // Revert request state
    const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<Set<string>>(new Set());
    const [revertNote, setRevertNote] = useState('');
    const [isSendingRevert, setIsSendingRevert] = useState(false);
    const [revertSent, setRevertSent] = useState(false);


    useEffect(() => {
        if (!activeInstitute?.id || !user?.metadata) return;

        const fetchChildrenData = async () => {
            try {
                const childrenIds = user?.metadata?.childrenIds || (user?.metadata?.studentId ? [user.metadata.studentId] : []);
                if (childrenIds.length > 0) {
                    const res = await fetch(`/api/admin/users?ids=${childrenIds.join(',')}`);
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setChildren(data);
                        // Default to null (All) or first child if only one
                        if (data.length === 1) setSelectedChildId(data[0].id);
                    }
                }
            } catch (error) {
                console.error('Fetch children error:', error);
            }
        };

        fetchChildrenData();
    }, [activeInstitute?.id, user?.id, user?.metadata]);

    useEffect(() => {
        if (!activeInstitute?.id || !selectedChildId) return;

        const fetchChildStats = async () => {
            setLoading(true);
            try {
                const child = selectedChildId ? children.find(c => c.id === selectedChildId) : null;
                // 1. Fetch Assignments using the childId parameter
                let url = `/api/assignments?instituteId=${activeInstitute.id}&role=GUARDIAN&userId=${user?.id}`;
                if (selectedChildId) url += `&childId=${selectedChildId}`;

                const res = await fetch(url);
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Keep full list for stats, but maybe only show 10 in UI
                    setAssignments(data);

                    // Helper: Check if an assignment is comment-only (teacher remarks, not student work)
                    const isCommentOnly = (a: any) => {
                        try {
                            const parsed = JSON.parse(a.description || '{}');
                            if (parsed.version === '2.0' && parsed.sections) {
                                return parsed.sections.every((s: any) =>
                                    s.title?.toUpperCase().includes('COMMENT') || s.type?.toUpperCase() === 'COMMENTS'
                                );
                            }
                        } catch { }
                        return false;
                    };

                    // Only count real student assignments (not teacher comments)
                    const taskAssignments = data.filter((a: any) => !isCommentOnly(a));
                    const total = taskAssignments.length;
                    const completed = taskAssignments.filter((a: any) =>
                        a.userStatus === 'SUBMITTED' || a.userStatus === 'APPROVED' || a.userStatus === 'GRADED'
                    ).length;

                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                    setProgressPercentage(percentage);
                }

                // 2. Attendance is still mocked in the system, but we can check if child has specific metadata
                // If not, we use the fallback or fetch from a (future) attendance API
            } catch (error) {
                console.error('Fetch child stats error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChildStats();
    }, [selectedChildId, activeInstitute?.id, children, user?.id]);

    const openAssignment = (assignment: any) => {
        // Group all assignments of the same day to allow slider navigation in modal
        const dateStr = new Date(assignment.createdAt).toDateString();
        const sameDayAssignments = assignments.filter(a =>
            new Date(a.createdAt).toDateString() === dateStr
        );

        const currentIndex = sameDayAssignments.findIndex(a => a.id === assignment.id);

        setActiveAssignments(sameDayAssignments);
        setModalActiveIndex(currentIndex >= 0 ? currentIndex : 0);
        setIsAssignmentModalOpen(true);
    };

    if (!activeInstitute) {
        return <OnboardingRouter role="GUARDIAN" user={user} onComplete={() => typeof window !== 'undefined' && window.location.reload()} />;
    }

    const attendancePercentage = 85;

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in-up font-bengali">
            {/* 1. Header with Cover */}
            <div className="relative rounded-[32px] overflow-hidden shadow-lg bg-primary text-white group">
                <div className="h-48 md:h-64 bg-slate-700 relative overflow-hidden">
                    {activeInstitute?.coverImage || activeInstitute?.metadata?.coverImage ? (
                        <img
                            src={activeInstitute.coverImage || activeInstitute.metadata.coverImage}
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

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-end gap-6 translate-y-4 md:translate-y-0">
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
                        <h1 className="text-2xl md:text-3xl font-black mb-2 text-white shadow-sm tracking-tight text-right">আমার ড্যাশবোর্ড</h1>
                        <p className="text-white/90 text-sm md:text-base font-medium flex items-center justify-end gap-2 drop-shadow-sm">
                            <MapPin size={16} className="text-red-400" />
                            {activeInstitute?.name || 'আপনার শিক্ষা প্রতিষ্ঠান'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-8 md:h-10" />

            {/* 2. Child Selector */}
            {children.length > 1 && (
                <div className="flex flex-wrap gap-2 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => setSelectedChildId(null)}
                        className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${!selectedChildId ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-primary'}`}
                    >
                        সকল সন্তান ({children.length})
                    </button>
                    {children.map(child => (
                        <button
                            key={child.id}
                            onClick={() => setSelectedChildId(child.id)}
                            className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedChildId === child.id ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-primary'}`}
                        >
                            {child.name}
                        </button>
                    ))}
                </div>
            )}



            {/* 3. Stats & Summary Cards for Guardian */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Attendance Summary */}
                <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-6 group">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="40" cy="40" r="34" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                            <circle
                                cx="40" cy="40" r="34"
                                stroke="#10b981"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={213.6}
                                strokeDashoffset={213.6 * (1 - attendancePercentage / 100)}
                                className="transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-lg font-bold text-slate-700">{attendancePercentage}%</span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">উপস্থিতি</h3>
                        <p className="text-slate-500 text-[10px] font-medium mb-2">সন্তানের মাসিক উপস্থিতি</p>
                        <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider">
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">P: 20</span>
                            <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">A: 3</span>
                        </div>
                    </div>
                </div>

                {/* Child Class Link */}
                <a href="/dashboard/guardian/children" className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 translate-y-4">
                        <GraduationCap size={100} />
                    </div>
                    <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <GraduationCap size={28} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors">সন্তানের প্রোফাইল</h3>
                        <p className="text-slate-500 text-[10px] font-medium mt-1">সন্তানদের তথ্য ও ক্লাস সম্পর্কে জানুন</p>
                    </div>
                </a>

                {/* Teacher List Link */}
                <a href="/dashboard/guardian/children" className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex items-center gap-5 relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity transform translate-x-4 translate-y-4">
                        <Users size={100} />
                    </div>
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Users size={28} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">আমার সন্তানসমূহ</h3>
                        <p className="text-slate-500 text-[10px] font-medium mt-1">একাধিক সন্তানের তথ্য দেখুন</p>
                    </div>
                </a>
            </div>

            {/* 4. Assignments & Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Progress Stats */}
                <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">শিক্ষা অগ্রগতি</h2>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${progressPercentage >= 70 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : progressPercentage >= 40 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                            {selectedChildId ? `${progressPercentage}% সম্পন্ন` : 'সন্তান বাছুন'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {!selectedChildId ? (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                <p className="text-xs font-bold text-slate-400">একজন সন্তান বেছে নিন</p>
                                <p className="text-[10px] text-slate-300 mt-1">তাদের অ্যাসাইনমেন্টের অগ্রগতি দেখতে পাবেন</p>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold text-slate-600">অ্যাসাইনমেন্ট সম্পন্নের হার</span>
                                    <span className="text-xs font-black text-primary">{progressPercentage}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${progressPercentage >= 70 ? 'bg-emerald-500' : progressPercentage >= 40 ? 'bg-amber-400' : 'bg-primary'}`}
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                                    {assignments.filter((a: any) => a.userStatus === 'SUBMITTED' || a.userStatus === 'APPROVED' || a.userStatus === 'GRADED').length} / {assignments.length} টি অ্যাসাইনমেন্ট জমা দিয়েছে
                                </p>
                            </div>
                        )}
                    </div>

                    <a href="/dashboard/calendar" className="block w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black text-center rounded-2xl transition-all border border-slate-100 uppercase tracking-widest">
                        সন্তানের রুটিন ও পরীক্ষার সূচি দেখুন
                    </a>
                </div>

                {/* Recent Assignments with Status */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shadow-sm">
                                <ClipboardList size={20} />
                            </div>
                            <span>সাম্প্রতিক অ্যাসাইনমেন্ট</span>
                        </h2>
                        <a href="/dashboard/assignments" className="text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-all">সব দেখুন →</a>
                    </div>

                    <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
                        {/* Selection toolbar */}
                        {selectedAssignmentIds.size > 0 && (
                            <div className="px-5 py-3 bg-indigo-50/80 border-b border-indigo-100 flex items-center justify-between gap-3 flex-wrap">
                                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">
                                    {selectedAssignmentIds.size}টি সিলেক্ট
                                </p>
                                <button
                                    onClick={() => setSelectedAssignmentIds(new Set())}
                                    className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                                >
                                    বাতিল করুন
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="py-10 text-center">
                                <Loader2 className="animate-spin text-primary mx-auto mb-2" />
                                <p className="text-xs text-slate-400">লোড হচ্ছে...</p>
                            </div>
                        ) : assignments.length > 0 ? (
                            <>
                                {assignments.slice(0, 10).map((assignment: any, i: number) => {
                                    const isSelected = selectedAssignmentIds.has(assignment.id);
                                    const status = assignment.userStatus || 'NOT_STARTED';

                                    const statusMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
                                        'SUBMITTED': { label: 'জমা দিয়েছে', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Clock size={10} /> },
                                        'APPROVED': { label: 'অনুমোদিত', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={10} /> },
                                        'GRADED': { label: 'গ্রেডেড', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={10} /> },
                                        'REJECTED': { label: 'বাতিল', color: 'bg-red-50 text-red-600 border-red-100', icon: <XCircle size={10} /> },
                                        'RETRY': { label: 'আবার চেষ্টা', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <RotateCcw size={10} /> },
                                        'NOT_STARTED': { label: 'বাকি', color: 'bg-slate-50 text-slate-500 border-slate-100', icon: <AlertCircle size={10} /> }
                                    };
                                    const statusInfo = statusMap[status] || statusMap['NOT_STARTED'];

                                    return (
                                        <div
                                            key={assignment.id}
                                            className={`flex items-center gap-4 px-5 py-4 transition-colors group ${i !== assignments.length - 1 ? 'border-b border-slate-100' : ''
                                                } ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
                                        >
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => {
                                                    setSelectedAssignmentIds(prev => {
                                                        const next = new Set(prev);
                                                        next.has(assignment.id) ? next.delete(assignment.id) : next.add(assignment.id);
                                                        return next;
                                                    });
                                                }}
                                                className="shrink-0 text-slate-300 hover:text-indigo-600 transition-colors"
                                            >
                                                {isSelected
                                                    ? <CheckSquare size={16} className="text-indigo-600" />
                                                    : <Square size={16} />}
                                            </button>

                                            {/* Icon */}
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
                                                <FileText size={16} />
                                            </div>

                                            <div
                                                className="flex-1 min-w-0 cursor-pointer"
                                                onClick={() => openAssignment(assignment)}
                                            >
                                                <h4 className="font-bold text-slate-800 text-sm mb-0.5 line-clamp-1 group-hover:text-primary transition-colors">{assignment.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                                                    <span className="text-slate-700 font-semibold">{assignment.book?.name}</span>
                                                    <span>•</span>
                                                    <span className="text-red-400 font-bold">
                                                        {new Date(assignment.createdAt).toLocaleDateString('bn-BD', { weekday: 'long', day: 'numeric', month: 'short' })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <span
                                                className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tight border flex items-center gap-1 cursor-pointer transition-transform active:scale-95 ${statusInfo.color}`}
                                                onClick={() => openAssignment(assignment)}
                                            >
                                                {statusInfo.icon}{statusInfo.label}
                                            </span>
                                        </div>
                                    );
                                })}

                                {/* Revert Request Section */}
                                {selectedAssignmentIds.size > 0 && (
                                    <div className="px-5 py-4 bg-amber-50/60 border-t border-amber-100">
                                        <div className="flex items-start gap-3">
                                            <MessageSquare size={16} className="text-amber-500 mt-2.5 shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-[11px] font-black text-amber-700 mb-2 uppercase tracking-widest">
                                                    শিক্ষকের কাছে পুনর্বিবেচনার অনুরোধ ({selectedAssignmentIds.size}টি)
                                                </p>
                                                {revertSent ? (
                                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                                        <CheckCircle2 size={14} />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">অনুরোধ পাঠানো হয়েছে!</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={revertNote}
                                                            onChange={e => setRevertNote(e.target.value)}
                                                            placeholder="কারণ লিখুন (ঐচ্ছিক)..."
                                                            className="flex-1 bg-white border-0 rounded-xl px-4 py-2.5 text-[12px] font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none shadow-sm"
                                                        />
                                                        <button
                                                            disabled={isSendingRevert}
                                                            onClick={async () => {
                                                                setIsSendingRevert(true);
                                                                // Simulate API or notification send
                                                                await new Promise(r => setTimeout(r, 800));
                                                                setIsSendingRevert(false);
                                                                setRevertSent(true);
                                                                setRevertNote('');
                                                                setTimeout(() => {
                                                                    setRevertSent(false);
                                                                    setSelectedAssignmentIds(new Set());
                                                                }, 2500);
                                                            }}
                                                            className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-amber-200"
                                                        >
                                                            {isSendingRevert ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                                            পাঠান
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-20 text-center">
                                <ClipboardList className="mx-auto text-slate-200 mb-2" size={32} />
                                <p className="text-slate-400 text-xs font-bold">কোনো অ্যাসাইনমেন্ট নেই</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Assignment Details Modal */}
            <AssignmentDetailsModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                assignments={activeAssignments}
                initialIndex={modalActiveIndex}
                selectedStudentId={selectedChildId || undefined}
                canEdit={false} // Guardians cannot edit assignments
            />
        </div>
    );
}

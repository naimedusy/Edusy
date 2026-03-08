'use client';

import React, { useState, useEffect } from 'react';
import {
    Check,
    X,
    Clock,
    Search,
    CheckSquare,
    Square,
    Save,
    ChevronDown,
    Loader2,
    Users,
    Calendar as CalendarIcon,
    Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from './SessionProvider';

interface Student {
    id: string;
    name: string;
    rollNumber?: string;
    photo?: string;
    attendance?: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
    initialAttendance?: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
    updatedAt?: string;
    stats?: {
        totalDays: number;
        presentDays: number;
        percentage: number;
    };
    classId?: string;
    className?: string;
}

export default function ManualAttendance({ classId, selectedDate }: { classId: string, selectedDate: string }) {
    const { activeInstitute } = useSession();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<{ message: string, type: 'SUCCESS' | 'ERROR' | 'INFO' } | null>(null);

    const showToast = (message: string, type: 'SUCCESS' | 'ERROR' | 'INFO' = 'SUCCESS') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const storageKey = `attendance_draft_${activeInstitute?.id}_${classId}_${selectedDate}`;

    // Sync to localStorage
    useEffect(() => {
        if (!loading && students.length > 0) {
            const hasChanges = students.some(s => s.attendance !== s.initialAttendance);
            if (hasChanges) {
                const draft = students.reduce((acc, s) => {
                    if (s.attendance !== s.initialAttendance) {
                        acc[s.id] = s.attendance;
                    }
                    return acc;
                }, {} as Record<string, any>);
                localStorage.setItem(storageKey, JSON.stringify(draft));
            } else {
                localStorage.removeItem(storageKey);
            }
        }
    }, [students, storageKey, loading]);

    useEffect(() => {
        if (classId !== undefined) {
            fetchStudents();
        }
    }, [classId, selectedDate, activeInstitute?.id]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Fetch students, attendance, and stats in parallel
            const fetchClassId = classId || 'all';
            const [studentsRes, attendanceRes, statsRes] = await Promise.all([
                fetch(`/api/admin/users?role=STUDENT&classId=${fetchClassId}&instituteId=${activeInstitute?.id}`),
                fetch(`/api/attendance/list?instituteId=${activeInstitute?.id}&date=${selectedDate}&classId=${fetchClassId}`),
                fetch(`/api/attendance/stats?instituteId=${activeInstitute?.id}&classId=${fetchClassId}`)
            ]);

            if (studentsRes.ok) {
                const studentsData = await studentsRes.json();
                const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];
                const statsData = statsRes.ok ? await statsRes.json() : [];

                const statsMap = new Map(statsData.map((s: any) => [s.studentId, s]));

                const normalizeId = (id: any) => {
                    if (!id) return null;
                    if (typeof id === 'object' && id?.$oid) return id.$oid;
                    return String(id);
                };

                const mappedStudents = studentsData.map((s: any) => {
                    const existing = attendanceData.find((a: any) => normalizeId(a.studentId) === s.id);
                    const status = existing?.status || 'ABSENT';
                    return {
                        id: s.id,
                        name: s.name,
                        rollNumber: s.metadata?.rollNumber,
                        photo: s.metadata?.studentPhoto,
                        attendance: status,
                        initialAttendance: status,
                        updatedAt: existing?.updatedAt,
                        stats: statsMap.get(s.id),
                        classId: s.metadata?.classId,
                        className: s.metadata?.className
                    };
                });

                // Check for localStorage draft
                const savedDraft = localStorage.getItem(storageKey);
                if (savedDraft) {
                    try {
                        const draft = JSON.parse(savedDraft);
                        mappedStudents.forEach((s: any) => {
                            if (draft[s.id]) {
                                s.attendance = draft[s.id];
                            }
                        });
                    } catch (e) {
                        console.error('Error parsing attendance draft:', e);
                    }
                }

                setStudents(mappedStudents);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = (id: string, status: Student['attendance']) => {
        setStudents(prev => prev.map(s => s.id === id ? {
            ...s,
            attendance: status,
            updatedAt: status !== 'ABSENT' ? new Date().toISOString() : s.updatedAt
        } : s));
    };

    const bulkUpdate = (status: Student['attendance'] | 'RESET') => {
        const now = new Date().toISOString();
        setStudents(prev => prev.map(s => {
            const finalStatus = status === 'RESET' ? s.initialAttendance : status;
            return {
                ...s,
                attendance: finalStatus,
                updatedAt: (status !== 'RESET' && finalStatus !== 'ABSENT') ? now : s.updatedAt
            };
        }));
    };

    const handleSave = async () => {
        const changedStudents = students.filter(s => s.attendance !== s.initialAttendance);
        if (changedStudents.length === 0) return;

        setSaving(true);
        try {
            const promises = changedStudents.map(s =>
                fetch('/api/attendance/mark', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: s.id,
                        instituteId: activeInstitute?.id,
                        classId: s.classId || classId,
                        dateString: selectedDate,
                        status: s.attendance,
                        method: 'MANUAL'
                    })
                })
            );
            await Promise.all(promises);

            // Sync initial state after successful save
            setStudents(prev => prev.map(s => {
                const savedStatus = s.attendance;
                return {
                    ...s,
                    initialAttendance: savedStatus as any,
                    attendance: savedStatus as any,
                    updatedAt: s.updatedAt // Preserve the timestamp we just set
                };
            }));

            // Clear draft
            localStorage.removeItem(storageKey);

            // Show success toast
            showToast('হাজিরা সফলভাবে সংরক্ষিত হয়েছে।', 'SUCCESS');
        } catch (err) {
            console.error('Error saving attendance:', err);
            showToast('হাজিরা সেভ করতে সমস্যা হয়েছে।', 'ERROR');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber?.includes(searchQuery)
    );

    const hasChanges = students.some(s => s.attendance !== s.initialAttendance);

    return (
        <div className="space-y-6">
            {/* Simplified Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white px-3 py-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative group flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84] transition-colors" />
                    <input
                        type="text"
                        placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg pl-11 pr-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 ring-[#045c84]/20 w-full"
                    />
                </div>

                <div className="flex items-center gap-3 overflow-hidden w-full">
                    <div className="flex bg-slate-100/50 p-1 rounded-lg border border-slate-200 shadow-inner flex-1 overflow-x-auto no-scrollbar min-w-0">
                        {[
                            { id: 'PRESENT', label: 'সব উপস্থিত', color: 'text-emerald-700', hover: 'hover:bg-emerald-100/50' },
                            { id: 'ABSENT', label: 'সব অনুপস্থিত', color: 'text-rose-700', hover: 'hover:bg-rose-100/50' },
                            { id: 'LEAVE', label: 'সব ছুটি', color: 'text-blue-700', hover: 'hover:bg-blue-100/50' },
                            { id: 'RESET', label: 'হাজিরা রিসেট', color: 'text-slate-600', hover: 'hover:bg-slate-200/50' }
                        ].map((btn) => (
                            <button
                                key={btn.id}
                                onClick={() => bulkUpdate(btn.id as any)}
                                className={`px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-black ${btn.color} ${btn.hover} transition-all uppercase tracking-tight whitespace-nowrap active:scale-95`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || loading || !hasChanges}
                        className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-black text-[11px] sm:text-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-300 shadow-md sm:shadow-lg active:scale-95 shrink-0 ${hasChanges
                            ? 'bg-indigo-600 text-white shadow-indigo-900/20 hover:bg-indigo-700'
                            : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed opacity-70'
                            }`}
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        <span className="hidden sm:inline-block truncate">{hasChanges ? 'হাজিরা সেভ করুন' : 'হাজিরা সংরক্ষিত'}</span>
                        <span className="sm:hidden">{hasChanges ? 'সেভ' : 'সেভড'}</span>
                    </button>
                </div>
            </div>

            {/* Student List - Card Grid */}
            <div className="min-h-[400px]">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <div key="loading" className="py-20 text-center bg-white rounded-2xl border border-slate-200">
                            <Loader2 size={32} className="animate-spin text-slate-300 mx-auto" />
                            <p className="text-slate-400 font-bold mt-4">ছাত্রদের তালিকা লোড হচ্ছে...</p>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div key="empty" className="py-20 text-center bg-white rounded-2xl border border-slate-200">
                            <Users size={32} className="text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">কোনো ছাত্র পাওয়া যায়নি।</p>
                        </div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        >
                            {filteredStudents.map((student) => {
                                const status = student.attendance;

                                const getStatusConfig = (s: string | undefined) => {
                                    switch (s) {
                                        case 'PRESENT': return { next: 'LATE', label: 'উপস্থিত', color: 'emerald', icon: Check };
                                        case 'LATE': return { next: 'ABSENT', label: 'দেরি', color: 'amber', icon: Clock };
                                        case 'ABSENT': return { next: 'LEAVE', label: 'অনুপস্থিত', color: 'rose', icon: X };
                                        case 'LEAVE': return { next: 'PRESENT', label: 'ছুটী', color: 'blue', icon: Square };
                                        default: return { next: 'PRESENT', label: '---', color: 'slate', icon: Minus };
                                    }
                                };

                                const current = {
                                    PRESENT: { label: 'উপস্থিত', color: 'emerald', icon: Check },
                                    ABSENT: { label: 'অনুপস্থিত', color: 'rose', icon: X },
                                    LATE: { label: 'দেরি', color: 'amber', icon: Clock },
                                    LEAVE: { label: 'ছুটী', color: 'blue', icon: Square }
                                }[status || 'PRESENT'] || { label: '---', color: 'slate', icon: Minus };

                                const attendanceTime = student.updatedAt ? new Date(student.updatedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : null;

                                return (
                                    <motion.div
                                        key={student.id}
                                        layout
                                        className="bg-white rounded-xl p-3 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 italic font-black text-slate-400 text-[10px]">
                                                    {student.photo ? (
                                                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users size={16} />
                                                    )}
                                                </div>
                                                {student.stats && (
                                                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-black text-white px-0.5 ${student.stats.percentage >= 80 ? 'bg-emerald-500' :
                                                        student.stats.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}>
                                                        {student.stats.percentage}%
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h4 className="text-xs font-black text-slate-700 truncate">{student.name}</h4>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-black text-slate-400">#{student.rollNumber || 'N/A'}</span>
                                                        {classId === '' && student.className && (
                                                            <span className="text-[8px] font-black text-slate-300 uppercase truncate">
                                                                {student.className}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {status !== 'ABSENT' && attendanceTime && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <Clock size={8} className="text-slate-300" />
                                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">{attendanceTime}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[8px] font-black uppercase tracking-tighter mb-0.5 text-${current.color}-600`}>{current.label}</span>
                                                <button
                                                    onClick={() => updateStatus(student.id, getStatusConfig(status).next as any)}
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10' :
                                                        status === 'ABSENT' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 ring-4 ring-rose-500/10' :
                                                            status === 'LATE' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 ring-4 ring-amber-500/10' :
                                                                status === 'LEAVE' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 ring-4 blue-500/10' :
                                                                    'bg-slate-50 text-slate-400 border border-slate-200 shadow-inner hover:bg-slate-100 flex items-center justify-center'
                                                        }`}
                                                >
                                                    <current.icon size={18} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Summary */}
            {!loading && filteredStudents.length > 0 && (
                <div className="flex flex-col md:flex-row md:items-center justify-end gap-6 py-6 px-8 bg-slate-100/50 rounded-2xl border border-slate-200/60">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">উপস্থিত: {students.filter(s => s.attendance === 'PRESENT').length}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="w-2 h-2 bg-rose-500 rounded-full" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">অনুপস্থিত: {students.filter(s => s.attendance === 'ABSENT').length}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100">
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">দেরি: {students.filter(s => s.attendance === 'LATE').length}</span>
                        </div>
                    </div>
                </div>
            )}
            {/* Glassmorphism Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="fixed top-6 right-6 z-[9999] pointer-events-none"
                    >
                        <div className={`
                            min-w-[320px] px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-4 transition-all
                            ${toast.type === 'SUCCESS' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700' :
                                toast.type === 'ERROR' ? 'bg-rose-500/10 border-rose-500/20 text-rose-700' :
                                    'bg-slate-500/10 border-slate-500/20 text-slate-700'}
                        `}>
                            <div className={`
                                w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg
                                ${toast.type === 'SUCCESS' ? 'bg-emerald-500 text-white' :
                                    toast.type === 'ERROR' ? 'bg-rose-500 text-white' :
                                        'bg-slate-500 text-white'}
                            `}>
                                {toast.type === 'SUCCESS' ? <Check size={20} strokeWidth={3} /> :
                                    toast.type === 'ERROR' ? <X size={20} strokeWidth={3} /> :
                                        <Users size={20} strokeWidth={3} />}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">
                                    {toast.type === 'SUCCESS' ? 'সাফল্য' : toast.type === 'ERROR' ? 'ত্রুটি' : 'তথ্য'}
                                </h4>
                                <p className="text-sm font-black italic uppercase leading-tight truncate">
                                    {toast.message}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

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
    Minus,
    Trash2,
    MoreVertical,
    Phone,
    MessageSquare,
    Edit3,
    UserCircle,
    Clock8
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from './SessionProvider';
import { useUI } from './UIProvider';
import dynamic from 'next/dynamic';

const StudentProfileModal = dynamic(() => import('./StudentProfileModal'), { ssr: false });

interface Student {
    id: string;
    name: string;
    rollNumber?: string;
    photo?: string;
    phone?: string;
    email?: string;
    attendance?: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'LEAVE_PENDING';
    initialAttendance?: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE' | 'LEAVE_PENDING';
    updatedAt?: string;
    stats?: {
        totalDays: number;
        presentDays: number;
        lateDays: number;
        absentDays: number;
        percentage: number;
    };
    classId?: string;
    className?: string;
    metadata?: any;
}

export default function ManualAttendance({ classId, selectedDate }: { classId: string, selectedDate: string }) {
    const { activeInstitute, activeRole } = useSession();
    const isAdmin = activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN';
    const isTeacher = activeRole === 'TEACHER';
    const ui = useUI();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'LEAVE' | 'LEAVE_PENDING'>('ALL');
    const [toast, setToast] = useState<{ message: string, type: 'SUCCESS' | 'ERROR' | 'INFO' } | null>(null);
    const [activeActionId, setActiveActionId] = useState<string | null>(null);
    const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
    const [modalTab, setModalTab] = useState<'fees' | 'attendance' | 'assignments' | 'login' | 'face'>('fees');

    const showToast = (message: string, type: 'SUCCESS' | 'ERROR' | 'INFO' = 'SUCCESS') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const storageKey = `attendance_draft_${activeInstitute?.id}_${selectedDate}`;

    // Close dropdown on click outside
    useEffect(() => {
        const handleClick = () => setActiveActionId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const openProfileModal = (student: Student, tab: typeof modalTab = 'attendance') => {
        setModalTab(tab);
        setSelectedStudentForModal(student);
        setActiveActionId(null);
    };

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
        if (classId !== undefined && activeInstitute?.id) {
            fetchStudents();
        }
    }, [classId, selectedDate, activeInstitute?.id]);

    const fetchStudents = async () => {
        if (!activeInstitute?.id) return;
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
                        phone: s.phone || s.metadata?.studentPhone || s.metadata?.guardianPhone,
                        email: s.email,
                        attendance: status,
                        initialAttendance: status,
                        updatedAt: existing?.updatedAt,
                        stats: statsMap.get(s.id),
                        classId: s.metadata?.classId,
                        className: s.metadata?.className,
                        metadata: s.metadata // Keep all for modal
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
            let finalStatus = status === 'RESET' ? s.initialAttendance : status;
            
            // Redirect LEAVE to LEAVE_PENDING for teachers even in bulk actions
            if (isTeacher && finalStatus === 'LEAVE') {
                finalStatus = 'LEAVE_PENDING';
            }

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

    const handleClearSaved = async () => {
        const savedStudents = students.filter(s => s.initialAttendance !== 'ABSENT' || s.updatedAt);
        if (savedStudents.length === 0) return;

        if (!await ui.confirm('আপনি কি আজকের সমস্ত হাজিরা রেকর্ড মুছে ফেলতে চান? এটি রিপোর্ট থেকেও মুছে যাবে।')) {
            return;
        }

        setSaving(true);
        try {
            const promises = savedStudents.map(s =>
                fetch('/api/attendance/unmark', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentId: s.id,
                        dateString: selectedDate
                    })
                })
            );
            await Promise.all(promises);

            // Reset state
            setStudents(prev => prev.map(s => ({
                ...s,
                attendance: 'ABSENT',
                initialAttendance: 'ABSENT',
                updatedAt: undefined
            })));

            localStorage.removeItem(storageKey);
            showToast('সমস্ত হাজিরা রেকর্ড মুছে ফেলা হয়েছে।', 'SUCCESS');
        } catch (err) {
            console.error('Error clearing attendance:', err);
            showToast('হাজিরা মুছতে সমস্যা হয়েছে।', 'ERROR');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNumber?.includes(searchQuery);
        const matchesStatus = statusFilter === 'ALL' || s.attendance === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const hasChanges = students.some(s => s.attendance !== s.initialAttendance);

    return (
        <div className="space-y-6">
            {/* Redesigned Toolbar */}
            <div className="flex flex-col gap-3 bg-white p-3 rounded-[24px] border border-slate-200 shadow-sm relative z-20">
                <div className="flex items-center gap-3">
                    {/* Expanding Search Bar */}
                    <motion.div
                        initial={false}
                        animate={{ flex: searchFocused ? 5 : 1 }}
                        className="relative group min-w-[50px]"
                    >
                        <Search
                            size={18}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${searchFocused ? 'text-[#045c84]' : 'text-slate-400'}`}
                        />
                        <input
                            type="text"
                            placeholder={searchFocused ? "নাম বা রোল দিয়ে খুঁজুন..." : ""}
                            value={searchQuery}
                            onFocus={() => setSearchFocused(true)}
                            onBlur={() => setSearchFocused(false)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`bg-slate-50 border border-slate-100 rounded-[22px] pl-12 pr-4 py-4 text-base font-bold text-slate-700 outline-none focus:ring-4 ring-[#045c84]/5 transition-all w-full cursor-pointer focus:cursor-text ${!searchFocused && !searchQuery ? 'placeholder-transparent' : ''}`}
                        />
                    </motion.div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving || loading || !hasChanges}
                        className={`px-8 py-4 rounded-[22px] font-black text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-xl active:scale-95 shrink-0 ${hasChanges
                            ? 'bg-[#045c84] text-white shadow-[#045c84]/20 hover:bg-[#034a6b]'
                            : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed opacity-70'
                            }`}
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        <span className={searchFocused ? 'hidden sm:inline' : 'inline'}>{hasChanges ? 'হাজিরা সেভ' : 'সেভড'}</span>
                    </button>
                </div>

                {/* Interactive Status Tabs - Always in one scrollable row */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                    {[
                        { id: 'ALL', label: 'সব', count: students.length, color: 'slate', activeBg: 'bg-slate-800', activeText: 'text-white' },
                        { id: 'PRESENT', label: 'উপস্থিত', count: students.filter(s => s.attendance === 'PRESENT').length, color: 'emerald', activeBg: 'bg-emerald-500', activeText: 'text-white' },
                        { id: 'ABSENT', label: 'অনুপস্থিত', count: students.filter(s => s.attendance === 'ABSENT').length, color: 'rose', activeBg: 'bg-rose-500', activeText: 'text-white' },
                        { id: 'LEAVE', label: 'ছুটি', count: students.filter(s => s.attendance === 'LEAVE').length, color: 'blue', activeBg: 'bg-blue-500', activeText: 'text-white' },
                        ...(isAdmin ? [{ id: 'LEAVE_PENDING', label: 'অপেক্ষমান', count: students.filter(s => s.attendance === 'LEAVE_PENDING').length, color: 'amber', activeBg: 'bg-amber-500', activeText: 'text-white' }] : [])
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id as any)}
                            className={`flex items-center gap-3 px-6 py-3 rounded-[18px] text-[13px] font-black uppercase tracking-widest transition-all whitespace-nowrap border shrink-0 ${statusFilter === tab.id
                                ? `${tab.activeBg} ${tab.activeText} border-transparent shadow-lg scale-105`
                                : `bg-white text-slate-500 border-slate-100 hover:bg-slate-50`
                                }`}
                        >
                            <span>{tab.label}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] ${statusFilter === tab.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                                {tab.count.toLocaleString('bn-BD')}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Actions (Quick Set) */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2">
                <div className="flex items-center gap-2">
                    <button onClick={() => bulkUpdate('PRESENT')} className="px-5 py-2.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[11px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">উপস্থিত</button>
                    <button onClick={() => bulkUpdate('ABSENT')} className="px-5 py-2.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 text-[11px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">অনুপস্থিত</button>
                    <button onClick={() => bulkUpdate('LEAVE')} className="px-5 py-2.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 text-[11px] font-black uppercase hover:bg-blue-500 hover:text-white transition-all">ছুটি</button>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <AnimatePresence>
                        {hasChanges && (
                            <motion.button
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onClick={() => bulkUpdate('RESET')}
                                className="px-6 py-2.5 rounded-full text-[11px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all active:scale-95 whitespace-nowrap shadow-sm"
                            >
                                সব বাতিল করুন
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {students.some(s => s.initialAttendance !== 'ABSENT' || s.updatedAt) && (
                        <button
                            onClick={handleClearSaved}
                            disabled={saving}
                            className="px-6 py-2.5 rounded-full text-[11px] font-black uppercase text-slate-500 bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:text-slate-700 transition-all active:scale-95 whitespace-nowrap shadow-sm flex items-center gap-2"
                        >
                            <Trash2 size={12} className="opacity-70" />
                            <span>আজকের ডাটা মুছুন</span>
                        </button>
                    )}
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
                            className="grid gap-4 justify-center"
                            style={{ 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                                maxWidth: '100%' 
                            }}
                        >
                            {filteredStudents.map((student) => {
                                const status = student.attendance;

                                const getStatusConfig = (s: string | undefined) => {
                                    switch (s) {
                                        case 'ABSENT': return { next: 'PRESENT', label: 'অনুপস্থিত', color: 'rose', icon: X };
                                        case 'PRESENT': return { next: isTeacher ? 'LEAVE_PENDING' : 'LEAVE', label: 'উপস্থিত', color: 'emerald', icon: Check };
                                        case 'LEAVE': return { next: 'ABSENT', label: 'ছুটী', color: 'blue', icon: Square };
                                        case 'LEAVE_PENDING': return { next: 'ABSENT', label: 'ছুটীর আবেদন', color: 'amber', icon: Clock8 };
                                        default: return { next: 'PRESENT', label: '---', color: 'slate', icon: Minus };
                                    }
                                };

                                const current = {
                                    PRESENT: { label: 'উপস্থিত', color: 'emerald', icon: Check },
                                    ABSENT: { label: 'অনুপস্থিত', color: 'rose', icon: X },
                                    LEAVE: { label: 'ছুটী', color: 'blue', icon: Square },
                                    LATE: { label: 'দেরি', color: 'amber', icon: Clock },
                                    LEAVE_PENDING: { label: 'অপেক্ষমান', color: 'amber', icon: Clock8 }
                                }[status || 'PRESENT'] as any || { label: '---', color: 'slate', icon: Minus };

                                const attendanceTime = student.updatedAt ? new Date(student.updatedAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : null;

                                // Attendance Stats for segment border
                                const stats = student.stats || { presentDays: 0, lateDays: 0, absentDays: 0, totalDays: 0 };
                                const total = stats.totalDays || 0;
                                const presentPct = total > 0 ? (stats.presentDays / total) * 100 : 0;
                                const absentPct = total > 0 ? (stats.absentDays / total) * 100 : 0;

                                return (
                                    <motion.div
                                        key={student.id}
                                        layout
                                        className="bg-white rounded-[20px] p-2 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3 relative overflow-hidden group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative shrink-0">
                                                <div
                                                    className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 italic font-black text-slate-400 text-[10px] shadow-inner cursor-pointer"
                                                    onClick={() => setSelectedStudentForModal(student)}
                                                >
                                                    {student.photo ? (
                                                        <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Users size={20} />
                                                    )}
                                                </div>
                                                {student.stats && (
                                                    <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-md ${student.stats.percentage >= 80 ? 'bg-emerald-500' :
                                                        student.stats.percentage >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                        }`}>
                                                        {student.stats.percentage}%
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="text-[15px] font-black text-slate-800 truncate mb-0.5 cursor-pointer hover:text-[#045c84]" onClick={() => setSelectedStudentForModal(student)}>{student.name}</h4>
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveActionId(activeActionId === student.id ? null : student.id);
                                                            }}
                                                            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                                                        >
                                                            <MoreVertical size={13} />
                                                        </button>

                                                        <AnimatePresence>
                                                            {activeActionId === student.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                    className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[100] font-bengali"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">দ্রুত অ্যাকশন</div>

                                                                    <a href={`tel:${student.phone}`} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors text-sm font-bold group/item">
                                                                        <Phone size={16} className="group-hover/item:scale-110 transition-transform" />
                                                                        <span>কল করুন</span>
                                                                    </a>

                                                                    <a href={`sms:${student.phone}`} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors text-sm font-bold group/item">
                                                                        <MessageSquare size={16} className="group-hover/item:scale-110 transition-transform" />
                                                                        <span>মেসেজ দিন</span>
                                                                    </a>

                                                                    <button
                                                                        onClick={() => openProfileModal(student, 'face')}
                                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors text-sm font-bold group/item"
                                                                    >
                                                                        <UserCircle size={16} className="group-hover/item:scale-110 transition-transform" />
                                                                        <span>প্রোফাইল / ফেস আইডি</span>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => openProfileModal(student, 'attendance')}
                                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 text-amber-600 transition-colors text-sm font-bold group/item"
                                                                    >
                                                                        <Edit3 size={16} className="group-hover/item:scale-110 transition-transform" />
                                                                        <span>এডিট তথ্য</span>
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[10px] font-black text-slate-400 opacity-60">#{student.rollNumber || 'N/A'}</span>
                                                        {classId === '' && student.className && (
                                                            <span className="text-[10px] font-black text-[#045c84] uppercase truncate opacity-50">
                                                                {student.className}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {status !== 'ABSENT' && attendanceTime && (
                                                        <div className="flex items-center gap-1 mt-0">
                                                            <Clock size={9} className="text-slate-300" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{attendanceTime}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-[9px] font-black uppercase tracking-widest mb-1 text-${current.color}-600 opacity-70`}>{current.label}</span>
                                                {isAdmin && status === 'LEAVE_PENDING' ? (
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => updateStatus(student.id, 'LEAVE')}
                                                            className="w-10 h-10 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center justify-center active:scale-95"
                                                            title="অনুমোদন করুন"
                                                        >
                                                            <Check size={18} strokeWidth={3} />
                                                        </button>
                                                        <button 
                                                            onClick={() => updateStatus(student.id, 'ABSENT')}
                                                            className="w-10 h-10 rounded-xl bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:scale-105 transition-all flex items-center justify-center active:scale-95"
                                                            title="বাতিল করুন"
                                                        >
                                                            <X size={18} strokeWidth={3} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => updateStatus(student.id, getStatusConfig(status).next as any)}
                                                        disabled={!isAdmin && status === 'LEAVE_PENDING'}
                                                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${status === 'PRESENT' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10 ring-4 ring-emerald-500/5' :
                                                            status === 'ABSENT' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/10 ring-4 ring-rose-500/5' :
                                                                status === 'LEAVE' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/10 ring-4 blue-500/5' :
                                                                    status === 'LEAVE_PENDING' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/10 ring-4 ring-amber-500/5 cursor-wait' :
                                                                        'bg-slate-50 text-slate-400 border border-slate-200 shadow-inner hover:bg-slate-100 flex items-center justify-center'
                                                            }`}
                                                    >
                                                        <current.icon size={22} strokeWidth={3} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Segmented Bottom Border */}
                                        <div className="absolute bottom-0 left-0 right-0 h-1 flex">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-500"
                                                style={{ width: `${presentPct}%` }}
                                            />
                                            <div
                                                className="h-full bg-rose-500 transition-all duration-500"
                                                style={{ width: `${absentPct}%` }}
                                            />
                                            {total === 0 && (
                                                <div className="h-full bg-slate-100 w-full" />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Student Profile Modal */}
                {selectedStudentForModal && (
                    <StudentProfileModal
                        isOpen={!!selectedStudentForModal}
                        onClose={() => setSelectedStudentForModal(null)}
                        student={selectedStudentForModal}
                        onUpdate={fetchStudents}
                        initialTab={modalTab}
                    />
                )}
            </div >

            {/* Glassmorphism Toast */}
            <AnimatePresence>
                {
                    toast && (
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
                    )
                }
            </AnimatePresence >
        </div >
    );
}

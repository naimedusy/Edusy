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
    Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from './SessionProvider';

interface Student {
    id: string;
    name: string;
    rollNumber?: string;
    photo?: string;
    attendance?: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
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

    useEffect(() => {
        if (classId !== undefined) {
            fetchStudents();
        }
    }, [classId, selectedDate, activeInstitute?.id]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Fetch students, attendance, and stats in parallel
            const [studentsRes, attendanceRes, statsRes] = await Promise.all([
                fetch(`/api/admin/users?role=STUDENT&classId=${classId}&instituteId=${activeInstitute?.id}`),
                fetch(`/api/attendance/list?instituteId=${activeInstitute?.id}&date=${selectedDate}`),
                fetch(`/api/attendance/stats?instituteId=${activeInstitute?.id}&classId=${classId}`)
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
                    return {
                        id: s.id,
                        name: s.name,
                        rollNumber: s.metadata?.rollNumber,
                        photo: s.metadata?.studentPhoto,
                        attendance: existing?.status || 'ABSENT',
                        stats: statsMap.get(s.id),
                        classId: s.metadata?.classId,
                        className: s.metadata?.className
                    };
                });
                setStudents(mappedStudents);
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = (id: string, status: Student['attendance']) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, attendance: status } : s));
    };

    const bulkUpdate = (status: Student['attendance']) => {
        setStudents(prev => prev.map(s => ({ ...s, attendance: status })));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const promises = students.map(s =>
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
            // Show success toast or notification
            alert('হাজিরা সফলভাবে সংরক্ষিত হয়েছে।');
        } catch (err) {
            console.error('Error saving attendance:', err);
            alert('হাজিরা সেভ করতে সমস্যা হয়েছে।');
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber?.includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-200">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-[#045c84] flex items-center gap-2">
                            <CalendarIcon size={14} />
                            {selectedDate}
                        </div>
                    </div>

                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <button
                            onClick={() => bulkUpdate('PRESENT')}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-black text-emerald-600 hover:bg-white transition-all uppercase tracking-tighter"
                        >
                            Select All
                        </button>
                        <button
                            onClick={() => bulkUpdate('ABSENT')}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-black text-rose-500 hover:bg-white transition-all uppercase tracking-tighter"
                        >
                            Deselect All
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84] transition-colors" />
                        <input
                            type="text"
                            placeholder="নাম বা রোল দিয়ে খুঁজুন..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 ring-[#045c84]/20 min-w-[240px]"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="bg-[#045c84] text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 hover:bg-[#034a6b] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/10"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Attendence
                    </button>
                </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">রোল</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest italic">ছাত্রের নাম</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest italic text-center">উপস্থিতি</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {loading ? (
                                    <tr>
                                        <td colSpan={3} className="py-20 text-center">
                                            <Loader2 size={32} className="animate-spin text-slate-300 mx-auto" />
                                            <p className="text-slate-400 font-bold mt-4">ছাত্রদের তালিকা লোড হচ্ছে...</p>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-20 text-center">
                                            <Users size={32} className="text-slate-200 mx-auto mb-4" />
                                            <p className="text-slate-400 font-bold">কোনো ছাত্র পাওয়া যায়নি।</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student) => (
                                        <motion.tr
                                            key={student.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-8 py-4">
                                                <span className="text-xs font-black text-slate-400">#{student.rollNumber || 'N/A'}</span>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 overflow-hidden shrink-0 border border-slate-200">
                                                        {student.photo ? (
                                                            <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users size={18} />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-black text-slate-700">{student.name}</p>
                                                            {classId === '' && student.className && (
                                                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-black text-slate-400 border border-slate-200 uppercase tracking-tighter">
                                                                    {student.className}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {student.stats && (
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full transition-all duration-500 rounded-full ${student.stats.percentage >= 80 ? 'bg-emerald-500' :
                                                                            student.stats.percentage >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                                                                            }`}
                                                                        style={{ width: `${student.stats.percentage}%` }}
                                                                    />
                                                                </div>
                                                                <span className={`text-[10px] font-black ${student.stats.percentage >= 80 ? 'text-emerald-600' :
                                                                    student.stats.percentage >= 50 ? 'text-amber-600' : 'text-rose-600'
                                                                    }`}>
                                                                    {student.stats.percentage}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    {[
                                                        { id: 'PRESENT', label: 'উপস্থিত', color: 'emerald', icon: Check },
                                                        { id: 'ABSENT', label: 'অনুপস্থিত', color: 'rose', icon: X },
                                                        { id: 'LATE', label: 'দেরি', color: 'amber', icon: Clock },
                                                        { id: 'LEAVE', label: 'ছুটি', color: 'blue', icon: Square },
                                                    ].map((st) => (
                                                        <button
                                                            key={st.id}
                                                            onClick={() => updateStatus(student.id, st.id as any)}
                                                            className={`p-2 rounded-xl border transition-all duration-300 group flex flex-col items-center gap-1 min-w-[70px] ${student.attendance === st.id
                                                                ? `bg-${st.color}-50 border-${st.color}-200 text-${st.color}-600 ring-4 ring-${st.color}-500/5`
                                                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-600'
                                                                }`}
                                                        >
                                                            <st.icon size={16} strokeWidth={student.attendance === st.id ? 3 : 2} />
                                                            <span className="text-[9px] font-black uppercase tracking-tighter">{st.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer Summary */}
            {!loading && filteredStudents.length > 0 && (
                <div className="flex flex-wrap items-center gap-4 py-4 px-6 bg-slate-100/50 rounded-3xl border border-slate-200/60">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">উপস্থিত: {students.filter(s => s.attendance === 'PRESENT').length}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-2 h-2 bg-rose-500 rounded-full" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">অনুপস্থিত: {students.filter(s => s.attendance === 'ABSENT').length}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">দেরি: {students.filter(s => s.attendance === 'LATE').length}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

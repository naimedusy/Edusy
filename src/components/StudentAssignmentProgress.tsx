'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Loader2,
    ChevronRight,
    XCircle,
    RefreshCw,
    CheckSquare,
    Square,
    Users,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useUI } from '@/components/UIProvider';
import { motion, AnimatePresence } from 'framer-motion';

interface Submission {
    id: string;
    studentId: string;
    assignmentId: string;
    status: string;
    submittedAt: string;
    student: { name: string; metadata?: any };
    assignment: { id: string; title: string; book?: { name: string }; createdAt?: string };
}

type BulkAction = 'APPROVED' | 'REJECTED' | 'RETRY';

export default function StudentAssignmentProgress({
    instituteId,
    teacherId,
    title = 'শিক্ষার্থীর ক্লাস ডাইরি প্রগ্রেস'
}: { instituteId?: string; teacherId?: string; title?: string }) {
    const { openAssignmentDetails } = useUI();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [collapsedStudents, setCollapsedStudents] = useState<Set<string>>(new Set());

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            let url = '/api/submissions?';
            if (instituteId) url += `instituteId=${instituteId}&`;
            if (teacherId) url += `teacherId=${teacherId}&`;
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                // Sort: SUBMITTED first, then most recent by updatedAt/submittedAt
                const sorted = data.sort((a: any, b: any) => {
                    if (a.status === 'SUBMITTED' && b.status !== 'SUBMITTED') return -1;
                    if (b.status === 'SUBMITTED' && a.status !== 'SUBMITTED') return 1;
                    const aDate = a.submittedAt || a.updatedAt || a.createdAt;
                    const bDate = b.submittedAt || b.updatedAt || b.createdAt;
                    return new Date(bDate).getTime() - new Date(aDate).getTime();
                });
                setSubmissions(sorted.slice(0, 50));
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (instituteId || teacherId) fetchSubmissions();
    }, [instituteId, teacherId]);

    // Group submissions by student
    const grouped = useMemo(() => {
        const map = new Map<string, { name: string; photo: string | null; items: Submission[] }>();
        for (const s of submissions) {
            if (!map.has(s.studentId)) {
                map.set(s.studentId, {
                    name: s.student.name,
                    photo: s.student.metadata?.photo || null,
                    items: []
                });
            }
            map.get(s.studentId)!.items.push(s);
        }
        return map;
    }, [submissions]);

    // Selectable = only SUBMITTED
    const pendingIds = useMemo(
        () => new Set(submissions.filter(s => s.status === 'SUBMITTED').map(s => s.id)),
        [submissions]
    );
    const allSelected = pendingIds.size > 0 && [...pendingIds].every(id => selectedIds.has(id));
    const someSelected = selectedIds.size > 0;

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => setSelectedIds(new Set(pendingIds));
    const deselectAll = () => setSelectedIds(new Set());

    const selectStudent = (studentId: string) => {
        const studentPendingIds = (grouped.get(studentId)?.items ?? [])
            .filter(s => s.status === 'SUBMITTED')
            .map(s => s.id);
        const allAlreadySelected = studentPendingIds.every(id => selectedIds.has(id));
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (allAlreadySelected) {
                studentPendingIds.forEach(id => next.delete(id));
            } else {
                studentPendingIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const toggleCollapse = (studentId: string) => {
        setCollapsedStudents(prev => {
            const next = new Set(prev);
            next.has(studentId) ? next.delete(studentId) : next.add(studentId);
            return next;
        });
    };

    const handleSingleAction = async (
        e: React.MouseEvent,
        subId: string,
        action: BulkAction
    ) => {
        e.stopPropagation();
        setProcessingId(subId);
        try {
            const res = await fetch('/api/submissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: subId, status: action })
            });
            if (res.ok) {
                setSubmissions(prev => prev.map(s => s.id === subId ? { ...s, status: action } : s));
                setSelectedIds(prev => { const n = new Set(prev); n.delete(subId); return n; });
            }
        } finally {
            setProcessingId(null);
        }
    };

    const handleBulkAction = async (action: BulkAction) => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        const ids = [...selectedIds];
        try {
            await Promise.all(ids.map(id =>
                fetch('/api/submissions', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, status: action })
                })
            ));
            setSubmissions(prev => prev.map(s => ids.includes(s.id) ? { ...s, status: action } : s));
            setSelectedIds(new Set());
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'SUBMITTED': return { label: 'জমা দিয়েছে', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Clock size={11} /> };
            case 'APPROVED': return { label: 'অনুমোদিত', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={11} /> };
            case 'RETRY': return { label: 'আবার চেষ্টা', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <RotateCcw size={11} /> };
            case 'REJECTED': return { label: 'বাতিল', color: 'bg-red-50 text-red-600 border-red-100', icon: <AlertCircle size={11} /> };
            default: return { label: status, color: 'bg-slate-50 text-slate-500 border-slate-100', icon: <AlertCircle size={11} /> };
        }
    };

    const fmt = (dateStr: string) => {
        const d = new Date(dateStr);
        return {
            date: d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
            time: d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
        };
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin text-[#045c84] mb-2" size={32} />
                <p className="text-slate-600 text-xs font-bold font-bengali">লোডিং করা হচ্ছে...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm font-bengali flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-[15px] font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-[#045c84] rounded-xl shadow-sm">
                        <ClipboardList size={18} />
                    </div>
                    <span>{title}</span>
                </h2>
                <div className="flex items-center gap-2">
                    {/* Select All / Deselect All */}
                    {pendingIds.size > 0 && (
                        <>
                            <button
                                onClick={allSelected ? deselectAll : selectAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all bg-slate-50 text-slate-600 border-slate-100 hover:border-[#045c84] hover:text-[#045c84]"
                            >
                                {allSelected ? <Square size={12} /> : <CheckSquare size={12} />}
                                {allSelected ? 'ডিসিলেক্ট' : 'সব সিলেক্ট'}
                            </button>
                        </>
                    )}
                    <button
                        onClick={fetchSubmissions}
                        className="text-[10px] font-black text-[#045c84] uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-blue-100"
                    >
                        রিফ্রেশ করুন
                    </button>
                </div>
            </div>

            {/* Bulk Action Bar — appears when items are selected */}
            <AnimatePresence>
                {someSelected && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 py-3 bg-[#045c84]/5 border-b border-[#045c84]/10 flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-[11px] font-black text-[#045c84] uppercase tracking-widest">
                                {selectedIds.size}টি সিলেক্ট করা হয়েছে
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleBulkAction('APPROVED')}
                                    disabled={isBulkProcessing}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-sm shadow-emerald-200"
                                >
                                    {isBulkProcessing ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                    সব গ্রহণ করুন
                                </button>
                                <button
                                    onClick={() => handleBulkAction('RETRY')}
                                    disabled={isBulkProcessing}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all disabled:opacity-50"
                                >
                                    <RefreshCw size={12} />
                                    রিট্রাই
                                </button>
                                <button
                                    onClick={() => handleBulkAction('REJECTED')}
                                    disabled={isBulkProcessing}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                                >
                                    <XCircle size={12} />
                                    সব বাতিল
                                </button>
                                <button
                                    onClick={deselectAll}
                                    className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    বাতিল
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List grouped by student */}
            <div className="flex-1 overflow-y-auto max-h-[520px] custom-scrollbar divide-y divide-slate-50">
                {submissions.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                            <ClipboardList size={32} />
                        </div>
                        <p className="text-slate-600 text-xs font-bold">এখনো কোনো ক্লাস ডাইরি জমা পড়েনি</p>
                    </div>
                ) : (
                    [...grouped.entries()].map(([studentId, { name, photo, items }]) => {
                        const pendingInGroup = items.filter(s => s.status === 'SUBMITTED');
                        const allStudentSelected = pendingInGroup.length > 0 && pendingInGroup.every(s => selectedIds.has(s.id));
                        const collapsed = collapsedStudents.has(studentId);

                        return (
                            <div key={studentId}>
                                {/* Student Group Header */}
                                <div className="px-5 py-2.5 bg-slate-50/80 flex items-center gap-3 sticky top-0 z-10 border-b border-slate-100">
                                    {/* Student select toggle */}
                                    {pendingInGroup.length > 0 && (
                                        <button
                                            onClick={() => selectStudent(studentId)}
                                            className="text-slate-300 hover:text-[#045c84] transition-colors"
                                            title={allStudentSelected ? 'ডিসিলেক্ট' : 'সব সিলেক্ট'}
                                        >
                                            {allStudentSelected
                                                ? <CheckSquare size={16} className="text-[#045c84]" />
                                                : <Square size={16} />}
                                        </button>
                                    )}
                                    {/* Avatar */}
                                    <div className="w-7 h-7 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                        {photo ? (
                                            <img src={photo} alt={name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-[#045c84]/10 flex items-center justify-center text-[#045c84] font-black text-[11px]">
                                                {name?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <p className="flex-1 text-[11px] font-black text-slate-700 uppercase tracking-widest">{name}</p>
                                    <span className="text-[9px] font-bold text-slate-600">{items.length}টি</span>
                                    <button onClick={() => toggleCollapse(studentId)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                        {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                                    </button>
                                </div>

                                {/* Student's submissions */}
                                <AnimatePresence initial={false}>
                                    {!collapsed && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {items.map(sub => {
                                                const statusInfo = getStatusInfo(sub.status);
                                                const isProcessing = processingId === sub.id;
                                                const isPending = sub.status === 'SUBMITTED';
                                                const isSelected = selectedIds.has(sub.id);

                                                // Date calculations
                                                const subDate = new Date(sub.submittedAt);
                                                const assignDate = new Date(sub.assignment.createdAt || sub.submittedAt);

                                                // Format submitted date/time
                                                const formattedDate = subDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' });
                                                const formattedTime = subDate.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                                                const dayName = subDate.toLocaleDateString('bn-BD', { weekday: 'long' });

                                                // Delay calculation
                                                const diffTime = subDate.getTime() - assignDate.getTime();
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                let delayText = '';
                                                let delayColor = '';

                                                if (diffDays <= 0) {
                                                    delayText = 'সময়মতো';
                                                    delayColor = 'text-emerald-600 bg-emerald-50 border-emerald-100';
                                                } else if (diffDays === 1) {
                                                    delayText = '১ দিন পর';
                                                    delayColor = 'text-amber-600 bg-amber-50 border-amber-100';
                                                } else {
                                                    delayText = `${diffDays} দিন পর`;
                                                    delayColor = 'text-red-500 bg-red-50 border-red-100';
                                                }

                                                return (
                                                    <div
                                                        key={sub.id}
                                                        onClick={() => openAssignmentDetails(sub.assignment, { selectedStudentId: sub.studentId })}
                                                        className={`group flex items-center gap-3 px-5 py-4 transition-all cursor-pointer hover:bg-blue-50/30 ${isSelected ? 'bg-blue-50/50 border-l-2 border-[#045c84]' : 'border-l-2 border-transparent'}`}
                                                    >
                                                        {/* Checkbox */}
                                                        <div
                                                            onClick={e => { e.stopPropagation(); if (isPending) toggleSelect(sub.id); }}
                                                            className={`shrink-0 ${isPending ? 'cursor-pointer' : 'opacity-20 cursor-not-allowed'}`}
                                                        >
                                                            {isSelected
                                                                ? <CheckSquare size={16} className="text-[#045c84]" />
                                                                : <Square size={16} className="text-slate-300" />}
                                                        </div>

                                                        {/* Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border flex items-center gap-1 ${statusInfo.color}`}>
                                                                    {statusInfo.icon} {statusInfo.label}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${delayColor}`}>
                                                                    {delayText}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-600 font-medium truncate flex items-center gap-1.5 mt-1">
                                                                <span className="text-[#045c84] font-bold">{sub.assignment.book?.name || 'ক্লাস ডাইরি'}</span>
                                                                <span className="opacity-30">•</span>
                                                                <span className="line-clamp-1">{sub.assignment.title}</span>
                                                            </p>
                                                        </div>

                                                        {/* Right: Date+Time & Actions */}
                                                        <div className="shrink-0 flex flex-col items-end gap-1.5" onClick={e => e.stopPropagation()}>
                                                            <div className="text-right">
                                                                <p className="text-[11px] font-bold text-slate-700 leading-none mb-1">{dayName}, {formattedDate}</p>
                                                                <p className="text-[9px] font-bold text-slate-600">{formattedTime}</p>
                                                            </div>

                                                            {isPending && (
                                                                <div className="flex items-center gap-1 mt-1">
                                                                    <button
                                                                        onClick={e => handleSingleAction(e, sub.id, 'APPROVED')}
                                                                        disabled={isProcessing}
                                                                        title="গ্রহণ করুন"
                                                                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-100 hover:border-emerald-500 transition-all disabled:opacity-40"
                                                                    >
                                                                        {isProcessing ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={12} />}
                                                                    </button>
                                                                    <button
                                                                        onClick={e => handleSingleAction(e, sub.id, 'RETRY')}
                                                                        disabled={isProcessing}
                                                                        title="রিট্রাই"
                                                                        className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white border border-amber-100 hover:border-amber-500 transition-all disabled:opacity-40"
                                                                    >
                                                                        <RefreshCw size={11} />
                                                                    </button>
                                                                    <button
                                                                        onClick={e => handleSingleAction(e, sub.id, 'REJECTED')}
                                                                        disabled={isProcessing}
                                                                        title="বাতিল করুন"
                                                                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 hover:border-red-500 transition-all disabled:opacity-40"
                                                                    >
                                                                        <XCircle size={12} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100">
                <a
                    href="/dashboard/assignments"
                    className="w-full h-11 flex items-center justify-center bg-slate-50 hover:bg-[#045c84] hover:text-white text-slate-600 rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] gap-2 group"
                >
                    সকল ক্লাস ডাইরি দেখুন
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
            </div>
        </div>
    );
}

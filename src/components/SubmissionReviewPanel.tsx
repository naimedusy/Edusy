'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2,
    XCircle,
    RefreshCw,
    ClipboardCheck,
    BookOpen,
    Users,
    Clock,
    Loader2,
    CheckCheck,
    RefreshCcw,
    School,
    User,
    ListChecks,
    ChevronDown,
    ChevronUp,
    Zap,
    CloudUpload,
    RotateCcw,
    Calendar,
    Search,
    SearchX
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

interface ReviewSubmission {
    id: string;
    status: string;
    submittedAt: string;
    student: { id: string; name: string; metadata?: any };
    assignment: {
        id: string;
        book?: { id: string; name: string };
        class?: { id: string; name: string };
        group?: { id: string; name: string };
        teacher?: { id: string; name: string };
        scheduledDate?: string;
    };
}

type ActionType = 'APPROVED' | 'REJECTED' | 'RETRY';
type ViewTab = 'class' | 'student' | 'subject';

const formatTime = (dateStr: string) => {
    const diffMins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diffMins < 1) return 'এইমাত্র';
    if (diffMins < 60) return `${diffMins}মি`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}ঘ`;
    return `${Math.floor(diffMins / 1440)}দি`;
};

const formatBengaliDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    const bnDigits: any = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' };
    const toBn = (n: number | string) => n.toString().split('').map(d => bnDigits[d] || d).join('');

    return `${toBn(day)}/${toBn(month)}`;
};

const getPhotoUrl = (s: ReviewSubmission) => s.student.metadata?.photo || null;
const getInitial = (s: ReviewSubmission) => s.student.name?.charAt(0)?.toUpperCase() || '?';

// Student Avatar
const Avatar = ({ sub, size = 9 }: { sub: ReviewSubmission; size?: number }) => (
    <div className={`w-${size} h-${size} rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm shrink-0`}>
        {getPhotoUrl(sub) ? (
            <img src={getPhotoUrl(sub)} alt={sub.student.name} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#045c84]/20 to-[#045c84]/5 flex items-center justify-center text-[#045c84] font-black text-[13px]">
                {getInitial(sub)}
            </div>
        )}
    </div>
);

// Selection Checkbox
const SelectionCheckbox = ({ sub, isSelected, onToggle }: { sub: ReviewSubmission; isSelected: boolean; onToggle: () => void }) => (
    <div
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${isSelected ? 'bg-[#045c84] border-[#045c84] text-white' : 'border-slate-200 bg-white hover:border-[#045c84]/50'
            }`}
    >
        {isSelected && <CheckCheck size={12} strokeWidth={4} />}
    </div>
);

// Action Buttons
interface ActionButtonsProps {
    sub: ReviewSubmission;
    processingId: string | null;
    actionDone?: ActionType;
    onAction: (id: string, action: ActionType | 'REVERT') => void;
}
const ActionButtons = ({ sub, processingId, actionDone, onAction }: ActionButtonsProps) => {
    const isProcessing = processingId === sub.id;
    if (actionDone) {
        const colorMap: Record<ActionType, string> = {
            APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            REJECTED: 'bg-red-50 text-red-500 border-red-100',
            RETRY: 'bg-amber-50 text-amber-600 border-amber-100'
        };
        const iconMap: Record<ActionType, React.ReactNode> = {
            APPROVED: <CheckCircle2 size={14} />,
            REJECTED: <XCircle size={14} />,
            RETRY: <RefreshCw size={14} />
        };
        return (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className={`p-1.5 rounded-lg border ${colorMap[actionDone]}`}>
                {iconMap[actionDone]}
            </motion.div>
        );
    }
    return (
        <div className="flex items-center gap-1 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onAction(sub.id, 'APPROVED'); }} disabled={isProcessing} title="গ্রহণ"
                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-100 disabled:opacity-40 shadow-sm">
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onAction(sub.id, 'RETRY'); }} disabled={isProcessing} title="রিট্রাই"
                className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white transition-all border border-amber-100 disabled:opacity-40 shadow-sm">
                <RefreshCw size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onAction(sub.id, 'REJECTED'); }} disabled={isProcessing} title="বাতিল"
                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100 disabled:opacity-40 shadow-sm">
                <XCircle size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onAction(sub.id, 'REVERT'); }} disabled={isProcessing} title="স্টুডেন্টকে ফেরত পাঠান"
                className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-500 hover:text-white transition-all border border-slate-100 disabled:opacity-40 shadow-sm">
                {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            </button>
        </div>
    );
};

// ─── VIEW: CLASS-WISE ──────────────────────────────────────────
interface ViewProps {
    submissions: ReviewSubmission[];
    expanded: Record<string, boolean>;
    setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    selectedIds: Set<string>;
    toggleSelection: (id: string) => void;
    toggleGroup: (ids: string[], forceSelect?: boolean) => void;
    processingId: string | null;
    justActioned: Record<string, ActionType>;
    onAction: (id: string, action: ActionType | 'REVERT') => void;
}

const ClassWiseView = ({ submissions, expanded, setExpanded, selectedIds, toggleSelection, toggleGroup, processingId, justActioned, onAction }: ViewProps) => {
    const groups: Record<string, { label: string; subs: ReviewSubmission[] }> = {};
    submissions.forEach(s => {
        const key = s.assignment.class?.id || 'unknown';
        if (!groups[key]) groups[key] = { label: s.assignment.class?.name || 'অজানা ক্লাস', subs: [] };
        groups[key].subs.push(s);
    });

    return (
        <div className="divide-y divide-slate-50">
            {Object.entries(groups).map(([key, group]) => {
                const expandKey = `cls-${key}`;
                const isOpen = expanded[expandKey] === true;
                const groupIds = group.subs.map(s => s.id);
                const allSelected = groupIds.every(id => selectedIds.has(id));
                const someSelected = groupIds.some(id => selectedIds.has(id)) && !allSelected;

                return (
                    <div key={key}>
                        <div className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors group cursor-pointer"
                            onClick={() => setExpanded(p => ({ ...p, [expandKey]: !isOpen }))}>
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleGroup(groupIds); }}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${allSelected ? 'bg-[#045c84] border-[#045c84] text-white' :
                                        someSelected ? 'bg-[#045c84]/20 border-[#045c84] text-[#045c84]' :
                                            'border-slate-200 bg-white hover:border-[#045c84]/50'
                                        }`}
                                >
                                    {allSelected && <CheckCheck size={12} strokeWidth={4} />}
                                    {someSelected && <div className="w-2.5 h-0.5 bg-[#045c84] rounded-full" />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-[#045c84]/10 flex items-center justify-center text-[#045c84]">
                                        <School size={14} />
                                    </div>
                                    <span className="text-[12px] font-black text-slate-700 uppercase tracking-widest">{group.label}</span>
                                    <span className="px-1.5 py-0.5 bg-[#045c84]/10 text-[#045c84] text-[9px] font-black rounded-full">{group.subs.length}</span>
                                </div>
                            </div>
                            {isOpen ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
                        </div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                    {group.subs.map(sub => (
                                        <motion.div key={sub.id} layout exit={{ opacity: 0, x: 40, height: 0 }}
                                            onClick={() => toggleSelection(sub.id)}
                                            className={`px-5 py-3 flex items-center gap-3 transition-colors border-t border-slate-50 cursor-pointer ${selectedIds.has(sub.id) ? 'bg-[#045c84]/5' : 'bg-slate-50/30 hover:bg-slate-50'
                                                }`}>
                                            <SelectionCheckbox sub={sub} isSelected={selectedIds.has(sub.id)} onToggle={() => toggleSelection(sub.id)} />
                                            <Avatar sub={sub} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-black text-slate-800 truncate">{sub.student.name}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <BookOpen size={9} className="text-[#045c84] shrink-0" />
                                                    <p className="text-[10px] font-bold text-[#045c84] truncate">{sub.assignment.book?.name || '—'}</p>
                                                    <span className="text-slate-200 text-[9px]">·</span>
                                                    <p className="text-[9px] text-amber-600 font-bold shrink-0">{formatBengaliDate(sub.assignment.scheduledDate)}</p>
                                                    <span className="text-slate-200 text-[9px]">·</span>
                                                    <p className="text-[9px] text-slate-400 font-bold shrink-0">{formatTime(sub.submittedAt)}</p>
                                                </div>
                                            </div>
                                            <ActionButtons sub={sub} processingId={processingId} actionDone={justActioned[sub.id]} onAction={onAction} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
};

// ─── VIEW: STUDENT-WISE ────────────────────────────────────────
const StudentWiseView = ({ submissions, expanded, setExpanded, selectedIds, toggleSelection, toggleGroup, processingId, justActioned, onAction }: ViewProps) => {
    const groups: Record<string, { label: string; meta: string; subs: ReviewSubmission[] }> = {};
    submissions.forEach(s => {
        const key = s.student.id;
        if (!groups[key]) groups[key] = {
            label: s.student.name,
            meta: s.assignment.class?.name || '',
            subs: []
        };
        groups[key].subs.push(s);
    });

    return (
        <div className="divide-y divide-slate-50">
            {Object.entries(groups).map(([key, group]) => {
                const expandKey = `stu-${key}`;
                const isOpen = expanded[expandKey] === true;
                const groupIds = group.subs.map(s => s.id);
                const allSelected = groupIds.every(id => selectedIds.has(id));
                const someSelected = groupIds.some(id => selectedIds.has(id)) && !allSelected;
                const firstSub = group.subs[0];

                return (
                    <div key={key}>
                        <div className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                            onClick={() => setExpanded(p => ({ ...p, [expandKey]: !isOpen }))}>
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleGroup(groupIds); }}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${allSelected ? 'bg-[#045c84] border-[#045c84] text-white' :
                                        someSelected ? 'bg-[#045c84]/20 border-[#045c84] text-[#045c84]' :
                                            'border-slate-200 bg-white hover:border-[#045c84]/50'
                                        }`}
                                >
                                    {allSelected && <CheckCheck size={12} strokeWidth={4} />}
                                    {someSelected && <div className="w-2.5 h-0.5 bg-[#045c84] rounded-full" />}
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <Avatar sub={firstSub} size={8} />
                                    <div className="text-left">
                                        <p className="text-[12px] font-black text-slate-800">{group.label}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{group.meta}</p>
                                    </div>
                                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded-full border border-amber-100">{group.subs.length} টাস্ক</span>
                                </div>
                            </div>
                            {isOpen ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
                        </div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                    {group.subs.map(sub => (
                                        <motion.div key={sub.id} layout exit={{ opacity: 0, x: 40, height: 0 }}
                                            onClick={() => toggleSelection(sub.id)}
                                            className={`px-5 py-2.5 flex items-center gap-3 border-t border-slate-50 transition-colors cursor-pointer ${selectedIds.has(sub.id) ? 'bg-[#045c84]/5' : 'bg-slate-50/40 hover:bg-slate-50'
                                                }`}>
                                            <SelectionCheckbox sub={sub} isSelected={selectedIds.has(sub.id)} onToggle={() => toggleSelection(sub.id)} />
                                            <div className="w-7 h-7 rounded-lg bg-[#045c84]/8 flex items-center justify-center text-[#045c84] shrink-0">
                                                <BookOpen size={13} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black text-slate-700 truncate">{sub.assignment.book?.name || 'ক্লাস ডাইরি'}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <p className="text-[9px] text-amber-600 font-bold shrink-0">{formatBengaliDate(sub.assignment.scheduledDate)}</p>
                                                    <span className="text-slate-200 text-[9px]">·</span>
                                                    <Clock size={9} className="text-slate-300" />
                                                    <p className="text-[9px] text-slate-400 font-bold">{formatTime(sub.submittedAt)}</p>
                                                </div>
                                            </div>
                                            <ActionButtons sub={sub} processingId={processingId} actionDone={justActioned[sub.id]} onAction={onAction} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
};

// ─── VIEW: SUBJECT-WISE (by book) ─────────────────────────────
const SubjectWiseView = ({ submissions, expanded, setExpanded, selectedIds, toggleSelection, toggleGroup, processingId, justActioned, onAction }: ViewProps) => {
    const groups: Record<string, { label: string; subs: ReviewSubmission[] }> = {};
    submissions.forEach(s => {
        const key = s.assignment.book?.id || 'unknown';
        if (!groups[key]) groups[key] = { label: s.assignment.book?.name || 'অজানা বিষয়', subs: [] };
        groups[key].subs.push(s);
    });

    return (
        <div className="divide-y divide-slate-50">
            {Object.entries(groups).map(([key, group]) => {
                const expandKey = `sbj-${key}`;
                const isOpen = expanded[expandKey] === true;
                const groupIds = group.subs.map(s => s.id);
                const allSelected = groupIds.every(id => selectedIds.has(id));
                const someSelected = groupIds.some(id => selectedIds.has(id)) && !allSelected;

                return (
                    <div key={key}>
                        <div className="w-full px-5 py-3 flex items-center justify-between hover:bg-slate-50/70 transition-colors cursor-pointer"
                            onClick={() => setExpanded(p => ({ ...p, [expandKey]: !isOpen }))}>
                            <div className="flex items-center gap-3">
                                <div
                                    onClick={(e) => { e.stopPropagation(); toggleGroup(groupIds); }}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${allSelected ? 'bg-[#045c84] border-[#045c84] text-white' :
                                        someSelected ? 'bg-[#045c84]/20 border-[#045c84] text-[#045c84]' :
                                            'border-slate-200 bg-white hover:border-[#045c84]/50'
                                        }`}
                                >
                                    {allSelected && <CheckCheck size={12} strokeWidth={4} />}
                                    {someSelected && <div className="w-2.5 h-0.5 bg-[#045c84] rounded-full" />}
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <ListChecks size={14} />
                                    </div>
                                    <span className="text-[12px] font-black text-slate-700">{group.label}</span>
                                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full border border-emerald-100">{group.subs.length} জন</span>
                                </div>
                            </div>
                            {isOpen ? <ChevronUp size={14} className="text-slate-300" /> : <ChevronDown size={14} className="text-slate-300" />}
                        </div>
                        <AnimatePresence>
                            {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                    {group.subs.map(sub => (
                                        <motion.div key={sub.id} layout exit={{ opacity: 0, x: 40, height: 0 }}
                                            onClick={() => toggleSelection(sub.id)}
                                            className={`px-5 py-3 flex items-center gap-3 border-t border-slate-50 transition-colors cursor-pointer ${selectedIds.has(sub.id) ? 'bg-[#045c84]/5' : 'bg-slate-50/30 hover:bg-slate-50'
                                                }`}>
                                            <SelectionCheckbox sub={sub} isSelected={selectedIds.has(sub.id)} onToggle={() => toggleSelection(sub.id)} />
                                            <Avatar sub={sub} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-black text-slate-800 truncate">{sub.student.name}</p>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <School size={9} className="text-slate-400 shrink-0" />
                                                    <p className="text-[10px] font-bold text-slate-400 truncate">{sub.assignment.class?.name || '—'}</p>
                                                    <span className="text-slate-200 text-[9px]">·</span>
                                                    <p className="text-[9px] text-amber-600 font-bold shrink-0">{formatBengaliDate(sub.assignment.scheduledDate)}</p>
                                                    <span className="text-slate-200 text-[9px]">·</span>
                                                    <Clock size={9} className="text-slate-300 shrink-0" />
                                                    <p className="text-[9px] text-slate-400 font-bold">{formatTime(sub.submittedAt)}</p>
                                                </div>
                                            </div>
                                            <ActionButtons sub={sub} processingId={processingId} actionDone={justActioned[sub.id]} onAction={onAction} />
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
};

export default function SubmissionReviewPanel() {
    const { user, activeInstitute, activeRole } = useSession();
    const [submissions, setSubmissions] = useState<ReviewSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [justActioned, setJustActioned] = useState<Record<string, ActionType>>({});
    const [viewTab, setViewTab] = useState<ViewTab>('class');
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const [isForceProcessing, setIsForceProcessing] = useState(false);
    const [showForceMenu, setShowForceMenu] = useState(false);
    const [selectedForceDate, setSelectedForceDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchQuery, setSearchQuery] = useState('');

    const isTeacher = activeRole === 'TEACHER';
    const isAdmin = activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN';

    const fetchSubmissions = useCallback(async () => {
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            let url = `/api/submissions/review?instituteId=${activeInstitute.id}`;
            if (isTeacher && user?.id) url += `&teacherId=${user.id}`;
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSubmissions(data);
            }
        } catch (err) {
            console.error('Review fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [activeInstitute?.id, user?.id, isTeacher]);

    useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

    const filteredSubmissions = submissions.filter(s => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const studentName = s.student.name?.toLowerCase() || '';
        const roll = (s.student.metadata?.roll || '').toString().toLowerCase();
        return studentName.includes(q) || roll.includes(q);
    });

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleGroup = (ids: string[], forceSelect?: boolean) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            const allInGroupSelected = ids.every(id => next.has(id));
            const shouldSelect = forceSelect !== undefined ? forceSelect : !allInGroupSelected;

            ids.forEach(id => {
                if (shouldSelect) next.add(id);
                else next.delete(id);
            });
            return next;
        });
    };

    const handleAction = async (submissionId: string, action: ActionType | 'REVERT') => {
        setProcessingId(submissionId);
        try {
            const body = action === 'REVERT'
                ? { id: submissionId, action: 'REVERT' }
                : { id: submissionId, status: action };

            const res = await fetch('/api/submissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            if (res.ok) {
                // For visual feedback, use 'RETRY' colors for REVERT during the brief delay
                const displayAction = action === 'REVERT' ? 'RETRY' : action;
                setJustActioned(prev => ({ ...prev, [submissionId]: displayAction as ActionType }));
                setTimeout(() => {
                    setSubmissions(prev => prev.filter(s => s.id !== submissionId));
                    setJustActioned(prev => { const n = { ...prev }; delete n[submissionId]; return n; });
                    setSelectedIds(prev => {
                        const next = new Set(prev);
                        next.delete(submissionId);
                        return next;
                    });
                }, 1200);
            }
        } catch (err) {
            console.error('Action error:', err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleBulkAction = async (action: ActionType | 'REVERT') => {
        if (selectedIds.size === 0) return;
        setIsBulkProcessing(true);
        const idsArray = Array.from(selectedIds);
        try {
            const body = action === 'REVERT'
                ? { ids: idsArray, action: 'REVERT' }
                : { ids: idsArray, status: action };

            const res = await fetch('/api/submissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                // Show success for all
                const newActioned = { ...justActioned };
                const displayAction = action === 'REVERT' ? 'RETRY' : action; // Visual fallback for temporary actioned state
                idsArray.forEach(id => { newActioned[id] = displayAction as ActionType; });
                setJustActioned(newActioned);

                setTimeout(() => {
                    setSubmissions(prev => prev.filter(s => !selectedIds.has(s.id)));
                    setJustActioned(prev => {
                        const n = { ...prev };
                        idsArray.forEach(id => delete n[id]);
                        return n;
                    });
                    setSelectedIds(new Set());
                }, 1200);
            }
        } catch (err) {
            console.error('Bulk action error:', err);
        } finally {
            setIsBulkProcessing(false);
        }
    };

    const handleForceSubmit = async (sDate?: string, eDate?: string) => {
        if (!activeInstitute?.id) return;
        setIsForceProcessing(true);
        setShowForceMenu(false);
        try {
            let url = `/api/submissions/force?instituteId=${activeInstitute.id}`;
            if (isTeacher && user?.id) url += `&teacherId=${user.id}`;
            if (sDate) url += `&startDate=${sDate}`;
            if (eDate) url += `&endDate=${eDate}`;

            const res = await fetch(url, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                // Optionally show a toast or message about how many were created
                fetchSubmissions();
            }
        } catch (err) {
            console.error('Force submit error:', err);
        } finally {
            setIsForceProcessing(false);
        }
    };

    const sharedProps: ViewProps = {
        submissions: filteredSubmissions,
        expanded,
        setExpanded,
        selectedIds,
        toggleSelection,
        toggleGroup,
        processingId,
        justActioned,
        onAction: handleAction
    };

    // Tab definitions
    const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
        { id: 'class', label: 'ক্লাস', icon: <School size={13} /> },
        { id: 'student', label: 'শিক্ষার্থী', icon: <User size={13} /> },
        { id: 'subject', label: 'বিষয়', icon: <BookOpen size={13} /> },
    ];

    return (
        <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-slate-100 flex flex-col">
                <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#045c84]/10 flex items-center justify-center text-[#045c84]">
                            <ClipboardCheck size={18} />
                        </div>
                        <div>
                            <h2 className="text-[14px] font-black text-slate-800 tracking-tight">জমা পর্যালোচনা</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {loading ? '...' : `${filteredSubmissions.length}${searchQuery ? 'টি ফলাফল' : 'টি পেন্ডিং'}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {(isAdmin || isTeacher) && (
                            <div className="relative">
                                <button onClick={() => setShowForceMenu(!showForceMenu)} disabled={isForceProcessing || loading}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-600 transition-all border border-amber-100 disabled:opacity-50 font-black text-[10px] uppercase tracking-widest"
                                    title="বাকিদের জমা গ্রহণ করুন">
                                    {isForceProcessing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                                    <span className="hidden sm:inline">ফোর্স সাবমিট</span>
                                    <ChevronDown size={12} className={showForceMenu ? 'rotate-180 transition-transform' : 'transition-transform'} />
                                </button>

                                <AnimatePresence>
                                    {showForceMenu && (
                                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                                            <div className="px-3 py-1.5 mb-1 border-b border-slate-50">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">সময় বেছে নিন</p>
                                            </div>
                                            <button onClick={() => {
                                                const today = new Date().toISOString().split('T')[0];
                                                handleForceSubmit(today, today);
                                            }} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                আজকের জন্য
                                            </button>
                                            <button onClick={() => {
                                                const yest = new Date();
                                                yest.setDate(yest.getDate() - 1);
                                                const d = yest.toISOString().split('T')[0];
                                                handleForceSubmit(d, d);
                                            }} className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                গতকালের জন্য
                                            </button>
                                            <div className="px-3 py-2 border-t border-slate-50 mt-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">নির্ধারিত দিন</p>
                                                <div className="flex items-center gap-1.5">
                                                    <input type="date" value={selectedForceDate} onChange={(e) => setSelectedForceDate(e.target.value)}
                                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-bold outline-none focus:border-amber-300 transition-colors" />
                                                    <button onClick={() => handleForceSubmit(selectedForceDate, selectedForceDate)}
                                                        className="p-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm shadow-amber-200">
                                                        <Calendar size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        <button onClick={fetchSubmissions} disabled={loading}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-[#045c84] hover:text-white text-slate-400 transition-all border border-slate-100 disabled:opacity-50"
                            title="রিফ্রেশ">
                            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Search Bar Row */}
                <div className="px-5 pb-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#045c84] transition-colors">
                            <Search size={16} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="শিক্ষার্থী বা রোল দিয়ে খুঁজুন..."
                            className="w-full bg-slate-50/50 border border-slate-100 rounded-[20px] py-3 pl-11 pr-10 text-[12px] font-bold text-slate-700 outline-none focus:bg-white focus:border-[#045c84]/30 focus:ring-8 focus:ring-[#045c84]/5 transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-3 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                <SearchX size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* View Tabs */}
            <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 border-b border-slate-100 relative overflow-hidden">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setViewTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex-1 justify-center ${viewTab === tab.id
                            ? 'bg-[#045c84] text-white shadow-md shadow-[#045c84]/20'
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                            }`}>
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}

                {/* Floating Bulk Bar */}
                <AnimatePresence>
                    {selectedIds.size > 0 && (
                        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
                            className="absolute inset-0 bg-white flex items-center justify-between px-4 z-20">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedIds(new Set())}
                                    className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                                    <XCircle size={14} />
                                </button>
                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                    {selectedIds.size}টি সিলেক্ট
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleBulkAction('APPROVED')} disabled={isBulkProcessing} title="সব গ্রহণ"
                                    className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50">
                                    {isBulkProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                                </button>
                                <button onClick={() => handleBulkAction('RETRY')} disabled={isBulkProcessing} title="সব রিট্রাই"
                                    className="p-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-all shadow-sm disabled:opacity-50">
                                    <RefreshCw size={13} />
                                </button>
                                <button onClick={() => handleBulkAction('REJECTED')} disabled={isBulkProcessing} title="সব বাতিল"
                                    className="p-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm disabled:opacity-50">
                                    <XCircle size={13} />
                                </button>
                                <button onClick={() => handleBulkAction('REVERT' as any)} disabled={isBulkProcessing} title="সব ফেরত পাঠান"
                                    className="p-2 rounded-xl bg-slate-600 text-white hover:bg-slate-700 transition-all shadow-sm disabled:opacity-50">
                                    <RotateCcw size={13} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="py-14 text-center">
                        <Loader2 className="animate-spin text-[#045c84] mx-auto mb-3" size={26} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">লোড হচ্ছে...</p>
                    </div>
                ) : filteredSubmissions.length === 0 ? (
                    <div className="py-14 text-center">
                        <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3">
                            <Search size={26} className="text-slate-300" />
                        </div>
                        <h3 className="text-sm font-black text-slate-600 mb-1">কোনো ফলাফল পাওয়া যায়নি</h3>
                        <p className="text-[10px] font-bold text-slate-400">আপনার অনুসন্ধানটি আবার চেক করুন</p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div key={viewTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                            {viewTab === 'class' && <ClassWiseView {...sharedProps} />}
                            {viewTab === 'student' && <StudentWiseView {...sharedProps} />}
                            {viewTab === 'subject' && <SubjectWiseView {...sharedProps} />}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>

            {/* Footer */}
            {!loading && submissions.length > 0 && (
                <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                            {submissions.length}টি পেন্ডিং
                        </p>
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-slate-200 text-[10px]">|</span>
                                <p className="text-[9px] font-black text-[#045c84] uppercase tracking-widest animate-pulse">
                                    {selectedIds.size}টি সিলেক্টেড
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1 text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> গ্রহণ</span>
                        <span className="flex items-center gap-1 text-amber-500"><div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> রিট্রাই</span>
                        <span className="flex items-center gap-1 text-red-500"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> বাতিল</span>
                    </div>
                </div>
            )}
        </div>
    );
}

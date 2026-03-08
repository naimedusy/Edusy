'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useSession } from '@/components/SessionProvider';
import {
    X,
    Calendar,
    BookOpen,
    User,
    Clock,
    FileText,
    Users,
    Loader2,
    Paperclip,
    Pin,
    RotateCcw,
    MessageCircle,
    Check,
    ClipboardList,
    PenTool,
    TrendingUp,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Send,
    ShieldCheck
} from 'lucide-react';
import dynamic from 'next/dynamic';

const FaceVerificationOverlay = dynamic(() => import('./FaceVerificationOverlay'), { ssr: false });

interface AssignmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignments: any[];
    onRelease?: (assignmentId: string, e: React.MouseEvent) => Promise<void>;
    onEdit?: (assignment: any) => void;
    onRevert?: (assignment: any) => void;
    isReleasing?: boolean;
    selectedStudentId?: string;
    canEdit?: boolean;
    initialIndex?: number;
}

export default function AssignmentDetailsModal({
    isOpen,
    onClose,
    assignments = [],
    onRelease,
    onEdit,
    onRevert,
    isReleasing,
    selectedStudentId,
    canEdit = true,
    initialIndex = 0
}: AssignmentDetailsModalProps) {
    const { user, activeInstitute } = useSession();
    const isStudent = user?.role === 'STUDENT';
    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const activeAssignment = assignments[activeIndex] || assignments[0];

    useEffect(() => {
        if (isOpen) {
            setActiveIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    const [students, setStudents] = React.useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = React.useState(false);
    const [submission, setSubmission] = React.useState<any>(null);
    const [completingTaskId, setCompletingTaskId] = React.useState<string | null>(null);
    const notificationTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const [hasMounted, setHasMounted] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});
    const [activeMessageTaskId, setActiveMessageTaskId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const [sentSuccessTaskId, setSentSuccessTaskId] = useState<string | null>(null);
    const [isFaceVerifyOpen, setIsFaceVerifyOpen] = useState(false);
    const [verifiedAssignmentIds, setVerifiedAssignmentIds] = useState<Set<string>>(new Set());
    const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    // Reset index and expand all sections when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveIndex(0);
        }
    }, [isOpen]);

    // Initialize expanded sections when active assignment changes
    useEffect(() => {
        if (activeAssignment?.id) {
            setExpandedSections({});
        }
    }, [activeAssignment?.id]);

    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (activeAssignment?.id) {
                if (user?.role === 'STUDENT') {
                    fetchSubmission();
                } else {
                    if (activeAssignment.classId) {
                        fetchStudents();
                    }
                }
            }
        } else {
            document.body.style.overflow = 'unset';
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, activeAssignment?.id, user?.role, activeInstitute?.id]);

    const fetchSubmission = async () => {
        const targetStudentId = selectedStudentId || user?.id;
        if (!activeAssignment?.id || !targetStudentId) return;
        try {
            const res = await fetch(`/api/submissions?assignmentId=${activeAssignment.id}&studentId=${targetStudentId}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setSubmission(data[0]);
            } else {
                setSubmission(null);
            }
        } catch (error) {
            console.error('Failed to fetch submission:', error);
        }
    };

    const fetchStudents = async () => {
        if (!activeAssignment?.classId || !activeInstitute?.id) return;
        setLoadingStudents(true);
        try {
            const res = await fetch(`/api/admin/users?instituteId=${activeInstitute?.id}&role=STUDENT&classId=${activeAssignment.classId}`);
            const data = await res.json();
            if (Array.isArray(data)) setStudents(data);
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleToggleTask = async (taskId: string) => {
        const targetStudentId = selectedStudentId || user?.id;
        if (!targetStudentId || !activeAssignment) return;

        const isCurrentlyDone = submission?.taskProgress?.[taskId]?.status === 'DONE';

        // If mandatory face verify is on and student hasn't verified yet for this assignment
        if (isStudent && activeAssignment.requireFaceVerify && !verifiedAssignmentIds.has(activeAssignment.id) && !isCurrentlyDone) {
            setPendingTaskId(taskId);
            setIsFaceVerifyOpen(true);
            return;
        }

        const nextStatus = !isCurrentlyDone;

        // Optimistic UI Update
        const previousSubmission = submission;
        const newSubmission = {
            ...(submission || { assignmentId: activeAssignment.id, studentId: targetStudentId }),
            taskProgress: {
                ...(submission?.taskProgress || {}),
                [taskId]: {
                    status: nextStatus ? 'DONE' : 'PENDING',
                    completed: nextStatus,
                    submittedAt: new Date().toISOString()
                }
            }
        };
        setSubmission(newSubmission);
        setCompletingTaskId(taskId);

        try {
            // Immediate save to DB without notification
            await fetch('/api/submissions/mark-done', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: activeAssignment.id,
                    studentId: targetStudentId,
                    taskId,
                    completed: nextStatus,
                    skipNotification: true
                })
            });

            // Debounced notification
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
            notificationTimerRef.current = setTimeout(async () => {
                await fetch('/api/submissions/mark-done', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assignmentId: activeAssignment.id,
                        studentId: targetStudentId,
                        taskId,
                        completed: nextStatus,
                        skipNotification: false
                    })
                });
            }, 60000);

        } catch (error) {
            setSubmission(previousSubmission);
            console.error('Toggle task error:', error);
        } finally {
            setCompletingTaskId(null);
        }
    };

    if (!isOpen || !hasMounted || !activeAssignment) return null;

    // Parse tasks
    let taskGroups: any[] = [];
    try {
        const data = JSON.parse(activeAssignment?.description || '{}');
        if (data.version === '2.0' && data.sections) {
            taskGroups = data.sections.map((section: any) => ({
                ...section,
                tasks: (section.tasks || []).filter((t: any) => {
                    const hasText = t.text && t.text.trim().length > 0;
                    const hasSegments = t.segments && t.segments.some((s: any) => s.value && s.value.trim().length > 0);
                    return hasText || hasSegments;
                })
            })).filter((s: any) => s.tasks.length > 0);
        }
    } catch (e) { }

    const date = new Date(activeAssignment.createdAt);
    const dayNameBangla = date.toLocaleDateString('bn-BD', { weekday: 'long' });
    const TAG_TRANSLATIONS: Record<string, string> = {
        'READ': 'পড়ুন',
        'MEANING': 'অর্থ',
        'LESSON': 'পাঠ',
        'CHAPTER': 'অধ্যায়',
        'EXERCISE': 'অনুশীলনী',
        'QA': 'প্রশ্ন-উত্তর',
        'PAGE': 'পৃষ্ঠা'
    };

    const SECTION_STYLES: Record<string, { color: string, border: string, dot: string }> = {
        'CLASSWORK': { color: 'text-blue-700', border: 'border-blue-700', dot: 'bg-blue-700' },
        'PREPARATION': { color: 'text-indigo-700', border: 'border-indigo-700', dot: 'bg-indigo-700' },
        'HOMEWORK': { color: 'text-orange-700', border: 'border-orange-700', dot: 'bg-orange-700' },
        'COMMENTS': { color: 'text-slate-700', border: 'border-slate-700', dot: 'bg-slate-700' }
    };

    const dateBangla = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' });

    const getDelayInfo = (submittedAtStr: string, deadlineStr?: string) => {
        if (!deadlineStr || !submittedAtStr) return null;
        const submittedAt = new Date(submittedAtStr);
        const deadline = new Date(deadlineStr);

        // Normalize to dates to ignore precise time differences for day count
        const sDate = new Date(submittedAt.getFullYear(), submittedAt.getMonth(), submittedAt.getDate());
        const dDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());

        const diffTime = sDate.getTime() - dDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) return { delay: 0, text: 'সময়মত' };

        const bnDays = diffDays.toLocaleString('bn-BD');
        return { delay: diffDays, text: `${bnDays} দিন বিলম্বে` };
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-0 md:p-6 animate-fade-in overflow-hidden">
            {/* Bright, Airy Glass Background */}
            <div
                className="absolute inset-0 bg-white/40 backdrop-blur-xl transition-all duration-700"
                onClick={onClose}
            />

            {/* Container */}
            <div className="w-full h-full md:max-w-6xl md:max-h-[850px] bg-white/95 backdrop-blur-3xl md:rounded-[48px] border-2 border-white shadow-2xl overflow-hidden flex flex-col relative animate-scale-in">

                {/* Close Button - Moved to Top-Right Corner */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 z-50 w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-white transition-all flex items-center justify-center border border-slate-200 active:scale-90 shadow-sm"
                >
                    <X size={24} />
                </button>

                {/* Header Section */}
                <div className="p-8 pb-4 shrink-0 bg-white border-b border-slate-100">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-6">
                            <div>
                                <h2 className="text-[36px] font-black text-black leading-none tracking-tight">
                                    {dayNameBangla}
                                </h2>
                                <div className="flex items-center gap-2 mt-3">
                                    <Calendar size={14} className="text-blue-700" />
                                    <p className="text-[14px] font-bold text-slate-600">
                                        {dateBangla}
                                    </p>
                                </div>
                            </div>

                            {/* Integrated Teacher & Deadline Info */}
                            <div className="h-10 w-px bg-slate-100 hidden md:block" />

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-6 h-6 rounded-full bg-[#045c84] text-white flex items-center justify-center text-[10px] font-bold">
                                        {activeAssignment.teacher?.name?.charAt(0)}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-600 truncate max-w-[100px]">
                                        {activeAssignment.teacher?.name}
                                    </span>
                                </div>

                                {activeAssignment.deadline && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-2xl border border-orange-100">
                                        <Clock size={12} className="text-orange-500" />
                                        <span className="text-[11px] font-bold text-orange-700">
                                            {new Date(activeAssignment.deadline).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Subject Tabs */}
                    <div className="flex gap-2 p-1.5 bg-slate-50/50 rounded-full border border-slate-100 overflow-x-auto no-scrollbar">
                        {assignments.map((a, idx) => (
                            <button
                                key={a.id}
                                onClick={() => setActiveIndex(idx)}
                                className={`px-6 py-2.5 rounded-full text-[15px] font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeIndex === idx ? 'bg-[#005c8d] text-white shadow-lg shadow-[#005c8d]/20 scale-105' : 'text-[#005c8d] hover:bg-white/50'}`}
                            >
                                <BookOpen size={16} />
                                {a.book?.name || a.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area - Full Width Single Column */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 py-6" data-lenis-prevent>
                    <div className="w-full space-y-3">
                        {/* Print-Style Content - High Density */}
                        <div className="space-y-3">
                            {taskGroups.length > 0 ? taskGroups.map((group, groupIdx) => {
                                const sectionType = (group.title.match(/\((CLASSWORK|PREPARATION|HOMEWORK|COMMENTS)\)/i)?.[1] || 'CLASSWORK').toUpperCase();
                                const style = SECTION_STYLES[sectionType] || SECTION_STYLES.CLASSWORK;

                                return (
                                    <div key={groupIdx} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                        {/* Minimal Header - Expandable */}
                                        <button
                                            onClick={() => setExpandedSections(prev => ({ ...prev, [groupIdx]: !prev[groupIdx] === false ? false : !prev[groupIdx] }))}
                                            className="w-full bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-5 ${style.dot} rounded-full`} />
                                                <h5 className={`text-[16px] font-black ${style.color} uppercase tracking-[0.1em]`}>
                                                    {group.title.replace(/\((CLASSWORK|PREPARATION|HOMEWORK|COMMENTS)\)/gi, '').trim()}
                                                </h5>
                                            </div>
                                            {expandedSections[groupIdx] !== false ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                        </button>

                                        {/* Density Adjusted Rows - Collapsible */}
                                        <AnimatePresence>
                                            {expandedSections[groupIdx] !== false && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="divide-y divide-slate-100">
                                                        {group.tasks.map((task: any, taskIdx: number) => {
                                                            const taskId = `${groupIdx}-${taskIdx}`;
                                                            const isDone = submission?.taskProgress?.[taskId]?.status === 'DONE';
                                                            const isCompleting = completingTaskId === taskId;

                                                            return (
                                                                <React.Fragment key={taskId}>
                                                                    <div
                                                                        onClick={() => isStudent && handleToggleTask(taskId)}
                                                                        className={`flex items-start gap-4 py-3 px-4 transition-all cursor-pointer ${isDone ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}
                                                                    >
                                                                        {isStudent && (
                                                                            <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isDone ? 'bg-blue-800 border-blue-800 text-white' : 'border-slate-300 bg-white'}`}>
                                                                                {isCompleting ? <Loader2 size={10} className="animate-spin" /> : isDone ? <Check size={12} strokeWidth={4} /> : null}
                                                                            </div>
                                                                        )}

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className={`text-[15px] font-bold leading-normal ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                                                {task.segments?.map((seg: any) => (
                                                                                    <span key={seg.id} className={seg.type === 'tag' ? `inline-block text-[15px] text-slate-500 font-black mr-2` : ''}>
                                                                                        {seg.type === 'tag' ? (TAG_TRANSLATIONS[seg.value.toUpperCase()] || seg.value) : seg.value}
                                                                                    </span>
                                                                                )) || <span>{task.text}</span>}
                                                                            </div>
                                                                            {isDone && submission?.taskProgress?.[taskId]?.submittedAt && (
                                                                                <div className="mt-1 flex items-center gap-2 text-[10px] font-bold">
                                                                                    <span className="text-slate-400">
                                                                                        {new Date(submission.taskProgress[taskId].submittedAt).toLocaleDateString('bn-BD', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                                    </span>
                                                                                    {(() => {
                                                                                        const delayInfo = getDelayInfo(submission.taskProgress[taskId].submittedAt, activeAssignment.deadline);
                                                                                        if (!delayInfo) return null;
                                                                                        return (
                                                                                            <span className={delayInfo.delay > 0 ? 'text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md' : 'text-emerald-500'}>
                                                                                                {delayInfo.text}
                                                                                            </span>
                                                                                        );
                                                                                    })()}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {isStudent && (
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    if (activeMessageTaskId === taskId) {
                                                                                        setActiveMessageTaskId(null);
                                                                                        setMessageText('');
                                                                                    } else {
                                                                                        setActiveMessageTaskId(taskId);
                                                                                    }
                                                                                }}
                                                                                className={`shrink-0 p-1.5 rounded-lg transition-all ${activeMessageTaskId === taskId ? 'text-blue-600 bg-blue-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
                                                                                title={`Message ${activeAssignment.teacher?.role === 'SUPER_ADMIN' || activeAssignment.teacher?.role === 'ADMIN' ? (activeAssignment.book?.name + ' Teacher') : (activeAssignment.teacher?.name || 'Teacher')} about this task`}
                                                                            >
                                                                                <MessageCircle size={16} />
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {/* Inline Message Form */}
                                                                    <AnimatePresence>
                                                                        {activeMessageTaskId === taskId && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                className="px-4 pb-3"
                                                                            >
                                                                                <div className="flex items-center gap-2 bg-white p-1 pr-2 relative min-h-[44px]">
                                                                                    {sentSuccessTaskId === taskId ? (
                                                                                        <motion.div
                                                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                                                            animate={{ scale: 1, opacity: 1 }}
                                                                                            className="flex items-center gap-2 px-4 py-1.5 w-full bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100/50"
                                                                                        >
                                                                                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200">
                                                                                                <Check size={12} strokeWidth={4} />
                                                                                            </div>
                                                                                            <span className="text-[13px] font-black uppercase tracking-widest">Message Sent Successfully!</span>
                                                                                        </motion.div>
                                                                                    ) : (
                                                                                        <>
                                                                                            <input
                                                                                                type="text"
                                                                                                placeholder={`Message ${activeAssignment.teacher?.role === 'SUPER_ADMIN' || activeAssignment.teacher?.role === 'ADMIN' ? (activeAssignment.book?.name + ' Teacher') : (activeAssignment.teacher?.name || 'Teacher')}...`}
                                                                                                className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none text-[13px] px-3 py-1.5 text-black placeholder:text-slate-400 font-bold shadow-none disabled:opacity-50"
                                                                                                value={messageText}
                                                                                                onChange={(e) => setMessageText(e.target.value)}
                                                                                                autoFocus
                                                                                                disabled={isSendingMessage}
                                                                                            />
                                                                                            <button
                                                                                                className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:bg-slate-300"
                                                                                                disabled={!messageText.trim() || isSendingMessage}
                                                                                                onClick={async () => {
                                                                                                    setIsSendingMessage(true);
                                                                                                    // Simulate API call
                                                                                                    setTimeout(() => {
                                                                                                        setIsSendingMessage(false);
                                                                                                        setSentSuccessTaskId(taskId);
                                                                                                        setMessageText('');

                                                                                                        // Close form after success
                                                                                                        setTimeout(() => {
                                                                                                            setSentSuccessTaskId(null);
                                                                                                            setActiveMessageTaskId(null);
                                                                                                        }, 2000);
                                                                                                    }, 800);
                                                                                                }}
                                                                                            >
                                                                                                {isSendingMessage ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            }) : (
                                <div className="p-20 text-center bg-slate-50/50 rounded-[48px] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-4">
                                    <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-slate-200 shadow-sm">
                                        <ClipboardList size={32} />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">কোনো তথ‍্য পাওয়া যায়নি</p>
                                </div>
                            )}
                        </div>

                        {/* Resources Section (integrated) */}
                        {activeAssignment.resources?.length > 0 && (
                            <div className="pt-10 border-t border-slate-100 space-y-6">
                                <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#045c84]/40" />
                                    রিসোর্স ফাইল
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeAssignment.resources.map((res: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-4 p-4 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 group shadow-sm"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-[#045c84] group-hover:text-white transition-colors">
                                                <Paperclip size={18} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-sm font-bold text-slate-700 block truncate">{res.name}</span>
                                                <span className="text-[9px] font-black text-[#045c84] uppercase tracking-tighter">ডাউনলোড</span>
                                            </div>
                                            <ChevronRight size={14} className="ml-auto text-slate-300 group-hover:text-[#045c84] transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer / Actions */}
                {!isStudent && canEdit && (
                    <div className="p-8 pt-0 flex gap-4 shrink-0 bg-white/10 backdrop-blur-sm">
                        <button
                            onClick={() => onEdit?.(activeAssignment)}
                            className="flex-1 py-5 bg-[#045c84] text-white rounded-[28px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-blue-900/30 hover:bg-[#034a6b] transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <PenTool size={18} />
                            এডিট করুন (EDIT)
                        </button>
                        <button
                            onClick={() => onRevert?.(activeAssignment)}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-[28px] bg-red-50 text-red-500 border-2 border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-xl active:scale-90"
                            title="প্রত্যাহার করুন"
                        >
                            <RotateCcw size={28} />
                        </button>
                    </div>
                )}
            </div>
            {/* Face Verification Overlay */}
            <FaceVerificationOverlay
                isOpen={isFaceVerifyOpen}
                onClose={() => {
                    setIsFaceVerifyOpen(false);
                    setPendingTaskId(null);
                }}
                onVerifySuccess={() => {
                    setVerifiedAssignmentIds(prev => new Set(prev).add(activeAssignment.id));
                    setIsFaceVerifyOpen(false);
                    if (pendingTaskId) {
                        handleToggleTask(pendingTaskId);
                        setPendingTaskId(null);
                    }
                }}
                studentName={user?.name || ''}
                studentFaceDescriptor={user?.faceDescriptor || []}
            />
        </div>,
        document.body
    );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUI } from './UIProvider';
import { useSession } from './SessionProvider';
import { X, Pin, Move, FileText, ClipboardList, CheckCircle2, ChevronDown, ChevronUp, Loader2, Paperclip, ShieldCheck, Lock } from 'lucide-react';
import dynamic from 'next/dynamic';

const FaceVerificationOverlay = dynamic(() => import('./FaceVerificationOverlay'), { ssr: false });

export default function PinnedAssignmentOverlay() {
    const { pinnedAssignment, togglePinAssignment, openAssignmentDetails } = useUI();
    const { user, activeInstitute } = useSession();
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [dayAssignments, setDayAssignments] = useState<any[]>([]);
    const [activeAssignment, setActiveAssignment] = useState<any>(null);
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
    const [hasMounted, setHasMounted] = useState(false);
    const [isFaceVerifyOpen, setIsFaceVerifyOpen] = useState(false);
    const [verifiedAssignmentIds, setVerifiedAssignmentIds] = useState<Set<string>>(new Set());
    const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

    const TAG_LABELS: Record<string, string> = {
        'read': 'পড়া',
        'write': 'লেখা',
        'memo': 'মুখস্থ',
        'notes': 'নোট',
        'exercise': 'অনুশীলনী',
        'chapter': 'অধ্যায়',
        'lesson': 'পাঠ',
        'meaning': 'শব্দার্থ',
        'qa': 'প্রশ্ন-উত্তর',
        'grammar': 'ব্যাকরণ',
        'test': 'পরীক্ষা',
        'correction': 'সংশোধন',
        'drawing': 'ছবি/চিত্র',
        'map': 'মানচিত্র',
        'mcq': 'MCQ',
        'creative': 'সৃজনশীল',
        'excellent': 'চমৎকার',
        'attentive': 'মনোযোগী',
        'improving': 'উন্নতি করছে',
        'incomplete': 'অসম্পূর্ণ',
        'late': 'দেরি',
        'parent-call': 'অভিভাবক সাক্ষাত',
        'behavior': 'আচরণ ভালো'
    };
    const dragRef = useRef<HTMLDivElement>(null);
    const offsetRef = useRef({ x: 0, y: 0 });
    const currentPosRef = useRef(position);
    const notificationTimerRef = useRef<any>(null);

    const isStudent = user?.role === 'STUDENT';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPos = localStorage.getItem('edusy_pin_pos');
            if (savedPos) setPosition(JSON.parse(savedPos));

            const savedExpanded = localStorage.getItem('edusy_pin_expanded');
            if (savedExpanded) setIsExpanded(JSON.parse(savedExpanded));
            setHasMounted(true);
        }
    }, []);

    useEffect(() => {
        if (pinnedAssignment && activeInstitute?.id) {
            fetchDayAssignments();
        } else {
            setDayAssignments([]);
            setActiveAssignment(null);
        }
    }, [pinnedAssignment?.id, activeInstitute?.id]);

    useEffect(() => {
        if (activeAssignment && isStudent) {
            fetchSubmission();
        }
    }, [activeAssignment?.id]);

    const fetchDayAssignments = async () => {
        if (!pinnedAssignment?.id || !activeInstitute?.id || !user?.id) return;
        setLoading(true);
        try {
            const date = pinnedAssignment.scheduledDate.split('T')[0];
            let url = `/api/assignments?instituteId=${activeInstitute.id}&role=${user.role}&userId=${user.id}&date=${date}`;

            // For students/guardians, ensure we filter by class if applicable
            if (pinnedAssignment.classId) {
                url += `&classId=${pinnedAssignment.classId}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                // Filter assignments to only those with tasks
                const filteredData = data.filter(assignment => {
                    try {
                        const parsed = JSON.parse(assignment.description || '{}');
                        return parsed.sections && parsed.sections.some((s: any) => s.tasks && s.tasks.length > 0);
                    } catch (e) {
                        return false;
                    }
                });

                setDayAssignments(filteredData);
                // Set the pinned one as active initially, or the first one
                const current = filteredData.find(a => a.id === pinnedAssignment.id) || filteredData[0];
                setActiveAssignment(current);
            }
        } catch (error) {
            console.error('Fetch day assignments error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmission = async () => {
        if (!activeAssignment?.id || !user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/submissions?assignmentId=${activeAssignment.id}&studentId=${user.id}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setSubmission(data[0]);
            } else {
                setSubmission(null);
            }
        } catch (error) {
            console.error('Fetch submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        setIsDragging(true);
        offsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isDragging || !dragRef.current) return;
        const x = e.clientX - offsetRef.current.x;
        const y = e.clientY - offsetRef.current.y;
        currentPosRef.current = { x, y };
        // Direct DOM manipulation for buttery smooth movement (instant)
        dragRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }, [isDragging]);

    const handleMouseUp = React.useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            setPosition(currentPosRef.current);
            localStorage.setItem('edusy_pin_pos', JSON.stringify(currentPosRef.current));
        }
    }, [isDragging]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (!hasMounted || !pinnedAssignment) return null;

    // Parse tasks from description if it's JSON
    let taskGroups: any[] = [];
    try {
        const data = JSON.parse(activeAssignment?.description || '{}');
        if (data.version === '2.0' && data.sections) {
            // Filter out empty sections and internal blank tasks
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

    const handleToggleTask = async (taskId: string) => {
        if (!user?.id || !activeAssignment) return;

        const isCurrentlyDone = getTaskStatus(taskId);

        // Face Verify logic
        if (isStudent && activeAssignment.requireFaceVerify && !verifiedAssignmentIds.has(activeAssignment.id) && !isCurrentlyDone) {
            setPendingTaskId(taskId);
            setIsFaceVerifyOpen(true);
            return;
        }

        const nextStatus = !isCurrentlyDone;

        // Optimistic UI Update
        const previousSubmission = submission;
        const newSubmission = {
            ...(submission || { assignmentId: activeAssignment.id, studentId: user.id }),
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

        // Immediate persistence (skip notification)
        try {
            await fetch('/api/submissions/mark-done', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: activeAssignment.id,
                    studentId: user.id,
                    taskId,
                    completed: nextStatus,
                    skipNotification: true
                })
            });

            // Debounced notification for teacher (1 minute)
            if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
            notificationTimerRef.current = setTimeout(async () => {
                await fetch('/api/submissions/mark-done', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        assignmentId: activeAssignment.id,
                        studentId: user.id,
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


    const toggleExpand = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('edusy_pin_expanded', JSON.stringify(newState));
    };

    const getTaskStatus = (taskId: string) => {
        if (!submission?.taskProgress) return false;
        const task = submission.taskProgress[taskId];
        return !!task?.completed || task?.status === 'DONE';
    };

    return (
        <div
            ref={dragRef}
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
                zIndex: 9999,
                cursor: isDragging ? 'grabbing' : 'default',
                willChange: 'transform',
            }}
            className={`${isExpanded ? 'w-80' : 'w-64'} bg-white/40 backdrop-blur-3xl border-2 border-white/30 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(4,92,132,0.25)] p-5 group animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto select-none antialiased ${isDragging ? '' : 'transition-all duration-200'}`}
        >
            {/* Header */}
            <div
                onMouseDown={handleMouseDown}
                className="flex items-center justify-between mb-4 border-b-2 border-[#045c84]/10 pb-3 cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-2xl bg-[#045c84] text-white flex items-center justify-center shadow-lg shadow-[#045c84]/20">
                        <Pin size={16} className="rotate-45" />
                    </div>
                    <div>
                        <span className="text-[11px] font-black text-[#045c84] uppercase tracking-tighter leading-none block">সাঁটানো ডায়েরি</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1 block">পাঠ অগ্রগতি ট্র্যাকার</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleExpand}
                        className="p-2 text-slate-400 hover:text-[#045c84] hover:bg-blue-50 rounded-xl transition-all interactive"
                    >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button
                        onClick={() => togglePinAssignment(pinnedAssignment)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all interactive"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Subject Tabs */}
            {dayAssignments.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-3 mb-3 border-b border-[#045c84]/5">
                    {dayAssignments.map((assignment) => (
                        <button
                            key={assignment.id}
                            onClick={() => setActiveAssignment(assignment)}
                            className={`px-4 py-2 rounded-2xl text-[10px] whitespace-nowrap transition-all font-black uppercase tracking-widest border-2 ${activeAssignment?.id === assignment.id ? 'bg-[#045c84] text-white border-[#045c84] shadow-lg shadow-[#045c84]/20' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-[#045c84]'}`}
                        >
                            {assignment.book?.name || assignment.title || 'পাঠ'}
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-5">
                {!activeAssignment ? (
                    <div className="py-10 text-center">
                        <Loader2 className="animate-spin text-primary mx-auto mb-2" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">লোড হচ্ছে...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3 bg-white/20 p-3 rounded-2xl border border-white/10 backdrop-blur-md">
                            <div className="w-8 h-8 rounded-xl bg-[#045c84] text-white flex items-center justify-center text-[12px] font-black border-2 border-white shadow-sm shrink-0">
                                {activeAssignment.teacher?.metadata?.photo ? (
                                    <img src={activeAssignment.teacher.metadata.photo} alt="" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    activeAssignment.teacher?.name?.charAt(0)
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">শিক্ষক</span>
                                <span className="text-[12px] font-black text-[#045c84] tracking-tight mt-1">
                                    {activeAssignment.teacher?.name}
                                </span>
                            </div>
                        </div>

                        {isExpanded && taskGroups.length > 0 && (
                            <div
                                onWheel={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchMove={(e) => e.stopPropagation()}
                                data-lenis-prevent
                                className="pt-2 space-y-3 max-h-[350px] overflow-y-auto overflow-x-hidden overscroll-contain custom-scrollbar pr-1"
                            >
                                {taskGroups.map((group, groupIdx) => (
                                    <div key={groupIdx} className="space-y-2">
                                        <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-l-2 border-slate-300 pl-3">
                                            {group.title.replace(/\((CLASSWORK|PREPARATION|HOMEWORK|COMMENTS)\)/gi, '').trim()}
                                        </h5>
                                        <div className="space-y-1">
                                            {group.tasks.map((task: any) => {
                                                const isDone = getTaskStatus(task.id);
                                                return (
                                                    <div
                                                        key={task.id}
                                                        onClick={() => !completingTaskId && handleToggleTask(task.id)}
                                                        className={`flex items-start gap-3 py-1.5 px-2 -mx-2 rounded-xl transition-all cursor-pointer ${isDone ? 'hover:bg-red-50/30' : 'hover:bg-slate-50/50'}`}
                                                    >
                                                        <div
                                                            className={`mt-1 shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${isDone ? 'bg-[#045c84] border-[#045c84] text-white shadow-sm' : 'border-slate-300 bg-white group-hover:border-[#045c84]'}`}
                                                        >
                                                            {isDone ? (
                                                                <CheckCircle2 size={12} />
                                                            ) : completingTaskId === task.id ? (
                                                                <Loader2 size={10} className="animate-spin" />
                                                            ) : null}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-[15px] font-black leading-[1.4] tracking-tight ${isDone ? 'text-slate-900 line-through' : 'text-slate-900'} flex items-center gap-2 flex-wrap`}>
                                                                {!isDone && activeAssignment.requireFaceVerify && !verifiedAssignmentIds.has(activeAssignment.id) && (
                                                                    <Lock size={12} className="text-blue-500 fill-blue-50" />
                                                                )}
                                                                {task.segments ? task.segments.map((seg: any) => {
                                                                    if (seg.type === 'tag') {
                                                                        const tagLabel = TAG_LABELS[seg.value.toLowerCase()] || seg.value;
                                                                        return <span key={seg.id} className="inline-block px-2 py-0.5 bg-white/30 border border-white/20 rounded-lg text-[10px] font-black mr-2 text-[#045c84] uppercase tracking-tighter whitespace-nowrap">{tagLabel}</span>;
                                                                    }
                                                                    return <span key={seg.id}>{seg.value}</span>;
                                                                }) : task.text}
                                                            </div>
                                                            {isDone && submission?.taskProgress?.[task.id] && (
                                                                <div className="mt-2 space-y-2">
                                                                    {submission.taskProgress[task.id].content && (
                                                                        <p className="mt-2 text-[11px] font-black text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200 italic leading-snug">
                                                                            Note: {submission.taskProgress[task.id].content}
                                                                        </p>
                                                                    )}
                                                                    {submission.taskProgress[task.id].attachments?.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {submission.taskProgress[task.id].attachments.map((at: any, i: number) => (
                                                                                <div key={i} className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-[#045c84] flex items-center gap-1.5 shadow-sm">
                                                                                    <Paperclip size={10} /> {at.name}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-3 flex items-center justify-between gap-3 border-t-2 border-slate-50">
                            <div className="flex gap-2 items-center min-w-0">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                    <ClipboardList size={14} />
                                </div>
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter truncate">
                                    {activeAssignment.class?.name || 'Class'}
                                </span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openAssignmentDetails(activeAssignment);
                                }}
                                className="px-4 py-2 bg-[#045c84] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-[#034a6b] transition-all shadow-xl shadow-[#045c84]/20 active:scale-95 shrink-0 interactive"
                            >
                                বিস্তারিত দেখুন
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Drag Handle Tooltip */}
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
        </div>
    );
}

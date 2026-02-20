'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUI } from './UIProvider';
import { useSession } from './SessionProvider';
import { X, Pin, Move, FileText, ClipboardList, CheckCircle2, ChevronDown, ChevronUp, Loader2, Paperclip } from 'lucide-react';

export default function PinnedAssignmentOverlay() {
    const { pinnedAssignment, togglePinAssignment, openAssignmentDetails } = useUI();
    const { user } = useSession();
    const [position, setPosition] = useState({ x: 20, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [submission, setSubmission] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

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

    const isStudent = user?.role === 'STUDENT';

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedPos = localStorage.getItem('edusy_pin_pos');
            if (savedPos) setPosition(JSON.parse(savedPos));

            const savedExpanded = localStorage.getItem('edusy_pin_expanded');
            if (savedExpanded) setIsExpanded(JSON.parse(savedExpanded));
        }
    }, []);

    useEffect(() => {
        if (pinnedAssignment && isStudent) {
            fetchSubmission();
        }
    }, [pinnedAssignment?.id]);

    const fetchSubmission = async () => {
        if (!pinnedAssignment?.id || !user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/submissions?assignmentId=${pinnedAssignment.id}&studentId=${user.id}`);
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
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.interactive')) return;
        setIsDragging(true);
        offsetRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const newPos = {
            x: e.clientX - offsetRef.current.x,
            y: e.clientY - offsetRef.current.y
        };
        setPosition(newPos);
    }, [isDragging]);

    const handleMouseUp = React.useCallback(() => {
        if (isDragging) {
            setIsDragging(false);
            localStorage.setItem('edusy_pin_pos', JSON.stringify(position));
        }
    }, [isDragging, position]);

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

    if (!pinnedAssignment) return null;

    // Parse tasks from description if it's JSON
    let taskGroups: any[] = [];
    try {
        const data = JSON.parse(pinnedAssignment.description);
        if (data.version === '2.0' && data.sections) {
            taskGroups = data.sections;
        }
    } catch (e) { }

    const handleMarkDone = async (taskId: string) => {
        if (!user?.id) return;
        setCompletingTaskId(taskId);
        try {
            const res = await fetch('/api/submissions/mark-done', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: pinnedAssignment.id,
                    studentId: user.id,
                    taskId,
                    notes: 'Marked as done from Pin card',
                    attachments: []
                })
            });

            if (res.ok) {
                fetchSubmission();
            }
        } catch (error) {
            console.error('Mark done error:', error);
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
        return !!submission.taskProgress[taskId]?.completed;
    };

    return (
        <div
            ref={dragRef}
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: 9999,
                cursor: isDragging ? 'grabbing' : 'default',
            }}
            className={`${isExpanded ? 'w-80' : 'w-64'} bg-white/90 backdrop-blur-xl border border-[#045c84]/20 rounded-[32px] shadow-2xl p-5 group animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto transition-all`}
            onMouseDown={handleMouseDown}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 border-b border-[#045c84]/10 pb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#045c84]/10 text-[#045c84] flex items-center justify-center">
                        <Pin size={14} className="rotate-45" />
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-[#045c84] uppercase tracking-widest leading-none block">সাঁটানো</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">পাঠ ট্র্যাকার</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={toggleExpand}
                        className="p-1.5 text-slate-400 hover:text-[#045c84] hover:bg-blue-50 rounded-xl transition-all interactive"
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                        onClick={() => togglePinAssignment(pinnedAssignment)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all interactive"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-black text-slate-700 leading-tight line-clamp-2">
                        {pinnedAssignment.book?.name || pinnedAssignment.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                            {pinnedAssignment.teacher?.metadata?.photo ? (
                                <img src={pinnedAssignment.teacher.metadata.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#045c84]">
                                    {pinnedAssignment.teacher?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 italic">
                            {pinnedAssignment.teacher?.name}
                        </span>
                    </div>
                </div>

                {isExpanded && taskGroups.length > 0 && (
                    <div className="pt-2 space-y-4 max-h-64 overflow-y-auto custom-scrollbar pr-1 interactive">
                        {taskGroups.map((group, gIdx) => (
                            <div key={gIdx} className="space-y-2">
                                <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-[#045c84] pl-2">
                                    {group.title.replace(/\((CLASSWORK|PREPARATION|HOMEWORK|COMMENTS)\)/gi, '').trim()}
                                </h5>
                                <div className="space-y-1">
                                    {group.tasks.map((task: any, tIdx: number) => {
                                        const isDone = getTaskStatus(task.id);
                                        return (
                                            <div
                                                key={task.id}
                                                className={`flex items-start gap-2 p-2 rounded-xl transition-all ${isDone ? 'bg-emerald-50/50' : 'bg-slate-50 hover:bg-slate-100'}`}
                                            >
                                                <button
                                                    onClick={() => !isDone && handleMarkDone(task.id)}
                                                    disabled={isDone || completingTaskId === task.id}
                                                    className={`mt-0.5 shrink-0 w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white hover:border-[#045c84]'}`}
                                                >
                                                    {completingTaskId === task.id ? (
                                                        <Loader2 size={8} className="animate-spin" />
                                                    ) : isDone ? (
                                                        <CheckCircle2 size={10} />
                                                    ) : null}
                                                </button>
                                                <div className="flex-1">
                                                    <div className={`text-[10px] font-bold leading-tight ${isDone ? 'text-emerald-700 line-through opacity-50' : 'text-slate-600'}`}>
                                                        {task.segments ? task.segments.map((seg: any) => {
                                                            if (seg.type === 'tag') {
                                                                const tagLabel = TAG_LABELS[seg.value.toLowerCase()] || seg.value;
                                                                return <span key={seg.id} className="inline-block px-1 py-0 bg-white border border-slate-200 rounded-[4px] text-[8px] font-black mr-1 text-[#045c84] uppercase">{tagLabel}</span>;
                                                            }
                                                            return <span key={seg.id}>{seg.value}</span>;
                                                        }) : task.text}
                                                    </div>
                                                    {isDone && submission?.taskProgress?.[task.id] && (
                                                        <div className="mt-1 space-y-1">
                                                            {submission.taskProgress[task.id].content && (
                                                                <p className="text-[8px] text-slate-500 bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100/30 italic">
                                                                    Note: {submission.taskProgress[task.id].content}
                                                                </p>
                                                            )}
                                                            {submission.taskProgress[task.id].attachments?.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {submission.taskProgress[task.id].attachments.map((at: any, i: number) => (
                                                                        <div key={i} className="px-1.5 py-0.5 bg-white border border-slate-100 rounded text-[7px] font-black text-[#045c84] flex items-center gap-1 opacity-80">
                                                                            <Paperclip size={6} /> {at.name}
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

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-50">
                    <div className="flex gap-1 items-center min-w-0">
                        <ClipboardList size={12} className="text-[#045c84]/40 shrink-0" />
                        <span className="text-[9px] font-black text-slate-400 uppercase truncate">
                            {pinnedAssignment.class?.name || 'Class'}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openAssignmentDetails(pinnedAssignment);
                        }}
                        className="px-3 py-1.5 bg-[#045c84] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#034a6b] transition-all shadow-lg active:scale-95 shrink-0 interactive"
                    >
                        বিস্তারিত দেখুন
                    </button>
                </div>
            </div>

            {/* Drag Handle Tooltip */}
            {!isDragging && (
                <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-[#045c84] text-white p-1 rounded-full shadow-lg">
                        <Move size={8} />
                    </div>
                </div>
            )}
        </div>
    );
}

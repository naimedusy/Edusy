'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from '@/components/SessionProvider';
import {
    X,
    Calendar,
    BookOpen,
    User,
    Clock,
    FileText,
    CheckCircle2,
    Users,
    Info,
    Loader2,
    Pencil,
    CheckCircle,
    Paperclip,
    Pin,
    Mic,
    Link as LinkIcon,
    Image as ImageIcon,
    Upload,
    ChevronDown,
    RotateCcw,
    MessageCircle,
    Star
} from 'lucide-react';

interface AssignmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    assignment: any;
    onRelease?: (assignmentId: string, e: React.MouseEvent) => Promise<void>;
    onEdit?: (assignment: any) => void;
    onRevert?: (assignment: any) => void;
    isReleasing?: boolean;
    selectedStudentId?: string;
}

export default function AssignmentDetailsModal({
    isOpen,
    onClose,
    assignment,
    onRelease,
    onEdit,
    onRevert,
    isReleasing,
    selectedStudentId
}: AssignmentDetailsModalProps) {
    const { user, activeInstitute } = useSession();
    const isStudent = user?.role === 'STUDENT';
    const [students, setStudents] = React.useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = React.useState(false);
    const [expandedTaskId, setExpandedTaskId] = React.useState<string | null>(null);
    const [submission, setSubmission] = React.useState<any>(null);
    const [submissions, setSubmissions] = React.useState<any[]>([]);
    const [completingTaskId, setCompletingTaskId] = React.useState<string | null>(null);
    const [taskNotes, setTaskNotes] = React.useState('');
    const [taskAttachments, setTaskAttachments] = React.useState<any[]>([]);
    const [isSubmittingTask, setIsSubmittingTask] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [updatingSubmissionId, setUpdatingSubmissionId] = useState<string | null>(null);
    const [teacherMessages, setTeacherMessages] = useState<{ [key: string]: string }>({});
    const [fullAssignment, setFullAssignment] = useState<any>(assignment);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const studentRefs = React.useRef<{ [key: string]: HTMLDivElement | null }>({});

    React.useEffect(() => {
        if (isOpen && assignment?.id) {
            // Check if we need to fetch full assignment details (e.g. description is missing)
            if (!assignment.description || !assignment.classId) {
                fetchFullAssignment();
            } else {
                setFullAssignment(assignment);
            }

            if (user?.role === 'STUDENT') {
                fetchSubmission();
            } else {
                // For teachers/admins, we need students and all submissions
                // Use assignment.classId or fullAssignment.classId once fetched
                if (assignment.classId || fullAssignment?.classId) {
                    fetchStudents();
                    fetchSubmissions();
                }
            }
        }
    }, [isOpen, assignment?.id, user?.role, activeInstitute?.id]);

    // Handle classId becoming available after fetch
    React.useEffect(() => {
        if (isOpen && !isStudent && fullAssignment?.classId && students.length === 0) {
            fetchStudents();
            fetchSubmissions();
        }
    }, [fullAssignment?.classId]);

    // Scroll to selected student
    React.useEffect(() => {
        if (isOpen && selectedStudentId && studentRefs.current[selectedStudentId]) {
            setTimeout(() => {
                studentRefs.current[selectedStudentId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [isOpen, selectedStudentId, students]);

    const fetchFullAssignment = async () => {
        try {
            const res = await fetch(`/api/assignments/${assignment.id}`);
            if (res.ok) {
                const data = await res.json();
                setFullAssignment(data);
            }
        } catch (error) {
            console.error('Failed to fetch full assignment:', error);
        }
    };

    const fetchSubmissions = async () => {
        try {
            const res = await fetch(`/api/submissions?assignmentId=${assignment.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSubmissions(data);
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        }
    };

    const fetchSubmission = async () => {
        try {
            const res = await fetch(`/api/submissions?assignmentId=${assignment.id}&studentId=${user?.id}`);
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
        setLoadingStudents(true);
        try {
            const res = await fetch(`/api/admin/users?instituteId=${activeInstitute?.id}&role=STUDENT&classId=${assignment.classId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setStudents(data);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleMarkDone = async (taskId: string) => {
        setIsSubmittingTask(true);
        try {
            const res = await fetch('/api/submissions/mark-done', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assignmentId: assignment.id,
                    studentId: user?.id,
                    taskId,
                    content: taskNotes,
                    attachments: taskAttachments
                })
            });
            if (res.ok) {
                await fetchSubmission();
                setCompletingTaskId(null);
                setTaskNotes('');
                setTaskAttachments([]);
            }
        } catch (error) {
            console.error('Failed to mark task as done:', error);
        } finally {
            setIsSubmittingTask(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (data.url) {
                setTaskAttachments(prev => [...prev, {
                    name: file.name,
                    url: data.url,
                    type: file.type
                }]);
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen || !assignment) return null;

    // Simple Markdown Parser for our specific format
    const renderMarkdownLine = (line: string, index: number) => {
        // Header (### Title)
        if (line.startsWith('### ')) {
            const title = line.replace('### ', '');
            // Determine color based on section title
            let colorClass = 'text-slate-700';
            if (title.includes('Classwork')) colorClass = 'text-[#045c84]';
            if (title.includes('Preparation')) colorClass = 'text-purple-600';
            if (title.includes('Homework')) colorClass = 'text-orange-600';
            if (title.includes('Comments')) colorClass = 'text-slate-500';

            return (
                <h4 key={index} className={`font-black uppercase tracking-widest text-xs mt-6 mb-3 flex items-center gap-2 ${colorClass}`}>
                    {title}
                </h4>
            );
        }
        // List Item (- Item)
        if (line.startsWith('- ')) {
            return (
                <li key={index} className="flex items-start gap-2 text-sm font-bold text-slate-600 mb-2 ml-1">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                    <span>{line.replace('- ', '')}</span>
                </li>
            );
        }
        // Normal Text
        if (line.trim()) {
            return <p key={index} className="text-sm text-slate-600 mb-2 font-medium">{line}</p>;
        }
        return null;
    };

    const renderDescription = (text: string) => {
        const descriptionTxt = text || fullAssignment?.description;
        if (!descriptionTxt) return <p className="text-slate-400 italic">কোনো বর্ণনা নেই</p>;

        const TAG_LABELS: Record<string, string> = {
            'read': 'পড়া', 'write': 'লেখা', 'memo': 'মুখস্থ', 'notes': 'নোট',
            'exercise': 'অনুশীলনী', 'chapter': 'অধ্যায়', 'lesson': 'পাঠ',
            'meaning': 'শব্দার্থ', 'qa': 'প্রশ্ন-উত্তর', 'grammar': 'ব্যাকরণ',
            'test': 'পরীক্ষা', 'correction': 'সংশোধন', 'drawing': 'ছবি/চিত্র',
            'map': 'মানচিত্র', 'mcq': 'MCQ', 'creative': 'সৃজনশীল',
            'excellent': 'চমৎকার', 'attentive': 'মনোযোগী', 'improving': 'উন্নতি করছে',
            'incomplete': 'অসম্পূর্ণ', 'late': 'দেরি', 'parent-call': 'অভিভাবক সাক্ষাত',
            'behavior': 'আচরণ ভালো'
        };

        // Try parsing as JSON for individualized distribution
        try {
            const data = JSON.parse(text);
            if (data.version === '2.0' && data.sections) {
                const isStudent = user?.role === 'STUDENT';

                return data.sections.map((section: any, sIdx: number) => {
                    const filteredTasks = isStudent
                        ? section.tasks.filter((t: any) => !t.targetStudents || t.targetStudents.length === 0 || t.targetStudents.includes(user?.id))
                        : section.tasks;

                    if (filteredTasks.length === 0) return null;

                    let colorClass = 'text-slate-500';
                    let bgClass = 'bg-slate-50';
                    let titleText = section.title;

                    if (section.title.includes('Classwork')) { colorClass = 'text-blue-600'; bgClass = 'bg-blue-50/50'; titleText = 'ক্লাসের কাজ'; }
                    if (section.title.includes('Preparation')) { colorClass = 'text-purple-600'; bgClass = 'bg-purple-50/50'; titleText = 'প্রস্তুতি'; }
                    if (section.title.includes('Homework')) { colorClass = 'text-orange-600'; bgClass = 'bg-orange-50/50'; titleText = 'বাড়ির কাজ'; }
                    if (section.title.includes('Comments')) { colorClass = 'text-emerald-600'; bgClass = 'bg-emerald-50/50'; titleText = 'মন্তব্য'; }

                    return (
                        <div key={sIdx} className="mb-6 animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${sIdx * 100}ms` }}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`px-2 py-0.5 ${bgClass} ${colorClass} text-[9px] font-black rounded border border-current/10 uppercase tracking-widest`}>
                                    {titleText.replace(/\((CLASSWORK|PREPARATION|HOMEWORK|COMMENTS)\)/gi, '').trim() || titleText}
                                </span>
                                <div className="h-[1px] flex-1 bg-slate-100" />
                            </div>
                            <div className="space-y-3">
                                {filteredTasks.map((task: any, tIdx: number) => {
                                    const taskId = `${sIdx}-${tIdx}`;
                                    const isExpanded = expandedTaskId === taskId;
                                    const targetedStudentList = students.filter(s => task.targetStudents?.includes(s.id));

                                    const taskState = submission?.taskProgress?.[taskId] || null;
                                    const isDone = taskState?.status === 'DONE' || taskState?.status === 'APPROVED';
                                    const isApproved = taskState?.status === 'APPROVED';
                                    const isRetry = taskState?.status === 'RETRY';
                                    const isRejected = taskState?.status === 'REJECTED';
                                    const isCompleting = completingTaskId === taskId;

                                    const contentJSX = task.segments.map((seg: any) => {
                                        if (seg.type === 'tag') {
                                            const tagLabel = TAG_LABELS[seg.value.toLowerCase()] || seg.value;
                                            return <span key={seg.id} className="inline-block px-1 py-0 bg-white border border-slate-200 rounded-[4px] text-[8px] font-black mr-1 text-[#045c84] uppercase">{tagLabel}</span>;
                                        }
                                        return <span key={seg.id}>{seg.value}</span>;
                                    });

                                    return (
                                        <div key={tIdx} className="group relative">
                                            <div className={`flex items-start gap-2 p-3 rounded-2xl transition-all ${isApproved ? 'bg-emerald-50/50 border border-emerald-100/50' : isRetry ? 'bg-amber-50/50 border border-amber-100/50' : isRejected ? 'bg-red-50/50 border border-red-100/50' : isDone ? 'bg-blue-50/50 border border-blue-100/50' : 'bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-[#045c84]/30'}`}>
                                                {isStudent && (
                                                    <button
                                                        onClick={() => !isApproved && setCompletingTaskId(isCompleting ? null : taskId)}
                                                        disabled={isApproved || isCompleting}
                                                        className={`mt-0.5 shrink-0 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isApproved ? 'bg-emerald-500 border-emerald-500 text-white cursor-default' : isDone ? 'bg-blue-500 border-blue-500 text-white' : isRetry ? 'bg-amber-500 border-amber-500 text-white' : isRejected ? 'bg-red-500 border-red-500 text-white' : 'border-slate-300 bg-white hover:border-[#045c84] text-transparent hover:text-emerald-400'}`}
                                                    >
                                                        {isCompleting ? <Loader2 size={10} className="animate-spin text-emerald-500" /> : (isApproved || isDone) ? <CheckCircle size={12} /> : isRetry ? <RotateCcw size={12} /> : isRejected ? <X size={12} /> : null}
                                                    </button>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <div className={`text-[12px] font-bold leading-relaxed ${isApproved ? 'text-emerald-700 line-through opacity-50' : 'text-slate-700'}`}>
                                                            {contentJSX}
                                                        </div>
                                                        {isRetry && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded uppercase">আবার চেষ্টা করুন</span>}
                                                        {isRejected && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[8px] font-black rounded uppercase">বাতিল</span>}
                                                        {isApproved && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded uppercase tracking-widest">OK</span>}
                                                    </div>

                                                    {(isRetry || isRejected || (isApproved && taskState?.feedback)) && taskState?.feedback && (
                                                        <div className="mb-3 mt-1 px-3 py-2 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] font-bold text-rose-700 relative">
                                                            <div className="absolute -top-1 left-3 w-2 h-2 bg-rose-50 border-t border-l border-rose-100 rotate-45"></div>
                                                            <p className="flex items-center gap-1.5">
                                                                <MessageCircle size={10} className="shrink-0" /> {taskState.feedback}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {isDone && taskState?.content && (
                                                        <p className={`mt-2 text-[9px] p-2 rounded-xl border italic ${isApproved ? 'text-emerald-600 bg-white/50 border-emerald-100/50' : 'text-blue-600 bg-white/50 border-blue-100/50'}`}>
                                                            টীকা: {taskState.content}
                                                        </p>
                                                    )}

                                                    {isDone && taskState?.attachments?.length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {taskState.attachments.map((at: any, i: number) => (
                                                                <div key={i} className={`px-2 py-1 bg-white border rounded-lg text-[8px] font-black flex items-center gap-1.5 shadow-sm ${isApproved ? 'border-emerald-100/50 text-[#045c84]' : 'border-blue-100/50 text-[#045c84]'}`}>
                                                                    <Paperclip size={10} /> {at.name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {!isStudent && task.targetStudents && task.targetStudents.length > 0 && (
                                                        <button
                                                            onClick={() => setExpandedTaskId(isExpanded ? null : taskId)}
                                                            className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-[#045c84] uppercase tracking-tighter hover:bg-blue-50 px-2 py-0.5 rounded-full transition-colors"
                                                        >
                                                            <Users size={10} />
                                                            {task.targetStudents.length} Students Targeted
                                                            {isExpanded ? <Clock size={8} className="rotate-180 transition-transform" /> : <Clock size={8} className="transition-transform" />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Completion Form for Students */}
                                            {
                                                isCompleting && (
                                                    <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-[24px] animate-in zoom-in-95 duration-200">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">টাস্ক সম্পন্ন করুন</h5>
                                                            <button onClick={() => setCompletingTaskId(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                                                        </div>

                                                        <textarea
                                                            value={taskNotes}
                                                            onChange={(e) => setTaskNotes(e.target.value)}
                                                            placeholder="শিক্ষকের জন্য কোনো নোট লিখুন (ঐচ্ছিক)..."
                                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-[#045c84]/5 mb-3 min-h-[80px]"
                                                        />

                                                        <div className="flex flex-wrap gap-2 mb-2">
                                                            <input
                                                                type="file"
                                                                ref={fileInputRef}
                                                                className="hidden"
                                                                onChange={handleFileUpload}
                                                                accept="image/*,audio/*,application/pdf"
                                                            />
                                                            <button
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={isUploading}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                                                            >
                                                                {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Paperclip size={14} className="text-blue-500" />}
                                                                ফাইল যুক্ত করুন
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const url = prompt('লিঙ্কটি দিন (Link):');
                                                                    if (url) {
                                                                        setTaskAttachments(prev => [...prev, { name: 'লিঙ্ক', url, type: 'link' }]);
                                                                    }
                                                                }}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                                                            >
                                                                <LinkIcon size={14} className="text-[#045c84]" /> লিঙ্ক
                                                            </button>
                                                        </div>

                                                        {taskAttachments.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mb-4 p-2 bg-white rounded-xl border border-dashed border-slate-200">
                                                                {taskAttachments.map((at, i) => (
                                                                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg text-[9px] font-bold text-slate-500 border border-slate-100">
                                                                        <Paperclip size={10} /> {at.name}
                                                                        <button onClick={() => setTaskAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 ml-1">
                                                                            <X size={10} />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={handleMarkDone.bind(null, taskId)}
                                                            disabled={isSubmittingTask}
                                                            className="w-full py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                        >
                                                            {isSubmittingTask ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                                            শিক্ষককে পাঠান
                                                        </button>
                                                    </div>
                                                )
                                            }

                                            {/* Student List Dropdown - Hide for Students */}
                                            {
                                                !isStudent && isExpanded && targetedStudentList.length > 0 && (
                                                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl animate-in zoom-in-95 duration-200">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Targeted Students:</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {targetedStudentList.map(st => (
                                                                <div key={st.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-sm animate-in zoom-in-50">
                                                                    <div className="w-6 h-6 rounded-full border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 bg-slate-50">
                                                                        {st.metadata?.studentPhoto ? (
                                                                            <img src={st.metadata.studentPhoto} alt={st.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-[10px] font-bold text-slate-400">{st.name.charAt(0)}</span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[10px] font-bold text-slate-700 truncate">
                                                                        {st.name} {st.metadata?.roll && <span className="text-slate-400 font-medium ml-1">#{st.metadata.roll}</span>}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                }).filter(Boolean);
            }
        } catch (e) {
            console.error('Description parse error:', e);
        }

        const lines = text.split('\n');
        return <div className="space-y-1">{lines.map((line, index) => renderMarkdownLine(line, index))}</div>;
    };

    const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();

    return createPortal(
        <>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />

                {/* Modal Content */}
                <div className={`bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[90vh] z-10 relative border border-[#045c84]/10`}>
                    {/* Header */}
                    <div className={`p-6 border-b border-[#045c84]/10 flex justify-between items-center shrink-0 ${isStudent ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/10 ${isStudent ? 'bg-[#045c84] text-white' : 'bg-[#045c84]/10 text-[#045c84]'}`}>
                                {isStudent ? <BookOpen size={24} /> : <FileText size={24} />}
                            </div>
                            <div>
                                <div className="flex gap-2 mb-1.5 leading-none">
                                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${isStudent ? 'bg-[#045c84]/10 text-[#045c84] border-[#045c84]/20' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                        {isStudent ? 'বিস্তারিত বিবরণ' : assignment.type}
                                    </span>
                                </div>
                                <h2 className="text-xl font-black text-slate-800 leading-tight">
                                    {assignment.title}
                                </h2>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-red-500 interactive">
                            <X size={20} />
                        </button>
                        {isStudent && (
                            <div className="absolute top-0 right-0 p-1 opacity-20 pointer-events-none">
                                <Pin size={48} className="rotate-45 text-[#045c84]" />
                            </div>
                        )}
                    </div>

                    {/* Body */}
                    <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                        {/* Meta Info */}
                        <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400">
                                    <User size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">শিক্ষক</p>
                                    <p className="text-sm font-bold text-slate-700">{assignment.teacher?.name || 'অজানা'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400">
                                    <BookOpen size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">বিষয়</p>
                                    <p className="text-sm font-bold text-slate-700">{assignment.book?.name || 'অজানা'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-400">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">ক্লাস</p>
                                    <p className="text-sm font-bold text-slate-700">{assignment.class?.name || 'অজানা'}</p>
                                </div>
                            </div>
                            {assignment.deadline && (
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className={`text-[10px] uppercase font-black tracking-widest ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>জমা দেওয়ার শেষ সময়</p>
                                        <p className={`text-sm font-bold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                                            {new Date(assignment.deadline).toLocaleDateString('bn-BD')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Resources if any */}
                        {assignment.resources && assignment.resources.length > 0 && (
                            <div className="mb-8">
                                <h4 className="font-black uppercase tracking-widest text-xs text-slate-400 mb-3 flex items-center gap-2">
                                    সংযুক্ত রিসোর্স (Resources)
                                </h4>
                                <div className="grid gap-2">
                                    {assignment.resources.map((res: any, idx: number) => (
                                        <a
                                            key={idx}
                                            href={res.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 bg-[#045c84]/5 border border-[#045c84]/10 rounded-xl hover:bg-[#045c84]/10 transition-colors group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-[#045c84] shadow-sm group-hover:scale-110 transition-transform">
                                                <FileText size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-[#045c84] underline decoration-dotted underline-offset-4">{res.name || res.url}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Description Content */}
                        <div className="prose-slate">
                            {renderDescription(assignment.description)}
                        </div>

                        {/* Teacher: Submissions Review Section */}
                        {!isStudent && (
                            <div className="mt-12 pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="font-black uppercase tracking-widest text-xs text-[#045c84] flex items-center gap-2">
                                        <Users size={14} />
                                        শিক্ষার্থীদের অগ্রগতি ({submissions.length}/{students.length})
                                    </h4>
                                    <div className="flex gap-2">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black border border-amber-100">
                                            {submissions.filter(s => s.status === 'SUBMITTED').length} PENDING
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black border border-emerald-100">
                                            {submissions.filter(s => s.status === 'APPROVED').length} APPROVED
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {loadingStudents ? (
                                        <div className="py-10 text-center">
                                            <Loader2 size={24} className="animate-spin text-slate-300 mx-auto" />
                                        </div>
                                    ) : students.length > 0 ? (
                                        students.map((st) => {
                                            const sub = submissions.find(s => s.studentId === st.id);
                                            const isUpdating = updatingSubmissionId === sub?.id;

                                            const handleStatusUpdate = async (newStatus: string, tId?: string, tStatus?: string) => {
                                                if (!sub?.id) return;
                                                setUpdatingSubmissionId(sub.id);
                                                try {
                                                    const res = await fetch('/api/submissions', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            id: sub.id,
                                                            status: newStatus,
                                                            taskId: tId,
                                                            taskStatus: tStatus,
                                                            feedback: teacherMessages[st.id] || ''
                                                        })
                                                    });
                                                    if (res.ok) {
                                                        setTeacherMessages(prev => ({ ...prev, [st.id]: '' }));
                                                        fetchSubmissions();
                                                    }
                                                } catch (error) {
                                                    console.error('Failed to update status:', error);
                                                } finally {
                                                    setUpdatingSubmissionId(null);
                                                }
                                            };

                                            const handleApproveAll = async () => {
                                                if (!sub?.taskProgress) return;
                                                setUpdatingSubmissionId(sub.id);
                                                try {
                                                    for (const tId of Object.keys(sub.taskProgress)) {
                                                        await fetch('/api/submissions', {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                id: sub.id,
                                                                taskId: tId,
                                                                taskStatus: 'APPROVED'
                                                            })
                                                        });
                                                    }
                                                    await fetch('/api/submissions', {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({
                                                            id: sub.id,
                                                            status: 'APPROVED',
                                                            feedback: teacherMessages[st.id] || ''
                                                        })
                                                    });
                                                    fetchSubmissions();
                                                } catch (error) {
                                                    console.error('Bulk approve failed:', error);
                                                } finally {
                                                    setUpdatingSubmissionId(null);
                                                }
                                            };

                                            return (
                                                <div
                                                    key={st.id}
                                                    ref={el => { studentRefs.current[st.id] = el }}
                                                    className={`p-4 border transition-all hover:bg-white hover:shadow-md hover:border-[#045c84]/20 group rounded-2xl ${selectedStudentId === st.id ? 'bg-blue-50/50 border-blue-200 ring-2 ring-blue-500/20' : 'bg-slate-50/50 border-slate-100'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 bg-white">
                                                                {st.metadata?.studentPhoto ? (
                                                                    <img src={st.metadata.studentPhoto} alt={st.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User size={20} className="text-slate-300" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-black text-slate-700">{st.name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400">Roll: {st.metadata?.rollNumber || 'N/A'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="text"
                                                                value={teacherMessages[st.id] || ''}
                                                                onChange={(e) => setTeacherMessages(prev => ({ ...prev, [st.id]: e.target.value }))}
                                                                placeholder="শিক্ষার্থীর জন্য মেসেজ দিন..."
                                                                className="flex-1 px-4 py-2 bg-slate-100/50 border-2 border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#045c84]/50 focus:bg-white transition-all font-black text-slate-700 placeholder:text-slate-400"
                                                            />
                                                            {!sub ? (
                                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                                                    জমা দেয়নি
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    {sub.status === 'SUBMITTED' ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                onClick={() => handleStatusUpdate('APPROVED')}
                                                                                disabled={isUpdating}
                                                                                className="px-4 py-1.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10 flex items-center gap-2 disabled:opacity-50"
                                                                            >
                                                                                {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                                                                APPROVE
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleStatusUpdate('REJECTED')}
                                                                                disabled={isUpdating}
                                                                                className="px-4 py-1.5 bg-white text-red-600 border border-red-100 rounded-xl text-[10px] font-black hover:bg-red-50 transition-all disabled:opacity-50"
                                                                            >
                                                                                REJECT
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border flex items-center gap-2 ${sub.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                                            {sub.status === 'APPROVED' ? <CheckCircle size={12} /> : <X size={12} />}
                                                                            {sub.status}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {sub && (sub.content || (sub.taskProgress && Object.keys(sub.taskProgress).length > 0)) && (
                                                        <div className="mt-4 pt-4 border-t border-slate-100/50">
                                                            {sub.content && (
                                                                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 mb-3 italic">
                                                                    "{sub.content}"
                                                                </p>
                                                            )}

                                                            {sub.taskProgress && (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">টাস্ক প্রগ্রেস</p>
                                                                        {sub.status !== 'APPROVED' && (
                                                                            <button
                                                                                onClick={handleApproveAll}
                                                                                disabled={isUpdating}
                                                                                className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-tighter flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 transition-all"
                                                                            >
                                                                                <CheckCircle size={10} /> Approve All
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                    <div className="grid gap-2">
                                                                        {Object.entries(sub.taskProgress as any).map(([taskId, progress]: [string, any]) => (
                                                                            <div key={taskId} className={`p-2 rounded-xl border flex items-center justify-between transition-all ${progress.status === 'APPROVED' ? 'bg-emerald-50/30 border-emerald-100/50' : progress.status === 'RETRY' ? 'bg-amber-50/30 border-amber-100/50' : progress.status === 'REJECTED' ? 'bg-red-50/30 border-red-100/50' : 'bg-slate-50 border-slate-100'}`}>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${progress.status === 'APPROVED' ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-900/10' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                                                        {progress.status === 'APPROVED' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className={`text-[11px] font-black ${progress.status === 'APPROVED' ? 'text-emerald-700' : 'text-slate-600'}`}>টাস্ক {taskId}</p>
                                                                                        <div className="flex flex-col gap-1 mt-1">
                                                                                            {progress.content && (
                                                                                                <p className="text-[10px] text-slate-500 bg-white/50 p-1.5 rounded-lg border border-slate-200/50 italic">
                                                                                                    {progress.content}
                                                                                                </p>
                                                                                            )}
                                                                                            {progress.attachments?.length > 0 && (
                                                                                                <div className="flex flex-wrap gap-1">
                                                                                                    {progress.attachments.map((at: any, idx: number) => (
                                                                                                        <a
                                                                                                            key={idx}
                                                                                                            href={at.url}
                                                                                                            target="_blank"
                                                                                                            rel="noopener noreferrer"
                                                                                                            className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[8px] font-black text-blue-700 hover:bg-blue-100"
                                                                                                        >
                                                                                                            <Paperclip size={8} /> File {idx + 1}
                                                                                                        </a>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>

                                                                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                    {progress.status !== 'APPROVED' && (
                                                                                        <button
                                                                                            onClick={() => handleStatusUpdate(sub.status, taskId, 'APPROVED')}
                                                                                            disabled={isUpdating}
                                                                                            className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm disabled:opacity-50"
                                                                                            title="Approve Task"
                                                                                        >
                                                                                            <CheckCircle2 size={12} />
                                                                                        </button>
                                                                                    )}
                                                                                    <button
                                                                                        onClick={() => handleStatusUpdate(sub.status, taskId, 'RETRY')}
                                                                                        disabled={isUpdating}
                                                                                        className="p-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-sm disabled:opacity-50"
                                                                                        title="Request Retry"
                                                                                    >
                                                                                        <RotateCcw size={12} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleStatusUpdate(sub.status, taskId, 'REJECTED')}
                                                                                        disabled={isUpdating}
                                                                                        className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm disabled:opacity-50"
                                                                                        title="Reject Task"
                                                                                    >
                                                                                        <X size={12} />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {sub.attachments && sub.attachments.length > 0 && (
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    {sub.attachments.map((at: any, i: number) => (
                                                                        <a
                                                                            key={i}
                                                                            href={at.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-[#045c84] hover:bg-blue-50 transition-all hover:border-[#045c84]/30 shadow-sm"
                                                                        >
                                                                            <Paperclip size={12} />
                                                                            {at.name}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-10 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                                            <p className="text-sm font-bold text-slate-400">এই ক্লাসে কোনো শিক্ষার্থী খুঁজে পাওয়া যায়নি</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Info size={12} />
                            এটা সরাসরি শিক্ষার্থীর কাছে পাঠানো মেসেজ এর প্রিভিউ
                        </div>

                        <div className="flex gap-3">
                            {assignment.status === 'DRAFT' && onRelease && (
                                <button
                                    onClick={(e) => onRelease(assignment.id, e).then(() => onClose())}
                                    disabled={isReleasing}
                                    className="px-6 py-3 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-900/10 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isReleasing ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                    রিলিজ করুন
                                </button>
                            )}
                            {(assignment.status === 'RELEASED' || assignment.status === 'PUBLISHED') && onRevert && (
                                <button
                                    onClick={() => {
                                        onRevert(assignment);
                                        onClose();
                                    }}
                                    className="px-6 py-3 bg-red-50 text-red-600 border border-red-100 font-black rounded-xl hover:bg-red-100 transition-all uppercase tracking-widest text-[10px] shadow-sm flex items-center gap-2"
                                >
                                    <RotateCcw size={14} />
                                    প্রত্যাহার (Revert)
                                </button>
                            )}
                            {!isStudent && onEdit && (
                                <button
                                    onClick={() => {
                                        onEdit(assignment);
                                        onClose();
                                    }}
                                    className="px-6 py-3 bg-white text-slate-700 border border-slate-200 font-black rounded-xl hover:bg-slate-50 transition-all uppercase tracking-widest text-[10px] shadow-sm flex items-center gap-2"
                                >
                                    <Pencil size={14} />
                                    এডিট করুন
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-slate-800 text-white font-black rounded-xl hover:bg-slate-700 transition-all uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/10"
                            >
                                বন্ধ করুন
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}

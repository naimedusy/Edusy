'use client';

import React from 'react';
import {
    ClipboardList,
    Calendar,
    User,
    BookOpen,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    MoreVertical,
    Pin,
    PinOff,
    Users,
    ChevronRight,
    MessageCircle,
    RotateCcw,
    X
} from 'lucide-react';
import { useUI } from './UIProvider';

interface AssignmentCardProps {
    assignment: any;
    dayAssignments?: any[];
    role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUARDIAN';
    onAction?: (assignment: any) => void;
    onRevert?: (assignment: any) => void;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
}

export default function AssignmentCard({
    assignment,
    dayAssignments,
    role,
    onAction,
    onRevert,
    isSelected,
    onSelect
}: AssignmentCardProps) {
    const { pinnedAssignment, togglePinAssignment, openAssignmentDetails } = useUI();
    const isPinned = pinnedAssignment?.id === assignment.id;
    const isStudent = role === 'STUDENT';
    const isGuardian = role === 'GUARDIAN';
    const isOverdue = assignment.deadline && new Date(assignment.deadline) < new Date();

    // Extract task types from description if structured
    let taskTypes: string[] = [];
    if (assignment?.description) {
        try {
            const parsed = JSON.parse(assignment.description);
            if (parsed.version === '2.0' && parsed.sections) {
                taskTypes = parsed.sections.map((s: any) => {
                    if (s.title.includes('Classwork')) return 'ক্লাসের কাজ';
                    if (s.title.includes('Preparation')) return 'প্রস্তুতি';
                    if (s.title.includes('Homework')) return 'বাড়ির কাজ';
                    if (s.title.includes('Comments')) return 'মন্তব্য';
                    return null;
                }).filter(Boolean);
            }
        } catch (e) { /* Not structured */ }
    }

    const getStatusInfo = (status: string, userStatus?: string) => {
        // If it's a student/guardian view, the submission status takes precedence
        if ((isStudent || isGuardian) && userStatus && userStatus !== 'NOT_STARTED') {
            switch (userStatus) {
                case 'SUBMITTED': return { label: 'SUBMITTED', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Clock size={10} /> };
                case 'APPROVED': return { label: 'APPROVED', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={10} /> };
                case 'RETRY': return { label: 'RETRY', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <RotateCcw size={10} /> };
                case 'REJECTED': return { label: 'REJECTED', color: 'bg-red-50 text-red-600 border-red-100', icon: <X size={10} /> };
            }
        }

        switch (status) {
            case 'DRAFT': return { label: 'DRAFT', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <Clock size={10} /> };
            case 'RELEASED': return { label: 'RELEASED', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={10} /> };
            case 'PUBLISHED': return { label: 'ACTIVE', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <CheckCircle2 size={10} /> };
            default: return { label: status, color: 'bg-slate-50 text-slate-600 border-slate-100', icon: <AlertCircle size={10} /> };
        }
    };

    const statusInfo = getStatusInfo(assignment.status, assignment.userStatus);

    const renderPersonalCard = () => {
        const date = new Date(assignment.createdAt);
        const dayNameBangla = date.toLocaleDateString('bn-BD', { weekday: 'long' });
        const dateBangla = date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' });

        return (
            <div
                onClick={() => onAction?.(assignment)}
                className={`group bg-white/95 backdrop-blur-2xl rounded-3xl border ${isPinned ? 'border-[#045c84] shadow-xl shadow-[#045c84]/10' : 'border-white shadow-md'} p-6 hover:shadow-2xl hover:border-[#045c84]/30 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col gap-6 min-h-[170px]`}
            >
                {/* Header: Bangla Day & Date */}
                <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                        <h2 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">
                            {dayNameBangla}
                        </h2>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Calendar size={13} className="shrink-0" />
                            <p className="text-[13px] font-semibold font-sans">
                                {dateBangla}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePinAssignment(assignment);
                        }}
                        className={`p-2.5 rounded-xl transition-all duration-200 ${isPinned ? 'bg-[#045c84] text-white shadow-lg' : 'bg-slate-50/50 text-slate-300 hover:text-[#045c84] hover:bg-white border border-slate-100 shadow-sm'}`}
                    >
                        {isPinned ? <PinOff size={16} /> : <Pin size={16} className="rotate-45" />}
                    </button>
                </div>

                {/* Content: Subjects */}
                <div className="flex flex-col gap-3 mt-auto">
                    {dayAssignments && dayAssignments.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                            {dayAssignments.map((a, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50/50 rounded-2xl border border-slate-100/50 group-hover:bg-white group-hover:border-[#045c84]/10 transition-all shadow-sm"
                                >
                                    <div className="w-5 h-5 rounded-full bg-[#045c84]/10 flex items-center justify-center">
                                        <BookOpen size={10} className="text-[#045c84]" />
                                    </div>
                                    <span className="text-[14px] font-bold text-slate-700 tracking-tight">
                                        {a.book?.name || a.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#045c84] text-white flex items-center justify-center shadow-lg shadow-[#045c84]/10 shrink-0">
                                <BookOpen size={20} />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-[15px] font-bold text-slate-800 truncate">{assignment.book?.name || assignment.title}</h4>
                            </div>
                        </div>
                    )}
                </div>

                {/* Refined Arrow */}
                <div className="absolute top-1/2 -translate-y-1/2 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <div className="w-8 h-8 rounded-full bg-[#045c84]/5 flex items-center justify-center">
                        <ChevronRight size={18} className="text-[#045c84]" />
                    </div>
                </div>
            </div>
        );
    };

    if (isStudent || isGuardian) return renderPersonalCard();

    return (
        <div
            onClick={() => onAction?.(assignment)}
            className={`group bg-white rounded-[24px] border ${isSelected ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200'} p-4 hover:shadow-2xl hover:shadow-blue-900/10 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[140px] h-auto`}
        >
            {assignment.status === 'DRAFT' && (
                <div className="absolute top-0 right-0 left-0 h-1 bg-amber-400"></div>
            )}
            {onSelect && (
                <div
                    className="absolute top-3 right-10 z-10"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(assignment.id, !isSelected);
                    }}
                >
                    <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                        {isSelected && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                </div>
            )}

            {/* Pin Toggle for Teacher/Admin too if they want */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    togglePinAssignment(assignment);
                }}
                className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-all ${isPinned ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100'}`}
            >
                <Pin size={12} className={isPinned ? '' : 'rotate-45'} />
            </button>

            <div>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black rounded-full border border-slate-100 uppercase tracking-tighter">
                        <Calendar size={8} /> {new Date(assignment.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 ${statusInfo.color} text-[10px] font-black rounded-xl border uppercase tracking-wider shadow-sm`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                    </div>
                </div>

                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-black text-slate-700 truncate group-hover:text-[#045c84] transition-colors">
                        {assignment.book?.name || assignment.title}
                    </h3>
                    {(role === 'ADMIN' || role === 'TEACHER') && (assignment.status === 'RELEASED' || assignment.status === 'PUBLISHED') && onRevert && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRevert(assignment);
                            }}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all border border-red-100 flex items-center gap-1.5"
                            title="প্রত্যাহার করুন (Revert)"
                        >
                            <RotateCcw size={12} />
                            <span className="text-[8px] font-black uppercase">Revert</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{assignment.class?.name || 'Unknown Class'}</p>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-100">
                            {assignment.teacher?.metadata?.photo ? (
                                <img src={assignment.teacher.metadata.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[7px] font-bold text-slate-400">
                                    {assignment.teacher?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 truncate italic">by {assignment.teacher?.name || 'Teacher'}</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
                <div className="flex flex-wrap gap-1">
                    {taskTypes.length > 0 ? (
                        taskTypes.map((type: string) => {
                            let color = 'bg-slate-50 text-slate-500 border-slate-100';
                            if (type === 'সি.ডব্লিউ') color = 'bg-slate-50 text-slate-500 border-slate-100';
                            if (type === 'প্রস্তুতি') color = 'bg-slate-50 text-slate-500 border-slate-100';
                            if (type === 'এইচ.ডব্লিউ') color = 'bg-slate-50 text-slate-500 border-slate-100';
                            if (type === 'মন্তব্য') color = 'bg-slate-50 text-slate-500 border-slate-100';

                            return (
                                <span key={type} className={`px-1.5 py-0.5 ${color} text-[8px] font-black rounded border uppercase tracking-tighter`}>
                                    {type}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-[10px] font-bold text-slate-300 italic">No structured tasks</span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className="text-[8px] text-slate-400 uppercase font-black tracking-tighter">Done</p>
                        <p className="text-xs font-black text-slate-700 leading-none">{assignment._count?.submissions || 0}</p>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-[#045c84]/5 text-[#045c84] flex items-center justify-center group-hover:bg-[#045c84] group-hover:text-white transition-all shadow-sm">
                        <FileText size={16} />
                    </div>
                </div>
            </div>
        </div >
    );
}

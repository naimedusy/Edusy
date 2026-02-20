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
    role: 'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUARDIAN';
    onAction?: (assignment: any) => void;
    onRevert?: (assignment: any) => void;
    isSelected?: boolean;
    onSelect?: (id: string, selected: boolean) => void;
}

export default function AssignmentCard({
    assignment,
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

    const renderPersonalCard = () => (
        <div
            onClick={() => onAction?.(assignment)}
            className={`group bg-white rounded-[32px] border-2 ${isPinned ? 'border-[#045c84] shadow-2xl shadow-blue-900/10' : 'border-slate-100'} p-5 hover:border-[#045c84]/30 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-[200px]`}
        >
            {/* Top Bar: Subject & Pin */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-2xl bg-blue-50 text-[#045c84] flex items-center justify-center border border-blue-100 shrink-0">
                        <BookOpen size={16} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">বিষয়</p>
                        <h4 className="text-xs font-black text-[#045c84] mt-1 truncate">{assignment.book?.name || 'অজানা বিষয়'}</h4>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 ${statusInfo.color} text-[8px] font-black rounded-lg border uppercase tracking-wider`}>
                        {statusInfo.label}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            togglePinAssignment(assignment);
                        }}
                        className={`p-2 rounded-xl transition-all ${isPinned ? 'bg-[#045c84] text-white shadow-lg' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-500'}`}
                    >
                        {isPinned ? <PinOff size={14} /> : <Pin size={14} className="rotate-45" />}
                    </button>
                </div>
            </div>

            {/* Title & Teacher */}
            <div>
                <h3 className="text-base font-black text-slate-800 leading-tight mb-2 group-hover:text-[#045c84] transition-colors line-clamp-1">
                    {assignment.title}
                </h3>
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-[16px] border border-slate-100/50 w-fit">
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white border border-slate-200 shrink-0">
                        {assignment.teacher?.metadata?.photo ? (
                            <img src={assignment.teacher.metadata.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-[#045c84] bg-blue-50">
                                {assignment.teacher?.name?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 italic truncate max-w-[100px]">{assignment.teacher?.name || 'শিক্ষক'}</span>
                </div>
            </div>

            {/* Task Types Labels */}
            <div className="flex flex-wrap gap-1.5">
                {taskTypes.map((type: string) => {
                    let style = 'bg-slate-100 text-slate-500 border-slate-200';
                    if (type === 'ক্লাসের কাজ' || type === 'সি.ডব্লিউ') style = 'bg-blue-50 text-blue-600 border-blue-100';
                    if (type === 'প্রস্তুতি') style = 'bg-purple-50 text-purple-600 border-purple-100';
                    if (type === 'বাড়ির কাজ' || type === 'এইচ.ডব্লিউ') style = 'bg-orange-50 text-orange-600 border-orange-100';

                    return (
                        <div key={type} className={`px-2 py-1 ${style} text-[8px] font-black rounded-lg border flex items-center gap-1`}>
                            <div className={`w-1 h-1 rounded-full ${style.split(' ')[1].replace('text-', 'bg-')}`}></div>
                            {type}
                        </div>
                    );
                })}
            </div>

            {/* Bottom Info: Date & Action */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-400">
                    <Calendar size={10} />
                    <span className="text-[9px] font-black uppercase tracking-tighter">
                        {new Date(assignment.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                    </span>
                </div>
                <div className="px-3 py-1.5 bg-[#045c84] text-white text-[9px] font-black uppercase tracking-widest rounded-xl flex items-center gap-1.5 group-hover:scale-105 transition-transform shadow-lg shadow-blue-900/10 active:scale-95">
                    দেখুন
                    <ChevronRight size={12} />
                </div>
            </div>
        </div>
    );

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
                            let color = 'bg-slate-100 text-slate-500 border-slate-200';
                            if (type === 'সি.ডব্লিউ') color = 'bg-blue-50 text-blue-600 border-blue-100';
                            if (type === 'প্রস্তুতি') color = 'bg-purple-50 text-purple-600 border-purple-100';
                            if (type === 'এইচ.ডব্লিউ') color = 'bg-orange-50 text-orange-600 border-orange-100';
                            if (type === 'মন্তব্য') color = 'bg-emerald-50 text-emerald-600 border-emerald-100';

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

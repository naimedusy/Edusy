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
import Diary3D from './Diary3D';

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

    // Use the class cover image if assignment.class exists, otherwise fallback to book cover
    const coverImage = assignment.class?.coverImage || assignment.book?.metadata?.coverImage || (assignment.book?.coverImage);
    const classTitle = assignment.class?.name || assignment.book?.name || assignment.title || 'DAILY DIARY';

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

    return (
        <div
            onClick={() => onAction?.(assignment)}
            className="group relative flex flex-col gap-4 p-2 transition-all cursor-pointer"
        >
            {/* The Realistic 3D Diary */}
            <div className="w-full max-w-[200px] mx-auto">
                <Diary3D 
                    coverImage={coverImage} 
                    classTitle={classTitle}
                    accentColor={assignment.book?.metadata?.color || '#045c84'}
                />
            </div>

            {/* Below Text Content */}
            <div className="space-y-2 px-1 text-center md:text-left">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-black text-slate-800 leading-tight group-hover:text-[#045c84] transition-colors line-clamp-1">
                        {assignment.book?.name || assignment.title}
                    </h3>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {assignment.class?.name || 'All Classes'}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                        <span className="text-[10px] font-bold text-[#045c84] uppercase tracking-tighter">
                            {new Date(assignment.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4">
                    {/* Status Badge - Subtle */}
                    <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${statusInfo.color}`}>
                        {statusInfo.label}
                    </div>

                    {/* Submission Count */}
                    <div className="flex items-center gap-1.5 grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                        <Users size={10} className="text-slate-400" />
                        <span className="text-[10px] font-black text-slate-500">
                            {assignment._count?.submissions || 0}
                        </span>
                    </div>
                </div>
            </div>

            {/* Three Dot Action Button (Floating relative to card) */}
            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        // openAssignmentDetails(assignment);
                    }}
                    className="w-10 h-10 rounded-2xl bg-white shadow-xl flex items-center justify-center text-slate-400 hover:text-[#045c84] hover:scale-110 active:scale-95 transition-all border border-slate-100"
                >
                    <MoreVertical size={18} />
                </button>
            </div>

            {/* Pin Action */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    togglePinAssignment(assignment);
                }}
                className={`absolute top-4 left-4 z-20 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isPinned ? 'bg-[#045c84] text-white shadow-lg' : 'bg-white/80 backdrop-blur-sm text-slate-300 hover:text-[#045c84] opacity-0 group-hover:opacity-100 border border-white/50'}`}
            >
                <Pin size={14} className={isPinned ? '' : 'rotate-45'} />
            </button>
        </div >
    );
}

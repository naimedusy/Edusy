'use client';

import React, { useState, useEffect } from 'react';
import {
    ClipboardList,
    User,
    Clock,
    CheckCircle2,
    AlertCircle,
    RotateCcw,
    Loader2,
    ChevronRight,
    MessageCircle
} from 'lucide-react';
import { useUI } from '@/components/UIProvider';

interface Submission {
    id: string;
    studentId: string;
    assignmentId: string;
    status: string;
    submittedAt: string;
    student: {
        name: string;
    };
    assignment: {
        id: string;
        title: string;
        book?: {
            name: string;
        };
    };
}

interface StudentAssignmentProgressProps {
    instituteId?: string;
    teacherId?: string;
    title?: string;
}

export default function StudentAssignmentProgress({
    instituteId,
    teacherId,
    title = 'শিক্ষার্থীর অ্যাসাইনমেন্ট প্রগ্রেস'
}: StudentAssignmentProgressProps) {
    const { openAssignmentDetails } = useUI();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSubmissions = async () => {
        try {
            let url = '/api/submissions?';
            if (instituteId) url += `instituteId=${instituteId}&`;
            if (teacherId) url += `teacherId=${teacherId}&`;

            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSubmissions(data.slice(0, 10)); // Show latest 10
            }
        } catch (error) {
            console.error('Failed to fetch dashboard submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (instituteId || teacherId) {
            fetchSubmissions();
        }
    }, [instituteId, teacherId]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return { label: 'জমা দিয়েছে', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: <Clock size={12} /> };
            case 'APPROVED':
                return { label: 'অনুমোদিত', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: <CheckCircle2 size={12} /> };
            case 'RETRY':
                return { label: 'আবার চেষ্টা', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: <RotateCcw size={12} /> };
            case 'REJECTED':
                return { label: 'বাতিল', color: 'bg-red-50 text-red-600 border-red-100', icon: <AlertCircle size={12} /> };
            default:
                return { label: status, color: 'bg-slate-50 text-slate-600 border-slate-100', icon: <AlertCircle size={12} /> };
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="animate-spin text-[#045c84] mb-2" size={32} />
                <p className="text-slate-400 text-xs font-bold font-bengali">লোডিং করা হচ্ছে...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-100 shadow-sm font-bengali h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-[#045c84] rounded-xl shadow-sm">
                        <ClipboardList size={20} />
                    </div>
                    <span>{title}</span>
                </h2>
                <button
                    onClick={fetchSubmissions}
                    className="text-[10px] font-black text-[#045c84] uppercase tracking-widest hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-blue-100 flex items-center gap-1.5"
                >
                    রিফ্রেশ করুন
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {submissions.length > 0 ? (
                    submissions.map((sub) => {
                        const statusInfo = getStatusInfo(sub.status);
                        return (
                            <div
                                key={sub.id}
                                onClick={() => openAssignmentDetails(sub.assignment, { selectedStudentId: sub.studentId })}
                                className="group p-4 bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-blue-200 rounded-[24px] transition-all cursor-pointer flex items-center gap-4 hover:shadow-md active:scale-[0.98]"
                            >
                                {/* Left Side: Student Initial/Icon */}
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#045c84] font-black italic shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                    {sub.student.name?.[0] || 'S'}
                                </div>

                                {/* Middle: Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <h4 className="font-bold text-slate-800 text-sm truncate">{sub.student.name}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border flex items-center gap-1 ${statusInfo.color}`}>
                                            {statusInfo.icon} {statusInfo.label}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium truncate flex items-center gap-1.5">
                                        <span className="text-blue-600 font-bold">{sub.assignment.book?.name || 'অ্যাসাইনমেন্ট'}</span>
                                        <span className="opacity-30">•</span>
                                        <span className="line-clamp-1">{sub.assignment.title}</span>
                                    </p>
                                </div>

                                {/* Right Side: Time/Action */}
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                        {new Date(sub.submittedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                                    </p>
                                    <div className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-300 group-hover:text-blue-600 group-hover:border-blue-100 transition-all">
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
                            <ClipboardList size={32} />
                        </div>
                        <p className="text-slate-400 text-xs font-bold">এখনো কোনো অ্যাসাইনমেন্ট জমা পড়েনি</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
                <a
                    href="/dashboard/assignments"
                    className="w-full h-12 flex items-center justify-center bg-slate-50 hover:bg-[#045c84] hover:text-white text-slate-600 rounded-2xl transition-all font-black text-xs uppercase tracking-[0.2em] gap-2 group"
                >
                    সকল অ্যাসাইনমেন্ট দেখুন
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
            </div>
        </div>
    );
}

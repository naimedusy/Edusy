'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, BookOpen, CreditCard, ChevronRight, User, Edit, ChevronDown, ChevronUp, Printer, Trash2, Loader2, Check, Key, LogIn } from 'lucide-react';
import { useSession } from './SessionProvider';
import PrintLayout from './PrintLayout';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    onEdit?: (student: any, context?: any) => void;
    onUpdate?: () => void;
}

export default function StudentProfileModal({ isOpen, onClose, student, onEdit, onUpdate }: StudentProfileModalProps) {
    const { activeInstitute, user: currentUser, login } = useSession();
    const [activeTab, setActiveTab] = useState<'fees' | 'attendance' | 'assignments' | 'login'>('fees');
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [guardianInfo, setGuardianInfo] = useState<any>(null);
    const [loadingGuardian, setLoadingGuardian] = useState(false);
    const [editingLogin, setEditingLogin] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const fetchGuardianInfo = async () => {
        if (!student?.metadata?.guardianId) {
            setGuardianInfo(null);
            return;
        }
        setLoadingGuardian(true);
        try {
            const res = await fetch(`/api/admin/users?id=${student.metadata.guardianId}`);
            if (res.ok) {
                const data = await res.json();
                setGuardianInfo(data);
            }
        } catch (error) {
            console.error('Failed to fetch guardian info:', error);
        } finally {
            setLoadingGuardian(false);
        }
    };

    const handleUpdateCredentials = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLogin) return;
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingLogin)
            });
            if (res.ok) {
                if (editingLogin.id === student.id) {
                    onUpdate?.();
                } else if (editingLogin.id === guardianInfo?.id) {
                    fetchGuardianInfo();
                }
                setEditingLogin(null);
            }
        } catch (error) {
            console.error('Failed to update credentials:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleQuickLogin = async (identifier: string, password: string) => {
        if (!identifier || !password) {
            alert('আইডি বা পাসওয়ার্ড পাওয়া যায়নি।');
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: identifier, password })
            });
            if (res.ok) {
                const data = await res.json();
                login(data.user);
                window.location.href = '/dashboard';
            } else {
                const err = await res.json();
                alert(err.message || 'লগইন ব্যর্থ হয়েছে।');
            }
        } catch (error) {
            console.error('Quick login failed:', error);
            alert('লগইন করার সময় একটি সমস্যা হয়েছে।');
        } finally {
            setIsSaving(false);
        }
    };

    const isAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN' || currentUser?.role === 'TEACHER';

    const guardianLoginPassword = (guardian: any) => {
        return guardian.password || 'নেই';
    };

    useEffect(() => {
        if (activeTab === 'login' && student?.metadata?.guardianId) {
            fetchGuardianInfo();
        }
    }, [activeTab, student?.metadata?.guardianId]);

    const fetchAssignmentsAndSubmissions = async () => {
        if (!student?.id || !activeInstitute?.id) return;
        setLoadingAssignments(true);
        try {
            const classId = student.metadata?.classId;
            const groupId = student.metadata?.groupId;

            // Build URL for assignments
            let assignmentUrl = `/api/assignments?instituteId=${activeInstitute.id}&role=STUDENT`;
            if (classId) assignmentUrl += `&classId=${classId}`;
            if (groupId) assignmentUrl += `&groupId=${groupId}`;

            const [assignRes, subRes] = await Promise.all([
                fetch(assignmentUrl),
                fetch(`/api/submissions?studentId=${student.id}`)
            ]);

            const assignData = await assignRes.json();
            const subData = await subRes.json();

            setAssignments(Array.isArray(assignData) ? assignData : []);
            setSubmissions(Array.isArray(subData) ? subData : []);
        } catch (error) {
            console.error('Failed to fetch assignment data:', error);
        } finally {
            setLoadingAssignments(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'assignments' && isOpen) {
            fetchAssignmentsAndSubmissions();
        }
    }, [activeTab, isOpen, student?.id, activeInstitute?.id]);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen || !student) return null;

    const renderDescription = (description: string) => {
        if (!description) return <p className="text-slate-400 italic">কোনো বর্ণনা নেই</p>;
        try {
            const parsed = JSON.parse(description);
            if (parsed.version === '2.0' && parsed.sections) {
                return (
                    <div className="space-y-4">
                        {parsed.sections.map((section: any, idx: number) => {
                            const validTasks = section.tasks.filter((t: any) =>
                                t.segments.some((s: any) => s.value.trim() !== '') ||
                                t.segments.some((s: any) => s.type === 'tag')
                            );
                            if (validTasks.length === 0) return null;

                            const bengaliTitle =
                                section.title.includes('Classwork') ? 'ক্লাসের কাজ' :
                                    section.title.includes('Preparation') ? 'প্রস্তুতি' :
                                        section.title.includes('Homework') ? 'বাড়ির কাজ' : section.title;

                            return (
                                <div key={idx} className="space-y-2">
                                    <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${section.title.includes('Classwork') ? 'bg-blue-600' :
                                            section.title.includes('Preparation') ? 'bg-purple-600' :
                                                section.title.includes('Homework') ? 'bg-orange-600' : 'bg-slate-600'
                                            }`} />
                                        {bengaliTitle}
                                    </h6>
                                    <ul className="space-y-2">
                                        {validTasks.map((task: any, tIdx: number) => (
                                            <li key={tIdx} className="flex items-start gap-3 text-[13px] text-slate-800 leading-relaxed font-semibold">
                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {task.segments.map((seg: any, sIdx: number) => {
                                                        if (seg.type === 'tag') {
                                                            const tag = ALL_TAGS.find(t => t.id === seg.value);
                                                            if (!tag) return null;
                                                            return (
                                                                <span key={sIdx} className={`px-2.5 py-1 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest shadow-sm ${tag.color}`}>
                                                                    {tag.label}
                                                                </span>
                                                            );
                                                        }
                                                        return <span key={sIdx}>{seg.value}</span>;
                                                    })}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            return <p className="text-slate-600 font-medium whitespace-pre-wrap">{description}</p>;
        } catch (e) {
            return <p className="text-slate-600 font-medium whitespace-pre-wrap">{description}</p>;
        }
    };

    const ALL_TAGS = [
        { id: 'read', label: 'পড়া', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        { id: 'write', label: 'লেখা', color: 'bg-blue-50 text-[#045c84] border-blue-100' },
        { id: 'memo', label: 'মুখস্থ', color: 'bg-purple-50 text-purple-600 border-purple-100' },
        { id: 'notes', label: 'নোট', color: 'bg-slate-50 text-slate-600 border-slate-200' },
        { id: 'exercise', label: 'অনুশীলনী', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
        { id: 'chapter', label: 'অধ্যায়', color: 'bg-amber-50 text-amber-600 border-amber-100' },
        { id: 'lesson', label: 'পাঠ', color: 'bg-orange-50 text-orange-600 border-orange-100' },
        { id: 'meaning', label: 'শব্দার্থ', color: 'bg-lime-50 text-lime-600 border-lime-100' },
        { id: 'qa', label: 'প্রশ্ন-উত্তর', color: 'bg-violet-50 text-violet-600 border-violet-100' },
        { id: 'grammar', label: 'ব্যাকরণ', color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100' },
        { id: 'test', label: 'পরীক্ষা', color: 'bg-red-50 text-red-600 border-red-100' },
        { id: 'correction', label: 'সংশোধন', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
        { id: 'drawing', label: 'ছবি/চিত্র', color: 'bg-pink-50 text-pink-600 border-pink-100' },
        { id: 'map', label: 'মানচিত্র', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { id: 'mcq', label: 'MCQ', color: 'bg-rose-50 text-rose-600 border-rose-100' },
        { id: 'creative', label: 'সৃজনশীল', color: 'bg-teal-50 text-teal-600 border-teal-100' },
        { id: 'excellent', label: 'চমৎকার', color: 'bg-blue-50 text-[#045c84] border-blue-100' },
        { id: 'attentive', label: 'মনোযোগী', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
        { id: 'improving', label: 'উন্নতি করছে', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        { id: 'incomplete', label: 'অসম্পূর্ণ', color: 'bg-amber-50 text-amber-600 border-amber-100' },
        { id: 'late', label: 'দেরি', color: 'bg-slate-50 text-slate-600 border-slate-200' },
        { id: 'parent-call', label: 'অভিভাবক সাক্ষাত', color: 'bg-rose-50 text-rose-600 border-rose-100' },
        { id: 'behavior', label: 'আচরণ ভালো', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' }
    ];

    const tabs = [
        { id: 'fees', label: 'ফি', icon: CreditCard },
        { id: 'attendance', label: 'উপস্থিতি', icon: Calendar },
        { id: 'assignments', label: 'অ্যাসাইনমেন্ট', icon: BookOpen },
        ...(isAdmin ? [{ id: 'login', label: 'লগইন তথ্য', icon: Key }] : []),
    ];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl animate-scale-in overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 flex items-center justify-between pb-2 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 font-bengali">শিক্ষার্থীর প্রোফাইল</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit?.(student)}
                            className="p-2 text-slate-400 hover:text-[#045c84] hover:bg-slate-100 rounded-full transition-all"
                            title="সম্পাদনা করুন"
                        >
                            <Edit size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Profile Top Section */}
                <div className="flex flex-col items-center pb-6 shrink-0 font-bengali">
                    <div className="w-24 h-24 rounded-full bg-[#CCF2F4] border-4 border-white shadow-sm flex items-center justify-center text-[#045c84] font-bold text-3xl mb-4 overflow-hidden">
                        {student.metadata?.studentPhoto ? (
                            <img src={student.metadata.studentPhoto} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            student.name?.[0] || 'S'
                        )}
                    </div>
                    <h3 className="text-[18px] font-bold text-slate-800 uppercase tracking-tight">{student.name}</h3>
                    <p className="text-slate-500 text-[9px] font-bold">শিক্ষার্থী আইডি: {student.metadata?.studentId || 'নেই'}</p>
                </div>

                {/* Tab Navigation */}
                <div className="px-6 border-b border-slate-100 flex items-center bg-white shrink-0">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-all duration-200 ${isActive
                                    ? 'text-[#045c84] border-[#045c84]'
                                    : 'text-slate-400 border-transparent hover:text-slate-600'
                                    }`}
                            >
                                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-sm font-black font-bengali">
                                    {tab.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide font-bengali">
                    {activeTab === 'fees' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Total Due Card */}
                            <div className="bg-[#FFF5F5] p-6 rounded-2xl flex items-center justify-between border border-red-50">
                                <div>
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">মোট বকেয়া</p>
                                    <h4 className="text-2xl font-bold text-slate-800">৳ ১,২০০</h4>
                                </div>
                                <button className="px-6 py-2.5 bg-[#F43F5E] text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95 text-sm">
                                    পরিশোধ করুন
                                </button>
                            </div>

                            {/* Detailed Due List */}
                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">বকেয়া তালিকা (Due List)</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-sm font-bold text-slate-700 font-bengali">মাসিক ফি (ডিসেম্বর)</span>
                                        <span className="text-sm font-bold text-red-500 font-bengali">৳ ১,০০০</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-sm font-bold text-slate-700 font-bengali">কো-কারিকুলার ফি</span>
                                        <span className="text-sm font-bold text-red-500 font-bengali">৳ ২০০</span>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction History Expandable */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                    className="w-full flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-all font-bengali"
                                >
                                    <span>লেনদেনের ইতিহাস ({isHistoryExpanded ? 'বন্ধ করুন' : 'দেখুন'})</span>
                                    {isHistoryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isHistoryExpanded && (
                                    <div className="space-y-2 animate-fade-in">
                                        <TransactionItem label="মাসিক ফি (নভেম্বর)" date="নভেম্বর ০৫, ২০২৫" status="পরিশোধিত" amount="৳১,০০০" isPaid />
                                        <TransactionItem label="পরীক্ষার ফি" date="অক্টোবর ১২, ২০২৫" status="পরিশোধিত" amount="৳৫০০" isPaid />
                                        <TransactionItem label="ক্রীড়া তহবিল (ডিলেটেড টেস্ট)" date="শেষ তারিখ: ডিসেম্বর ১০ (বাতিল: ২ দিন আগে)" status="বাতিলকৃত" amount="৳২০০" isPaid={false} isDeleted />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Attendance Overview Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#EBFAF2] p-6 rounded-2xl text-center border border-green-50">
                                    <h4 className="text-2xl font-bold text-[#10B981]">৯২%</h4>
                                    <p className="text-xs font-bold text-[#10B981]/80 mt-1">উপস্থিত</p>
                                </div>
                                <div className="bg-[#FFF5F5] p-6 rounded-2xl text-center border border-red-50">
                                    <h4 className="text-2xl font-bold text-[#F43F5E]">৩</h4>
                                    <p className="text-xs font-bold text-[#F43F5E]/80 mt-1">অনুপস্থিত দিন</p>
                                </div>
                            </div>

                            {/* Recent Status List */}
                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">সাম্প্রতিক পরিসংখ্যান</h5>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 pb-3">
                                        <span className="text-sm font-bold text-slate-600">আজ</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-bold rounded-lg">উপস্থিত</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 pb-3">
                                        <span className="text-sm font-bold text-slate-600">গতকাল</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-bold rounded-lg">উপস্থিত</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 pb-3">
                                        <span className="text-sm font-bold text-slate-600">নভেম্বর ২৮</span>
                                        <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-lg">অনুপস্থিত</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="space-y-4 animate-fade-in">
                            {loadingAssignments ? (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                    <Loader2 size={24} className="animate-spin mb-2" />
                                    <p className="text-sm">অ্যাসাইনমেন্ট লোড হচ্ছে...</p>
                                </div>
                            ) : assignments.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 px-6 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                                        <BookOpen size={32} className="text-slate-300" />
                                    </div>
                                    <h5 className="text-sm font-black text-slate-400 font-bengali">কোনো অ্যাসাইনমেন্ট পাওয়া যায়নি</h5>
                                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">অ্যাসাইনমেন্টের তালিকা এখন খালি</p>
                                </div>
                            ) : (
                                assignments.map((assignment) => {
                                    const submission = submissions.find(s => s.assignmentId === assignment.id);
                                    const isSubmitted = !!submission;

                                    return (
                                        <div key={assignment.id} className="bg-white p-7 border border-slate-200 rounded-[32px] space-y-5 hover:border-[#045c84] hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="text-xl font-black text-[#045c84] leading-tight capitalize">
                                                        {assignment.book?.name || 'অ্যাসাইনমেন্ট'}
                                                    </h5>
                                                    <p className="text-sm font-bold text-slate-500 mt-1">
                                                        {assignment.title}
                                                    </p>
                                                </div>
                                                <div className={`flex-shrink-0 px-4 py-1.5 text-[10px] font-black rounded-full border tracking-widest uppercase ${isSubmitted
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    : 'bg-slate-50 text-slate-500 border-slate-100'
                                                    }`}>
                                                    {isSubmitted ? 'জমা দেওয়া হয়েছে' : 'চলমান'}
                                                </div>
                                            </div>

                                            <div className="text-slate-700">
                                                {renderDescription(assignment.description)}
                                            </div>

                                            <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    {isSubmitted ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                                জমা: <span className="text-slate-900 font-bold">{new Date(submission.submittedAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}</span>
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        assignment.deadline && (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-red-400" />
                                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                                                                    শেষ সময়: <span className="text-red-600 font-bold">{new Date(assignment.deadline).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' })}</span>
                                                                </p>
                                                            </div>
                                                        )
                                                    )}
                                                </div>

                                                <button className="text-[11px] font-black text-[#045c84] hover:underline flex items-center gap-1">
                                                    বিস্তারিত <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {activeTab === 'login' && isAdmin && (
                        <div className="space-y-6 animate-fade-in font-bengali">
                            {/* Student Login Info */}
                            <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        শিক্ষার্থীর লগইন প্রোফাইল
                                    </h4>
                                    <button
                                        onClick={() => setEditingLogin(editingLogin?.id === student.id ? null : { id: student.id, name: student.name, email: student.email, phone: student.phone, password: student.password })}
                                        className="text-[10px] font-black text-[#045c84] uppercase tracking-widest hover:underline"
                                    >
                                        {editingLogin?.id === student.id ? 'বাতিল করুন' : 'সম্পাদনা'}
                                    </button>
                                </div>

                                {editingLogin?.id === student.id ? (
                                    <form onSubmit={handleUpdateCredentials} className="space-y-4 pt-2">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আইডি / ইমেইল</label>
                                            <input
                                                type="text"
                                                value={editingLogin.email || ''}
                                                onChange={(e) => setEditingLogin({ ...editingLogin, email: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#045c84]/10 focus:border-[#045c84] outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">পাসওয়ার্ড</label>
                                            <input
                                                type="text"
                                                value={editingLogin.password || ''}
                                                onChange={(e) => setEditingLogin({ ...editingLogin, password: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#045c84]/10 focus:border-[#045c84] outline-none transition-all"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full py-2.5 bg-[#045c84] text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-[#034a6b] transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                                        </button>
                                    </form>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white rounded-2xl border border-slate-50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">লগইন আইডি</p>
                                            <p className="text-sm font-bold text-slate-700">{student.email || student.phone || 'নেই'}</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-slate-50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">পাসওয়ার্ড</p>
                                            <p className="text-sm font-bold text-slate-700">{student.password || '••••••'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleQuickLogin(student.email || student.phone || student.metadata?.studentId, student.password)}
                                            disabled={isSaving}
                                            className="col-span-2 py-3 bg-[#045c84]/10 text-[#045c84] font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-[#045c84] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <LogIn size={14} />
                                            {isSaving ? 'প্রবেশ করা হচ্ছে...' : 'এই আইডি দিয়ে দ্রুত লগইন করুন'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Guardian Login Info */}
                            <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        অভিভাবকের লগইন প্রোফাইল
                                    </h4>
                                    {guardianInfo && (
                                        <button
                                            onClick={() => setEditingLogin(editingLogin?.id === guardianInfo.id ? null : { id: guardianInfo.id, name: guardianInfo.name, email: guardianInfo.email, phone: guardianInfo.phone, password: guardianLoginPassword(guardianInfo) })}
                                            className="text-[10px] font-black text-[#045c84] uppercase tracking-widest hover:underline"
                                        >
                                            {editingLogin?.id === guardianInfo.id ? 'বাতিল করুন' : 'সম্পাদনা'}
                                        </button>
                                    )}
                                </div>

                                {loadingGuardian ? (
                                    <div className="flex flex-col items-center py-4 text-slate-400">
                                        <Loader2 size={20} className="animate-spin mb-2" />
                                        <p className="text-xs">লোড হচ্ছে...</p>
                                    </div>
                                ) : guardianInfo ? (
                                    editingLogin?.id === guardianInfo.id ? (
                                        <form onSubmit={handleUpdateCredentials} className="space-y-4 pt-2">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মোবাইল নম্বর / আইডি</label>
                                                <input
                                                    type="text"
                                                    value={editingLogin.phone || editingLogin.email || ''}
                                                    onChange={(e) => setEditingLogin({ ...editingLogin, phone: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#045c84]/10 focus:border-[#045c84] outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">পাসওয়ার্ড</label>
                                                <input
                                                    type="text"
                                                    value={editingLogin.password || ''}
                                                    onChange={(e) => setEditingLogin({ ...editingLogin, password: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#045c84]/10 focus:border-[#045c84] outline-none transition-all"
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="w-full py-2.5 bg-[#045c84] text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-900/10 hover:bg-[#034a6b] transition-all active:scale-95 disabled:opacity-50"
                                            >
                                                {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
                                            </button>
                                        </form>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-white rounded-2xl border border-slate-50">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">লগইন আইডি</p>
                                                <p className="text-sm font-bold text-slate-700">{guardianInfo.phone || guardianInfo.email || 'নেই'}</p>
                                            </div>
                                            <div className="p-4 bg-white rounded-2xl border border-slate-50">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">পাসওয়ার্ড</p>
                                                <p className="text-sm font-bold text-slate-700">{guardianLoginPassword(guardianInfo)}</p>
                                            </div>
                                            <div className="col-span-2 p-3 bg-white/50 rounded-xl border border-slate-50 flex items-center gap-2">
                                                <User size={14} className="text-slate-400" />
                                                <p className="text-[10px] font-bold text-slate-500">লিঙ্ক করা অভিভাবক: <span className="text-[#045c84]">{guardianInfo.name}</span></p>
                                            </div>
                                            <button
                                                onClick={() => handleQuickLogin(guardianInfo.phone || guardianInfo.email, guardianLoginPassword(guardianInfo))}
                                                disabled={isSaving}
                                                className="col-span-2 py-3 bg-emerald-50 text-emerald-700 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <LogIn size={14} />
                                                {isSaving ? 'প্রবেশ করা হচ্ছে...' : 'অভিভাবক হিসেবে লগইন করুন'}
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    <div className="py-6 px-4 bg-white border-2 border-dashed border-slate-200 rounded-[24px] text-center space-y-3">
                                        <p className="text-xs font-bold text-slate-400">এই শিক্ষার্থীর সাথে কোনো অভিভাবক প্রোফাইল লিঙ্ক করা নেই।</p>
                                        <p className="text-[10px] text-slate-300 uppercase tracking-widest font-black">নতুন অভিভাবক প্রোফাইল তৈরি করুন অথবা লিঙ্ক করুন</p>
                                        <button
                                            onClick={() => onEdit?.(student, { linkGuardian: true })}
                                            className="px-6 py-2 bg-slate-100 text-[#045c84] font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                        >
                                            অভিভাবক লিঙ্ক করুন
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-50 flex items-center justify-end gap-3 shrink-0 font-bengali bg-slate-50/30">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-95 text-xs uppercase tracking-widest shadow-sm"
                    >
                        বন্ধ করুন
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-8 py-3 bg-[#045c84] text-white font-black rounded-2xl shadow-lg shadow-blue-900/10 hover:bg-[#034a6b] hover:-translate-y-0.5 transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2"
                    >
                        <Printer size={16} />
                        ফি কার্ড প্রিন্ট
                    </button>
                </div>

                {/* Formal Print Version (Visible only during print) */}
                {isPrinting && (
                    <div className="hidden">
                        <PrintLayout title="ফি ক্লিয়ারেন্স কার্ড (Fee Clearance Card)" institute={activeInstitute}>
                            <div className="space-y-8">
                                {/* Student Snapshot */}
                                <div className="grid grid-cols-2 gap-10 border-2 border-slate-100 p-6 rounded-2xl">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">নাম (Name)</p>
                                            <p className="text-2xl font-black text-slate-900">{student.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">আইডি (Student ID)</p>
                                            <p className="text-xl font-bold text-slate-700">{student.metadata?.studentId || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-right">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">শ্রেণী (Class)</p>
                                            <p className="text-xl font-bold text-slate-700">{student.metadata?.className || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">রোল (Roll)</p>
                                            <p className="text-xl font-bold text-slate-700">{student.metadata?.roll || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Fee Status Table */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-900 pb-2 uppercase tracking-wide">লেনদেন ও বকেয়া (Transactions & Dues)</h3>
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-bold">বিবরণ (Description)</th>
                                                <th className="border border-slate-300 px-4 py-2 text-right text-sm font-bold">পরিমাণ (Amount)</th>
                                                <th className="border border-slate-300 px-4 py-2 text-center text-sm font-bold">অবস্থা (Status)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            <tr>
                                                <td className="border border-slate-300 px-4 py-3 text-sm font-medium">মাসিক ফি (ডিসেম্বর)</td>
                                                <td className="border border-slate-300 px-4 py-3 text-right text-sm font-bold">৳ ১,০০০</td>
                                                <td className="border border-slate-300 px-4 py-3 text-center text-sm font-bold text-red-600">বকেয়া</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-slate-300 px-4 py-3 text-sm font-medium">কো-কারিকুলার ফি</td>
                                                <td className="border border-slate-300 px-4 py-3 text-right text-sm font-bold">৳ ২০০</td>
                                                <td className="border border-slate-300 px-4 py-3 text-center text-sm font-bold text-red-600">বকেয়া</td>
                                            </tr>
                                            <tr className="bg-slate-50">
                                                <td className="border border-slate-300 px-4 py-3 text-sm font-black text-right">মোট বকেয়া (Total Due):</td>
                                                <td className="border border-slate-300 px-4 py-3 text-right text-lg font-black text-red-600">৳ ১,২০০</td>
                                                <td className="border border-slate-300 px-4 py-3 text-center font-bold text-red-600 uppercase text-xs">Unpaid</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Important Instructions */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">নির্দেশনা (Instructions):</p>
                                    <ul className="text-[10px] text-slate-600 list-disc pl-4 space-y-1">
                                        <li>আগামী ১০ তারিখের মধ্যে বকেয়া ফি পরিশোধ করার জন্য অনুরোধ করা হলো।</li>
                                        <li>এই কার্ডটি সংরক্ষিত রাখুন এবং ফি পরিশোধের সময় সাথে আনুন।</li>
                                        <li>যেকোন জিজ্ঞাসায় অফিস চলাকালীন সময়ে যোগাযোগ করুন।</li>
                                    </ul>
                                </div>
                            </div>
                        </PrintLayout>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

function TransactionItem({ label, date, status, amount, isPaid, isDeleted }: { label: string, date: string, status: string, amount: string, isPaid: boolean, isDeleted?: boolean }) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-xl border border-slate-50 transition-all ${isDeleted ? 'bg-red-50/50 border-red-100 scale-[0.98]' : 'hover:bg-slate-50 hover:border-slate-100'}`}>
            <div className="flex-1">
                <p className={`text-sm font-bold ${isDeleted ? 'text-red-400' : 'text-slate-800'}`}>{label}</p>
                <p className={`text-[10px] font-medium ${isDeleted ? 'text-red-300' : (isPaid ? 'text-slate-400' : 'text-red-400')}`}>{date}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                    <p className={`text-sm font-bold ${isDeleted ? 'text-red-300' : 'text-slate-700'}`}>{amount}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isDeleted ? 'text-red-300' : (isPaid ? 'text-green-500' : 'text-red-500')}`}>
                        {status}
                    </p>
                </div>
                {!isDeleted && (
                    <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="রশিদ প্রিন্ট">
                            <Printer size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="মুছে ফেলুন">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
                {isDeleted && (
                    <div className="text-[10px] font-bold text-red-400 italic px-2">
                        ৭ দিনের মধ্যে মুছে ফেলা হবে
                    </div>
                )}
            </div>
        </div>
    );
}

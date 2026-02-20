'use client';

import React, { useState, useEffect } from 'react';
import {
    ClipboardList,
    Plus,
    CheckCircle2,
    Clock,
    GraduationCap,
    X,
    PenTool,
    ArrowRight,
    CheckCircle,
    Loader2,
    Settings,
    TrendingUp,
    History as HistoryIcon,
    LayoutGrid,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    BookOpen,
    FileText,
    Home
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { useUI } from './UIProvider';
import AssignmentDetailsModal from './AssignmentDetailsModal';
import AssignmentEditorPanel from './AssignmentEditorPanel';
import Toast from './Toast';
import ClassScheduleSettingsModal from './ClassScheduleSettingsModal';

interface ClassData {
    id: string;
    name: string;
}

interface BookData {
    id: string;
    name: string;
    coverImage?: string | null;
}

interface SubjectStatus {
    classId: string;
    className: string;
    bookId: string;
    bookName: string;
    coverImage?: string | null;
    isDone: boolean;
    assignmentId?: string;
    submittedBy?: string; // Added to show who submitted
    assignedTo?: string; // Added to show who is responsible (teacher name)
    status?: string; // Added to track DRAFT/RELEASED
    pendingCount?: number; // Added to show pending submissions
    submittedCount?: number; // Added to show total submissions
    totalStudents?: number; // Added to show total students in class
    canEdit?: boolean; // Added to restrict editing
    assignment?: any; // Store full assignment object for details view
}

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

interface TeacherAssignmentPanelProps {
    onClose?: () => void;
    initialView?: 'LIST' | 'EDITOR';
    initialSubject?: { classId: string, bookId: string } | null;
    onSubjectClick?: (classId: string, bookId: string) => void;
    hideTitle?: boolean;
    initialEditingAssignment?: any;
    onEditComplete?: () => void;
    activeTab?: string;
    onTabChange?: (tab: string) => void;
    viewMode?: 'list' | 'calendar';
    onViewModeChange?: (mode: 'list' | 'calendar') => void;
}

export default function TeacherAssignmentPanel({
    onClose,
    initialView = 'LIST',
    initialSubject = null,
    onSubjectClick,
    hideTitle = false,
    initialEditingAssignment,
    onEditComplete,
    activeTab = 'entry',
    onTabChange,
    viewMode: externalViewMode,
    onViewModeChange
}: TeacherAssignmentPanelProps) {
    const { user, activeInstitute } = useSession();
    const ui = useUI();
    const classScrollRef = React.useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [subjects, setSubjects] = useState<SubjectStatus[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [allClasses, setAllClasses] = useState<ClassData[]>([]);
    const [allBooks, setAllBooks] = useState<BookData[]>([]);
    const [allStudents, setAllStudents] = useState<any[]>([]);

    // View State: LIST or EDITOR
    const [viewState, setViewState] = useState<'LIST' | 'EDITOR'>(initialView);
    const [selectedEntry, setSelectedEntry] = useState<{ classId: string, bookId: string } | null>(initialSubject);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<'MINE' | 'ALL'>((user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? 'ALL' : 'MINE');
    const [activeClassTab, setActiveClassTab] = useState<string>('ALL');
    const [activeStatusTab, setActiveStatusTab] = useState<string>('TOTAL');

    // Details Modal State
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [editingAssignment, setEditingAssignment] = useState<any>(initialEditingAssignment || null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [releasingId, setReleasingId] = useState<string | null>(null);
    const [isBulkReleasing, setIsBulkReleasing] = useState(false);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [scheduleModalClass, setScheduleModalClass] = useState<{ id: string; name: string; schedule?: any } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleBulkRelease = async (ids?: string[]) => {
        const idsToRelease = ids || selectedIds;
        if (!activeInstitute?.id || idsToRelease.length === 0) return;

        setIsBulkReleasing(true);
        try {
            const res = await fetch(`/api/assignments/release?instituteId=${activeInstitute.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignmentIds: idsToRelease })
            });

            if (res.ok) {
                const data = await res.json();
                showToast(`${data.releasedCount}টি অ্যাসাইনমেন্ট রিলিজ করা হয়েছে`, 'success');
                setSelectedIds([]);
                await fetchData();
            } else {
                showToast('রিলিজ করতে ব্যর্থ হয়েছে', 'error');
            }
        } catch (error) {
            console.error('Bulk Release Error:', error);
            showToast('সার্ভার এরর', 'error');
        } finally {
            setIsBulkReleasing(false);
        }
    };

    const handleSingleRelease = async (assignmentId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await handleBulkRelease([assignmentId]);
    };

    const getBengaliDate = (dateString: string) => {
        const date = new Date(dateString);
        const months = [
            'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
            'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
        ];
        const days = [
            'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
        ];

        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const dayName = days[date.getDay()];

        const bnDigits: any = {
            '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
        };
        const toBn = (n: number | string) => n.toString().split('').map(d => bnDigits[d] || d).join('');

        return `${toBn(day)} ${month} ${toBn(year)}, ${dayName}`;
    };

    const fetchData = async () => {
        if (!activeInstitute?.id || !user?.id) return;
        setLoading(true);
        try {
            const isMINE = viewMode === 'MINE';

            // 1. Fetch data
            const [classesRes, booksRes, teachersRes, assignmentsRes, studentsRes] = await Promise.all([
                fetch(`/api/admin/classes?instituteId=${activeInstitute.id}`),
                fetch(`/api/admin/books?instituteId=${activeInstitute.id}`),
                fetch(`/api/teacher?instituteId=${activeInstitute.id}`),
                fetch(`/api/assignments?instituteId=${activeInstitute.id}&role=TEACHER&userId=${user.id}&date=${selectedDate}${isMINE ? '&ownOnly=true' : ''}`),
                fetch(`/api/admin/users?instituteId=${activeInstitute.id}&role=STUDENT`)
            ]);

            const [classes, books, teachers, dateAssignments, students] = await Promise.all([
                classesRes.json(),
                booksRes.json(),
                teachersRes.json(),
                assignmentsRes.json(),
                studentsRes.json()
            ]);

            setAllClasses(classes);
            setAllBooks(books);
            setTeachers(teachers);
            setAllStudents(students);

            // Calculate student counts per class
            const counts: Record<string, number> = {};
            if (Array.isArray(students)) {
                students.forEach((s: any) => {
                    const cId = s.metadata?.classId;
                    if (cId) counts[cId] = (counts[cId] || 0) + 1;
                });
            }

            const subjectList: SubjectStatus[] = [];
            const processedPairs = new Set<string>();

            if (viewMode === 'ALL') {
                classes.forEach((cls: any) => {
                    const classBooks = books.filter((b: any) => b.classId === cls.id);
                    classBooks.forEach((book: any) => {
                        const pairKey = `${cls.id}-${book.id}`;
                        if (processedPairs.has(pairKey)) return;
                        processedPairs.add(pairKey);

                        const assignment = dateAssignments.find((a: any) => a.classId === cls.id && a.bookId === book.id);

                        // Find assigned teacher(s)
                        const assignedTeacher = teachers.find((t: any) =>
                            t.permissions?.classWise?.[cls.id]?.bookIds?.includes(book.id)
                        );

                        const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
                        const isAssigned = assignedTeacher?.userId === user?.id;

                        subjectList.push({
                            classId: cls.id,
                            className: cls.name,
                            bookId: book.id,
                            bookName: book.name,
                            coverImage: book.coverImage,
                            isDone: !!assignment,
                            status: assignment?.status,
                            assignmentId: assignment?.id,
                            submittedBy: assignment?.teacher?.name,
                            assignedTo: assignedTeacher?.user?.name,
                            submittedCount: assignment?.submissions?.length || 0,
                            totalStudents: counts[cls.id] || 0,
                            pendingCount: assignment?.submissions?.filter((s: any) => s.status === 'SUBMITTED').length || 0,
                            canEdit: isAdmin || isAssigned,
                            assignment
                        });
                    });
                });
            } else {
                const currentUserProfile = teachers.find((t: any) => t.userId === user.id);
                if (currentUserProfile?.permissions?.classWise) {
                    Object.keys(currentUserProfile.permissions.classWise).forEach(classId => {
                        const classInfo = classes.find((c: any) => c.id === classId);
                        if (!classInfo) return;

                        const bookIds = currentUserProfile.permissions.classWise[classId].bookIds || [];
                        bookIds.forEach((bookId: string) => {
                            const pairKey = `${classId}-${bookId}`;
                            if (processedPairs.has(pairKey)) return;
                            processedPairs.add(pairKey);

                            const bookInfo = books.find((b: any) => b.id === bookId);
                            if (!bookInfo) return;

                            const assignment = dateAssignments.find((a: any) => a.classId === classId && a.bookId === bookId);

                            const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

                            subjectList.push({
                                classId: classId,
                                className: classInfo.name,
                                bookId: bookId,
                                bookName: bookInfo.name,
                                coverImage: bookInfo.coverImage,
                                isDone: !!assignment,
                                status: assignment?.status,
                                assignmentId: assignment?.id,
                                submittedBy: assignment?.teacher?.name,
                                assignedTo: user.name || 'আপনি',
                                submittedCount: assignment?.submissions?.length || 0,
                                totalStudents: counts[classId] || 0,
                                pendingCount: assignment?.submissions?.filter((s: any) => s.status === 'SUBMITTED').length || 0,
                                canEdit: true, // In MINE mode, it's already filtered to their subjects, or they are Admin
                                assignment
                            });
                        });
                    });
                }
            }

            setSubjects(subjectList);
        } catch (error) {
            console.error('Failed to fetch teacher assignment status:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (initialEditingAssignment) {
            setEditingAssignment(initialEditingAssignment);
            setViewState('EDITOR');
            setSelectedEntry({
                classId: initialEditingAssignment.classId,
                bookId: initialEditingAssignment.bookId
            });
        }
    }, [initialEditingAssignment]);

    useEffect(() => {
        fetchData();
    }, [activeInstitute?.id, user?.id, selectedDate, viewMode]);

    // Center active tab when it changes
    useEffect(() => {
        if (classScrollRef.current && activeClassTab) {
            const container = classScrollRef.current;
            const activeBtn = container.querySelector(`[data-class-id="${activeClassTab}"]`) as HTMLElement;
            if (activeBtn) {
                const containerWidth = container.offsetWidth;
                const btnOffset = activeBtn.offsetLeft;
                const btnWidth = activeBtn.offsetWidth;

                container.scrollTo({
                    left: btnOffset - (containerWidth / 2) + (btnWidth / 2),
                    behavior: 'smooth'
                });
            }
        }
    }, [activeClassTab]);

    const handleEntry = (classId: string, bookId: string) => {
        if (onSubjectClick) {
            onSubjectClick(classId, bookId);
        } else {
            setSelectedEntry({ classId, bookId });
            setEditingAssignment(null); // Ensure we're creating new
            setViewState('EDITOR'); // Switch to Editor view
            if (ui?.setAssignmentModalView) ui.setAssignmentModalView('EDITOR'); // Sync global UI state
        }
    };

    const handleEditAssignment = (assignment: any) => {
        setEditingAssignment(assignment);
        setSelectedEntry({ classId: assignment.classId, bookId: assignment.bookId });
        setViewState('EDITOR');
        if (ui?.setAssignmentModalView) ui.setAssignmentModalView('EDITOR');
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm flex items-center justify-center min-h-[200px]">
                <Loader2 className="animate-spin text-[#045c84]" size={32} />
            </div>
        );
    }

    // EDITOR VIEW
    if (viewState === 'EDITOR' && selectedEntry) {
        return (
            <AssignmentEditorPanel
                onBack={() => {
                    setViewState('LIST');
                    if (ui?.setAssignmentModalView) ui.setAssignmentModalView('LIST');
                    setSelectedEntry(null);
                    setEditingAssignment(null);
                }}
                onSave={async (data) => {
                    const isUpdate = !!editingAssignment?.id;
                    const res = await fetch('/api/assignments', {
                        method: isUpdate ? 'PATCH' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(isUpdate ? { ...data, id: editingAssignment.id } : data)
                    });

                    if (res.ok) {
                        setToast({ message: 'অ্যাসাইনমেন্ট সফলভাবে সেভ করা হয়েছে', type: 'success' });
                        await fetchData(); // Refresh data

                        // Small delay before returning to list so user sees the toast
                        setTimeout(() => {
                            setViewState('LIST'); // Return to list
                            if (ui?.setAssignmentModalView) ui.setAssignmentModalView('LIST'); // Sync global UI state
                            setSelectedEntry(null); // Clear selection
                            setEditingAssignment(null);
                            if (onEditComplete) onEditComplete();
                        }, 1000);
                    } else {
                        let errorMessage = 'সেভ করতে ব্যর্থ হয়েছে';
                        try {
                            const errorData = await res.json();
                            errorMessage = errorData.message || errorMessage;
                        } catch (e) {
                            console.error('Failed to parse error response');
                        }
                        setToast({ message: errorMessage, type: 'error' });
                    }
                }}
                classes={allClasses}
                books={allBooks}
                teacherId={user?.id || ''}
                instituteId={activeInstitute?.id || ''}
                initialClassId={selectedEntry.classId}
                initialBookId={selectedEntry.bookId}
                scheduledDate={selectedDate}
                initialAssignment={editingAssignment}
            />
        );
    }

    // LIST VIEW (Default)
    const filteredSubjects = activeClassTab === 'ALL'
        ? subjects
        : subjects.filter(s => s.classId === activeClassTab);

    const availableClasses = (viewMode === 'ALL'
        ? allClasses
        : Array.from(new Set(subjects.map(s => s.classId)))
            .map(id => {
                const cls = subjects.find(s => s.classId === id);
                return { id, name: cls?.className || 'Unknown' };
            })
    ).sort((a, b) => a.name.localeCompare(b.name));

    // Status Filter Logic
    const stats = {
        TOTAL: filteredSubjects.length,
        DRAFTING: filteredSubjects.filter(s => s.status === 'DRAFT').length,
        WAITING: filteredSubjects.filter(s => !s.isDone).length,
        RELEASED: filteredSubjects.filter(s => s.status === 'RELEASED').length,
        SUBMITTED: filteredSubjects.filter(s => (s.pendingCount || 0) > 0).length,
        APPROVED: filteredSubjects.filter(s => s.isDone && (s.pendingCount || 0) === 0 && s.status === 'RELEASED').length,
    };

    const displaySubjects = (() => {
        switch (activeStatusTab) {
            case 'DRAFTING': return filteredSubjects.filter(s => s.status === 'DRAFT');
            case 'WAITING': return filteredSubjects.filter(s => !s.isDone);
            case 'RELEASED': return filteredSubjects.filter(s => s.status === 'RELEASED');
            case 'SUBMITTED': return filteredSubjects.filter(s => (s.pendingCount || 0) > 0);
            case 'APPROVED': return filteredSubjects.filter(s => s.isDone && (s.pendingCount || 0) === 0 && s.status === 'RELEASED');
            default: return filteredSubjects;
        }
    })();

    return (
        <div className="space-y-4 font-bengali">
            {/* Contextual Grid Controls */}
            <div className="bg-white/40 backdrop-blur-xl rounded-[32px] border border-slate-200/50 p-4 shadow-sm space-y-4">
                {/* 1. Class Navigation (Top Priority) */}
                {availableClasses.length > 0 && (
                    <div className="flex items-center gap-3">
                        <div
                            ref={classScrollRef}
                            className="flex-1 flex items-center gap-2 overflow-x-auto pb-2 px-1 scroll-smooth scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
                        >
                            <button
                                data-class-id="ALL"
                                onClick={() => setActiveClassTab('ALL')}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0 ${activeClassTab === 'ALL'
                                    ? 'bg-[#045c84] text-white border-[#045c84] shadow-xl shadow-[#045c84]/20'
                                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-[#045c84]/30 hover:shadow-md'
                                    }`}
                            >
                                সব ক্লাস ({availableClasses.length})
                            </button>
                            {availableClasses.map(cls => (
                                <button
                                    key={cls.id}
                                    data-class-id={cls.id}
                                    onClick={() => setActiveClassTab(cls.id)}
                                    className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border shrink-0 ${activeClassTab === cls.id
                                        ? 'bg-[#045c84] text-white border-[#045c84] shadow-xl shadow-[#045c84]/20'
                                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-[#045c84]/30 hover:shadow-md'
                                        }`}
                                >
                                    {cls.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 2. Primary Tabs (Status & Entry / History) - Moved under Class Tabs */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100/50">
                    <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-1.5 rounded-[20px] border border-slate-200 shadow-inner w-full md:w-auto">
                        <button
                            onClick={() => onTabChange?.('entry')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'entry' ? 'bg-white text-[#045c84] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <PenTool size={14} />
                            স্ট্যাটাস
                        </button>
                        <button
                            onClick={() => onTabChange?.('history')}
                            className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white text-[#045c84] shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <HistoryIcon size={14} />
                            হিস্টোরি
                        </button>

                        <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

                        {/* Date Picker */}
                        <div className="relative group flex-1 md:flex-none">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full md:w-auto bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black text-[#045c84] outline-none hover:border-[#045c84]/50 transition-all cursor-pointer shadow-sm uppercase tracking-widest"
                            />
                        </div>

                        {/* Mine / All compact toggle */}
                        <button
                            onClick={() => setViewMode(viewMode === 'MINE' ? 'ALL' : 'MINE')}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${viewMode === 'MINE'
                                ? 'bg-[#045c84] text-white border-[#045c84] shadow-sm'
                                : 'bg-white text-slate-400 border-slate-200 hover:border-[#045c84]/30 hover:text-slate-600'
                                }`}
                            title={viewMode === 'MINE' ? 'সব বিষয় দেখুন' : 'শুধু আমার বিষয়'}
                        >
                            <BookOpen size={10} />
                            {viewMode === 'MINE' ? 'আমার' : 'সব'}
                        </button>
                    </div>

                    {/* View Controls (History only) and Close Button */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {activeTab === 'history' && onViewModeChange && (
                            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
                                <button
                                    onClick={() => onViewModeChange('list')}
                                    className={`p-2 rounded-lg transition-all ${externalViewMode === 'list' ? 'bg-white text-[#045c84] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    onClick={() => onViewModeChange('calendar')}
                                    className={`p-2 rounded-lg transition-all ${externalViewMode === 'calendar' ? 'bg-white text-[#045c84] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <CalendarIcon size={16} />
                                </button>
                            </div>
                        )}

                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Unified Status Dashboard - ONLY IN HISTORY TAB */}
            {activeTab === 'history' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { id: 'TOTAL', label: 'সর্বমোট কাজ', count: stats.TOTAL, color: 'slate', icon: ClipboardList },
                        { id: 'WAITING', label: 'অপেক্ষমাণ', count: stats.WAITING, color: 'amber', icon: Clock },
                        { id: 'DRAFTING', label: 'ড্রাফটিং', count: stats.DRAFTING, color: 'blue', icon: PenTool },
                        { id: 'RELEASED', label: 'রিলিজ করা', count: stats.RELEASED, color: 'emerald', icon: CheckCircle2 },
                        { id: 'SUBMITTED', label: 'জমা হয়েছে', count: stats.SUBMITTED, color: 'purple', icon: TrendingUp },
                        { id: 'APPROVED', label: 'অনুমোদিত', count: stats.APPROVED, color: 'teal', icon: CheckCircle },
                    ].map(tab => {
                        const Icon = tab.icon as any;
                        const isActive = activeStatusTab === tab.id;
                        const colors: any = {
                            slate: 'text-slate-600 bg-slate-100 border-slate-200 active:bg-slate-800',
                            amber: 'text-amber-600 bg-amber-50 border-amber-100 active:bg-amber-600',
                            blue: 'text-blue-600 bg-blue-50 border-blue-100 active:bg-blue-600',
                            emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 active:bg-emerald-600',
                            purple: 'text-purple-600 bg-purple-50 border-purple-100 active:bg-purple-600',
                            teal: 'text-teal-600 bg-teal-50 border-teal-100 active:bg-teal-600',
                        };

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveStatusTab(tab.id)}
                                className={`group relative flex flex-col items-start p-4 rounded-[24px] border transition-all duration-300 ${isActive
                                    ? `bg-gradient-to-br from-slate-800 to-slate-900 border-slate-900 shadow-xl -translate-y-1`
                                    : `bg-white border-slate-100 hover:border-[#045c84]/20 hover:shadow-lg`
                                    }`}
                            >
                                <div className={`p-2 rounded-xl mb-2 transition-colors ${isActive ? 'bg-white/10 text-white' : `${colors[tab.color].split(' ')[1]} ${colors[tab.color].split(' ')[0]}`}`}>
                                    <Icon size={16} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>{tab.label}</span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className={`text-2xl font-black ${isActive ? 'text-white' : 'text-slate-800'}`}>{tab.count}</span>
                                    {tab.id === 'SUBMITTED' && tab.count > 0 && (
                                        <span className="flex h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                                    )}
                                </div>
                                {/* Accent line for active state */}
                                {isActive && (
                                    <div className="absolute top-4 right-4 w-1 h-6 bg-[#045c84] rounded-full shadow-[0_0_8px_#045c84]" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Subject Entry Grid - ONLY IN ENTRY TAB */}
            {activeTab === 'entry' && (
                <>
                    {/* Action Bar (Contextual) */}
                    {(activeStatusTab === 'DRAFTING' && stats.DRAFTING > 0) || selectedIds.length > 0 ? (
                        <div className="bg-[#045c84] p-4 rounded-3xl border border-[#045c84] shadow-2xl shadow-[#045c84]/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                    <Settings size={20} className="animate-spin-slow" />
                                </div>
                                <div>
                                    <p className="text-white text-xs font-black uppercase tracking-widest">বাল্ক অ্যাকশন প্যানেল</p>
                                    <p className="text-blue-200/60 text-[10px] font-bold uppercase tracking-widest">
                                        {selectedIds.length > 0 ? `${selectedIds.length}টি বিষয় সিলেক্ট করা হয়েছে` : `${stats.DRAFTING}টি ড্রাফট রিলিজের জন্য প্রস্তুত`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => setSelectedIds([])}
                                    className="flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#045c84] bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10"
                                >
                                    বাতিল করুন
                                </button>
                                <button
                                    onClick={() => {
                                        if (selectedIds.length > 0) handleBulkRelease();
                                        else handleBulkRelease(displaySubjects.filter(s => s.status === 'DRAFT' && s.assignmentId).map(s => s.assignmentId as string));
                                    }}
                                    disabled={isBulkReleasing}
                                    className="flex-1 md:flex-none px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#045c84] bg-white shadow-xl shadow-white/10 hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                                >
                                    {isBulkReleasing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="group-hover:rotate-12 transition-transform" />}
                                    রিলিজ কনফার্ম করুন
                                </button>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-6">
                        {Object.entries(
                            displaySubjects.reduce((acc: any, s: any) => {
                                if (!acc[s.className]) acc[s.className] = [];
                                acc[s.className].push(s);
                                return acc;
                            }, {})
                        ).map(([className, classSubjects]: [string, any]) => (
                            <div key={className} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Class Header */}
                                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-[#045c84] rounded-full" />
                                        <h3 className="text-lg font-black text-slate-800">{className}</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-slate-100">
                                            <CalendarIcon size={12} />
                                            {getBengaliDate(selectedDate)}
                                        </div>
                                        {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (() => {
                                            const cls = allClasses.find(c => c.name === className);
                                            return cls ? (
                                                <button
                                                    onClick={() => setScheduleModalClass({ id: cls.id, name: cls.name, schedule: (cls as any).schedule })}
                                                    className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-[#045c84] hover:border-[#045c84]/30 rounded-xl transition-all shadow-sm"
                                                    title="ক্লাস সময়সূচী সেটিংস"
                                                >
                                                    <Settings size={14} />
                                                </button>
                                            ) : null;
                                        })()}
                                    </div>
                                </div>

                                {/* Subjects List */}
                                <div className="divide-y divide-slate-100">
                                    {classSubjects.map((s: any, idx: number) => {
                                        const isExpanded = expandedSubject === `${s.classId}-${s.bookId}`;
                                        const progress = s.totalStudents > 0 ? (s.submittedCount / s.totalStudents) * 100 : 0;

                                        // Parse assignment description for details
                                        let details: any = { homework: '', classwork: '', nextWork: '', comments: '' };
                                        if (s.assignment?.description) {
                                            try {
                                                const parsed = JSON.parse(s.assignment.description);
                                                if (parsed.sections) {
                                                    parsed.sections.forEach((sec: any) => {
                                                        const tasks = sec.tasks || [];
                                                        if (sec.title.includes('Homework')) details.homework = tasks;
                                                        if (sec.title.includes('Classwork')) details.classwork = tasks;
                                                        if (sec.title.includes('Preparation')) details.nextWork = tasks;
                                                        if (sec.title.includes('Comments')) details.comments = tasks;
                                                    });
                                                }
                                            } catch (e) {
                                                details.homework = s.assignment.description;
                                            }
                                        }

                                        return (
                                            <div key={`${s.classId}-${s.bookId}`} className="group transition-all">
                                                {/* Thin Sub-card */}
                                                <div
                                                    onClick={() => !s.isDone ? (s.canEdit ? handleEntry(s.classId, s.bookId) : setToast({ message: 'আপনার এই বিষয়ের জন্য পারমিশন নেই', type: 'error' })) : setExpandedSubject(isExpanded ? null : `${s.classId}-${s.bookId}`)}
                                                    className={`px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors ${!s.isDone ? (s.canEdit ? 'bg-amber-50/30' : 'bg-slate-100/30 grayscale-sm opacity-60') : ''}`}
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                                            {s.coverImage ? <img src={s.coverImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><BookOpen size={16} /></div>}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-slate-800 text-sm truncate">{s.bookName}</h4>
                                                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.assignedTo || 'Teacher'}</p>
                                                        </div>
                                                    </div>

                                                    {!s.isDone ? (
                                                        <div className="flex items-center gap-3">
                                                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded-full border border-amber-200 uppercase tracking-widest">পেন্ডিং</span>
                                                            <ArrowRight size={16} className="text-amber-400 group-hover:translate-x-1 transition-transform" />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-6 flex-1 max-w-md">
                                                            {/* Progress Bar Container */}
                                                            <div className="flex-1 space-y-1.5">
                                                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                                                    <span className="text-slate-400">সাবমিশন প্রগ্রেস</span>
                                                                    <span className={progress === 100 ? 'text-emerald-600' : 'text-[#045c84]'}>{Math.round(progress)}% ({s.submittedCount}/{s.totalStudents})</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                                                                    <div
                                                                        className={`h-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-[#045c84]'}`}
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                            </div>

                                                            <button
                                                                className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-[#045c84] text-white' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                                            >
                                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Expanded Content */}
                                                {isExpanded && (
                                                    <div className="px-6 py-6 bg-slate-50/50 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {[
                                                                { title: 'বাড়ির কাজ (HW)', icon: <Home size={14} />, tasks: details.homework, color: 'text-[#045c84]' },
                                                                { title: 'ক্লাসের কাজ (CW)', icon: <FileText size={14} />, tasks: details.classwork, color: 'text-blue-600' },
                                                                { title: 'পরবর্তী ক্লাসের প্রস্তুতি', icon: <TrendingUp size={14} />, tasks: details.nextWork, color: 'text-purple-600' },
                                                                { title: 'মন্তব্য', icon: <MessageSquare size={14} />, tasks: details.comments, color: 'text-emerald-600' }
                                                            ].map((section, sIdx) => {
                                                                if (!section.tasks || section.tasks.length === 0) return null;

                                                                return (
                                                                    <div key={sIdx} className="bg-white p-4 rounded-2xl border border-slate-200/50 shadow-sm space-y-3">
                                                                        <div className={`flex items-center justify-between ${section.color}`}>
                                                                            <div className="flex items-center gap-2">
                                                                                {section.icon}
                                                                                <span className="text-[10px] font-black uppercase tracking-widest">{section.title}</span>
                                                                            </div>
                                                                            <span className="text-[9px] font-black bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 text-slate-400">
                                                                                {s.submittedCount}/{s.totalStudents}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            {section.tasks.map((task: any, tIdx: number) => {
                                                                                const targetedNames = task.targetStudents?.map((sid: string) => allStudents.find(st => st.id === sid)?.name).filter(Boolean);

                                                                                return (
                                                                                    <div key={tIdx} className="flex flex-col gap-1">
                                                                                        <div className="flex gap-2">
                                                                                            <span className="text-[#045c84] mt-0.5 font-black shrink-0">→</span>
                                                                                            <div className="flex flex-wrap gap-1 items-center">
                                                                                                {task.segments ? task.segments.map((seg: any, segIdx: number) => {
                                                                                                    if (seg.type === 'tag') {
                                                                                                        const tag = ALL_TAGS.find(at => at.id === seg.value);
                                                                                                        return (
                                                                                                            <span key={segIdx} className={`px-1.5 py-0 text-[8px] font-black rounded ${tag?.color || 'bg-slate-100 text-slate-500'} border border-current/10 uppercase`}>
                                                                                                                {tag?.label || seg.value}
                                                                                                            </span>
                                                                                                        );
                                                                                                    }
                                                                                                    return <span key={segIdx} className="text-[11px] font-bold text-slate-600">{seg.value}</span>;
                                                                                                }) : <span className="text-[11px] font-bold text-slate-600">{task.text}</span>}
                                                                                            </div>
                                                                                        </div>
                                                                                        {targetedNames && targetedNames.length > 0 && (
                                                                                            <p className="ml-5 text-[8px] font-black text-blue-500 uppercase tracking-tight">
                                                                                                🎯 Only for: {targetedNames.join(', ')}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="mt-6 flex justify-end gap-3">
                                                            <button
                                                                onClick={() => setSelectedAssignment(s.assignment)}
                                                                className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm"
                                                            >
                                                                বিস্তারিত দেখুন
                                                            </button>
                                                            {s.status === 'DRAFT' && s.canEdit && (
                                                                <button
                                                                    onClick={(e) => handleSingleRelease(s.assignmentId, e)}
                                                                    className="px-6 py-2.5 bg-[#045c84] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#034a6b] transition-all shadow-lg shadow-[#045c84]/20"
                                                                >
                                                                    রিলিজ করুন
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {displaySubjects.length === 0 && (
                        <div className="bg-white rounded-[32px] p-12 text-center border border-dashed border-slate-200 mt-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <GraduationCap size={32} />
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4">
                                {viewMode === 'MINE'
                                    ? 'আপনার কোনো ক্লাস বা বিষয় নির্ধারিত নেই'
                                    : 'এই ভিউতে কোনো বিষয় খুঁজে পাওয়া যায়নি'}
                            </p>
                            {viewMode === 'MINE' && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                                <div className="flex flex-col items-center gap-3">
                                    <a href="/dashboard/teachers" className="inline-flex items-center gap-2 px-4 py-2 bg-[#045c84] text-white text-xs font-bold rounded-xl hover:bg-[#034a6b] transition-colors">
                                        <Settings size={14} />
                                        পারমিশন সেট করুন
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            <AssignmentDetailsModal
                isOpen={!!selectedAssignment}
                onClose={() => setSelectedAssignment(null)}
                assignment={selectedAssignment}
                onRelease={handleSingleRelease}
                onEdit={handleEditAssignment}
                isReleasing={releasingId === selectedAssignment?.id}
                canEdit={displaySubjects.find(s => s.assignmentId === selectedAssignment?.id)?.canEdit}
            />

            {/* Class Schedule Settings Modal */}
            {scheduleModalClass && (
                <ClassScheduleSettingsModal
                    isOpen={!!scheduleModalClass}
                    onClose={() => setScheduleModalClass(null)}
                    classId={scheduleModalClass.id}
                    className={scheduleModalClass.name}
                    existingSchedule={scheduleModalClass.schedule}
                />
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}

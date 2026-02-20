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
    Calendar as CalendarIcon
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { useUI } from './UIProvider';
import AssignmentDetailsModal from './AssignmentDetailsModal';
import AssignmentEditorPanel from './AssignmentEditorPanel';
import Toast from './Toast';

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
    assignment?: any; // Store full assignment object for details view
}

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

    const fetchData = async () => {
        if (!activeInstitute?.id || !user?.id) return;
        setLoading(true);
        try {
            const isMINE = viewMode === 'MINE';

            // 1. Fetch data
            const [classesRes, booksRes, teachersRes, assignmentsRes] = await Promise.all([
                fetch(`/api/admin/classes?instituteId=${activeInstitute.id}`),
                fetch(`/api/admin/books?instituteId=${activeInstitute.id}`),
                fetch(`/api/teacher?instituteId=${activeInstitute.id}`),
                fetch(`/api/assignments?instituteId=${activeInstitute.id}&role=TEACHER&userId=${user.id}&date=${selectedDate}${isMINE ? '&ownOnly=true' : ''}`)
            ]);

            const [classes, books, teachers, dateAssignments] = await Promise.all([
                classesRes.json(),
                booksRes.json(),
                teachersRes.json(),
                assignmentsRes.json()
            ]);

            setAllClasses(classes);
            setAllBooks(books);
            setTeachers(teachers);

            const subjectList: SubjectStatus[] = [];
            const processedPairs = new Set<string>();

            if (viewMode === 'ALL') {
                // "ALL" mode: Show ALL Class-Book combinations in the institute
                classes.forEach((cls: any) => {
                    const classBooks = books.filter((b: any) => b.classId === cls.id);
                    classBooks.forEach((book: any) => {
                        const pairKey = `${cls.id}-${book.id}`;
                        if (processedPairs.has(pairKey)) return;
                        processedPairs.add(pairKey);

                        const assignment = dateAssignments.find((a: any) => a.classId === cls.id && a.bookId === book.id);

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

                        // Find assigned teacher(s)
                        const assignedTeacher = teachers.find((t: any) =>
                            t.permissions?.classWise?.[cls.id]?.bookIds?.includes(book.id)
                        );

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
                            pendingCount: assignment?.pendingCount || 0,
                            assignment: { ...assignment, taskTypes }
                        });
                    });
                });
            } else {
                // "MINE" mode: Only show subjects assigned to the current user
                // relevantProfiles is already filtered to just the user in 'MINE' mode
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

                            subjectList.push({
                                classId,
                                className: classInfo.name,
                                bookId,
                                bookName: bookInfo.name,
                                coverImage: bookInfo.coverImage,
                                isDone: !!assignment,
                                status: assignment?.status,
                                assignmentId: assignment?.id,
                                submittedBy: assignment?.teacher?.name,
                                assignedTo: currentUserProfile?.user?.name,
                                pendingCount: assignment?.pendingCount || 0,
                                assignment: { ...assignment, taskTypes }
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

                        {/* Mode Toggles (Mine/All) moved here to save space */}
                        <div className="hidden md:flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200 shadow-inner shrink-0">
                            <button
                                onClick={() => setViewMode('MINE')}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'MINE' ? 'bg-white text-[#045c84] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                আমার বিষয়
                            </button>
                            <button
                                onClick={() => setViewMode('ALL')}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'ALL' ? 'bg-white text-[#045c84] shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                সম্পূর্ণ প্রতিষ্ঠান
                            </button>
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

                        {/* Date Picker Integrated beside tabs */}
                        <div className="relative group flex-1 md:flex-none">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full md:w-auto bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black text-[#045c84] outline-none hover:border-[#045c84]/50 transition-all cursor-pointer shadow-sm uppercase tracking-widest"
                            />
                        </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displaySubjects.map((s, idx) => {
                            const isPending = !s.isDone;

                            if (isPending) {
                                return (
                                    <div
                                        key={`${s.classId}-${s.bookId}`}
                                        onClick={() => handleEntry(s.classId, s.bookId)}
                                        className="group bg-white p-4 rounded-[20px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-[#045c84]/30 transition-all cursor-pointer relative overflow-hidden flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 group-hover:scale-105 transition-transform">
                                            {s.coverImage ? (
                                                <img src={s.coverImage} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <GraduationCap size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-bold text-slate-800 text-sm truncate group-hover:text-[#045c84] transition-colors">{s.bookName}</h3>
                                                {viewMode === 'ALL' && s.assignedTo && (
                                                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0 whitespace-nowrap">
                                                        {s.assignedTo}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.className}</p>
                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                <span className="flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase tracking-tighter">
                                                    পেন্ডিং
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-8 h-8 bg-[#045c84] text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all absolute right-2 top-1/2 -translate-y-1/2 translate-x-10 group-hover:translate-x-0 shadow-lg">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={`${s.classId}-${s.bookId}`}
                                    onClick={() => setSelectedAssignment(s.assignment)}
                                    className={`bg-slate-50/50 p-4 rounded-[24px] border border-slate-100 opacity-90 flex items-center gap-4 group hover:grayscale-0 transition-all cursor-pointer hover:bg-white hover:opacity-100 hover:shadow-xl relative overflow-hidden h-[200px] ${selectedIds.includes(s.assignmentId!) ? 'ring-2 ring-blue-500 border-blue-200 bg-white opacity-100' : ''}`}
                                >
                                    {s.status === 'DRAFT' && s.assignmentId && (
                                        <div
                                            className="absolute top-4 left-4 z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedIds(prev =>
                                                    prev.includes(s.assignmentId!)
                                                        ? prev.filter(id => id !== s.assignmentId)
                                                        : [...prev, s.assignmentId!]
                                                );
                                            }}
                                        >
                                            <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${selectedIds.includes(s.assignmentId) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'}`}>
                                                {selectedIds.includes(s.assignmentId) && <CheckCircle2 size={12} className="text-white" />}
                                            </div>
                                        </div>
                                    )}
                                    <div className="w-14 h-14 bg-white rounded-2xl overflow-hidden shrink-0 border border-slate-200 relative shadow-sm group-hover:scale-105 transition-transform ml-2">
                                        {s.coverImage ? (
                                            <img src={s.coverImage} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <GraduationCap size={24} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <h3 className="font-black text-slate-700 text-base truncate group-hover:text-[#045c84] transition-colors">
                                                {s.bookName}
                                            </h3>
                                            {s.status === 'RELEASED' ? (
                                                s.pendingCount && s.pendingCount > 0 ? (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded-full border border-blue-100 uppercase tracking-tighter">
                                                        <Clock size={10} /> SUBMITTED
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full border border-emerald-100 uppercase tracking-tighter">
                                                        <CheckCircle2 size={10} /> APPROVED
                                                    </div>
                                                )
                                            ) : (
                                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded-full border border-amber-100 uppercase tracking-tighter">
                                                    <Clock size={10} /> DRAFT
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mb-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.className}</p>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <p className="text-[10px] font-bold text-slate-500 truncate italic">by {s.submittedBy || 'Teacher'}</p>
                                        </div>

                                        {s.pendingCount ? (
                                            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                                                    <Clock size={12} />
                                                    {s.pendingCount}টি পেন্ডিং সাবমিশন
                                                </span>
                                                <span className="text-[10px] font-black text-amber-600 group-hover:translate-x-1 transition-transform">&rarr;</span>
                                            </div>
                                        ) : s.status === 'RELEASED' && (
                                            <div className="mb-3 px-3 py-2 bg-emerald-50/50 border border-emerald-100/50 rounded-xl flex items-center justify-between">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} />
                                                    সব ঠিক আছে
                                                </span>
                                            </div>
                                        )}

                                        {/* Task Type Indicators */}
                                        {s.assignment?.taskTypes && s.assignment.taskTypes.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {s.assignment.taskTypes.map((type: string) => {
                                                    let color = 'bg-slate-100 text-slate-500 border-slate-200';
                                                    if (type === 'ক্লাসের কাজ') color = 'bg-blue-50 text-blue-600 border-blue-100';
                                                    if (type === 'প্রস্তুতি') color = 'bg-purple-50 text-purple-600 border-purple-100';
                                                    if (type === 'বাড়ির কাজ') color = 'bg-orange-50 text-orange-600 border-orange-100';
                                                    if (type === 'মন্তব্য') color = 'bg-emerald-50 text-emerald-600 border-emerald-100';

                                                    return (
                                                        <span key={type} className={`px-2 py-0.5 ${color} text-[8px] font-black rounded border uppercase tracking-tighter`}>
                                                            {type}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Individual Release Button for DRAFT assignments */}
                                    {s.status === 'DRAFT' && s.assignmentId && (
                                        <button
                                            onClick={(e) => handleSingleRelease(s.assignmentId as string, e)}
                                            disabled={releasingId === s.assignmentId}
                                            className="ml-2 h-10 px-4 bg-[#045c84] text-white text-[10px] font-black rounded-xl shadow-lg shadow-[#045c84]/20 hover:bg-[#034a6b] hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:hover:translate-y-0"
                                        >
                                            {releasingId === s.assignmentId ? (
                                                <Loader2 className="animate-spin" size={12} />
                                            ) : (
                                                <ArrowRight size={12} />
                                            )}
                                            রিলিজ
                                        </button>
                                    )}
                                </div>
                            );
                        })}
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
            />

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

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
    Plus,
    Search,
    ClipboardList,
    ChevronDown,
    Filter,
    GraduationCap,
    Users,
    Activity,
    TrendingUp,
    PenTool,
    History,
    LayoutGrid,
    Calendar as CalendarIcon
} from 'lucide-react';
import AssignmentCalendar from '@/components/AssignmentCalendar';
import { useSession } from '@/components/SessionProvider';
import AssignmentCard from '@/components/AssignmentCard';
import AssignmentDetailsModal from '@/components/AssignmentDetailsModal';
import Toast from '@/components/Toast';
import TeacherAssignmentPanel from '@/components/TeacherAssignmentPanel';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUI } from '@/components/UIProvider';

function AssignmentsPageContent() {
    const { user, activeInstitute, activeRole } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { openAssignmentModal } = useUI();

    // Default to Status (entry) tab for Teachers and Admins, History for others
    const isAdminOrTeacher = activeRole === 'TEACHER' || activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN';
    const currentTab = searchParams.get('tab') || (isAdminOrTeacher ? 'entry' : 'history');

    const [assignments, setAssignments] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [books, setBooks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [teacherProfile, setTeacherProfile] = useState<any>(null);

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isReleasing, setIsReleasing] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [editingAssignment, setEditingAssignment] = useState<any>(null);
    const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [monthAssignments, setMonthAssignments] = useState<any[]>([]);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [isBulkReleasing, setIsBulkReleasing] = useState(false);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchData = async () => {
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            // Fetch Assignments for specific date
            // For students, we always include their classId and groupId if available
            let url = `/api/assignments?instituteId=${activeInstitute.id}&role=${activeRole}&userId=${user?.id}&date=${selectedDate}`;
            if (activeRole === 'STUDENT' && user?.metadata?.classId) {
                url += `&classId=${user.metadata.classId}`;
                if (user.metadata.groupId) url += `&groupId=${user.metadata.groupId}`;
            }

            const assignmentsRes = await fetch(url);
            const assignmentsData = await assignmentsRes.json();
            if (Array.isArray(assignmentsData)) setAssignments(assignmentsData);

            // Fetch Classes & Books (needed for creation and filtering)
            const classesRes = await fetch(`/api/admin/classes?instituteId=${activeInstitute.id}`);
            const classesData = await classesRes.json();

            const booksRes = await fetch(`/api/admin/books?instituteId=${activeInstitute.id}`);
            const booksData = await booksRes.json();

            if (activeRole === 'TEACHER' && user?.id) {
                const teachersRes = await fetch(`/api/teacher?instituteId=${activeInstitute.id}`);
                const teachersData = await teachersRes.json();
                const profile = teachersData.find((t: any) => t.userId === user.id);
                setTeacherProfile(profile);

                if (profile && profile.assignedClassIds) {
                    const filteredClasses = classesData.filter((c: any) => profile.assignedClassIds.includes(c.id));
                    setClasses(filteredClasses);
                    if (!selectedClassId && filteredClasses.length > 0) {
                        setSelectedClassId(filteredClasses[0].id);
                    }
                } else {
                    setClasses(classesData);
                }
            } else if (activeRole === 'STUDENT' && user?.metadata?.classId) {
                const studentClass = classesData.find((c: any) => c.id === user.metadata?.classId);
                if (studentClass) {
                    setClasses([studentClass]);
                    setSelectedClassId(studentClass.id);
                } else {
                    setClasses([]);
                }
            } else if (activeRole === 'GUARDIAN' && user?.metadata) {
                // For guardians, we show all classes their children are in
                const childrenIds = user.metadata.childrenIds || (user.metadata.studentId ? [user.metadata.studentId] : []);
                if (childrenIds.length > 0) {
                    const childrenRes = await fetch(`/api/admin/users?ids=${childrenIds.join(',')}`);
                    const childrenData = await childrenRes.json();
                    const classIds = childrenData.map((c: any) => c.metadata?.classId).filter(Boolean);
                    const filteredClasses = classesData.filter((c: any) => classIds.includes(c.id));
                    setClasses(filteredClasses);
                    if (!selectedClassId && filteredClasses.length > 0) {
                        setSelectedClassId(filteredClasses[0].id);
                    }
                }
            } else {
                setClasses(classesData);
            }

            if (Array.isArray(booksData)) setBooks(booksData);

        } catch (error) {
            console.error(error);
            showToast('তথ্য লোড করতে সমস্যা হয়েছে', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthData = async (dateStr: string) => {
        if (!activeInstitute?.id) return;
        const date = new Date(dateStr);
        const y = date.getFullYear();
        const m = date.getMonth();
        const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0)).toISOString().split('T')[0];
        const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)).toISOString().split('T')[0];

        try {
            const res = await fetch(`/api/assignments?instituteId=${activeInstitute.id}&role=${activeRole}&userId=${user?.id}&startDate=${start}&endDate=${end}`);
            const data = await res.json();
            if (Array.isArray(data)) setMonthAssignments(data);
        } catch (error) {
            console.error('Fetch Month Error:', error);
        }
    };

    useEffect(() => {
        if (currentTab === 'history') {
            fetchData();
            if (viewMode === 'calendar') fetchMonthData(selectedDate);
        }
    }, [activeInstitute?.id, activeRole, selectedDate, currentTab]);

    useEffect(() => {
        if (currentTab === 'history' && viewMode === 'calendar') {
            fetchMonthData(selectedDate);
        }
    }, [viewMode]);

    const handleCreateAssignment = async (data: any) => {
        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                showToast('অ্যাসাইনমেন্ট সফলভাবে তৈরি করা হয়েছে', 'success');
                fetchData();
            } else {
                showToast('অ্যাসাইনমেন্ট তৈরি করতে ব্যর্থ হয়েছে', 'error');
            }
        } catch (error) {
            showToast('সার্ভার এরর, পুনরায় চেষ্টা করুন', 'error');
        }
    };

    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = !searchQuery || a.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'all' || a.type === selectedType;
        const matchesClass = (selectedClassId === 'all' || !selectedClassId) || a.classId === selectedClassId;
        const matchesSubject = (selectedSubjectId === 'all' || !selectedSubjectId) || a.bookId === selectedSubjectId;
        return matchesSearch && matchesType && matchesClass && matchesSubject;
    });

    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const isTeacher = activeRole === 'TEACHER';
    const isAdmin = activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN';
    const isStudent = activeRole === 'STUDENT';
    const isGuardian = activeRole === 'GUARDIAN';

    // Get subjects for the selected class
    const filterSubjects = React.useMemo(() => {
        if (isStudent && user?.metadata?.classId) {
            return books.filter(b => b.classId === user.metadata?.classId);
        }
        if (isTeacher && teacherProfile && selectedClassId) {
            const classData = teacherProfile.permissions?.classWise?.[selectedClassId];
            if (!classData || !classData.bookIds) return [];
            return books.filter(b => classData.bookIds.includes(b.id));
        }
        return [];
    }, [isTeacher, isStudent, user, teacherProfile, selectedClassId, books]);

    // Handle Tab Change
    const setTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', tab);
        router.push(`/dashboard/assignments?${params.toString()}`);
    };

    const handleEdit = (assignment: any) => {
        setEditingAssignment(assignment);
        setTab('entry');
        showToast('অ্যাসাইনমেন্ট এডিট মোডে লোড হয়েছে', 'success');
    };

    const handleBulkHistoryRelease = async (ids?: string[]) => {
        const idsToRelease = ids || selectedHistoryIds;
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
                setSelectedHistoryIds([]);
                fetchData();
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

    const handleRevert = async (assignment: any) => {
        if (!activeInstitute?.id) return;

        const confirmed = window.confirm(`আপনি কি নিশ্চিত যে আপনি "${assignment.title}" অ্যাসাইনমেন্টটি প্রত্যাহার করতে চান? এটি শিক্ষার্থীদের ডায়রি থেকে মুছে যাবে এবং তাদের কাছে একটি দুঃখিত মেসেজ যাবে।`);

        if (!confirmed) return;

        try {
            const res = await fetch(`/api/assignments/revert?instituteId=${activeInstitute.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignmentId: assignment.id })
            });

            if (res.ok) {
                const data = await res.json();
                showToast(`অ্যাসাইনমেন্ট প্রত্যাহার করা হয়েছে এবং ${data.notificationCount}টি নোটিফিকেশন পাঠানো হয়েছে`, 'success');
                fetchData();
            } else {
                showToast('অ্যাসাইনমেন্ট প্রত্যাহার করতে ব্যর্থ হয়েছে', 'error');
            }
        } catch (error) {
            console.error('Revert Error:', error);
            showToast('সার্ভার এরর, পুনরায় চেষ্টা করুন', 'error');
        }
    };

    // If Teacher, default tab logic could be improved, but respecting prompt:
    // User wants "Entry" tab to render TeacherAssignmentPanel.

    return (
        <div className="px-4 md:px-8 pt-2 space-y-0 animate-fade-in-up font-bengali min-h-screen pb-20">

            {/* Dashboard / Panel Section (Dynamic based on Tab) */}
            {(isTeacher || isAdmin) && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <TeacherAssignmentPanel
                        activeTab={currentTab}
                        onTabChange={setTab}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        initialEditingAssignment={editingAssignment}
                        onEditComplete={() => {
                            setEditingAssignment(null);
                            fetchData();
                        }}
                    />
                </div>
            )}

            {/* Content Based on Tab */}
            {currentTab === 'history' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4">
                    {/* History Tab Controls */}
                    {currentTab === 'history' && (
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto font-black no-scrollbar">
                                {isStudent || isGuardian ? (
                                    <>
                                        <button
                                            onClick={() => setSelectedSubjectId(null)}
                                            className={`px-6 py-3 rounded-2xl text-xs whitespace-nowrap transition-all border ${!selectedSubjectId ? 'bg-[#045c84] text-white border-[#045c84] shadow-lg shadow-[#045c84]/20' : 'bg-white text-slate-500 border-slate-200 hover:border-[#045c84]'}`}
                                        >
                                            সব বিষয় ({isGuardian ? 'সকল সন্তান' : 'আমার সব'})
                                        </button>
                                        {(isStudent ? filterSubjects : books.filter(b => classes.some(c => c.id === b.classId))).map(book => (
                                            <button
                                                key={book.id}
                                                onClick={() => setSelectedSubjectId(book.id)}
                                                className={`px-6 py-3 rounded-2xl text-xs whitespace-nowrap transition-all border ${selectedSubjectId === book.id ? 'bg-[#045c84] text-white border-[#045c84] shadow-lg shadow-[#045c84]/20' : 'bg-white text-slate-500 border-slate-200 hover:border-[#045c84]'}`}
                                            >
                                                {book.name}
                                            </button>
                                        ))}
                                    </>
                                ) : (
                                    classes.map(cls => (
                                        <button
                                            key={cls.id}
                                            onClick={() => {
                                                setSelectedClassId(cls.id);
                                                setSelectedSubjectId(null);
                                            }}
                                            className={`px-6 py-3 rounded-2xl text-xs whitespace-nowrap transition-all border ${selectedClassId === cls.id ? 'bg-[#045c84] text-white border-[#045c84] shadow-lg shadow-[#045c84]/20' : 'bg-white text-slate-500 border-slate-200 hover:border-[#045c84]'}`}
                                        >
                                            {cls.name}
                                        </button>
                                    ))
                                )}
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <div className="bg-white p-2 rounded-2xl border border-slate-200 flex items-center gap-3 w-full md:w-auto shadow-sm">
                                    <span className="text-xs font-black text-slate-400 pl-2 uppercase tracking-widest leading-none">তারিখ</span>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="flex-1 md:flex-none px-4 py-2 bg-slate-50 border-none rounded-xl focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-black text-[#045c84] cursor-pointer text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View Modes */}
                    {currentTab === 'history' && viewMode === 'calendar' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <AssignmentCalendar
                                assignments={monthAssignments}
                                selectedDate={selectedDate}
                                onDateSelect={(date) => {
                                    setSelectedDate(date);
                                    // Optionally switch to list view on selection if preferred, 
                                    // but user asked for calendar view specifically to "see" info.
                                    // For now, staying in calendar but highlighting.
                                }}
                            />
                        </div>
                    ) : (
                        <>
                            {/* Search & Global View Filters (Only in List View) */}
                            {!isTeacher && (
                                <div className="bg-white p-4 rounded-[28px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-300"
                                            placeholder={isStudent ? "বিষয় বা শিরোনাম দিয়ে খোঁজো..." : "শিরোনাম দিয়ে খুঁজুন..."}
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}


                    {/* Assignments Grid */}
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-12 h-12 border-4 border-[#045c84]/20 border-t-[#045c84] rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">অ্যাসাইনমেন্ট লোড হচ্ছে...</p>
                        </div>
                    ) : filteredAssignments.length > 0 ? (
                        <div className="space-y-12">
                            {/* Drafts Section */}
                            {filteredAssignments.some(a => a.status === 'DRAFT') && (
                                <div className="space-y-6 bg-amber-50/30 p-6 rounded-[32px] border border-amber-100/50">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse"></div>
                                            <div>
                                                <h3 className="text-xl font-black text-amber-900 uppercase tracking-tighter leading-none">কাজ তৈরি করা হয়েছে (Waiting for Release)</h3>
                                                <p className="text-[10px] font-bold text-amber-600/70 mt-1 uppercase tracking-widest">এই কাজগুলো এখনো শিক্ষার্থীদের কাছে পৌঁছায়নি</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {selectedHistoryIds.length > 0 ? (
                                                <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                        {selectedHistoryIds.length} Selected
                                                    </span>
                                                    <button
                                                        onClick={() => setSelectedHistoryIds([])}
                                                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                                                    >
                                                        Clear
                                                    </button>
                                                    <button
                                                        onClick={() => handleBulkHistoryRelease()}
                                                        disabled={isBulkReleasing}
                                                        className="bg-[#045c84] text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-blue-900/10 hover:bg-[#034a6b] transition-all flex items-center gap-2 disabled:opacity-50"
                                                    >
                                                        {isBulkReleasing ? <Activity className="animate-spin" size={12} /> : <TrendingUp size={12} />}
                                                        রিলিজ করুন
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        const draftIds = filteredAssignments
                                                            .filter(a => a.status === 'DRAFT')
                                                            .map(a => a.id);
                                                        handleBulkHistoryRelease(draftIds);
                                                    }}
                                                    disabled={isBulkReleasing}
                                                    className="text-[#045c84] border border-[#045c84]/20 bg-white hover:bg-blue-50 text-[10px] font-black px-4 py-2 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
                                                >
                                                    {isBulkReleasing ? <Activity className="animate-spin" size={12} /> : <PenTool size={12} />}
                                                    সব রilিজ (Release All)
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredAssignments.filter(a => a.status === 'DRAFT').map((assignment) => (
                                            <AssignmentCard
                                                key={assignment.id}
                                                assignment={assignment}
                                                role={activeRole as any}
                                                isSelected={selectedHistoryIds.includes(assignment.id)}
                                                onSelect={(id, selected) => {
                                                    setSelectedHistoryIds(prev =>
                                                        selected
                                                            ? [...prev, id]
                                                            : prev.filter(sid => sid !== id)
                                                    );
                                                }}
                                                onAction={(a) => setSelectedAssignment(a)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Released Section */}
                            {filteredAssignments.some(a => a.status !== 'DRAFT') && (
                                <div className="space-y-6 bg-emerald-50/20 p-6 rounded-[32px] border border-emerald-100/30">
                                    <div className="flex items-center gap-3 px-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"></div>
                                        <div>
                                            <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tighter leading-none">
                                                {isStudent ? 'আজকের পড়া' : 'রিলিজ করা হয়েছে'}
                                            </h3>
                                            <p className="text-[10px] font-bold text-emerald-600/70 mt-1 uppercase tracking-widest">
                                                {isStudent ? 'আজকের ডায়েরির পড়াগুলো নিচে দেখ' : 'এই কাজগুলো শিক্ষার্থীরা দেখতে পাচ্ছে'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredAssignments.filter(a => a.status !== 'DRAFT').map((assignment) => (
                                            <AssignmentCard
                                                key={assignment.id}
                                                assignment={assignment}
                                                role={activeRole as any}
                                                onAction={(a) => setSelectedAssignment(a)}
                                                onRevert={handleRevert}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-[40px] border border-slate-200 p-20 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                                <ClipboardList size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-600">কোনো অ্যাসাইনমেন্ট পাওয়া যায়নি</h3>
                            <p className="text-slate-400 font-bold mt-2">অন্য তারিখ বা ফিল্টার নির্বাচন করে চেষ্টা করুন।</p>
                            {(isTeacher || isAdmin) && (
                                <button
                                    onClick={() => setTab('entry')}
                                    className="mt-6 px-6 py-3 bg-[#045c84] text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 hover:bg-[#034a6b] transition-all"
                                >
                                    স্ট্যাটাস প্যানেলে যান
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <AssignmentDetailsModal
                isOpen={!!selectedAssignment}
                onClose={() => setSelectedAssignment(null)}
                assignment={selectedAssignment}
                onEdit={handleEdit}
                onRevert={handleRevert}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

export default function AssignmentsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-400 font-bold">Loading...</div>}>
            <AssignmentsPageContent />
        </Suspense>
    );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSession } from '@/components/SessionProvider';
import {
    Users,
    Search,
    UserPlus,
    ShieldCheck,
    Mail,
    Building2,
    Loader2,
    X,
    Save,
    Trash2,
    Edit,
    Settings2,
    CloudUpload,
    BookOpen,
    List,
    Plus,
    Layers,
    MoreVertical,
    ChevronRight,
    ChevronLeft,
    Layers3,
    Phone,
    MessageSquare,
    MessageCircle,
    ChevronDown,
} from 'lucide-react';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import FieldLibrary, { FieldDefinition, POSSIBLE_FIELDS } from '@/components/FieldLibrary';
import StudentProfileModal from '@/components/StudentProfileModal';

export default function StudentManagementPage() {
    const { user, activeRole, activeInstitute } = useSession();
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [selectedClassId, setSelectedClassId] = useState<string>('all');
    const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [classData, setClassData] = useState({ name: '' });
    const [isBulkClassMode, setIsBulkClassMode] = useState(false);
    const [bulkClassText, setBulkClassText] = useState('');
    const [groupData, setGroupData] = useState({ name: '' });
    const [editingClass, setEditingClass] = useState<any>(null);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number, left: number } | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [editingStudent, setEditingStudent] = useState<any>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const classTabsRef = useRef<HTMLDivElement>(null);
    const groupTabsRef = useRef<HTMLDivElement>(null);

    const scrollToCenter = (container: HTMLDivElement | null, selectedId: string) => {
        if (!container) return;
        const selectedElement = container.querySelector(`[data-id="${selectedId}"]`) as HTMLElement;
        if (selectedElement) {
            const containerRect = container.getBoundingClientRect();
            const elementRect = selectedElement.getBoundingClientRect();

            const scrollLeft = container.scrollLeft + (elementRect.left - containerRect.left) - (containerRect.width / 2) + (elementRect.width / 2);

            container.scrollTo({
                left: scrollLeft,
                behavior: 'smooth'
            });
        }
    };


    useEffect(() => {
        scrollToCenter(classTabsRef.current, selectedClassId);
    }, [selectedClassId]);

    useEffect(() => {
        scrollToCenter(groupTabsRef.current, selectedGroupId);
    }, [selectedGroupId]);

    // Drag Scroll Helper
    const useDragScroll = (ref: React.RefObject<HTMLDivElement | null>) => {
        const [isDragging, setIsDragging] = useState(false);
        const [startX, setStartX] = useState(0);
        const [scrollLeft, setScrollLeft] = useState(0);

        const onMouseDown = (e: React.MouseEvent) => {
            if (!ref.current) return;
            setIsDragging(true);
            setStartX(e.pageX - ref.current.offsetLeft);
            setScrollLeft(ref.current.scrollLeft);
        };

        const onMouseLeave = () => {
            setIsDragging(false);
        };

        const onMouseUp = () => {
            setIsDragging(false);
        };

        const onMouseMove = (e: React.MouseEvent) => {
            if (!isDragging || !ref.current) return;
            e.preventDefault();
            const x = e.pageX - ref.current.offsetLeft;
            const walk = (x - startX) * 2; // scroll speed
            ref.current.scrollLeft = scrollLeft - walk;
        };

        return {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove,
            isDragging
        };
    };

    const { isDragging: classIsDragging, ...classDragHandlers } = useDragScroll(classTabsRef);
    const { isDragging: groupIsDragging, ...groupDragHandlers } = useDragScroll(groupTabsRef);



    const [formData, setFormData] = useState<any>({
        name: '',
        email: '',
        password: '',
        metadata: {}
    });

    const [formConfig, setFormConfig] = useState<FieldDefinition[]>([]);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);

    // Scroll Arrows Helper
    const useScrollArrows = (ref: React.RefObject<HTMLDivElement | null>, dep: any) => {
        const [showLeft, setShowLeft] = useState(false);
        const [showRight, setShowRight] = useState(false);

        const checkScroll = () => {
            if (!ref.current) return;
            const { scrollLeft, scrollWidth, clientWidth } = ref.current;
            setShowLeft(scrollLeft > 5);
            setShowRight(scrollLeft < scrollWidth - clientWidth - 5);
        };

        useEffect(() => {
            checkScroll();
            window.addEventListener('resize', checkScroll);
            return () => window.removeEventListener('resize', checkScroll);
        }, [ref, dep]);

        const scroll = (direction: 'left' | 'right') => {
            if (!ref.current) return;
            const scrollAmount = 300;
            ref.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        };

        return { showLeft, showRight, scroll, checkScroll };
    };

    const classScroll = useScrollArrows(classTabsRef, classes);
    const groupScroll = useScrollArrows(groupTabsRef, groups);

    const fetchFormConfig = async () => {
        if (!activeInstitute?.id) return;
        try {
            const res = await fetch(`/api/admin/institutes/form-config?instituteId=${activeInstitute.id}`);
            const data = await res.json();
            let config = Array.isArray(data) ? data : [];

            // If empty, set default fields
            if (config.length === 0) {
                const defaultIds = ['studentPhoto', 'studentId', 'rollNumber', 'name', 'fathersName', 'mothersName', 'guardianPhone', 'password'];
                const defaults = POSSIBLE_FIELDS.filter(f => defaultIds.includes(f.id));
                // Sort by defaultIds order
                const sortedDefaults = defaultIds.map(id => defaults.find(f => f.id === id)).filter(Boolean) as FieldDefinition[];

                await handleUpdateFormConfig(sortedDefaults);
                config = sortedDefaults;
            }

            setFormConfig(config);
        } catch (error) {
            console.error('Fetch form config error:', error);
        }
    };

    const fetchClasses = async () => {
        if (!activeInstitute?.id) return;
        try {
            const res = await fetch(`/api/admin/classes?instituteId=${activeInstitute.id}`);
            const data = await res.json();
            setClasses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch classes error:', error);
        }
    };

    const fetchGroups = async (classId: string) => {
        try {
            const res = await fetch(`/api/admin/groups?classId=${classId}`);
            const data = await res.json();
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch groups error:', error);
        }
    };

    const fetchStudents = async () => {
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            const classFilter = selectedClassId !== 'all' ? `&classId=${selectedClassId}` : '';
            const groupFilter = selectedGroupId !== 'all' ? `&groupId=${selectedGroupId}` : '';
            const instituteFilter = activeInstitute?.id ? `&instituteId=${activeInstitute.id}` : '';

            const res = await fetch(`/api/admin/users?role=STUDENT&search=${search}${classFilter}${groupFilter}${instituteFilter}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setStudents(list);
        } catch (error) {
            console.error('Fetch students error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeInstitute?.id) {
            fetchFormConfig();
            fetchClasses();
        }
    }, [activeInstitute?.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStudents();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, activeInstitute?.id, selectedClassId, selectedGroupId]);

    const handleUpdateFormConfig = async (newConfig: FieldDefinition[]) => {
        if (!activeInstitute?.id) return;
        try {
            await fetch('/api/admin/institutes/form-config', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instituteId: activeInstitute.id,
                    studentFormConfig: newConfig
                }),
            });
            setFormConfig(newConfig);
        } catch (error) {
            console.error('Update form config error:', error);
        }
    };

    const handleAddField = (field: FieldDefinition) => {
        const newConfig = [...formConfig, field];
        handleUpdateFormConfig(newConfig);
    };

    const handleAutoGenerate = async (fieldId: string) => {
        if (!activeInstitute?.id) return;
        try {
            const classId = formData.metadata?.classId || '';
            const res = await fetch(`/api/admin/students/next-ids?instituteId=${activeInstitute.id}&classId=${classId}`);
            const data = await res.json();

            if (fieldId === 'studentId') {
                setFormData((prev: any) => ({
                    ...prev,
                    metadata: { ...prev.metadata, studentId: data.nextStudentId }
                }));
            } else if (fieldId === 'rollNumber') {
                if (!classId) {
                    setToast({ message: 'প্রথমে শ্রেণী নির্বাচন করুন।', type: 'error' });
                    return;
                }
                setFormData((prev: any) => ({
                    ...prev,
                    metadata: { ...prev.metadata, rollNumber: data.nextRollNumber }
                }));
            }
        } catch (error) {
            console.error('Auto generate failed', error);
        }
    };

    const handleRemoveField = (fieldId: string) => {
        const newConfig = formConfig.filter(f => f.id !== fieldId);
        handleUpdateFormConfig(newConfig);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            setActionLoading(true);
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (data.url) {
                setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, [fieldId]: data.url }
                });
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setActionLoading(false);
        }
    };

    // Auto-fill Guardian Name
    useEffect(() => {
        const checkGuardian = async () => {
            const phone = formData.metadata?.guardianPhone;
            if (!phone || phone.length < 11) return;

            try {
                const res = await fetch(`/api/admin/users?role=GUARDIAN&search=${phone}`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    const guardian = data[0];
                    setFormData((prev: any) => ({
                        ...prev,
                        metadata: {
                            ...prev.metadata,
                            guardianName: guardian.name
                        }
                    }));
                    setToast({ message: 'অভিভাবকের তথ্য পাওয়া গেছে!', type: 'success' });
                }
            } catch (error) {
                console.error("Guardian check failed", error);
            }
        };

        const timeoutId = setTimeout(checkGuardian, 1000);
        return () => clearTimeout(timeoutId);
    }, [formData.metadata?.guardianPhone]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeInstitute?.id) {
            setToast({ message: 'সক্রিয় প্রতিষ্ঠান পাওয়া যায়নি।', type: 'error' });
            return;
        }

        setActionLoading(true);
        try {
            // Map dynamic fields to top-level if needed
            const payload = {
                ...formData,
                id: editingStudent?.id, // include ID for PATCH
                name: formData.metadata?.name || formData.name,
                email: formData.metadata?.email || formData.email,
                password: formData.metadata?.password || formData.password,
                phone: formData.metadata?.guardianPhone || formData.metadata?.studentPhone || formData.phone,
                role: 'STUDENT',
                instituteIds: editingStudent ? undefined : [activeInstitute.id] // only for POST
            };

            const url = '/api/admin/users';
            const method = editingStudent ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setToast({ message: editingStudent ? 'শিক্ষার্থীর তথ্য আপডেট করা হয়েছে!' : 'শিক্ষার্থী সফলভাবে যুক্ত করা হয়েছে!', type: 'success' });
                setIsAddModalOpen(false);
                setEditingStudent(null);
                setFormData({ name: '', email: '', password: '', metadata: {} });
                fetchStudents();
            } else {
                const data = await res.json();
                setToast({ message: data.message || 'ব্যর্থ হয়েছে।', type: 'error' });
            }
        } catch (error) {
            console.error('Submit student error:', error);
            setToast({ message: 'সার্ভার এরর।', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickClassCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeInstitute?.id) return;
        setActionLoading(true);
        try {
            let payload: any = { instituteId: activeInstitute.id };

            if (isBulkClassMode) {
                const items = bulkClassText
                    .split('\n')
                    .map(line => {
                        const slMatch = line.match(/^(\d+)[\.\)\s-]+/);
                        const order = slMatch ? parseInt(slMatch[1]) : 0;
                        const name = line.replace(/^\d+[\.\)\s-]+/, '').trim();
                        return { name, order };
                    })
                    .filter(item => item.name.length > 0);

                if (items.length === 0) {
                    setToast({ message: 'অনুগ্রহ করে ক্লাস লিস্ট দিন।', type: 'error' });
                    setActionLoading(false);
                    return;
                }
                payload.names = items;
            } else {
                payload.name = classData.name;
            }

            const url = editingClass ? `/api/admin/classes/${editingClass.id}` : '/api/admin/classes';
            const method = editingClass ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setToast({ message: editingClass ? 'ক্লাস আপডেট হয়েছে!' : (isBulkClassMode ? 'ক্লাসগুলো তৈরি হয়েছে!' : 'ক্লাস সফলভাবে তৈরি হয়েছে!'), type: 'success' });
                setIsClassModalOpen(false);
                setClassData({ name: '' });
                setBulkClassText('');
                setEditingClass(null);
                fetchClasses();
            }
        } catch (error) {
            setToast({ message: 'ক্রুটি হয়েছে।', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };



    const handleDeleteClass = async (id: string) => {
        if (!confirm('আপনি কি এই ক্লাসটি ডিলিট করতে চান? ')) return;
        try {
            const res = await fetch(`/api/admin/classes/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: 'ক্লাস ডিলিট হয়েছে!', type: 'success' });
                if (selectedClassId === id) setSelectedClassId('all');
                fetchClasses();
            }
        } catch (error) {
            setToast({ message: 'ডিলিট করতে ক্রুটি হয়েছে।', type: 'error' });
        }
    };

    const handleDeleteStudent = async (id: string) => {
        if (!confirm('আপনি কি এই শিক্ষার্থীকে ডিলিট করতে চান?')) return;
        try {
            const res = await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: 'শিক্ষার্থী ডিলিট হয়েছে!', type: 'success' });
                fetchStudents();
            }
        } catch (error) {
            setToast({ message: 'ডিলিট করতে ক্রুটি হয়েছে।', type: 'error' });
        }
    };

    const handleQuickGroupCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedClassId === 'all') return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...groupData, classId: selectedClassId })
            });
            if (res.ok) {
                setToast({ message: 'গ্রুপ সফলভাবে তৈরি হয়েছে!', type: 'success' });
                setIsGroupModalOpen(false);
                setGroupData({ name: '' });
                fetchGroups(selectedClassId);
            }
        } catch (error) {
            setToast({ message: 'ক্রুটি হয়েছে।', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    if (activeRole !== 'ADMIN' && activeRole !== 'SUPER_ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <Users size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-medium font-bengali">আপনার এই পেজটি দেখার অনুমতি নেই।</p>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 md:p-8 space-y-6 animate-fade-in-up font-bengali max-w-full overflow-x-hidden">
            {/* Utility Bar (Search, Action, Library, Public Link) */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none text-black font-medium shadow-sm"
                        placeholder="খুঁজুন..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="shrink-0 flex items-center justify-center gap-2 px-4 py-3 bg-[#045c84] text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95 whitespace-nowrap"
                    >
                        <UserPlus size={20} />
                        <span>নতুন</span>
                    </button>
                    <div className="flex items-center gap-2 flex-1 lg:flex-none">
                        <button
                            onClick={() => {
                                if (activeInstitute?.id) {
                                    const url = `${window.location.origin}/admission/${activeInstitute.id}`;
                                    navigator.clipboard.writeText(url);
                                    setToast({ message: 'ভর্তি ফর্মের লিংক কপি হয়েছে!', type: 'success' });
                                }
                            }}
                            className="flex-1 lg:flex-none p-3 lg:p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:shadow-md hover:border-[#045c84] hover:text-[#045c84] transition-all active:scale-95 flex justify-center items-center"
                            title="ভর্তি ফর্মের লিংক কপি করুন"
                        >
                            <ShieldCheck size={24} />
                        </button>
                        <button
                            onClick={() => setIsLibraryOpen(true)}
                            className="flex-1 lg:flex-none p-3 lg:p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:shadow-md hover:border-[#045c84] hover:text-[#045c84] transition-all active:scale-95 flex justify-center items-center"
                            title="ফর্ম ফিল্ড লাইব্রেরি"
                        >
                            <Settings2 size={24} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Class & Group Tabs */}
            <div className="sticky top-[72px] z-30 bg-slate-50/95 backdrop-blur-sm py-3 -mx-3 px-3 sm:-mx-4 sm:px-4 md:-mx-8 md:px-8 space-y-4 shadow-sm transition-all max-w-full overflow-visible">
                <div className="flex items-center gap-2 w-full min-w-0">
                    <div className="relative flex items-center flex-1 min-w-0 group/scroll">
                        <div
                            ref={classTabsRef}
                            {...classDragHandlers}
                            onScroll={classScroll.checkScroll}
                            className={`flex-1 overflow-x-auto scrollbar-thin-custom flex items-center gap-2 py-3 px-1 pr-4 scroll-smooth ${classIsDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                        >
                            <div
                                data-id="all"
                                className={`transition-all duration-200 shrink-0 ${selectedClassId === 'all'
                                    ? 'group flex items-center rounded-full border border-[#045c84] bg-[#045c84] text-white shadow-md ring-2 ring-blue-100 transform scale-105 z-10 select-none'
                                    : 'px-0' // Reset default wrapper
                                    }`}>
                                {selectedClassId === 'all' ? (
                                    <>
                                        <div className="pl-4 pr-2 py-1.5 text-sm font-medium whitespace-nowrap cursor-default">
                                            সকল ক্লাস
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setMenuPosition({
                                                    top: rect.bottom,
                                                    left: rect.right - 128
                                                });
                                                setIsActionMenuOpen(isActionMenuOpen === 'all' ? null : 'all');
                                            }}
                                            className="px-2 py-1.5 flex items-center justify-center rounded-r-full text-blue-100 hover:text-white hover:bg-[#034d6e] transition-colors"
                                        >
                                            <MoreVertical size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setSelectedClassId('all');
                                            setSelectedGroupId('all');
                                            setGroups([]);
                                        }}
                                        className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-[#045c84]"
                                    >
                                        সকল ক্লাস
                                    </button>
                                )}
                            </div>
                            {classes.map(c => (
                                <div
                                    key={c.id}
                                    data-id={c.id}
                                    className={`transition-all duration-200 shrink-0 ${selectedClassId === c.id
                                        ? 'group flex items-center rounded-full border border-[#045c84] bg-[#045c84] text-white shadow-md ring-2 ring-blue-100 transform scale-105 z-10 select-none'
                                        : 'px-0'
                                        }`}
                                >
                                    {selectedClassId === c.id ? (
                                        <>
                                            <div className="pl-4 pr-2 py-1.5 text-sm font-medium whitespace-nowrap cursor-default">
                                                {c.name}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setMenuPosition({
                                                        top: rect.bottom,
                                                        left: rect.right - 128
                                                    });
                                                    setIsActionMenuOpen(isActionMenuOpen === c.id ? null : c.id);
                                                }}
                                                className="px-2 py-1.5 flex items-center justify-center rounded-r-full text-blue-100 hover:text-white hover:bg-[#034d6e] transition-colors"
                                            >
                                                <MoreVertical size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSelectedClassId(c.id);
                                                setSelectedGroupId('all');
                                                fetchGroups(c.id);
                                            }}
                                            className="px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-[#045c84]"
                                        >
                                            {c.name}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsClassModalOpen(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-[#045c84] hover:bg-blue-100 whitespace-nowrap border border-blue-200 transition shadow-sm shrink-0 ml-auto"
                        title="নতুন ক্লাস"
                    >
                        <Plus size={14} className="group-hover:rotate-90 transition-transform duration-300" />
                        <span>ক্লাস</span>
                    </button>
                </div>

                {selectedClassId !== 'all' && (
                    <div className="flex items-center gap-4 pl-4 border-l-4 border-slate-200 animate-fade-in w-full min-w-0">
                        <div className="relative flex items-center flex-1 min-w-0 group/scroll">
                            <div
                                ref={groupTabsRef}
                                {...groupDragHandlers}
                                onScroll={groupScroll.checkScroll}
                                className={`flex-1 overflow-x-auto scrollbar-thin-custom flex items-center gap-2 py-3 px-1 pr-4 scroll-smooth ${groupIsDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
                            >
                                <button
                                    onClick={() => setSelectedGroupId('all')}
                                    data-id="all"
                                    className={`px-5 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all ${selectedGroupId === 'all'
                                        ? 'bg-slate-800 text-white shadow-md'
                                        : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-800'
                                        }`}
                                >
                                    সকল গ্রুপ
                                </button>
                                {groups.map(g => (
                                    <button
                                        key={g.id}
                                        onClick={() => setSelectedGroupId(g.id)}
                                        data-id={g.id}
                                        className={`px-5 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all ${selectedGroupId === g.id
                                            ? 'bg-slate-800 text-white shadow-md'
                                            : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-800'
                                            }`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setIsGroupModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-400 rounded-full shadow-sm hover:text-slate-800 hover:border-slate-800 transition-all group shrink-0 ml-auto"
                            title="নতুন গ্রুপ"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-[10px] font-bold hidden md:inline">গ্রুপ যোগ করুন</span>
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#045c84] mb-4" size={40} />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">শিক্ষার্থী লোড হচ্ছে...</p>
                </div>
            ) : students.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
                    <Users className="mb-4 opacity-20" size={64} />
                    <span className="text-lg font-medium">কোন শিক্ষার্থী পাওয়া যায়নি।</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {students.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => {
                                setSelectedStudent(s);
                                setIsProfileModalOpen(true);
                            }}
                            className="bg-white p-3.5 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all flex items-center gap-4 relative group cursor-pointer"
                        >
                            {/* Avatar */}
                            {(() => {
                                const colors = ['bg-orange-500', 'bg-yellow-400', 'bg-teal-500', 'bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500'];
                                const colorIndex = s.name ? s.name.length % colors.length : 0;
                                const bgColor = colors[colorIndex];

                                return (
                                    <div className={`w-12 h-12 rounded-full ${bgColor} border-2 border-white shadow-md overflow-hidden flex items-center justify-center text-white font-bold text-lg shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                        {s.metadata?.studentPhoto ? (
                                            <img src={s.metadata.studentPhoto} alt={s.name} className="w-full h-full object-cover" />
                                        ) : (
                                            s.name?.[0] || 'S'
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[18px] font-bold text-slate-800 truncate mb-1" title={s.name}>
                                    {s.name || 'নাম নেই'}
                                </h3>

                                {/* ID | Roll Tag */}
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50/50 border border-blue-100 rounded-full group/tag hover:bg-blue-50 transition-colors">
                                    <div className="flex items-center gap-1.5 text-[#045c84] text-[9px] font-bold uppercase tracking-wider">
                                        <span>ID: {s.metadata?.studentId || '-'}</span>
                                        <span className="opacity-30">|</span>
                                        <span>Roll: {s.metadata?.rollNumber || '-'}</span>
                                    </div>
                                    <ChevronDown size={12} className="text-[#045c84] opacity-40 group-hover/tag:translate-y-0.5 transition-transform" />
                                </div>
                            </div>

                            {/* 3-Dot Action Button */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        setMenuPosition({
                                            top: rect.bottom + 8,
                                            left: rect.right - 220 // Increased width for better fit
                                        });
                                        setIsActionMenuOpen(isActionMenuOpen === s.id ? null : s.id);
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                                >
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Student Form Modal (Add/Edit) */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                    setFormData({ name: '', email: '', password: '', metadata: {} });
                }}
                title={editingStudent ? "শিক্ষার্থীর তথ্য আপডেট করুন" : "নতুন শিক্ষার্থী যুক্ত করুন"}
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleFormSubmit} className="p-5 md:p-8 space-y-6">
                    <div className="space-y-4">
                        {/* Dynamic Fields */}
                        {(() => {
                            const alwaysShowFields = ['studentId', 'rollNumber'];
                            const effectiveFields = editingStudent
                                ? [
                                    ...formConfig,
                                    ...POSSIBLE_FIELDS.filter(f =>
                                        !formConfig.some(cf => cf.id === f.id) &&
                                        (
                                            (formData.metadata[f.id] !== undefined && formData.metadata[f.id] !== '') ||
                                            alwaysShowFields.includes(f.id)
                                        ) &&
                                        f.id !== 'password'
                                    )
                                ]
                                : formConfig;

                            return effectiveFields.map((field) => {
                                const isTopLevel = ['name', 'email', 'password'].includes(field.id);
                                const fieldValue = isTopLevel ? (formData as any)[field.id] : formData.metadata[field.id];

                                return (
                                    <div key={field.id} className="space-y-2">
                                        {!formConfig.some(cf => cf.id === field.id) && (
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase tracking-wider border border-amber-100 italic">
                                                    Config Missing
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium">This field has data or is required but is not in current form config</span>
                                            </div>
                                        )}
                                        {field.id === 'guardianName' && (
                                            <div className="flex gap-2 mb-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formData.metadata.fathersName || formData.metadata.fathersPhone) {
                                                            setFormData({
                                                                ...formData,
                                                                metadata: {
                                                                    ...formData.metadata,
                                                                    guardianName: formData.metadata.fathersName || formData.metadata.guardianName,
                                                                    guardianPhone: formData.metadata.fathersPhone || formData.metadata.guardianPhone,
                                                                    guardianRelation: 'বাবা'
                                                                }
                                                            });
                                                        } else {
                                                            setToast({ message: 'পিতার তথ্য আগে পূরণ করুন।', type: 'error' });
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                >
                                                    অভিভাবক হিসেবে পিতা
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formData.metadata.mothersName || formData.metadata.mothersPhone) {
                                                            setFormData({
                                                                ...formData,
                                                                metadata: {
                                                                    ...formData.metadata,
                                                                    guardianName: formData.metadata.mothersName || formData.metadata.guardianName,
                                                                    guardianPhone: formData.metadata.mothersPhone || formData.metadata.guardianPhone,
                                                                    guardianRelation: 'মা'
                                                                }
                                                            });
                                                        } else {
                                                            setToast({ message: 'মাতার তথ্য আগে পূরণ করুন।', type: 'error' });
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold hover:bg-pink-100 transition-colors"
                                                >
                                                    অভিভাবক হিসেবে মাতা
                                                </button>
                                            </div>
                                        )}
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>

                                        {field.type === 'select' ? (
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black appearance-none"
                                                    value={fieldValue || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (isTopLevel) {
                                                            setFormData({ ...formData, [field.id]: val });
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                metadata: { ...formData.metadata, [field.id]: val }
                                                            });
                                                        }
                                                    }}
                                                    required={field.required}
                                                >
                                                    <option value="">নির্বাচন করুন</option>
                                                    {field.options?.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : field.type === 'attachment' ? (
                                            <div className="relative">
                                                <div className={`w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-between transition-all ${fieldValue ? 'border-green-200 bg-green-50/30' : 'hover:border-[#045c84]'}`}>
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <CloudUpload className={fieldValue ? 'text-green-500' : 'text-slate-400'} size={20} />
                                                        <span className="text-sm font-medium text-slate-600 truncate">
                                                            {fieldValue ? 'ফাইল আপলোড হয়েছে' : 'ফাইল নির্বাচন করুন'}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => handleFileUpload(e, field.id)}
                                                        required={field.required && !fieldValue}
                                                    />
                                                    {fieldValue && (
                                                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                                            <Save size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : field.type === 'class-lookup' ? (
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black appearance-none"
                                                    value={fieldValue || ''}
                                                    onChange={(e) => {
                                                        const classId = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            metadata: { ...formData.metadata, [field.id]: classId, groupId: '' }
                                                        });
                                                        if (classId) fetchGroups(classId);
                                                        else setGroups([]);
                                                    }}
                                                    required={field.required}
                                                >
                                                    <option value="">শ্রেণী নির্বাচন করুন</option>
                                                    {classes.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : field.type === 'group-lookup' ? (
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black appearance-none"
                                                    value={fieldValue || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        metadata: { ...formData.metadata, [field.id]: e.target.value }
                                                    })}
                                                    required={field.required}
                                                    disabled={!formData.metadata.classId}
                                                >
                                                    <option value="">গ্রুপ নির্বাচন করুন</option>
                                                    {groups.map(g => (
                                                        <option key={g.id} value={g.id}>{g.name}</option>
                                                    ))}
                                                </select>
                                                {!formData.metadata.classId && (
                                                    <p className="text-[10px] text-amber-600 font-bold mt-1">প্রথমে শ্রেণী নির্বাচন করুন</p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative group/field">
                                                <input
                                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                                    placeholder={field.placeholder || `${field.label} দিন`}
                                                    value={fieldValue || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (isTopLevel) {
                                                            setFormData({ ...formData, [field.id]: val });
                                                        } else {
                                                            setFormData({
                                                                ...formData,
                                                                metadata: { ...formData.metadata, [field.id]: val }
                                                            });
                                                        }
                                                    }}
                                                    required={field.required}
                                                />
                                                {(field.id === 'rollNumber' || field.id === 'studentId') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAutoGenerate(field.id)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white border border-slate-200 text-[#045c84] text-[10px] font-bold rounded-xl shadow-sm hover:bg-[#045c84] hover:text-white transition-all opacity-0 group-hover/field:opacity-100"
                                                    >
                                                        AUTO
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-8 py-4 bg-[#045c84] hover:bg-[#034d6e] text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                        >
                            {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            <span>সংরক্ষণ করুন</span>
                        </button>
                    </div>
                </form>
            </Modal>

            <FieldLibrary
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                currentFields={formConfig}
                onAddField={handleAddField}
                onRemoveField={handleRemoveField}
            />

            {/* Quick Class Add Modal */}
            <Modal
                isOpen={isClassModalOpen}
                onClose={() => {
                    setIsClassModalOpen(false);
                    setEditingClass(null);
                    setClassData({ name: '' });
                }}
                title={editingClass ? "ক্লাস আপডেট করুন" : "নতুন ক্লাস তৈরি করুন"}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleQuickClassCreate} className="p-5 md:p-8 space-y-6">
                    {!editingClass && (
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">বাল্ক অ্যাড (Bulk)</span>
                            <button
                                type="button"
                                onClick={() => setIsBulkClassMode(!isBulkClassMode)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isBulkClassMode ? 'bg-[#045c84]' : 'bg-slate-300'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBulkClassMode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    )}

                    {!isBulkClassMode ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ক্লাসের নাম</label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                placeholder="যেমন: ষষ্ঠ শ্রেণী"
                                value={classData.name}
                                onChange={(e) => setClassData({ ...classData, name: e.target.value })}
                                required={!isBulkClassMode}
                            />
                        </div>
                    ) : (
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black min-h-[150px] resize-none"
                            placeholder={"যেমন:\n1. Class One\n2. Class Two"}
                            value={bulkClassText}
                            onChange={(e) => setBulkClassText(e.target.value)}
                            required={isBulkClassMode}
                        />
                    )}
                    <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-4 bg-[#045c84] text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span>সেভ করুন</span>
                    </button>
                </form>
            </Modal>

            {/* Quick Group Add Modal */}
            <Modal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                title="নতুন গ্রুপ যোগ করুন"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleQuickGroupCreate} className="p-5 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">গ্রুপের নাম</label>
                        <input
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                            placeholder="যেমন: বিজ্ঞান"
                            value={groupData.name}
                            onChange={(e) => setGroupData({ ...groupData, name: e.target.value })}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-4 bg-[#045c84] text-white font-bold rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span>সেভ করুন</span>
                    </button>
                </form>
            </Modal>

            {/* Student Profile Modal */}
            <StudentProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                student={selectedStudent}
                onEdit={(s) => {
                    setIsProfileModalOpen(false);
                    setEditingStudent(s);
                    setFormData({
                        name: s.name || '',
                        email: s.email || '',
                        password: '', // Don't pre-fill password for security
                        metadata: s.metadata || {}
                    });
                    if (s.metadata?.classId) fetchGroups(s.metadata.classId);
                    setIsAddModalOpen(true);
                }}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {/* Action Menu Portal */}
            {isActionMenuOpen && menuPosition && createPortal(
                <>
                    <div className="fixed inset-0 z-[999998]" onClick={() => setIsActionMenuOpen(null)} />
                    <div
                        className="fixed w-[220px] bg-white rounded-xl shadow-2xl border border-slate-100 py-1 z-[999999] overflow-hidden text-slate-700 animate-in fade-in zoom-in duration-100"
                        style={{
                            top: `${menuPosition.top + 8}px`,
                            left: `${menuPosition.left}px`
                        }}
                    >
                        {isActionMenuOpen === 'all' ? (
                            <div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Format classes as SL. Name
                                        const text = [...classes]
                                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                                            .map((c, i) => `${c.order || i + 1}. ${c.name}`)
                                            .join('\n');
                                        setBulkClassText(text);
                                        setIsBulkClassMode(true);
                                        setEditingClass(null);
                                        setIsClassModalOpen(true);
                                        setIsActionMenuOpen(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-slate-50 flex items-center gap-2 transition-colors text-[#045c84]"
                                >
                                    <Settings2 size={14} />
                                    <span>বাল্ক এডিট (সর্টিং)</span>
                                </button>
                            </div>
                        ) : isActionMenuOpen && students.some(s => s.id === isActionMenuOpen) ? (
                            students.filter(s => s.id === isActionMenuOpen).map(s => (
                                <div key={s.id}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `tel:${s.phone || s.metadata?.studentPhone || s.metadata?.guardianPhone}`;
                                            setIsActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-[13px] font-bold hover:bg-slate-50 flex items-center gap-3 transition-colors text-emerald-600"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                            <Phone size={16} />
                                        </div>
                                        <span>কল করুন (Call)</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.location.href = `sms:${s.phone || s.metadata?.studentPhone || s.metadata?.guardianPhone}`;
                                            setIsActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-[13px] font-bold hover:bg-slate-50 flex items-center gap-3 transition-colors text-blue-600"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                            <MessageSquare size={16} />
                                        </div>
                                        <span>মেসেজ পাঠান (SMS)</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const phone = s.phone || s.metadata?.studentPhone || s.metadata?.guardianPhone;
                                            window.open(`https://wa.me/${phone?.replace(/\D/g, '')}`, '_blank');
                                            setIsActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-[13px] font-bold hover:bg-slate-50 flex items-center gap-3 transition-colors text-green-600"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                                            <MessageCircle size={16} />
                                        </div>
                                        <span>হোয়াটসঅ্যাপ (WhatsApp)</span>
                                    </button>
                                    <div className="h-[1px] bg-slate-100 my-1 mx-2" />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteStudent(s.id);
                                            setIsActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-3 text-left text-[13px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                            <Trash2 size={16} />
                                        </div>
                                        <span>মুছে ফেলুন (Delete)</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            classes.filter(c => c.id === isActionMenuOpen).map(c => (
                                <div key={c.id}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingClass(c);
                                            setClassData({ name: c.name });
                                            setIsBulkClassMode(false);
                                            setIsClassModalOpen(true);
                                            setIsActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    >
                                        <Edit size={14} />
                                        <span>এডিট</span>
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClass(c.id);
                                            setIsActionMenuOpen(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                        <span>ডিলিট</span>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
}

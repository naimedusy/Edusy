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
    Layers,
    Plus,
    ChevronDown,
    MoreVertical,
    ChevronRight,
    Phone,
    MessageSquare,
    MessageCircle,
    List,
    ChevronLeft,
    Layers3,
    CheckCircle,
    FileX,
    FileSpreadsheet
} from 'lucide-react';
import { ScrollableTabs } from '@/components/ui/ScrollableTabs';
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
    const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
    const [classSearch, setClassSearch] = useState('');
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
    const [activeTab, setActiveTab] = useState<'students' | 'applications' | 'books' | 'teachers'>('students');

    const [teachers, setTeachers] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);

    // Excel Import States
    const [isExcelMode, setIsExcelMode] = useState(false);
    const [excelData, setExcelData] = useState<string[][]>([]);
    const [columnMappings, setColumnMappings] = useState<{ [key: number]: string }>({});

    const fetchTeachers = async () => {
        if (!activeInstitute?.id) return;
        try {
            const res = await fetch(`/api/teacher?instituteId=${activeInstitute.id}`);
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    setTeachers(data);
                }
            } catch (e) {
                console.error('Invalid JSON from fetchTeachers:', text.substring(0, 100));
            }
        } catch (error) {
            console.error('Failed to fetch teachers:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'teachers') {
            fetchTeachers();
        }
    }, [activeTab, activeInstitute?.id]);

    // Books States
    const [books, setBooks] = useState<any[]>([]);
    const [isBookModalOpen, setIsBookModalOpen] = useState(false);
    const [bookData, setBookData] = useState({ names: '', classId: '' });

    const [pendingCount, setPendingCount] = useState(0);

    const fetchPendingCount = async () => {
        if (!activeInstitute?.id) return;
        try {
            const res = await fetch(`/api/admin/users?role=STUDENT&instituteId=${activeInstitute.id}&admissionStatus=PENDING`);
            const data = await res.json();
            setPendingCount(Array.isArray(data) ? data.length : 0);
        } catch (error) {
            console.error('Fetch pending count error:', error);
        }
    };



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

    // Dropdown Positioning
    const classButtonRef = useRef<HTMLButtonElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0 });

    const handleOpenDropdown = () => {
        if (isClassDropdownOpen) {
            setIsClassDropdownOpen(false);
            return;
        }
        if (classButtonRef.current) {
            const rect = classButtonRef.current.getBoundingClientRect();
            setDropdownStyle({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
            setIsClassDropdownOpen(true);
        }
    };

    // Update position on scroll/resize if open
    useEffect(() => {
        if (!isClassDropdownOpen) return;
        const handleReposition = () => {
            if (classButtonRef.current) {
                const rect = classButtonRef.current.getBoundingClientRect();
                setDropdownStyle({
                    top: rect.bottom + window.scrollY + 8,
                    left: rect.left + window.scrollX,
                    width: rect.width
                });
            }
        };
        window.addEventListener('scroll', handleReposition, true);
        window.addEventListener('resize', handleReposition);
        return () => {
            window.removeEventListener('scroll', handleReposition, true);
            window.removeEventListener('resize', handleReposition);
        };
    }, [isClassDropdownOpen]);

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

    const fetchBooks = async () => {
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            const classFilter = selectedClassId !== 'all' ? `&classId=${selectedClassId}` : '';
            const res = await fetch(`/api/admin/books?instituteId=${activeInstitute.id}${classFilter}`);
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                setBooks(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('Invalid JSON from fetchBooks:', text.substring(0, 100));
                setBooks([]);
            }
        } catch (error) {
            console.error('Fetch books error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            const classFilter = selectedClassId !== 'all' ? `&classId=${selectedClassId}` : '';
            const groupFilter = selectedGroupId !== 'all' ? `&groupId=${selectedGroupId}` : '';
            const instituteFilter = activeInstitute?.id ? `&instituteId=${activeInstitute.id}` : '';
            const statusFilter = activeTab === 'applications' ? '&admissionStatus=PENDING' : '';

            const res = await fetch(`/api/admin/users?role=STUDENT&search=${search}${classFilter}${groupFilter}${instituteFilter}${statusFilter}`);
            const text = await res.text();
            try {
                const data = JSON.parse(text);
                const list = Array.isArray(data) ? data : [];
                setStudents(list);
            } catch (e) {
                console.error('Invalid JSON from fetchStudents:', text.substring(0, 100));
                setStudents([]);
            }
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
            fetchPendingCount();
        }
    }, [activeInstitute?.id]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'books') {
                fetchBooks();
            } else {
                fetchStudents();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, activeInstitute?.id, selectedClassId, selectedGroupId, activeTab]);

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

    const handleAutoGenerate = async (fieldId: string, providedClassId?: string, force = false) => {
        if (!activeInstitute?.id) return;

        // Don't overwrite if field already has value, unless forced
        const currentValue = formData.metadata?.[fieldId];
        if (currentValue && !force) return;

        try {
            const classId = providedClassId || formData.metadata?.classId || '';
            const res = await fetch(`/api/admin/students/next-ids?instituteId=${activeInstitute.id}&classId=${classId}`);
            const data = await res.json();

            if (fieldId === 'studentId') {
                setFormData((prev: any) => ({
                    ...prev,
                    metadata: { ...prev.metadata, studentId: data.nextStudentId }
                }));
            } else if (fieldId === 'rollNumber') {
                if (!classId) return;
                setFormData((prev: any) => ({
                    ...prev,
                    metadata: { ...prev.metadata, rollNumber: data.nextRollNumber }
                }));
            }
        } catch (error) {
            console.error('Auto generate failed', error);
        }
    };

    // Auto-generate IDs when modal opens for a new student
    useEffect(() => {
        if (isAddModalOpen && !editingStudent) {
            // Capture current classId from state
            const currentClassId = formData.metadata?.classId;
            // Give a small delay to ensure formData is initialized
            setTimeout(() => {
                handleAutoGenerate('studentId');
                if (currentClassId) {
                    handleAutoGenerate('rollNumber', currentClassId);
                }
            }, 100);
        }
    }, [isAddModalOpen, !!editingStudent]);

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
                metadata: editingStudent?.metadata?.admissionStatus === 'PENDING'
                    ? { ...formData.metadata, admissionStatus: 'APPROVED' }
                    : formData.metadata,
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
                const isReviewing = editingStudent?.metadata?.admissionStatus === 'PENDING';
                setToast({
                    message: isReviewing ? 'আবেদনটি মঞ্জুর ও ডাটা আপডেট করা হয়েছে!' : (editingStudent ? 'শিক্ষার্থীর তথ্য আপডেট করা হয়েছে!' : 'শিক্ষার্থী সফলভাবে যুক্ত করা হয়েছে!'),
                    type: 'success'
                });
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

    const handleStatusUpdate = async (studentId: string, status: 'APPROVED' | 'REJECTED') => {
        setActionLoading(true);
        try {
            let res;
            if (status === 'APPROVED') {
                const student = students.find(s => s.id === studentId);
                res = await fetch(`/api/admin/users?id=${studentId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        role: 'STUDENT',
                        metadata: { ...student.metadata, admissionStatus: 'APPROVED' }
                    })
                });
            } else {
                // Reject means delete
                res = await fetch(`/api/admin/users?id=${studentId}`, {
                    method: 'DELETE'
                });
            }

            if (res && res.ok) {
                setToast({ message: `আবেদনটি ${status === 'APPROVED' ? 'মঞ্জুর' : 'বাতিল'} করা হয়েছে।`, type: 'success' });
                fetchStudents();
                fetchPendingCount();
            }
        } catch (error) {
            console.error('Status update error:', error);
            setToast({ message: 'প্রক্রিয়াটি সম্পন্ন করতে সমস্যা হয়েছে।', type: 'error' });
        } finally {
            setActionLoading(false);
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

    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeInstitute?.id || !bookData.names.trim()) return;

        const targetClassId = bookData.classId || selectedClassId;
        if (targetClassId === 'all') {
            setToast({ message: 'দয়া করে একটি ক্লাস নির্বাচন করুন।', type: 'error' });
            return;
        }

        setActionLoading(true);
        try {
            const names = bookData.names.split('\n').map(n => n.trim()).filter(Boolean);
            const res = await fetch('/api/admin/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    names,
                    classId: targetClassId,
                    instituteId: activeInstitute.id
                })
            });

            const result = await res.json();

            if (res.ok) {
                setToast({ message: `${result.count || ''} টি বই সফলভাবে যুক্ত হয়েছে!`, type: 'success' });
                setIsBookModalOpen(false);
                setBookData({ names: '', classId: '' });
                fetchBooks();
            } else {
                setToast({ message: result.message || 'বই যুক্ত করতে সমস্যা হয়েছে।', type: 'error' });
            }
        } catch (error) {
            console.error('Book create error:', error);
            setToast({ message: 'সার্ভারে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleBookDelete = async (id: string) => {
        if (!confirm('আপনি কি নিশ্চিতভাবে এই বইটি মুছে ফেলতে চান?')) return;
        try {
            const res = await fetch(`/api/admin/books?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: 'বইটি সফলভাবে মুছে ফেলা হয়েছে।', type: 'success' });
                fetchBooks();
            }
        } catch (error) {
            console.error('Book delete error:', error);
        }
    };
    // Calculate allowed classes for admission
    const allowedClasses = React.useMemo(() => {
        if (activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN') return classes;
        if (activeRole === 'TEACHER' && user?.teacherProfiles) {
            const profile = user.teacherProfiles.find((p: any) => p.instituteId === activeInstitute?.id);
            if (!profile || !profile.permissions?.classWise) return [];

            return classes.filter(c => {
                const classPermissions = profile.permissions.classWise[c.id];
                return classPermissions && classPermissions.includes('canManageAdmission');
            });
        }
        return [];
    }, [classes, activeRole, user, activeInstitute]);

    if (activeRole !== 'ADMIN' && activeRole !== 'SUPER_ADMIN' && activeRole !== 'TEACHER') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <Users size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-medium font-bengali">আপনার এই পেজটি দেখার অনুমতি নেই।</p>
            </div>
        );
    }

    return (
        <div className="p-3 sm:p-4 md:p-8 space-y-6 animate-fade-in-up font-bengali max-w-full overflow-x-hidden">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                {/* ... existing tabs ... */}
                <button
                    onClick={() => setActiveTab('students')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'students'
                        ? 'bg-white text-[#045c84] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    শিক্ষার্থী
                </button>
                <button
                    onClick={() => setActiveTab('books')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'books'
                        ? 'bg-white text-[#045c84] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    বই
                </button>
                <button
                    onClick={() => setActiveTab('teachers')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'teachers'
                        ? 'bg-white text-[#045c84] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    শিক্ষক
                </button>
                <button
                    onClick={() => setActiveTab('applications')}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'applications'
                        ? 'bg-white text-[#045c84] shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <span>আবেদনসমূহ</span>
                    <span className="bg-[#045c84]/10 text-[#045c84] px-2 py-0.5 rounded-lg text-[10px]">
                        {pendingCount || 0}
                    </span>
                </button>
            </div>

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
            </div>




            {/* Class & Group Tabs */}
            <div className="sticky top-[72px] z-[100] bg-slate-50/95 backdrop-blur-sm py-3 -mx-3 px-3 sm:-mx-4 sm:px-4 md:-mx-8 md:px-8 space-y-4 shadow-sm transition-all max-w-full overflow-visible">
                {/* Class Dropdown */}
                <div className="flex items-center gap-3 relative z-[110]">

                    <div className="relative">
                        <button
                            ref={classButtonRef}
                            onClick={handleOpenDropdown}
                            className="flex items-center gap-3 pl-4 pr-3 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-[#045c84] transition-all group min-w-[200px] justify-between"
                        >
                            <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-sm font-bold text-slate-700 truncate">
                                    {selectedClassId === 'all'
                                        ? 'সকল ক্লাস'
                                        : classes.find(c => c.id === selectedClassId)?.name || 'ক্লাস নির্বাচন করুন'}
                                </span>
                            </div>
                            <ChevronDown
                                size={18}
                                className={`text-slate-400 group-hover:text-[#045c84] transition-transform duration-300 ${isClassDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>



                        {/* Dropdown Menu Portal */}
                        {isClassDropdownOpen && typeof document !== 'undefined' && createPortal(
                            <div className="fixed inset-0 z-[9999]">
                                <div
                                    className="fixed inset-0 bg-transparent"
                                    onClick={() => setIsClassDropdownOpen(false)}
                                ></div>
                                <div
                                    className="fixed bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-in fade-in zoom-in-95 duration-200"
                                    style={{
                                        top: dropdownStyle.top - window.scrollY, // Adjust because we are using fixed positioning
                                        left: dropdownStyle.left - window.scrollX, // Adjust for fixed positioning
                                        width: dropdownStyle.width,
                                        zIndex: 10000
                                    }}
                                >
                                    <div className="relative mb-2">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="ক্লাস খুঁজুন..."
                                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#045c84]/10"
                                            value={classSearch}
                                            onChange={(e) => setClassSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>

                                    <div className="max-h-[240px] overflow-y-auto scrollbar-hide space-y-1">
                                        <button
                                            onClick={() => {
                                                setSelectedClassId('all');
                                                setSelectedGroupId('all');
                                                setGroups([]);
                                                setIsClassDropdownOpen(false);
                                            }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-bold transition-all ${selectedClassId === 'all'
                                                ? 'bg-[#045c84] text-white shadow-md shadow-blue-500/20'
                                                : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            <span>সকল ক্লাস</span>
                                            {selectedClassId === 'all' && <ChevronRight size={14} />}
                                        </button>

                                        {classes
                                            .filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase()))
                                            .map(c => (
                                                <div
                                                    key={c.id}
                                                    className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all ${selectedClassId === c.id
                                                        ? 'bg-[#045c84] text-white shadow-md shadow-blue-500/20'
                                                        : 'text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <button
                                                        onClick={() => {
                                                            setSelectedClassId(c.id);
                                                            setSelectedGroupId('all');
                                                            fetchGroups(c.id);
                                                            setIsClassDropdownOpen(false);
                                                        }}
                                                        className="flex-1 text-left text-sm font-bold truncate"
                                                    >
                                                        {c.name}
                                                    </button>

                                                    {/* Quick Action Menu for Class */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setMenuPosition({
                                                                top: rect.bottom,
                                                                left: rect.left
                                                            });
                                                            setIsActionMenuOpen(isActionMenuOpen === c.id ? null : c.id);
                                                        }}
                                                        className={`p-1 rounded-lg transition-colors ${selectedClassId === c.id
                                                            ? 'text-blue-200 hover:bg-white/20 hover:text-white'
                                                            : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'
                                                            }`}
                                                    >
                                                        <MoreVertical size={20} />
                                                    </button>
                                                </div>
                                            ))}

                                        {classes.length > 0 && classes.filter(c => c.name.toLowerCase().includes(classSearch.toLowerCase())).length === 0 && (
                                            <div className="py-4 text-center text-xs text-slate-400 font-medium">
                                                কোন ক্লাস পাওয়া যায়নি
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}
                    </div>

                    <div className="w-px h-8 bg-slate-200 shrink-0"></div>

                    {(activeRole === 'ADMIN' || activeRole === 'SUPER_ADMIN') && (
                        <button
                            onClick={() => setIsClassModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-[#045c84] text-white hover:bg-[#034a6b] hover:shadow-lg hover:shadow-blue-200 transition-all shadow-md active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span>ক্লাস</span>
                        </button>
                    )}

                    {activeTab !== 'applications' && (allowedClasses.length > 0) && (
                        <button
                            onClick={() => {
                                if (activeTab === 'students') {
                                    // Auto-populate classId if a specific class is selected
                                    if (selectedClassId !== 'all') {
                                        setFormData({
                                            name: '',
                                            email: '',
                                            password: '',
                                            metadata: { classId: selectedClassId }
                                        });
                                    } else {
                                        setFormData({
                                            name: '',
                                            email: '',
                                            password: '',
                                            metadata: {}
                                        });
                                    }
                                    setIsAddModalOpen(true);
                                } else {
                                    setBookData({ names: '', classId: selectedClassId !== 'all' ? selectedClassId : '' });
                                    setIsBookModalOpen(true);
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold bg-[#045c84] text-white hover:bg-[#034a6b] hover:shadow-lg hover:shadow-blue-200 transition-all shadow-md active:scale-95 whitespace-nowrap"
                        >
                            {activeTab === 'students' ? <UserPlus size={18} /> : <BookOpen size={18} />}
                            <span>{activeTab === 'students' ? 'ছাত্র' : 'বই'}</span>
                        </button>
                    )}
                </div>

                {selectedClassId !== 'all' && (
                    <div className="flex items-center gap-4 pl-4 border-l-4 border-slate-200 animate-fade-in w-full min-w-0">
                        <div className="relative flex items-center flex-1 min-w-0 group/scroll">
                            <ScrollableTabs
                                items={[
                                    { id: 'all', label: 'সকল গ্রুপ' },
                                    ...groups.map(g => ({ id: g.id, label: g.name }))
                                ]}
                                selectedId={selectedGroupId}
                                onSelect={(id) => setSelectedGroupId(id)}
                                className="flex-1"
                                itemClassName={(item, isSelected) => `px-5 py-2 rounded-full whitespace-nowrap text-xs font-bold transition-all border ${isSelected
                                    ? 'bg-slate-800 text-white shadow-md shadow-slate-900/20 border-slate-800'
                                    : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50 hover:text-slate-800 hover:shadow-sm'
                                    }`}
                            />
                        </div>
                        <button
                            onClick={() => setIsGroupModalOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-100 text-slate-400 rounded-full shadow-sm hover:text-slate-800 hover:border-slate-300 hover:shadow-md transition-all group shrink-0 ml-auto"
                            title="নতুন গ্রুপ"
                        >
                            <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-[10px] font-bold hidden md:inline">গ্রুপ যোগ করুন</span>
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'students' ? (
                loading ? (
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
                        {students
                            .filter(s => {
                                if (activeRole === 'TEACHER') {
                                    if (allowedClasses.length > 0) {
                                        const studentClassId = s.metadata?.classId;
                                        return allowedClasses.some(c => c.id === studentClassId);
                                    }
                                    return false;
                                }
                                return true;
                            })
                            .map((s) => (
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

                                    {/* Actions - 3-Dot Action Button */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setMenuPosition({
                                                    top: rect.bottom + 8,
                                                    left: rect.right - 220
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
                )
            ) : activeTab === 'books' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {books.map((book) => (
                        <div key={book.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between group hover:border-[#045c84] transition-all">
                            <div>
                                <h3 className="font-bold text-slate-800">{book.name}</h3>
                                <p className="text-xs text-slate-500 mt-1">শ্রেণী: {book.class?.name || 'অজানা'}</p>
                            </div>
                            <button
                                onClick={() => handleBookDelete(book.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {books.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400">
                            <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                            <p>কোনো বই পাওয়া যায়নি</p>
                        </div>
                    )}
                </div>
            ) : activeTab === 'teachers' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teachers.length > 0 ? (
                        teachers.map((teacher: any) => (
                            <div key={teacher.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-[#045c84] transition-all">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                                    {teacher.avatar ? (
                                        <img src={teacher.avatar} alt={teacher.name} className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="text-xl font-bold">{teacher.name?.[0]}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-800 truncate">{teacher.name}</h3>
                                    <p className="text-xs text-slate-500 truncate">{teacher.phone}</p>
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                                            {teacher.role === 'ADMIN' ? 'অ্যাডমিন' : 'শিক্ষক'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-slate-400">
                            <Users size={48} className="mx-auto mb-3 opacity-20" />
                            <p className="font-medium">কোনো শিক্ষক পাওয়া যায়নি</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                        {students.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => {
                                    setEditingStudent(s);
                                    setFormData({
                                        name: s.name || '',
                                        email: s.email || '',
                                        password: s.password || '',
                                        metadata: s.metadata || {}
                                    });
                                    setIsAddModalOpen(true);
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

                                {/* Actions for Applications */}
                                <div className="flex items-center gap-2 pr-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusUpdate(s.id, 'APPROVED');
                                        }}
                                        className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                        title="মঞ্জুর করুন"
                                    >
                                        <CheckCircle size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusUpdate(s.id, 'REJECTED');
                                        }}
                                        className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                        title="বাতিল করুন"
                                    >
                                        <FileX size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                    setFormData({ name: '', email: '', password: '', metadata: {} });
                }}
                title={editingStudent ? "শিক্ষার্থীর তথ্য আপডেট করুন" : "নতুন শিক্ষার্থী যুক্ত করুন"}
                maxWidth="max-w-lg"
                headerActions={
                    <>
                        {!editingStudent && (
                            <button
                                onClick={() => {
                                    if (!isExcelMode) {
                                        setExcelData([]);
                                        setColumnMappings({});
                                    }
                                    setIsExcelMode(!isExcelMode);
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isExcelMode
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                    }`}
                            >
                                <FileSpreadsheet size={16} />
                                <span>{isExcelMode ? 'ফর্ম মোড' : 'Excel Import'}</span>
                            </button>
                        )}
                    </>
                }
            >
                <form onSubmit={handleFormSubmit} className="p-5 md:p-8 space-y-6">
                    {editingStudent?.metadata?.admissionStatus === 'PENDING' && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 animate-pulse">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-black text-amber-800 uppercase tracking-widest">আবেদনটি রিভিউ করা হচ্ছে</p>
                                <p className="text-[10px] text-amber-600 font-bold">'মঞ্জুর ও নিশ্চিত করুন' বাটনে ক্লিক করলে ভর্তির তথ্য আপডেট হবে এবং স্ট্যাটাস Approved হয়ে যাবে।</p>
                            </div>
                        </div>
                    )}
                    {isExcelMode ? (
                        /* Excel Paste Mode */
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">
                                    Excel থেকে ডাটা Paste করুন
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84] focus:border-[#045c84] resize-none font-mono text-sm"
                                    rows={6}
                                    placeholder="Excel থেকে কপি করে এখানে Paste করুন (Ctrl+V)..."
                                    onPaste={(e) => {
                                        const pastedText = e.clipboardData.getData('text');
                                        const rows = pastedText.trim().split('\n').map(row =>
                                            row.split('\t').map(cell => cell.trim())
                                        );
                                        setExcelData(rows);
                                    }}
                                />
                            </div>

                            {excelData.length > 0 && (
                                <>
                                    <div className="text-sm text-slate-600 font-medium">
                                        {excelData.length} সারি পাওয়া গেছে
                                    </div>

                                    {/* Table Preview with Column Mapping */}
                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-slate-50">
                                                        {excelData[0]?.map((_, colIndex) => (
                                                            <th key={colIndex} className="px-3 py-2 text-left border-b border-slate-200">
                                                                <select
                                                                    value={columnMappings[colIndex] || ''}
                                                                    onChange={(e) => setColumnMappings({
                                                                        ...columnMappings,
                                                                        [colIndex]: e.target.value
                                                                    })}
                                                                    className="w-full px-2 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#045c84] focus:border-[#045c84]"
                                                                >
                                                                    <option value="">ফিল্ড নির্বাচন করুন</option>
                                                                    {formConfig.map(field => (
                                                                        <option key={field.id} value={field.id}>
                                                                            {field.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {excelData.slice(0, 5).map((row, rowIndex) => (
                                                        <tr key={rowIndex} className="hover:bg-slate-50">
                                                            {row.map((cell, cellIndex) => (
                                                                <td key={cellIndex} className="px-3 py-2 border-b border-slate-100 text-slate-700">
                                                                    {cell || '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {excelData.length > 5 && (
                                            <div className="px-3 py-2 bg-slate-50 text-xs text-slate-500 text-center border-t border-slate-200">
                                                প্রথম 5 সারি দেখানো হচ্ছে। মোট {excelData.length} সারি Import হবে।
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!activeInstitute?.id) {
                                                setToast({ message: 'সক্রিয় প্রতিষ্ঠান পাওয়া যায়নি।', type: 'error' });
                                                return;
                                            }

                                            setActionLoading(true);
                                            try {
                                                let successCount = 0;
                                                let errorCount = 0;

                                                for (const row of excelData) {
                                                    const studentData: any = {
                                                        role: 'STUDENT',
                                                        instituteIds: [activeInstitute.id],
                                                        metadata: {}
                                                    };

                                                    // Map columns to fields
                                                    Object.entries(columnMappings).forEach(([colIndex, fieldId]) => {
                                                        const value = row[parseInt(colIndex)];
                                                        if (value) {
                                                            if (['name', 'email', 'password', 'phone'].includes(fieldId)) {
                                                                studentData[fieldId] = value;
                                                            } else {
                                                                studentData.metadata[fieldId] = value;
                                                            }
                                                        }
                                                    });

                                                    // Validate required fields
                                                    if (!studentData.name || !studentData.password) {
                                                        errorCount++;
                                                        continue;
                                                    }

                                                    try {
                                                        const res = await fetch('/api/admin/users', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify(studentData)
                                                        });

                                                        if (res.ok) {
                                                            successCount++;
                                                        } else {
                                                            errorCount++;
                                                        }
                                                    } catch {
                                                        errorCount++;
                                                    }
                                                }

                                                setToast({
                                                    message: `${successCount} জন শিক্ষার্থী সফলভাবে যুক্ত হয়েছে${errorCount > 0 ? `, ${errorCount} টি ব্যর্থ হয়েছে` : ''}`,
                                                    type: successCount > 0 ? 'success' : 'error'
                                                });

                                                if (successCount > 0) {
                                                    fetchStudents();
                                                    setIsAddModalOpen(false);
                                                    setIsExcelMode(false);
                                                    setExcelData([]);
                                                    setColumnMappings({});
                                                }
                                            } catch (error) {
                                                setToast({ message: 'Import ব্যর্থ হয়েছে।', type: 'error' });
                                            } finally {
                                                setActionLoading(false);
                                            }
                                        }}
                                        disabled={actionLoading || Object.keys(columnMappings).length === 0}
                                        className="w-full py-3 bg-[#045c84] text-white rounded-xl font-bold hover:bg-[#034a6b] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                <span>Import হচ্ছে...</span>
                                            </>
                                        ) : (
                                            <>
                                                <CloudUpload size={20} />
                                                <span>{excelData.length} জন শিক্ষার্থী Import করুন</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        /* Regular Form Mode */
                        <>
                            <div className="space-y-4">
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
                                            <div key={field.id} className="space-y-2 group/field">
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

                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
                                                    <span>{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                                                    {field.id === 'password' && !editingStudent && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, password: Math.random().toString(36).slice(-8) })}
                                                            className="text-[10px] text-[#045c84] hover:underline"
                                                        >
                                                            জেনারেট করুন
                                                        </button>
                                                    )}
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
                                                                if (classId) {
                                                                    fetchGroups(classId);
                                                                    handleAutoGenerate('rollNumber', classId, true);
                                                                }
                                                                else setGroups([]);
                                                            }}
                                                            required={field.required}
                                                        >
                                                            <option value="">শ্রেণী নির্বাচন করুন</option>
                                                            <option value="">শ্রেণী নির্বাচন করুন</option>
                                                            {allowedClasses.map(c => (
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
                                                                onClick={() => handleAutoGenerate(field.id, undefined, true)}
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
                        </>
                    )}
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
                        {actionLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : editingStudent?.metadata?.admissionStatus === 'PENDING' ? (
                            <CheckCircle size={20} />
                        ) : (
                            <Save size={20} />
                        )}
                        <span>
                            {editingStudent?.metadata?.admissionStatus === 'PENDING'
                                ? 'মঞ্জুর ও নিশ্চিত করুন'
                                : 'সেভ করুন'}
                        </span>
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
            {
                isActionMenuOpen && menuPosition && createPortal(
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
                )
            }
            {/* Book Bulk Add Modal */}
            <Modal
                isOpen={isBookModalOpen}
                onClose={() => setIsBookModalOpen(false)}
                title="বই যুক্ত করুন (Bulk)"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleBookSubmit} className="p-5 md:p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">ক্লাস নির্বাচন করুন</label>
                        <select
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                            value={bookData.classId}
                            onChange={(e) => setBookData({ ...bookData, classId: e.target.value })}
                            required
                        >
                            <option value="">ক্লাস সিলেক্ট করুন</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">বইয়ের তালিকা (প্রতি লাইনে একটি)</label>
                        <textarea
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black min-h-[200px] resize-none"
                            placeholder={"যেমন:\nBangla\nEnglish\nMathematics"}
                            value={bookData.names}
                            onChange={(e) => setBookData({ ...bookData, names: e.target.value })}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-4 bg-[#045c84] text-white rounded-2xl font-bold hover:bg-[#034a6b] shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span>সেভ করুন</span>
                    </button>
                </form>
            </Modal>
        </div >
    );
}

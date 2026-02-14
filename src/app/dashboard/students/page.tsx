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
    Layers3
} from 'lucide-react';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import FieldLibrary, { FieldDefinition } from '@/components/FieldLibrary';

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
    const classTabsRef = useRef<HTMLDivElement>(null);
    const groupTabsRef = useRef<HTMLDivElement>(null);

    const scrollToCenter = (container: HTMLDivElement | null, selectedId: string) => {
        if (!container) return;
        const selectedElement = container.querySelector(`[data-id="${selectedId}"]`) as HTMLElement;
        if (selectedElement) {
            const containerWidth = container.offsetWidth;
            const elementWidth = selectedElement.offsetWidth;
            const elementLeft = selectedElement.offsetLeft;
            const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);
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

    const fetchFormConfig = async () => {
        if (!activeInstitute?.id) return;
        try {
            const res = await fetch(`/api/admin/institutes/form-config?instituteId=${activeInstitute.id}`);
            const data = await res.json();
            setFormConfig(Array.isArray(data) ? data : []);
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
            const res = await fetch(`/api/admin/users?role=STUDENT&search=${search}${classFilter}${groupFilter}`);
            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            const filtered = list.filter((u: any) =>
                u.institute?.name === activeInstitute.name
            );
            setStudents(filtered);
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

    const handleCreateStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeInstitute?.id) {
            setToast({ message: 'সক্রিয় প্রতিষ্ঠান পাওয়া যায়নি।', type: 'error' });
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    role: 'STUDENT',
                    instituteIds: [activeInstitute.id]
                }),
            });

            if (res.ok) {
                setToast({ message: 'শিক্ষার্থী সফলভাবে যুক্ত করা হয়েছে!', type: 'success' });
                setIsAddModalOpen(false);
                setFormData({ name: '', email: '', password: '', metadata: {} });
                fetchStudents();
            } else {
                const data = await res.json();
                setToast({ message: data.message || 'ব্যর্থ হয়েছে।', type: 'error' });
            }
        } catch (error) {
            console.error('Create student error:', error);
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
        <div className="p-4 md:p-8 space-y-8 animate-fade-in-up font-bengali">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight font-sans">শিক্ষার্থী ব্যবস্থাপনা</h1>
                    <p className="text-slate-500 font-medium">আপনার প্রতিষ্ঠানের শিক্ষার্থীদের তথ্য পরিচালনা করুন।</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none text-black font-medium shadow-sm"
                            placeholder="খুঁজুন..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setIsLibraryOpen(true)}
                        className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl shadow-sm hover:shadow-md hover:border-[#045c84] hover:text-[#045c84] transition-all active:scale-95"
                        title="ফর্ম ফিল্ড লাইব্রেরি"
                    >
                        <Settings2 size={24} />
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-4 bg-[#045c84] text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95"
                    >
                        <UserPlus size={20} />
                        <span>নতুন শিক্ষার্থী</span>
                    </button>
                </div>
            </div>

            {/* Class & Group Tabs */}
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="flex-1 relative flex items-center">
                        <div
                            ref={classTabsRef}
                            className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-2 p-1 pr-16 scroll-smooth"
                        >
                            <div
                                data-id="all"
                                className={`relative rounded-2xl whitespace-nowrap font-bold transition-all flex items-center border ${selectedClassId === 'all'
                                    ? 'bg-[#045c84] text-white shadow-lg shadow-blue-100 border-[#045c84]'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-[#045c84]'
                                    }`}>
                                <button
                                    onClick={() => {
                                        setSelectedClassId('all');
                                        setSelectedGroupId('all');
                                        setGroups([]);
                                    }}
                                    className="px-6 py-3 h-full w-full text-left"
                                >
                                    সকল ক্লাস
                                </button>
                                <div className="relative pr-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setMenuPosition({
                                                top: rect.bottom,
                                                left: rect.right - 128 // width of menu
                                            });
                                            setIsActionMenuOpen(isActionMenuOpen === 'all' ? null : 'all');
                                        }}
                                        className={`p-1 rounded-lg transition-colors ${selectedClassId === 'all' ? 'hover:bg-white/20' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>
                            {classes.map(c => (
                                <div
                                    key={c.id}
                                    data-id={c.id}
                                    className={`relative rounded-2xl whitespace-nowrap font-bold transition-all flex items-center border ${selectedClassId === c.id
                                        ? 'bg-[#045c84] text-white shadow-lg shadow-blue-100 border-[#045c84]'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-[#045c84]'
                                        }`}
                                >
                                    <button
                                        onClick={() => {
                                            setSelectedClassId(c.id);
                                            setSelectedGroupId('all');
                                            fetchGroups(c.id);
                                        }}
                                        className="px-6 py-3 h-full w-full text-left"
                                    >
                                        {c.name}
                                    </button>

                                    {selectedClassId === c.id && (
                                        <div className="relative pr-2 animate-fade-in">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setMenuPosition({
                                                        top: rect.bottom,
                                                        left: rect.right - 128 // width of menu
                                                    });
                                                    setIsActionMenuOpen(isActionMenuOpen === c.id ? null : c.id);
                                                }}
                                                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsClassModalOpen(true)}
                            className="absolute right-1 p-3 bg-white/80 backdrop-blur-md border border-slate-200 text-[#045c84] rounded-2xl shadow-xl hover:shadow-2xl hover:border-[#045c84] transition-all z-10 scale-90 md:scale-100"
                            title="নতুন ক্লাস"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {selectedClassId !== 'all' && (
                    <div className="flex items-center gap-4 pl-4 border-l-4 border-slate-200 animate-fade-in">
                        <div className="flex-1 relative flex items-center">
                            <div
                                ref={groupTabsRef}
                                className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-2 p-1 pr-12 scroll-smooth"
                            >
                                <button
                                    onClick={() => setSelectedGroupId('all')}
                                    data-id="all"
                                    className={`px-5 py-2 rounded-xl whitespace-nowrap text-xs font-black transition-all ${selectedGroupId === 'all'
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
                                        className={`px-5 py-2 rounded-xl whitespace-nowrap text-xs font-black transition-all ${selectedGroupId === g.id
                                            ? 'bg-slate-800 text-white shadow-md'
                                            : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-800'
                                            }`}
                                    >
                                        {g.name}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsGroupModalOpen(true)}
                                className="absolute right-1 p-2 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-400 rounded-xl shadow-lg hover:text-slate-800 hover:border-slate-800 transition-all z-10"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">শিক্ষার্থী</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">অ্যাকশন</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                                        <span>লোড হচ্ছে...</span>
                                    </td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                                        <Users className="mx-auto mb-2 opacity-20" size={48} />
                                        <span>কোন শিক্ষার্থী পাওয়া যায়নি।</span>
                                    </td>
                                </tr>
                            ) : students.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-black">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#045c84] font-black text-lg">
                                                {s.name?.[0] || 'S'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{s.name || 'নাম নেই'}</div>
                                                <div className="text-xs text-slate-500">{s.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Student Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="নতুন শিক্ষার্থী যুক্ত করুন"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleCreateStudent} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">পুরো নাম</label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                placeholder="যেমন: মোঃ সাকিব হাসান"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">ইমেইল (লগইন এর জন্য)</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                placeholder="student@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">পাসওয়ার্ড</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                placeholder="পাসওয়ার্ড দিন"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>

                        {/* Dynamic Fields */}
                        {formConfig.map((field) => (
                            <div key={field.id} className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>

                                {field.type === 'select' ? (
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black appearance-none"
                                            value={formData.metadata[field.id] || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                metadata: { ...formData.metadata, [field.id]: e.target.value }
                                            })}
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
                                        <div className={`w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-between transition-all ${formData.metadata[field.id] ? 'border-green-200 bg-green-50/30' : 'hover:border-[#045c84]'}`}>
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <CloudUpload className={formData.metadata[field.id] ? 'text-green-500' : 'text-slate-400'} size={20} />
                                                <span className="text-sm font-medium text-slate-600 truncate">
                                                    {formData.metadata[field.id] ? 'ফাইল আপলোড হয়েছে' : 'ফাইল নির্বাচন করুন'}
                                                </span>
                                            </div>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => handleFileUpload(e, field.id)}
                                                required={field.required && !formData.metadata[field.id]}
                                            />
                                            {formData.metadata[field.id] && (
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
                                            value={formData.metadata[field.id] || ''}
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
                                            value={formData.metadata[field.id] || ''}
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
                                    <input
                                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                        placeholder={field.placeholder || `${field.label} দিন`}
                                        value={formData.metadata[field.id] || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            metadata: { ...formData.metadata, [field.id]: e.target.value }
                                        })}
                                        required={field.required}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={actionLoading}
                            className="px-8 py-4 bg-[#045c84] hover:bg-[#034d6e] text-white font-black rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
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
                <form onSubmit={handleQuickClassCreate} className="p-8 space-y-6">
                    {!editingClass && (
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-wider ml-2">বাল্ক অ্যাড (Bulk)</span>
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
                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">ক্লাসের নাম</label>
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
                        className="w-full py-4 bg-[#045c84] text-white font-black rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
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
                <form onSubmit={handleQuickGroupCreate} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">গ্রুপের নাম</label>
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
                        className="w-full py-4 bg-[#045c84] text-white font-black rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                        {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        <span>সেভ করুন</span>
                    </button>
                </form>
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            {/* Action Menu Portal */}
            {isActionMenuOpen && menuPosition && createPortal(
                <>
                    <div className="fixed inset-0 z-[999998]" onClick={() => setIsActionMenuOpen(null)} />
                    <div
                        className="fixed w-32 bg-white rounded-xl shadow-2xl border border-slate-100 py-1 z-[999999] overflow-hidden text-slate-700 animate-in fade-in zoom-in duration-100"
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

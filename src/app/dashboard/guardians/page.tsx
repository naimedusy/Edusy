'use client';

import React, { useState, useEffect } from 'react';
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
    HeartPulse
} from 'lucide-react';
import Toast from '@/components/Toast';
import Modal from '@/components/Modal';
import GuardianCard from '@/components/GuardianCard';
import GuardianDetailsModal from '@/components/GuardianDetailsModal';

export default function GuardianManagementPage() {
    const { user, activeRole, activeInstitute } = useSession();
    const [guardians, setGuardians] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedClassId, setLinkClassId] = useState('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedGuardian, setSelectedGuardian] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        studentId: '',
        relationship: '',
    });

    const fetchGuardians = async () => {
        setLoading(true);
        try {
            const instituteFilter = activeInstitute?.id ? `&instituteId=${activeInstitute.id}` : '';
            const res = await fetch(`/api/admin/users?role=GUARDIAN&search=${search}${instituteFilter}`);
            const data = await res.json();
            setGuardians(Array.isArray(data) ? data : []);
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('Fetch guardians error:', error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        if (!activeInstitute?.id) return;
        try {
            const res = await fetch(`/api/admin/users?role=STUDENT&instituteId=${activeInstitute.id}`);
            const data = await res.json();
            setStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch students error:', error);
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

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGuardians();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, activeInstitute?.id]);

    useEffect(() => {
        if (activeInstitute?.id) {
            fetchStudents();
            fetchClasses();
        }
    }, [activeInstitute?.id]);

    const filteredStudents = students
        .filter(s => {
            const matchesSearch = studentSearch === '' ||
                s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.phone?.includes(studentSearch) ||
                s.metadata?.studentId?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.metadata?.rollNumber?.includes(studentSearch);

            const matchesClass = selectedClassId === 'all' || s.metadata?.classId === selectedClassId;

            return matchesSearch && matchesClass;
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'bn'));

    const handleSelectStudent = (s: any) => {
        setFormData(prev => ({
            ...prev,
            studentId: s.id,
            name: s.metadata?.guardianName || prev.name,
            phone: s.metadata?.guardianPhone || prev.phone,
            email: s.metadata?.guardianEmail || prev.email,
            relationship: s.metadata?.guardianRelation || prev.relationship
        }));
    };

    const handleCreateGuardian = async (e: React.FormEvent) => {
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
                    role: 'GUARDIAN',
                    instituteIds: [activeInstitute.id]
                }),
            });

            if (res.ok) {
                setToast({ message: 'অভিভাবক সফলভাবে যুক্ত করা হয়েছে!', type: 'success' });
                setIsAddModalOpen(false);
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    password: '',
                    studentId: '',
                    relationship: ''
                });
                fetchGuardians();
            } else {
                const data = await res.json();
                setToast({ message: data.message || 'ব্যর্থ হয়েছে।', type: 'error' });
            }
        } catch (error) {
            console.error('Create guardian error:', error);
            setToast({ message: 'সার্ভার এরর।', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteGuardian = async (id: string, name: string) => {
        try {
            const res = await fetch(`/api/admin/users?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setToast({ message: 'অভিভাবক সফলভাবে মুছে ফেলা হয়েছে!', type: 'success' });
                setIsDetailsModalOpen(false);
                fetchGuardians();
            } else {
                setToast({ message: 'মুছে ফেলা ব্যর্থ হয়েছে।', type: 'error' });
            }
        } catch (error) {
            console.error('Delete guardian error:', error);
            setToast({ message: 'সার্ভার এরর।', type: 'error' });
        }
    };

    if (activeRole !== 'ADMIN' && activeRole !== 'SUPER_ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 font-bengali">
                <HeartPulse size={64} className="mb-4 opacity-20" />
                <p className="text-xl font-medium">আপনার এই পেজটি দেখার অনুমতি নেই।</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-fade-in-up font-bengali min-h-screen pb-20">
            <div className="flex items-center justify-between gap-4">
                <div className="flex-1 max-w-lg">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84] transition-colors" size={20} />
                        <input
                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none text-black font-medium shadow-sm"
                            placeholder="খুঁজুন..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 sm:gap-4 px-4 sm:px-8 py-3 sm:py-4 bg-[#045c84] text-white rounded-2xl sm:rounded-[28px] shadow-xl shadow-blue-200 hover:shadow-2xl hover:bg-[#034a6b] transition-all active:scale-95 group shrink-0"
                >
                    <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform">
                        <UserPlus size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-[10px] font-bold text-blue-200/80 uppercase tracking-widest hidden sm:inline">নতুন</span>
                        <span className="text-sm sm:text-lg font-black tracking-tight">অভিভাবক</span>
                    </div>
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                    <Loader2 className="animate-spin text-[#045c84] mb-3" size={40} />
                    <p className="text-slate-500 font-bold">লোড হচ্ছে...</p>
                </div>
            ) : guardians.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
                    <Users className="text-slate-200 mb-4" size={64} />
                    <h3 className="text-xl font-bold text-slate-400">কোনো অভিভাবক পাওয়া যায়নি</h3>
                    <p className="text-slate-400 mt-1">অনুগ্রহ করে অন্য কিছু দিয়ে সার্চ করুন</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {guardians.map(g => {
                        const childId = g.metadata?.studentId || (g.metadata?.childrenIds && g.metadata.childrenIds[0]);
                        const linkedStudent = students.find(s => s.id === childId);

                        // Enrich student with class name if available
                        const enrichedStudent = linkedStudent ? {
                            ...linkedStudent,
                            metadata: {
                                ...linkedStudent.metadata,
                                className: classes.find(c => c.id === linkedStudent.metadata?.classId)?.name || linkedStudent.metadata?.className
                            }
                        } : null;

                        return (
                            <GuardianCard
                                key={g.id}
                                guardian={g}
                                students={students.filter(s =>
                                    (g.metadata?.childrenIds || (g.metadata?.studentId ? [g.metadata.studentId] : [])).includes(s.id)
                                )}
                                onDelete={handleDeleteGuardian}
                                onCardClick={(guardian) => {
                                    setSelectedGuardian(guardian);
                                    setIsDetailsModalOpen(true);
                                }}
                            />
                        );
                    })}
                </div>
            )}

            {/* Add Guardian Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
                    setStudentSearch('');
                    setLinkClassId('all');
                    setFormData({
                        name: '',
                        phone: '',
                        email: '',
                        password: '',
                        studentId: '',
                        relationship: ''
                    });
                }}
                title="নতুন অভিভাবক যুক্ত করুন"
                maxWidth="max-w-lg"
            >
                <form onSubmit={handleCreateGuardian} className="p-8 space-y-6">
                    {/* Hidden honeypot fields to catch browser autofill */}
                    <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
                        <input type="email" name="fake-email" tabIndex={-1} autoComplete="off" />
                        <input type="password" name="fake-password" tabIndex={-1} autoComplete="new-password" />
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">পুরো নাম</label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400"
                                placeholder="যেমন: মোঃ সাকিব হাসান"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">মোবাইল নম্বর <span className="text-red-500">*</span></label>
                                <input
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400"
                                    placeholder="017xxxxxxxx"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ইমেইল (ঐচ্ছিক)</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400"
                                    placeholder="guardian@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">শিক্ষার্থী নির্বাচন ও সম্পর্ক</label>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                        <input
                                            key={isAddModalOpen ? 'search-open' : 'search-closed'}
                                            type="text"
                                            name="student-search-field"
                                            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#045c84]/10 text-slate-800 placeholder:text-slate-400"
                                            placeholder="ছাত্র খুঁজুন..."
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                            autoComplete="off"
                                            data-lpignore="true"
                                            data-form-type="other"
                                            tabIndex={-1}
                                        />
                                    </div>
                                    <select
                                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#045c84]/10 text-slate-700"
                                        value={selectedClassId}
                                        onChange={(e) => setLinkClassId(e.target.value)}
                                    >
                                        <option value="all" className="text-slate-700">সকল ক্লাস</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id} className="text-slate-700">{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="max-h-[160px] overflow-y-auto scrollbar-hide space-y-2 pr-1">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => handleSelectStudent(s)}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${formData.studentId === s.id
                                                    ? 'bg-[#045c84] border-[#045c84] text-white shadow-md'
                                                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${formData.studentId === s.id ? 'bg-white/20' : 'bg-slate-100 text-[#045c84]'}`}>
                                                        {s.name?.[0] || 'S'}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="text-xs font-bold truncate max-w-[120px]">{s.name}</div>
                                                        <div className={`text-[9px] ${formData.studentId === s.id ? 'text-blue-100' : 'text-slate-400'}`}>ID: {s.metadata?.studentId || 'N/A'} | Roll: {s.metadata?.rollNumber || 'N/A'}</div>
                                                    </div>
                                                </div>
                                                {formData.studentId === s.id && (
                                                    <div className="w-5 h-5 bg-white text-[#045c84] rounded-full flex items-center justify-center">
                                                        <ShieldCheck size={12} />
                                                    </div>
                                                )}
                                            </button>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-xs text-slate-400 italic">
                                            কোন শিক্ষার্থী পাওয়া যায়নি
                                        </div>
                                    )}
                                </div>

                                {formData.studentId && (
                                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">ছাত্রের সাথে সম্পর্ক</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['বাবা', 'মা', 'ভাই', 'বোন', 'চাচা', 'খালা', 'অন্যান্য'].map(rel => (
                                                <button
                                                    key={rel}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, relationship: rel })}
                                                    className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all border ${formData.relationship === rel
                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                                                        }`}
                                                >
                                                    {rel}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">পাসওয়ার্ড</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400"
                                placeholder="পাসওয়ার্ড দিন"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                            <p className="text-[10px] text-slate-400 font-medium">পাসওয়ার্ড না দিলে মোবাইল নম্বরটিই পাসওয়ার্ড হিসেবে কাজ করবে।</p>
                        </div>
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

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <GuardianDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedGuardian(null);
                }}
                guardian={selectedGuardian}
                allStudents={students}
                classes={classes}
                onDelete={handleDeleteGuardian}
                onRefresh={async () => {
                    const latestGuardians = await fetchGuardians();
                    // Update current selected guardian state if it exists
                    if (selectedGuardian) {
                        const updated = latestGuardians.find((g: any) => g.id === selectedGuardian.id);
                        if (updated) setSelectedGuardian(updated);
                    }
                }}
            />
        </div >
    );
}

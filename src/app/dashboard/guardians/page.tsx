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

export default function GuardianManagementPage() {
    const { user, activeRole, activeInstitute } = useSession();
    const [guardians, setGuardians] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            const instituteFilter = activeInstitute?.id ? `&instituteId=${activeInstitute.id}` : '';
            const res = await fetch(`/api/admin/users?role=GUARDIAN&search=${search}${instituteFilter}`);
            const data = await res.json();
            setGuardians(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch guardians error:', error);
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

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGuardians();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, activeInstitute?.id]);

    useEffect(() => {
        if (activeInstitute?.id) {
            fetchStudents();
        }
    }, [activeInstitute?.id]);

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
                    className="flex items-center gap-4 px-8 py-4 bg-[#045c84] text-white rounded-[28px] shadow-xl shadow-blue-200 hover:shadow-2xl hover:bg-[#034a6b] transition-all active:scale-95 group"
                >
                    <div className="p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                        <UserPlus size={24} />
                    </div>
                    <div className="flex flex-col items-start leading-tight">
                        <span className="text-xs font-bold text-blue-200/80 uppercase tracking-widest">নতুন</span>
                        <span className="text-lg font-black tracking-tight">অভিভাবক</span>
                    </div>
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">অভিভাবক</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">অ্যাকশন</th>
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
                            ) : guardians.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-12 text-center text-slate-400">
                                        <Users className="mx-auto mb-2 opacity-20" size={48} />
                                        <span>কোন অভিভাবক পাওয়া যায়নি।</span>
                                    </td>
                                </tr>
                            ) : guardians.map((g) => (
                                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-black">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-[#045c84] font-bold text-lg">
                                                {g.name?.[0] || 'G'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{g.name || 'নাম নেই'}</div>
                                                <div className="text-xs text-slate-500">{g.email}</div>
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

            {/* Add Guardian Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false);
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
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">পুরো নাম</label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
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
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
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
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                    placeholder="guardian@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">শিক্ষার্থী নির্বাচন করুন</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black appearance-none"
                                    value={formData.studentId}
                                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                >
                                    <option value="">নির্বাচন করুন</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.metadata?.studentId || 'No ID'})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">সম্পর্ক</label>
                                <select
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black appearance-none"
                                    value={formData.relationship}
                                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                                    required={!!formData.studentId}
                                >
                                    <option value="">নির্বাচন করুন</option>
                                    <option value="বাবা">বাবা</option>
                                    <option value="মা">মা</option>
                                    <option value="ভাই">ভাই</option>
                                    <option value="বোন">বোন</option>
                                    <option value="চাচা">চাচা</option>
                                    <option value="খালা">খালা</option>
                                    <option value="অন্যান্য">অন্যান্য</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">পাসওয়ার্ড</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
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
        </div >
    );
}

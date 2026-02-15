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
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
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

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchGuardians();
        }, 500);
        return () => clearTimeout(timer);
    }, [search, activeInstitute?.id]);

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
                setFormData({ name: '', email: '', password: '' });
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
        <div className="p-4 md:p-8 space-y-8 animate-fade-in-up font-bengali">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight font-sans">অভিভাবক ব্যবস্থাপনা</h1>
                    <p className="text-slate-500 font-medium">আপনার প্রতিষ্ঠানের অভিভাবকদের তথ্য পরিচালনা করুন।</p>
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
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-4 bg-[#045c84] text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95"
                    >
                        <UserPlus size={20} />
                        <span>নতুন অভিভাবক</span>
                    </button>
                </div>
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
                onClose={() => setIsAddModalOpen(false)}
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
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ইমেইল (লগইন এর জন্য)</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                placeholder="guardian@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
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
        </div>
    );
}

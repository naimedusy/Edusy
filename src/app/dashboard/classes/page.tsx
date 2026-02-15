'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/SessionProvider';
import {
    BookOpen,
    Plus,
    Trash2,
    Loader2,
    ChevronRight,
    Layers as Layers3,
    Users,
    Save,
    X,
    LayoutGrid
} from 'lucide-react';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

export default function ClassesPage() {
    const { activeInstitute } = useSession();
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [selectedClass, setSelectedClass] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [classData, setClassData] = useState({ name: '' });
    const [bulkClassText, setBulkClassText] = useState('');
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [groupData, setGroupData] = useState({ name: '' });

    const fetchClasses = async () => {
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/classes?instituteId=${activeInstitute.id}`);
            const data = await res.json();
            setClasses(data || []);
        } catch (error) {
            console.error('Fetch classes error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeInstitute?.id) {
            fetchClasses();
        }
    }, [activeInstitute?.id]);

    const handleCreateClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeInstitute?.id) return;
        setActionLoading(true);
        try {
            let payload: any = { instituteId: activeInstitute.id };

            if (isBulkMode) {
                // Parse bulk text: 1. Class Name -> { name: "Class Name", order: 1 }
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
                    setToast({ message: 'অনুগ্রহ করে ক্লাস লিস্ট বা সঠিক ফরম্যাট দিন।', type: 'error' });
                    setActionLoading(false);
                    return;
                }
                payload.names = items;
            } else {
                if (!classData.name) {
                    setToast({ message: 'ক্লাসের নাম দিন।', type: 'error' });
                    setActionLoading(false);
                    return;
                }
                payload.name = classData.name;
            }

            const res = await fetch('/api/admin/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setToast({ message: isBulkMode ? 'ক্লাসগুলো সফলভাবে তৈরি হয়েছে!' : 'ক্লাস সফলভাবে তৈরি হয়েছে!', type: 'success' });
                setIsClassModalOpen(false);
                setClassData({ name: '' });
                setBulkClassText('');
                fetchClasses();
            }
        } catch (error) {
            setToast({ message: 'ক্রুটি হয়েছে।', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClass?.id) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...groupData, classId: selectedClass.id })
            });
            if (res.ok) {
                setToast({ message: 'গ্রুপ সফলভাবে তৈরি হয়েছে!', type: 'success' });
                setIsGroupModalOpen(false);
                setGroupData({ name: '' });
                fetchClasses();
            }
        } catch (error) {
            setToast({ message: 'ক্রুটি হয়েছে।', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in-up font-bengali">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight font-sans">ক্লাস ও গ্রুপ ব্যবস্থাপনা</h1>
                    <p className="text-slate-500 font-medium">আপনার প্রতিষ্ঠানের শ্রেণী এবং গ্রুপগুলো সেটআপ করুন।</p>
                </div>
                <button
                    onClick={() => setIsClassModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-4 bg-[#045c84] text-white font-bold rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95"
                >
                    <Plus size={20} />
                    <span>নতুন ক্লাস</span>
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 className="animate-spin mb-4" size={48} />
                    <p className="font-bold">লোড হচ্ছে...</p>
                </div>
            ) : classes.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center text-slate-400">
                    <BookOpen className="mx-auto mb-4 opacity-20" size={64} />
                    <p className="text-xl font-bold">কোন ক্লাস পাওয়া যায়নি।</p>
                    <button
                        onClick={() => setIsClassModalOpen(true)}
                        className="mt-4 text-[#045c84] font-bold hover:underline"
                    >
                        প্রথম ক্লাস তৈরি করুন →
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((c) => (
                        <div key={c.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#045c84] rounded-xl flex items-center justify-center text-white">
                                        <BookOpen size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">{c.name}</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        setSelectedClass(c);
                                        setIsGroupModalOpen(true);
                                    }}
                                    className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:text-[#045c84] hover:border-[#045c84] transition-all"
                                    title="গ্রুপ যোগ করুন"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    <LayoutGrid size={12} />
                                    <span>গ্রুপসমূহ</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(c.groups && c.groups.length > 0) ? c.groups.map((g: any) => (
                                        <span key={g.id} className="px-3 py-1 bg-blue-50 text-[#045c84] text-xs font-bold rounded-full border border-blue-100">
                                            {g.name}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-slate-400 italic">কোন গ্রুপ নেই</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Class Modal */}
            <Modal
                isOpen={isClassModalOpen}
                onClose={() => setIsClassModalOpen(false)}
                title="নতুন ক্লাস তৈরি করুন"
                maxWidth="max-w-md"
            >
                <form onSubmit={handleCreateClass} className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">বাল্ক অ্যাড (Bulk Add)</span>
                        <button
                            type="button"
                            onClick={() => setIsBulkMode(!isBulkMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isBulkMode ? 'bg-[#045c84]' : 'bg-slate-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isBulkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {!isBulkMode ? (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ক্লাসের নাম</label>
                            <input
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                placeholder="যেমন: ষষ্ঠ শ্রেণী"
                                value={classData.name}
                                onChange={(e) => setClassData({ ...classData, name: e.target.value })}
                                required={!isBulkMode}
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">ক্লাস লিস্ট (Pasted List)</label>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">ইংরেজি SL নম্বর থাকলে সমস্যা নেই</span>
                            </div>
                            <textarea
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black min-h-[150px] resize-none"
                                placeholder={"যেমন:\n1. Class One\n2. Class Two"}
                                value={bulkClassText}
                                onChange={(e) => setBulkClassText(e.target.value)}
                                required={isBulkMode}
                            />
                        </div>
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

            {/* Group Modal */}
            <Modal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                title={`নতুন গ্রুপ যোগ করুন (${selectedClass?.name})`}
                maxWidth="max-w-md"
            >
                <form onSubmit={handleCreateGroup} className="p-8 space-y-6">
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

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

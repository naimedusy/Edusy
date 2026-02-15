'use client';

import React, { useState, useEffect } from 'react';
import {
    Building2,
    X,
    Type,
    MapPin,
    Phone,
    Globe,
    Loader2,
    Save,
    Trash2,
    AlertTriangle
} from 'lucide-react';

interface InstituteProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    institute: any;
}

export default function InstituteProfileModal({ isOpen, onClose, institute }: InstituteProfileModalProps) {
    const [updating, setUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        type: '',
        address: '',
        phone: '',
        website: ''
    });

    // Delete State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        if (institute) {
            setEditForm({
                name: institute.name || '',
                type: institute.type || '',
                address: institute.address || '',
                phone: institute.phone || '',
                website: institute.website || ''
            });
        }
    }, [institute, isOpen]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!institute?.id) return;

        setUpdating(true);
        try {
            const res = await fetch('/api/institute', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: institute.id,
                    ...editForm
                })
            });

            if (res.ok) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Update Institute Profile Error:', error);
        } finally {
            setUpdating(false);
        }
    };

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setDeleteError('পাসওয়ার্ড দিন');
            return;
        }

        setDeleting(true);
        setDeleteError('');

        try {
            // Assuming we have user ID in session (not passed here props, might need context or assume backend handles if we pass instituteId)
            // Wait, DELETE route needs userId. InstituteProfileModal -> Dashboard -> Session. 
            // We need userId here. Let's use useSession.

            // Fetch checks session anyway? No, API route verifies userId matches. 
            // We need to pass userId to API.
            // Let's import useSession here.

            const session = JSON.parse(localStorage.getItem('edusy_session') || '{}');
            const userId = session.id;

            if (!userId) {
                setDeleteError('User session not found');
                return;
            }

            const res = await fetch('/api/institute', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instituteId: institute.id,
                    userId,
                    password
                })
            });

            const data = await res.json();

            if (res.ok) {
                window.location.reload();
            } else {
                setDeleteError(data.message || 'ডিলিট ব্যর্থ হয়েছে');
            }
        } catch (error) {
            console.error('Delete Institute Error:', error);
            setDeleteError('Something went wrong');
        } finally {
            setDeleting(false);
        }
    };

    if (deleteModalOpen) {
        return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-bengali">
                <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scale-in overflow-hidden border border-red-100">
                    <div className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">আপনি কি নিশ্চিত?</h3>
                        <p className="text-sm text-slate-500 font-medium">
                            এটি একটি <span className="text-red-600 font-bold">স্থায়ী অ্যাকশন</span>। এই প্রতিষ্ঠানের সকল ডাটা (ক্লাস, গ্রুপ, শিক্ষার্থী) মুছে ফেলা হবে।
                        </p>

                        <form onSubmit={handleDelete} className="space-y-4 pt-2">
                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">পাসওয়ার্ড দিন</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/5 transition-all outline-none font-bold text-slate-800"
                                    placeholder="আপনার পাসওয়ার্ড..."
                                    value={password}
                                    onChange={e => {
                                        setPassword(e.target.value);
                                        setDeleteError('');
                                    }}
                                />
                                {deleteError && <p className="text-xs font-bold text-red-500 ml-1">{deleteError}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeleteModalOpen(false);
                                        setPassword('');
                                        setDeleteError('');
                                    }}
                                    className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all uppercase tracking-widest text-xs"
                                >
                                    বাতিল
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleting}
                                    className="py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                                >
                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : 'নিশ্চিত করুন'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in font-bengali">
            <div className="bg-white w-full max-w-xl max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl animate-scale-in overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Building2 size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">প্রতিষ্ঠান প্রোফাইল আপডেট</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">প্রতিষ্ঠানের নাম</label>
                            <div className="relative">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold text-slate-800"
                                    value={editForm.name}
                                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">প্রতিষ্ঠানের ধরন</label>
                                <div className="relative">
                                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold text-slate-800"
                                        placeholder="উদা: মাদ্রাসা, স্কুল"
                                        value={editForm.type}
                                        onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">ফোন নাম্বার</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold text-slate-800"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">ঠিকানা</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold text-slate-800"
                                    value={editForm.address}
                                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">ওয়েবসাইট (লিঙ্ক)</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none font-bold text-slate-800"
                                    placeholder="https://example.com"
                                    value={editForm.website}
                                    onChange={e => setEditForm({ ...editForm, website: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all uppercase tracking-widest text-xs"
                        >
                            বাতিল করুন
                        </button>
                        <button
                            type="submit"
                            disabled={updating}
                            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            {updating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            আপডেট করুন
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-6 mt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(true)}
                            className="w-full py-3 border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 font-bold rounded-2xl transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 group"
                        >
                            <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                            প্রতিষ্ঠান ডিলিট করুন
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

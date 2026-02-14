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
    Save
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in font-bengali">
            <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl animate-scale-in overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Building2 size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">প্রতিষ্ঠান প্রোফাইল আপডেট</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleUpdate} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">প্রতিষ্ঠানের নাম</label>
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
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">প্রতিষ্ঠানের ধরন</label>
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
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">ফোন নাম্বার</label>
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
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">ঠিকানা</label>
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
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">ওয়েবসাইট (লিঙ্ক)</label>
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
                            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                        >
                            বাতিল করুন
                        </button>
                        <button
                            type="submit"
                            disabled={updating}
                            className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                        >
                            {updating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            আপডেট করুন
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

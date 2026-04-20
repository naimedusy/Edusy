'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Building2,
    Search,
    MapPin,
    Phone,
    Mail,
    Globe,
    Loader2,
    Users,
    ChevronRight,
    ArrowUpRight,
    X,
    ExternalLink,
    Calendar,
    Shield,
    Clock,
    Plus,
    Save,
    Edit3,
    Type
} from 'lucide-react';
import { useUI } from '@/components/UIProvider';
import { useSession } from '@/components/SessionProvider';

export default function GlobalInstituteList() {
    const { alert } = useUI();
    const { user, activeRole } = useSession();
    const [institutes, setInstitutes] = useState<any[]>([]);
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedInst, setSelectedInst] = useState<any>(null);
    const [editingInst, setEditingInst] = useState<any>(null);

    // Add Institute Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [newInst, setNewInst] = useState({
        name: '',
        type: '',
        address: '',
        phone: '',
        website: '',
        userId: '' // Admin to link
    });

    const fetchInstitutes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/institutes?role=${activeRole || ''}&t=${Date.now()}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setInstitutes(data);
            } else {
                console.error('Expected array from institutes API, got:', data);
                setInstitutes([]);
            }
        } catch (error) {
            console.error('Fetch institutes error:', error);
            setInstitutes([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            const res = await fetch('/api/admin/users?role=ADMIN');
            const data = await res.json();
            if (Array.isArray(data)) {
                setAdmins(data);
            } else {
                console.error('Expected array from admins API, got:', data);
                setAdmins([]);
            }
        } catch (error) {
            console.error('Fetch admins error:', error);
            setAdmins([]);
        }
    };

    useEffect(() => {
        fetchInstitutes();
        fetchAdmins();
    }, [activeRole]);

    useEffect(() => {
        if (editingInst) {
            setNewInst({
                name: editingInst.name || '',
                type: editingInst.type || '',
                address: editingInst.address || '',
                phone: editingInst.phone || '',
                website: editingInst.website || '',
                userId: '' // UserId is usually not changed during edit or handled differently
            });
        }
    }, [editingInst]);

    const handleSaveInstitute = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newInst.name || (!editingInst && !newInst.userId)) {
            await alert('প্রতিষ্ঠানের নাম এবং অ্যাডমিন নির্বাচন করুন।');
            return;
        }

        setCreateLoading(true);
        try {
            const url = editingInst 
                ? `/api/admin/institutes?id=${editingInst.id}`
                : '/api/institute';
            
            const method = editingInst ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newInst),
            });

            if (res.ok) {
                setIsAddModalOpen(false);
                setEditingInst(null);
                setNewInst({ name: '', type: '', address: '', phone: '', website: '', userId: '' });
                fetchInstitutes();
            } else {
                const error = await res.json();
                await alert(error.message || 'সেভ করতে সমস্যা হয়েছে।');
            }
        } catch (error) {
            console.error('Save institute error:', error);
            await alert('সার্ভার এর সাথে সংযোগ বিচ্ছিন্ন হয়েছে।');
        } finally {
            setCreateLoading(false);
        }
    };

    const filteredInstitutes = Array.isArray(institutes) ? institutes.filter(inst =>
        inst.name.toLowerCase().includes(search.toLowerCase()) ||
        inst.type?.toLowerCase().includes(search.toLowerCase())
    ) : [];

    return (
        <div className="p-8 space-y-8 animate-fade-in-up font-sans">
            {/* Header section with Stats and Add Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">প্রতিষ্ঠান ম্যানেজমেন্ট</h1>
                    <p className="text-slate-500 font-medium font-sans">সিস্টেমে রেজিস্টার্ড সকল প্রতিষ্ঠানের বিস্তারিত ওভারভিউ এবং কন্ট্রোল।</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84] transition-colors" size={18} />
                        <input
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none text-black font-bold shadow-sm text-sm"
                            placeholder="খুঁজুন..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {(activeRole === 'SUPER_ADMIN' || activeRole === 'ADMIN') && (
                        <button
                            onClick={() => {
                                setEditingInst(null);
                                setIsAddModalOpen(true);
                            }}
                            className="px-6 py-3.5 bg-[#045c84] hover:bg-[#034d6e] text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center gap-2 text-sm uppercase tracking-wider"
                        >
                            <Plus size={18} />
                            নতুন প্রতিষ্ঠান
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#045c84] mb-4" size={40} />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">তথ্য লোড হচ্ছে...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInstitutes.length === 0 ? (
                        <div className="md:col-span-2 lg:col-span-3 py-20 text-center text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                            <Building2 className="mx-auto mb-4 opacity-10" size={64} />
                            <p className="text-lg font-medium">কোন প্রতিষ্ঠান পাওয়া যায়নি।</p>
                        </div>
                    ) : filteredInstitutes.map((inst, index) => (
                        <div
                            key={inst?.id || `admin-inst-${index}`}
                            onClick={() => setSelectedInst(inst)}
                            className="bg-white rounded-3xl border border-slate-100 p-6 hover:shadow-2xl hover:shadow-blue-900/10 transition-all cursor-pointer group relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-8 -mt-8 group-hover:bg-[#045c84]/5 transition-colors"></div>

                            <div className="flex items-start gap-4 mb-6 relative z-10">
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[#045c84] font-black text-2xl border border-slate-100 shadow-inner group-hover:bg-[#045c84] group-hover:text-white transition-all">
                                    {inst.name[0]}
                                </div>
                                <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-black text-slate-800 tracking-tight text-lg line-clamp-1 group-hover:text-[#045c84] transition-colors">{inst.name}</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{inst.type}</span>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-[#045c84] transition-all transform group-hover:translate-x-1" size={20} />
                            </div>

                            <div className="space-y-3 mb-6 relative z-10">
                                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium line-clamp-1">
                                    <MapPin size={16} className="text-[#045c84]/60" />
                                    <span>{inst.address || 'ঠিকানা দেওয়া নেই'}</span>
                                </div>
                                <div className="flex flex-col gap-1.5 text-sm text-slate-500 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-[#045c84]/60" />
                                        <span>অ্যাডমিন: {(inst._count?.onlyAdmins || 0).toLocaleString('bn-BD')} জন</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <Shield size={14} className="text-emerald-500/60" />
                                            <span className="text-xs">শিক্ষক: {(inst._count?.teachers || 0).toLocaleString('bn-BD')} জন</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users size={14} className="text-sky-500/60" />
                                            <span className="text-xs">শিক্ষার্থী: {(inst._count?.students || 0).toLocaleString('bn-BD')} জন</span>
                                        </div>
                                    </div>
                                    {inst._count?.superAdmins > 0 && (
                                        <div className="flex items-center gap-2 text-[#045c84]">
                                            <Shield size={14} className="text-[#045c84]" />
                                            <span className="text-[10px] font-black uppercase tracking-wider italic">সুপার অ্যাডমিন: {(inst._count?.superAdmins).toLocaleString('bn-BD')} জন</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-[#045c84] transition-colors relative z-10">
                                <div className="flex items-center gap-1">
                                    <Clock size={12} />
                                    <span>{new Date(inst.createdAt).toLocaleDateString('bn-BD')}</span>
                                </div>
                                <button className="flex items-center gap-1 opacity-100 group-hover:translate-x-1 transition-transform">
                                    বিস্তারিত
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Institute Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in font-sans">
                    <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl animate-scale-in overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-[#045c84] rounded-2xl">
                                    <Building2 size={28} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{editingInst ? 'তথ্য পরিবর্তন করুন' : 'নতুন প্রতিষ্ঠান যুক্ত করুন'}</h2>
                            </div>
                            <button onClick={() => { setIsAddModalOpen(false); setEditingInst(null); }} className="p-2 hover:bg-slate-200/50 rounded-full transition-all text-slate-400">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveInstitute} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1">প্রতিষ্ঠানের নাম</label>
                                    <input
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#045c84] focus:ring-4 focus:ring-[#045c84]/5 transition-all outline-none font-bold text-slate-800 shadow-sm"
                                        placeholder="উদা: এভারগ্রিন হাই স্কুল"
                                        value={newInst.name}
                                        onChange={e => setNewInst({ ...newInst, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1">প্রতিষ্ঠানের ধরন</label>
                                    <div className="relative">
                                        <input
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#045c84] focus:ring-4 focus:ring-[#045c84]/5 transition-all outline-none font-bold text-slate-800 shadow-sm"
                                            placeholder="উদা: স্কুল / কলেজ"
                                            value={newInst.type}
                                            onChange={e => setNewInst({ ...newInst, type: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1">ফোন নম্বর</label>
                                    <input
                                        className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#045c84] focus:ring-4 focus:ring-[#045c84]/5 transition-all outline-none font-bold text-slate-800 shadow-sm"
                                        placeholder="উদা: +৮৮০১..."
                                        value={newInst.phone}
                                        onChange={e => setNewInst({ ...newInst, phone: e.target.value })}
                                    />
                                </div>

                                {!editingInst && (
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1">অ্যাডমিন নির্বাচন করুন</label>
                                        <select
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#045c84] focus:ring-4 focus:ring-[#045c84]/5 transition-all outline-none font-bold text-slate-800 shadow-sm appearance-none cursor-pointer"
                                            value={newInst.userId}
                                            onChange={e => setNewInst({ ...newInst, userId: e.target.value })}
                                        >
                                            <option value="">নির্বাচন করুন</option>
                                            {admins.map(admin => (
                                                <option key={admin.id} value={admin.id}>{admin.name} ({admin.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest ml-1">ঠিকানা</label>
                                    <textarea
                                        className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#045c84] focus:ring-4 focus:ring-[#045c84]/5 transition-all outline-none font-bold text-slate-800 shadow-sm resize-none"
                                        rows={2}
                                        placeholder="পুরো ঠিকানা এখানে লিখুন"
                                        value={newInst.address}
                                        onChange={e => setNewInst({ ...newInst, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={createLoading}
                                className="w-full py-4 bg-[#045c84] hover:bg-[#034d6e] text-white font-black rounded-2xl shadow-xl shadow-blue-100 transition-all uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 group"
                            >
                                {createLoading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18} className="group-hover:scale-110 transition-transform" />}
                                {editingInst ? 'তথ্য আপডেট করুন' : 'প্রতিষ্ঠান সংরক্ষণ করুন'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Institute Detail Modal - Using Portal for full-screen coverage */}
            {selectedInst && typeof window !== 'undefined' && createPortal(
                <div
                    className="fixed top-0 left-0 right-0 bottom-0 z-[200] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-fade-in overflow-y-auto font-sans"
                    onClick={(e) => {
                        // Close if clicking on backdrop
                        if (e.target === e.currentTarget) {
                            setSelectedInst(null);
                        }
                    }}
                >
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl animate-scale-in overflow-hidden my-auto flex flex-col" style={{ maxHeight: '90vh' }}>
                        {/* Header */}
                        <div className="relative h-40 bg-[#045c84] flex items-end px-8 pb-6">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <button
                                onClick={() => setSelectedInst(null)}
                                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/10"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-6 relative z-10 w-full">
                                <div className="w-20 h-20 bg-white/10 rounded-3xl backdrop-blur-xl flex items-center justify-center text-white font-black text-4xl border-2 border-white/20 shadow-2xl flex-shrink-0">
                                    {selectedInst.name[0]}
                                </div>
                                <div className="flex-1 text-white">
                                    <h2 className="text-4xl font-black tracking-tight leading-tight uppercase">{selectedInst.name}</h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider border border-white/20 italic">
                                            {selectedInst.type}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-sky-200">
                                            <Calendar size={12} />
                                            সক্রিয় {new Date(selectedInst.createdAt).toLocaleDateString('bn-BD')} হতে
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 font-sans">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Left Side: Contact Info */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-[#045c84] uppercase tracking-[0.3em] mb-4">যোগাযোগের তথ্য</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase font-black tracking-widest text-slate-400 mb-1">ঠিকানা</p>
                                                <p className="text-slate-800 font-bold text-lg">{selectedInst.address || 'ঠিকানা দেওয়া নেই'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase font-black tracking-widest text-slate-400 mb-1">ফোন</p>
                                                <p className="text-slate-800 font-bold text-lg">{selectedInst.phone || 'তথ্য নেই'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-slate-50 text-slate-400 rounded-xl">
                                                <Globe size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase font-black tracking-widest text-slate-400 mb-1">ওয়েবসাইট</p>
                                                {selectedInst.website ? (
                                                    <a href={selectedInst.website} target="_blank" rel="noopener noreferrer" className="text-[#045c84] font-bold hover:underline flex items-center gap-1 text-lg">
                                                        {selectedInst.website}
                                                        <ExternalLink size={14} />
                                                    </a>
                                                ) : (
                                                    <p className="text-slate-800 font-bold">তথ্য নেই</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Stats / Admin Info */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-black text-[#045c84] uppercase tracking-[0.3em] mb-4">প্রতিষ্ঠানের পরিসংখ্যান</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-[#045c84] rounded-2xl text-white">
                                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">অ্যাডমিন (Admin)</p>
                                            <p className="text-3xl font-black">{(selectedInst._count?.onlyAdmins || 0).toLocaleString('bn-BD')}</p>
                                        </div>
                                        <div className="p-4 bg-emerald-500 rounded-2xl text-white">
                                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">শিক্ষক (Teachers)</p>
                                            <p className="text-3xl font-black">{(selectedInst._count?.teachers || 0).toLocaleString('bn-BD')}</p>
                                        </div>
                                        <div className="p-4 bg-sky-500 rounded-2xl text-white">
                                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">শিক্ষার্থী (Students)</p>
                                            <p className="text-3xl font-black">{(selectedInst._count?.students || 0).toLocaleString('bn-BD')}</p>
                                        </div>
                                        <div className="p-4 bg-slate-800 rounded-2xl text-white">
                                            <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">সুপার অ্যাডমিন</p>
                                            <p className="text-3xl font-black">{(selectedInst._count?.superAdmins || 0).toLocaleString('bn-BD')}</p>
                                        </div>
                                    </div>

                                    {selectedInst.admins && selectedInst.admins.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">অ্যাডমিন তালিকা</h4>
                                            {selectedInst.admins.map((admin: any, idx: number) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center font-black text-slate-600 text-sm">
                                                        {admin.name?.[0] || 'A'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-slate-800 text-base truncate">{admin.name}</p>
                                                            {admin.role === 'SUPER_ADMIN' && (
                                                                <span className="px-1.5 py-0.5 bg-[#045c84]/10 text-[#045c84] text-[8px] font-black uppercase tracking-tighter rounded border border-[#045c84]/20 flex items-center gap-0.5">
                                                                    <Shield size={8} />
                                                                    PRO
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-slate-500 truncate">{admin.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-500/50"></div>
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">স্ট্যাটাস: সক্রিয়</span>
                            </div>
                            <div className="flex items-center gap-3">
                                { (activeRole === 'SUPER_ADMIN' || selectedInst.adminIds?.some((a: any) => (a.$oid || a) === user?.id)) && (
                                    <button 
                                        onClick={() => {
                                            setEditingInst(selectedInst);
                                            setIsAddModalOpen(true);
                                        }}
                                        className="px-6 py-4 bg-slate-200 text-slate-800 font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-slate-300 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Edit3 size={18} />
                                        এডিট করুন
                                    </button>
                                )}
                                <button className="px-8 py-4 bg-[#045c84] text-white font-black rounded-2xl text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-100 hover:shadow-xl hover:bg-[#034d6e] transition-all active:scale-95">
                                    ডাটাবেas এক্সেস করুন
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

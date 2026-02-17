import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Search, UserPlus, Mail, User, Phone, Briefcase, Lock, Loader2, Check } from 'lucide-react';

interface AddTeacherModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (data: any) => Promise<void>;
    instituteId?: string;
    instituteName?: string;
}

export default function AddTeacherModal({ isOpen, onClose, onAdd, instituteId, instituteName }: AddTeacherModalProps) {
    const [activeTab, setActiveTab] = useState<'search' | 'create'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        designation: '',
        department: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 1) { // Allow searching with 1 char if needed, but usually 3 is better. User said "type name", usually immediate feedback is expected. Let's stick to 1 or keep 3 but user might think it's broken if they type 'Al'. Let's go with 1 for "realtime" feel, or 2.
                // actually previous code had check < 3. Let's keep it robust.
                setSearchLoading(true);
                try {
                    const res = await fetch(`/api/user/search?q=${searchQuery}`);
                    const data = await res.json();
                    if (data.users) {
                        setSearchResults(data.users);
                    }
                } catch (error) {
                    console.error(error);
                } finally {
                    setSearchLoading(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleAddExisting = async (user: any) => {
        setLoading(true);
        try {
            // For existing user, we might need to ask for designation
            // For simplicity, we'll just add them as regular teacher first, then can edit
            await onAdd({
                email: user.email,
                phone: user.phone,
                designation: 'Managing Teacher', // Default
                department: 'General'
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAdd(formData);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="নতুন শিক্ষক যুক্ত করুন" maxWidth="max-w-2xl">
            <div className="font-bengali">
                {/* Institute Indicator */}
                {instituteName && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21h18" />
                                <path d="M9 8h1" />
                                <path d="M9 12h1" />
                                <path d="M9 16h1" />
                                <path d="M14 8h1" />
                                <path d="M14 12h1" />
                                <path d="M14 16h1" />
                                <path d="M6 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-blue-600 font-medium">যোগ করা হচ্ছে</p>
                            <p className="text-sm font-bold text-blue-800 truncate">{instituteName}</p>
                        </div>
                    </div>
                )}
                {/* Tabs */}
                <div className="flex border-b border-slate-100 mb-6">
                    <button
                        onClick={() => setActiveTab('search')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'search' ? 'border-[#045c84] text-[#045c84]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <Search size={16} />
                        সার্চ করুন
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'create' ? 'border-[#045c84] text-[#045c84]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserPlus size={16} />
                        নতুন তৈরি করুন
                    </button>
                </div>

                {activeTab === 'search' ? (
                    <div className="space-y-6 p-2 min-h-[300px]">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
                                className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 focus:border-[#045c84] outline-none transition-all font-sans placeholder:text-slate-400"
                                autoFocus
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            {searchLoading && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <Loader2 className="animate-spin text-[#045c84]" size={18} />
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {searchResults.length > 0 ? (
                                searchResults.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-lg">
                                                {user.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{user.name}</h4>
                                                <p className="text-xs text-slate-500 font-sans">{user.email || user.phone}</p>
                                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md border border-slate-200 mt-1 inline-block">
                                                    {user.role}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAddExisting(user)}
                                            disabled={loading}
                                            className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors flex items-center gap-2"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={12} /> : <><UserPlus size={14} /> যুক্ত করুন</>}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                searchQuery && !searchLoading && <div className="text-center py-8 text-slate-400">কোনো ব্যবহারকারী পাওয়া যায়নি</div>
                            )}

                            {!searchQuery && (
                                <div className="text-center py-10 text-slate-300">
                                    <Search className="mx-auto mb-2 opacity-50" size={32} />
                                    <p className="text-sm">শিক্ষক যুক্ত করতে প্রথমে সার্চ করুন</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleCreate} className="space-y-4 p-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">পূর্ণ নাম</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
                                        placeholder="শিক্ষকের নাম"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">ইমেইল (অপশনাল)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none text-sm font-bold text-slate-700 font-sans placeholder:text-slate-400"
                                        placeholder="example@mail.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">ফোন নম্বর</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        required
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none text-sm font-bold text-slate-700 font-sans placeholder:text-slate-400"
                                        placeholder="01XXXXXXXXX"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">পাসওয়ার্ড</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none text-sm font-bold text-slate-700 font-sans placeholder:text-slate-400"
                                        placeholder="******"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">পদবী / ডেসিগনেশন</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={formData.designation}
                                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
                                        placeholder="উদাহরণ: সহকারী শিক্ষক"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-500 ml-1">বিভাগ (অপশনাল)</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
                                        placeholder="উদাহরণ: বিজ্ঞান"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                                বাতিল
                            </button>
                            <button type="submit" disabled={loading} className="px-8 py-2.5 rounded-xl font-bold bg-[#045c84] text-white hover:bg-[#034a6b] transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 flex items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <><Check size={16} /> তৈরি করুন</>}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}

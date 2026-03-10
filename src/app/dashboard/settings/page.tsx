'use client';

import React, { useState } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Bell,
    ShieldCheck,
    Globe,
    Camera,
    Save,
    Trash2,
    Eye,
    EyeOff,
    Check,
    CloudUpload,
    Smartphone,
    Mail,
    Fingerprint,
    Building2,
    Languages
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

export default function SettingsPage() {
    const { user, activeRole } = useSession();
    const [activeTab, setActiveTab] = useState('profile');
    const [showPassword, setShowPassword] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => setIsSaving(false), 1500);
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in font-bengali min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 border border-slate-100 -z-0" />
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">সেটিংস ও প্রোফাইল</h1>
                    <p className="text-slate-500 font-bold max-w-lg leading-relaxed">
                        আপনার ব্যক্তিগত তথ্য আপডেট করুন, নোটিফিকেশন নিয়ন্ত্রণ করুন এবং অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করুন।
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <button
                        onClick={handleSave}
                        className={`px-8 py-5 ${isSaving ? 'bg-emerald-500' : 'bg-[#045c84]'} text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:shadow-blue-200 transition-all flex items-center gap-3 active:scale-95`}
                    >
                        {isSaving ? <Check size={18} /> : <Save size={18} />}
                        {isSaving ? 'সংরক্ষিত' : 'পরিবর্তন সেভ করুন'}
                    </button>
                    <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center text-[#045c84] shadow-sm">
                        <SettingsIcon size={32} />
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-80 shrink-0 space-y-4">
                    {[
                        { id: 'profile', label: 'প্রোফাইল তথ্য', icon: User, desc: 'নাম, ইমেইল ও ছবি' },
                        { id: 'notif', label: 'নোটিফিকেশন', icon: Bell, desc: 'অ্যালার্ট ও আপডেট' },
                        { id: 'security', label: 'নিরাপত্তা', icon: ShieldCheck, desc: 'পাসওয়ার্ড ও সুরক্ষা' },
                        { id: 'display', label: 'ভাষা ও ডিসপ্লে', icon: Languages, desc: 'থিম ও ফন্ট' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full p-6 rounded-[32px] border text-left transition-all group ${activeTab === item.id
                                ? 'bg-white border-[#045c84]/20 shadow-xl ring-4 ring-[#045c84]/5'
                                : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${activeTab === item.id ? 'bg-[#045c84] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-[#045c84]'
                                    }`}>
                                    <item.icon size={24} />
                                </div>
                                <div>
                                    <h3 className={`text-base font-black tracking-tight ${activeTab === item.id ? 'text-slate-800' : 'text-slate-500'}`}>{item.label}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.desc}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-[48px] border border-slate-100 shadow-sm p-10 lg:p-14 min-h-[600px]">
                    {activeTab === 'profile' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Profile Header */}
                            <div className="flex flex-col sm:flex-row items-center gap-8">
                                <div className="relative group">
                                    <div className="w-32 h-32 bg-gradient-to-tr from-[#045c84] to-sky-400 rounded-[40px] shadow-2xl flex items-center justify-center text-white text-5xl font-black">
                                        {user?.name ? user.name[0] : 'U'}
                                    </div>
                                    <button className="absolute -bottom-2 -right-2 p-3 bg-white border border-slate-100 rounded-2xl shadow-xl text-[#045c84] hover:bg-slate-50 transition-all">
                                        <Camera size={20} />
                                    </button>
                                </div>
                                <div className="text-center sm:text-left">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">{user?.name || 'ব্যবহারকারী'}</h2>
                                    <p className="text-xs font-black text-[#045c84] uppercase tracking-[0.2em] bg-blue-50 px-4 py-1.5 rounded-full w-fit mx-auto sm:mx-0">
                                        {activeRole === 'SUPER_ADMIN' ? 'সিস্টেম অ্যাডমিন' : activeRole === 'ADMIN' ? 'প্রতিষ্ঠান অ্যাডমিন' : 'শিক্ষক প্রোফাইল'}
                                    </p>
                                </div>
                            </div>

                            {/* Form Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">পুরো নাম</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#045c84] transition-colors" size={18} />
                                        <input type="text" defaultValue={user?.name || ''} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-[#045c84]/10 transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">মোবাইল নম্বর</label>
                                    <div className="relative group">
                                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#045c84] transition-colors" size={18} />
                                        <input type="text" defaultValue={user?.metadata?.phone || ''} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-[#045c84]/10 transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">ইমেইল অ্যাড্রেস</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#045c84] transition-colors" size={18} />
                                        <input type="email" defaultValue={user?.email || ''} className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-[#045c84]/10 transition-all" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">প্রতিষ্ঠান</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#045c84] transition-colors" size={18} />
                                        <input type="text" readOnly value="এডুসি একাডেমি" className="w-full pl-12 pr-6 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold text-slate-500 cursor-not-allowed" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">নিরাপত্তা সেটিংস</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">আপনার অ্যাকাউন্টের নিরাপত্তা সুনিশ্চিত করুন</p>
                            </div>

                            <div className="space-y-8 max-w-md">
                                <div className="space-y-3 text-emerald-600 bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                    <div className="flex items-center gap-3">
                                        <Fingerprint size={24} />
                                        <h4 className="font-black text-sm uppercase tracking-widest">টু-ফ্যাক্টর অথেনটিকেশন</h4>
                                    </div>
                                    <p className="text-[11px] font-bold leading-relaxed opacity-80">আপনার অ্যাকাউন্ট আরও সুরক্ষিত রাখতে মোবাইল ওটিপি (OTP) ভেরিফিকেশন সক্রিয় করুন।</p>
                                    <button className="text-[10px] font-black uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-sm mt-2">সক্রিয় করুন</button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">পুরানো পাসওয়ার্ড</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input type={showPassword ? 'text' : 'password'} className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">নতুন পাসওয়ার্ড</label>
                                        <div className="relative group">
                                            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input type={showPassword ? 'text' : 'password'} className="w-full pl-12 pr-12 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" />
                                            <button
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notif' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">নোটিফিকেশন প্রিফারেন্স</h3>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">কোন আপডেটগুলো আপনি পেতে চান তা নির্ধারণ করুন</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { title: 'নতুন নোটিশ', desc: 'প্রতিষ্ঠানের সকল ঘোষণা সঙ্গে সঙ্গে পান', enabled: true },
                                    { title: 'পরীক্ষার আপডেট', desc: 'সময়সূচী বা ফলাফল পরিবর্তনের আপডেট', enabled: true },
                                    { title: 'হাজিরা রিপোর্ট', desc: 'দৈনিক উপস্থিতির সংক্ষিপ্ত ফলাফল', enabled: false },
                                    { title: 'সিস্টেম নিউজলেটার', desc: 'এডুসি অ্যাপের নতুন ফিচার সংক্রান্ত তথ্য', enabled: true },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-6 rounded-3xl border border-slate-50 hover:bg-slate-50/50 transition-all">
                                        <div>
                                            <h4 className="text-base font-black text-slate-800 tracking-tight">{item.title}</h4>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{item.desc}</p>
                                        </div>
                                        <button className={`w-14 h-8 rounded-full transition-all relative ${item.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${item.enabled ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Storage Insight */}
            <div className="bg-[#045c84] rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-150 transition-transform duration-[2000ms]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl text-center md:text-left">
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 flex items-center justify-center md:justify-start gap-3">
                            <CloudUpload className="text-sky-300" />
                            আপনার ক্লাউড স্টোরেজ
                        </h2>
                        <p className="text-sky-100/80 font-bold leading-relaxed">
                            ব্যক্তিগত প্রোফাইলের জন্য আপনার কাছে ১ জিবি ফ্রি স্টোরেজ রয়েছে। যেকোনো গুরুত্বপূর্ণ ডকুমেন্ট বা ছবি নিরাপদে সংরক্ষণ করুন।
                        </p>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-3">
                        <div className="w-48 h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
                            <div className="w-[15%] h-full bg-sky-400" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">১৫০ এমবি / ১ জিবি ব্যবহার করা হয়েছে</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

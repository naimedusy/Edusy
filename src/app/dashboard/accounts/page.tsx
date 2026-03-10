'use client';

import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    DollarSign,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Download,
    Plus,
    Calendar,
    Users,
    ChevronRight,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    Wallet,
    Receipt
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

export default function AccountsPage() {
    const { activeInstitute } = useSession();
    const [activeTab, setActiveTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

    const stats = [
        { label: 'মোট আয়', value: '৳ ১,২৫,০০০', change: '+১২.৫%', trend: 'up', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'মোট ব্যয়', value: '৳ ৪৫,২০০', change: '+৫.২%', trend: 'up', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
        { label: 'বকেয়া ফি', value: '৳ ৮০,০০০', change: '-২.১%', trend: 'down', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'বর্তমান ব্যালেন্স', value: '৳ ৭৯,৮০০', change: '+৮.৪%', trend: 'up', icon: Wallet, color: 'text-[#045c84]', bg: 'bg-blue-50' },
    ];

    const transactions = [
        { id: 'TXN001', student: 'আহমেদ কবির', class: 'দশম', amount: '৫০০০', date: '১০ মার্চ, ২০২৬', status: 'COMPLETED', type: 'INCOME', category: 'মাসিক ফি' },
        { id: 'TXN002', student: 'সাফিয়া আক্তার', class: 'নবম', amount: '৩০০০', date: '০৯ মার্চ, ২০২৬', status: 'COMPLETED', type: 'INCOME', category: 'ভর্তি ফি' },
        { id: 'TXN003', category: 'বিদ্যুৎ বিল', amount: '৪৫০০', date: '০৮ মার্চ, ২০২৬', status: 'COMPLETED', type: 'EXPENSE', note: 'ফেব্রুয়ারি মাসের বিল' },
        { id: 'TXN004', student: 'তাহমিদ হাসান', class: 'অষ্টম', amount: '২০০০', date: '০৭ মার্চ, ২০২৬', status: 'PENDING', type: 'INCOME', category: 'বইয়ের দাম' },
    ];

    const renderStatus = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full"><CheckCircle2 size={12} /> সফল</span>;
            case 'PENDING':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full"><Clock size={12} /> পেন্ডিং</span>;
            default:
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full"><AlertCircle size={12} /> বাতিল</span>;
        }
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in font-bengali min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 border border-slate-100 -z-0" />
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">হিসাব ও লেনদেন</h1>
                    <p className="text-slate-500 font-bold max-w-lg leading-relaxed">
                        আপনার প্রতিষ্ঠানের সকল অর্থনৈতিক কর্মকাণ্ড এক নজরে দেখুন। ফি কালেকশন, বেতন এবং সকল আয়-ব্যয়ের হিসাব রাখুন ডিজিটাল পদ্ধতিতে।
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <button className="px-8 py-5 bg-[#045c84] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:shadow-blue-200 transition-all flex items-center gap-3 active:scale-95">
                        <Plus size={18} /> নতুন লেনদেন
                    </button>
                    <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center text-[#045c84] shadow-sm">
                        <CreditCard size={32} />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-black ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {stat.change}
                                {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </div>
                        </div>
                        <h3 className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-1">{stat.label}</h3>
                        <p className="text-2xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Tabs & Table */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
                <div className="px-10 py-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl w-fit">
                        {['overview', 'income', 'expense', 'pending'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                        ? 'bg-white text-[#045c84] shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab === 'overview' ? 'সংক্ষিপ্ত তথ্য' :
                                    tab === 'income' ? 'আয়' :
                                        tab === 'expense' ? 'ব্যয়' : 'বকেয়া'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84] transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="লেনদেন খুঁজুন..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-[#045c84]/20 w-full lg:w-64 transition-all"
                            />
                        </div>
                        <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-600 hover:bg-slate-100 transition-all">
                            <Filter size={20} />
                        </button>
                        <button className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-600 hover:bg-slate-100 transition-all">
                            <Download size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">লেনদেন আইডি</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">বিবরণ / শিক্ষার্থী</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ধরণ</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">পরিমাণ</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">তারিখ</th>
                                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">স্ট্যাটাস</th>
                                <th className="px-10 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.map((txn) => (
                                <tr key={txn.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-10 py-6">
                                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{txn.id}</span>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${txn.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {txn.type === 'INCOME' ? txn.student?.[0] || 'I' : <Receipt size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{txn.student || txn.category}</p>
                                                {txn.class && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{txn.class} শ্রেণী • {txn.category}</p>}
                                                {txn.note && <p className="text-[10px] font-bold text-slate-400 tracking-tight italic">{txn.note}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 font-bold text-xs uppercase tracking-widest">
                                        <span className={txn.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}>
                                            {txn.type === 'INCOME' ? 'জমা' : 'খরচ'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-6 text-right font-black text-slate-800">৳ {txn.amount}</td>
                                    <td className="px-6 py-6 text-xs font-bold text-slate-500">{txn.date}</td>
                                    <td className="px-6 py-6">
                                        {renderStatus(txn.status)}
                                    </td>
                                    <td className="px-10 py-6 text-right">
                                        <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                                            <MoreVertical size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Placeholder */}
                <div className="px-10 py-6 border-t border-slate-50 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">প্রদর্শিত হচ্ছে ১-৪ (মোট ৫০টি লেনদেন)</p>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg bg-slate-50 text-slate-300 font-black text-[10px] uppercase tracking-widest px-4 active:scale-95 transition-all">আগের</button>
                        <button className="p-2 rounded-lg bg-[#045c84] text-white font-black text-[10px] uppercase tracking-widest px-4 active:scale-95 transition-all">পরের</button>
                    </div>
                </div>
            </div>

            {/* Bottom Insight Card */}
            <div className="bg-[#045c84] rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-150 transition-transform duration-[2000ms]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                            <TrendingUp className="text-sky-300" />
                            স্মার্ট ফিন্যান্সিয়াল রিপোর্ট
                        </h2>
                        <p className="text-sky-100/80 font-bold leading-relaxed">
                            সিস্টেম স্বয়ংক্রিয়ভাবে আপনার বাৎসরিক আয়-ব্যয়ের রিপোর্ট এবং অডিট ফাইল তৈরি করে দিচ্ছে। কোনো গড়মিল থাকলে ইমেইলে অ্যালার্ট পাবেন।
                        </p>
                    </div>
                    <button className="px-8 py-5 bg-white text-[#045c84] rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-sky-50 transition-all">
                        বিস্তারিত দেখুন
                    </button>
                </div>
            </div>
        </div>
    );
}

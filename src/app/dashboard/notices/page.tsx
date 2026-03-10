'use client';

import React, { useState } from 'react';
import {
    Megaphone,
    Bell,
    Search,
    Filter,
    Plus,
    Calendar,
    ChevronRight,
    MoreVertical,
    Info,
    AlertTriangle,
    Flag,
    Clock,
    User,
    ArrowRight
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

export default function NoticesPage() {
    const { activeRole } = useSession();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const notices = [
        {
            id: 'N001',
            title: 'আগামী ১৬ই মার্চ শব-ই-বরাত উপলক্ষে প্রতিষ্ঠান বন্ধ থাকবে।',
            category: 'OFFICIAL',
            date: '১০ মার্চ, ২০২৬',
            author: 'অধ্যক্ষ',
            content: 'সকল শিক্ষার্থী ও অভিভাবকদের জানানো যাচ্ছে যে, আগামী ১৬ই মার্চ শব-ই-বরাত উপলক্ষে প্রতিষ্ঠানের সকল কার্যক্রম বন্ধ থাকবে। ১৭ই মার্চ থেকে যথারীতি ক্লাস চলবে।',
            priority: 'HIGH'
        },
        {
            id: 'N002',
            title: 'বার্ষিক ক্রীড়া প্রতিযোগিতার রেজিস্ট্রেশন শুরু হয়েছে।',
            category: 'EVENT',
            date: '০৯ মার্চ, ২০২৬',
            author: 'ক্রীড়া শিক্ষক',
            content: 'আগামী ২০শে মার্চ আমাদের বার্ষিক ক্রীড়া প্রতিযোগিতা অনুষ্ঠিত হতে যাচ্ছে। আগ্রহী শিক্ষার্থীদের আগামী ১৫ই মার্চের মধ্যে নিজ নিজ শ্রেণী শিক্ষকের কাছে নাম জমা দেওয়ার জন্য বলা হলো।',
            priority: 'MEDIUM'
        },
        {
            id: 'N003',
            title: 'দশম শ্রেণীর গণিত মডেল টেস্টের সময়সূচী পরিবর্তন।',
            category: 'ACADEMIC',
            date: '০৮ মার্চ, ২০২৬',
            author: 'পরীক্ষা নিয়ন্ত্রক',
            content: 'দশম শ্রেণীর গণিত মডেল টেস্টটি আগামী ১১ই মার্চের পরিবর্তে ১৩ই মার্চ অনুষ্ঠিত হবে। সময় অপরিবর্তিত থাকবে।',
            priority: 'LOW'
        },
        {
            id: 'N004',
            title: 'পরিষ্কার-পরিচ্ছন্নতা অভিযান ও সচেতনতা কর্মসূচি।',
            category: 'OFFICIAL',
            date: '০৭ মার্চ, ২০২৬',
            author: 'প্রশাসন',
            content: 'আগামী ১২ই মার্চ প্রতিষ্ঠান চত্বরে পরিষ্কার-পরিচ্ছন্নতা অভিযান চালানো হবে। সকল শিক্ষার্থীকে উপস্থিত থাকার জন্য বলা হলো।',
            priority: 'MEDIUM'
        }
    ];

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'OFFICIAL': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'ACADEMIC': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'EVENT': return 'bg-amber-50 text-amber-600 border-amber-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'HIGH': return <AlertTriangle size={14} className="text-rose-500" />;
            case 'MEDIUM': return <Flag size={14} className="text-amber-500" />;
            default: return <Info size={14} className="text-blue-500" />;
        }
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in font-bengali min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden text-center md:text-left">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 border border-slate-100 -z-0" />
                <div className="relative z-10 flex-1">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">নোটিশ বোর্ড</h1>
                    <p className="text-slate-500 font-bold max-w-lg leading-relaxed mx-auto md:mx-0">
                        প্রতিষ্ঠানের সকল গুরুত্বপূর্ণ ঘোষণা, ছুটির নোটিশ এবং একাডেমিক আপডেটগুলো এখানে নিয়মিত আপডেট করা হয়।
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    {activeRole === 'ADMIN' && (
                        <button className="px-8 py-5 bg-[#045c84] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:shadow-blue-200 transition-all flex items-center gap-3 active:scale-95">
                            <Plus size={18} /> নতুন নোটিশ
                        </button>
                    )}
                    <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center text-[#045c84] shadow-sm">
                        <Megaphone size={32} />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-2 p-1.5 bg-white border border-slate-100 rounded-2xl w-fit shadow-sm">
                    {['all', 'OFFICIAL', 'ACADEMIC', 'EVENT'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab
                                    ? 'bg-[#045c84] text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab === 'all' ? 'সব নোটিশ' :
                                tab === 'OFFICIAL' ? 'অফিসিয়াল' :
                                    tab === 'ACADEMIC' ? 'একাডেমিক' : 'ইভেন্ট'}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group flex-1 lg:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="নোটিশ খুঁজুন..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-[#045c84]/10 w-full lg:w-64 transition-all"
                        />
                    </div>
                    <button className="p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-slate-600 shadow-sm transition-all">
                        <Filter size={20} />
                    </button>
                </div>
            </div>

            {/* Notice Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {notices.filter(n => activeTab === 'all' || n.category === activeTab).map((notice) => (
                    <div key={notice.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group flex flex-col p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Megaphone size={80} />
                        </div>

                        <div className="flex justify-between items-start mb-6">
                            <div className={`px-4 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getCategoryStyles(notice.category)}`}>
                                {notice.category}
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30"></span>
                                <span className="flex items-center gap-1">
                                    {getPriorityIcon(notice.priority)}
                                </span>
                            </div>
                            <button className="text-slate-300 hover:text-slate-500 transition-colors">
                                <MoreVertical size={20} />
                            </button>
                        </div>

                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-4 group-hover:text-[#045c84] transition-colors">
                            {notice.title}
                        </h3>

                        <p className="text-slate-500 font-bold text-sm leading-relaxed mb-8 line-clamp-2">
                            {notice.content}
                        </p>

                        <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tight">
                                    <Calendar size={14} className="text-[#045c84]" />
                                    {notice.date}
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tight">
                                    <User size={14} className="text-[#045c84]" />
                                    {notice.author}
                                </div>
                            </div>
                            <button className="flex items-center gap-2 text-[#045c84] font-black text-xs uppercase tracking-widest group/btn">
                                বিস্তারিত
                                <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Newsletter / Subscription Section */}
            <div className="bg-[#045c84] rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-150 transition-transform duration-[2000ms]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl text-center md:text-left">
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 flex items-center justify-center md:justify-start gap-3">
                            <Bell className="text-sky-300 animate-bounce" />
                            স্মার্ট নোটিফিকেশন সিস্টেম
                        </h2>
                        <p className="text-sky-100/80 font-bold leading-relaxed">
                            আপনি কি সব আপডেট মোবাইল অ্যাপে পেতে চান? আপনার ডিভাইসে নোটিফিকেশন সক্রিয় করুন এবং প্রতিষ্ঠানের সকল ঘোষণা মুহূর্তের মধ্যে পেয়ে যান।
                        </p>
                    </div>
                    <button className="px-8 py-5 bg-white text-[#045c84] rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-sky-50 transition-all flex items-center gap-3">
                        নোটিফিকেশন অন করুন
                    </button>
                </div>
            </div>
        </div>
    );
}

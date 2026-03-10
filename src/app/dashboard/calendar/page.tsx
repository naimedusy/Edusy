'use client';

import React, { useState } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Plus,
    Clock,
    MapPin,
    Users,
    Star,
    Info,
    ArrowUpRight,
    Bookmark,
    AlertCircle
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

export default function CalendarPage() {
    const { activeRole } = useSession();
    const [currentMonth, setCurrentMonth] = useState('মার্চ ২০২৬');

    const events = [
        {
            id: 'E001',
            title: 'শব-ই-বরাত (সরকারি ছুটি)',
            date: '১৬ মার্চ, ২০২৬',
            day: 'সোমবার',
            category: 'HOLIDAY',
            time: 'সারাদিন',
            location: 'প্রতিষ্ঠান বন্ধ',
            description: 'শব-ই-বরাত উপলক্ষে প্রতিষ্ঠানের সকল শাখা বন্ধ থাকবে।'
        },
        {
            id: 'E002',
            title: 'বার্ষিক ক্রীড়া প্রতিযোগিতা ২০২৬',
            date: '২০ মার্চ, ২০২৬',
            day: 'শুক্রবার',
            category: 'EVENT',
            time: 'সকাল ৯:০০ - বিকেল ৪:০০',
            location: 'প্রতিষ্ঠান খেলার মাঠ',
            description: 'সকল শিক্ষার্থীর স্বতঃস্ফূর্ত অংশগ্রহণ কাম্য। আকর্ষণীয় পুরস্কারের ব্যবস্থা রয়েছে।'
        },
        {
            id: 'E003',
            title: 'দশম শ্রেণীর অভিভাবক সমাবেশ',
            date: '২৫ মার্চ, ২০২৬',
            day: 'বুধবার',
            category: 'MEETING',
            time: 'সকাল ১০:৩০ - দুপুর ১২:৩০',
            location: 'অডিটোরিয়াম',
            description: 'আগামী মডেল টেস্ট ও বোর্ড পরীক্ষা সংক্রান্ত গুরুত্বপূর্ণ আলোচনা।'
        },
        {
            id: 'E004',
            title: 'রমজান মাস শুরু (সম্ভাব্য)',
            date: '৩১ মার্চ, ২০২৬',
            day: 'মঙ্গলবার',
            category: 'HOLIDAY',
            time: 'সারাদিন',
            location: 'বিশেষ সময়সূচী',
            description: 'পবিত্র রমজান মাস উপলক্ষে প্রতিষ্ঠানের ক্লাস সময়সূচী পরিবর্তন হতে পারে।'
        }
    ];

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'HOLIDAY': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'EVENT': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'MEETING': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="p-8 space-y-10 animate-fade-in font-bengali min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 border border-slate-100 -z-0" />
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-2">একাডেমিক ক্যালেন্ডার</h1>
                    <p className="text-slate-500 font-bold max-w-lg leading-relaxed">
                        প্রতিষ্ঠানের বার্ষিক ছুটির তালিকা, পরীক্ষার সময়সূচী এবং সকল গুরুত্বপূর্ণ ইভেন্টগুলো এখান থেকে নিয়মিত ট্র্যাক করুন।
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    {activeRole === 'ADMIN' && (
                        <button className="px-8 py-5 bg-[#045c84] text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:shadow-blue-200 transition-all flex items-center gap-3 active:scale-95">
                            <Plus size={18} /> নতুন ইভেন্ট
                        </button>
                    )}
                    <div className="w-16 h-16 bg-blue-50 rounded-[24px] flex items-center justify-center text-[#045c84] shadow-sm">
                        <CalendarIcon size={32} />
                    </div>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <button className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-xl font-black text-slate-800 px-4">{currentMonth}</h2>
                    <button className="p-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-6 py-4 bg-white border border-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl shadow-sm hover:bg-slate-50 transition-all">
                        আজকে
                    </button>
                    <button className="p-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:text-slate-600 shadow-sm transition-all">
                        <Filter size={20} />
                    </button>
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="ইভেন্ট খুঁজুন..."
                            className="pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-[#045c84]/10 w-full lg:w-48 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Event Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                    <div key={event.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col group">
                        <div className={`h-3 ${getCategoryStyles(event.category).split(' ')[0]} bg-current opacity-20`} />

                        <div className="p-8 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-slate-800 tracking-tighter mb-1">{event.date.split(' ')[0]}</span>
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{event.day}</span>
                                </div>
                                <div className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${getCategoryStyles(event.category)}`}>
                                    {event.category === 'HOLIDAY' ? 'ছুটি' : event.category === 'EVENT' ? 'ইভেন্ট' : 'মিটিং'}
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-800 tracking-tight leading-tight mb-4 group-hover:text-[#045c84] transition-colors">
                                {event.title}
                            </h3>

                            <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-tight">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#045c84]">
                                        <Clock size={16} />
                                    </div>
                                    {event.time}
                                </div>
                                <div className="flex items-center gap-3 text-slate-500 font-bold text-xs uppercase tracking-tight">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#045c84]">
                                        <MapPin size={16} />
                                    </div>
                                    {event.location}
                                </div>
                            </div>

                            <p className="text-slate-400 font-bold text-xs leading-relaxed mb-8 flex-1 italic">
                                "{event.description}"
                            </p>

                            <button className="w-full py-4 bg-slate-50 text-slate-400 group-hover:bg-[#045c84] group-hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95">
                                বিস্তারিত দেখুন
                                <ArrowUpRight size={14} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Empty State / Add Card */}
                <div className="bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center p-10 text-center group cursor-pointer hover:bg-white hover:border-[#045c84]/30 transition-all duration-500">
                    <div className="w-20 h-20 rounded-full bg-white text-slate-300 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:text-[#045c84] transition-all">
                        <Star size={40} className="animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black text-slate-500 mb-2 group-hover:text-slate-800 transition-colors">গৌরবময় দিনগুলো</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                        আপনার প্রতিষ্ঠানের সকল গুরুত্বপূর্ণ মুহূর্তগুলো এখানে সুন্দরভাবে লিপিবদ্ধ থাকবে।
                    </p>
                </div>
            </div>

            {/* Bottom Reminder Section */}
            <div className="bg-[#045c84] rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-150 transition-transform duration-[2000ms]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                            <Bookmark className="text-sky-300" />
                            গুরুত্বপূর্ণ রিমাইন্ডার
                        </h2>
                        <p className="text-sky-100/80 font-bold leading-relaxed">
                            আপনি কি কোনো ইভেন্ট মিস করতে চান না? ক্যালেন্ডারের ইভেন্টগুলো আপনার ব্যক্তিগত গুগল বা অ্যাপল ক্যালেন্ডারে সিঙ্ক করে নিন।
                        </p>
                    </div>
                    <button className="px-8 py-5 bg-white text-[#045c84] rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-sky-50 transition-all flex items-center gap-3">
                        সিঙ্ক করুন
                    </button>
                </div>
            </div>
        </div>
    );
}

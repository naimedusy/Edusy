'use client';

import React from 'react';
import {
    BarChart3,
    TrendingUp,
    Users,
    BookOpen,
    CreditCard,
    FileText,
    ChevronRight,
    Zap,
    Calendar,
    PieChart as PieChartIcon,
    ArrowRight
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

export default function ReportsHubPage() {
    const { activeInstitute } = useSession();

    const reportCategories = [
        {
            title: 'হাজিরা রিপোর্ট',
            icon: Zap,
            color: 'bg-amber-50 text-amber-600',
            description: 'শিক্ষার্থী ও শিক্ষকদের উপস্থিতির বিস্তারিত পরিসংখ্যান ও গ্রাফ।',
            reports: [
                { name: 'উপস্থিতি সারসংক্ষেপ', href: '/dashboard/attendance/summary', icon: TrendingUp },
                { name: 'শ্রেণীভিত্তিক রিপোর্ট', href: '#', icon: BarChart3, status: 'শীঘ্রই আসছে' },
            ]
        },
        {
            title: 'একাডেমিক রিপোর্ট',
            icon: BookOpen,
            color: 'bg-indigo-50 text-indigo-600',
            description: 'পরীক্ষার ফলাফল, মার্কশিট এবং শিক্ষার্থী পারফরম্যান্স এনালাইসিস।',
            reports: [
                { name: 'ফলাফল শিট', href: '#', icon: FileText, status: 'শীঘ্রই আসছে' },
                { name: 'প্রগ্রেস রিপোর্ট কার্ড', href: '#', icon: FileText, status: 'শীঘ্রই আসছে' },
            ]
        },
        {
            title: 'আর্থিক রিপোর্ট',
            icon: CreditCard,
            color: 'bg-emerald-50 text-emerald-600',
            description: 'ফি কালেকশন, বকেয়া এবং প্রতিষ্ঠানের আয়-ব্যয়ের হিসাব।',
            reports: [
                { name: 'ফি কালেকশন সামারি', href: '#', icon: FileText, status: 'শীঘ্রই আসছে' },
                { name: 'বকেয়া তালিকা', href: '#', icon: FileText, status: 'শীঘ্রই আসছে' },
            ]
        },
        {
            title: 'প্রশাসনিক রিপোর্ট',
            icon: Users,
            color: 'bg-sky-50 text-sky-600',
            description: 'শিক্ষার্থী ভর্তি এবং শিক্ষকদের ডাটাবেজ সংক্রান্ত রিপোর্ট।',
            reports: [
                { name: 'ভর্তি রিপোর্ট', href: '#', icon: FileText, status: 'শীঘ্রই আসছে' },
                { name: 'টিচার্স লগ', href: '#', icon: FileText, status: 'শীঘ্রই আসছে' },
            ]
        }
    ];

    return (
        <div className="p-8 space-y-10 animate-fade-in font-bengali">
            {/* Header */}
            <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50 border border-slate-100 -z-0" />
                <div className="relative z-10 text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-800 tracking-tighter uppercase mb-4">রিপোর্টস হাব</h1>
                    <p className="text-slate-500 font-bold max-w-lg leading-relaxed">
                        আপনার প্রতিষ্ঠানের সকল ডাটা এক নজরে দেখুন। এখানে আপনি হাজিরা, একাডেমিক এবং আর্থিক প্রতিবেদনগুলো সুন্দরভাবে গুছিয়ে পাবেন।
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-16 h-16 bg-[#045c84] rounded-[24px] flex items-center justify-center text-white shadow-xl shadow-blue-100">
                        <BarChart3 size={32} />
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {reportCategories.map((category) => (
                    <div key={category.title} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 group flex flex-col">
                        <div className="p-8 pb-4">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-14 h-14 ${category.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                    <category.icon size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{category.title}</h2>
                            </div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                                {category.description}
                            </p>
                        </div>

                        <div className="p-8 pt-0 space-y-3 flex-1">
                            {category.reports.map((report) => (
                                <a
                                    key={report.name}
                                    href={report.href}
                                    className={`flex items-center justify-between p-5 rounded-3xl border transition-all ${report.href === '#'
                                        ? 'bg-slate-50/50 border-slate-100 cursor-not-allowed opacity-60'
                                        : 'bg-white border-slate-200 hover:border-[#045c84] hover:shadow-lg group/item'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl ${report.href === '#' ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-[#045c84]'}`}>
                                            {report.icon ? <report.icon size={18} /> : <FileText size={18} />}
                                        </div>
                                        <span className={`text-sm font-black ${report.href === '#' ? 'text-slate-400' : 'text-slate-700'}`}>
                                            {report.name}
                                        </span>
                                    </div>
                                    {report.status ? (
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                                            {report.status}
                                        </span>
                                    ) : (
                                        <ChevronRight size={18} className="text-slate-300 group-hover/item:text-[#045c84] group-hover/item:translate-x-1 transition-all" />
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Summary Section */}
            <div className="bg-[#045c84] rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden group mt-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-150 transition-transform duration-[2000ms]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl">
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 flex items-center gap-3">
                            <PieChartIcon className="text-sky-300" />
                            অটো-জেনারেটেড রিপোর্টস
                        </h2>
                        <p className="text-sky-100/80 font-bold leading-relaxed">
                            এডুসি সফটওয়্যার আপনার ইনপুট করা ডাটার ওপর ভিত্তি করে নিয়মিত রিয়েল-টাইম রিপোর্ট জেনারেট করে। কোনো প্রশ্নের জন্য সাপোর্ট টিমে যোগাযোগ করুন।
                        </p>
                    </div>
                    <button className="px-8 py-5 bg-white text-[#045c84] rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-sky-50 transition-all flex items-center gap-3">
                        গাইডলাইন দেখুন
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}

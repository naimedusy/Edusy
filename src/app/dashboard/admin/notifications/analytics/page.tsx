"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/SessionProvider';
import { 
    Users, 
    MousePointer2, 
    BarChart3, 
    CheckCircle2, 
    AlertCircle, 
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter
} from 'lucide-react';

export default function NotificationAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSent: 0,
        totalSeen: 0,
        totalClicked: 0,
        reachRate: 0,
        ctr: 0,
        recentEvents: []
    });
    const [expandedBatch, setExpandedBatch] = useState<string | null>(null);

    const { activeInstitute } = useSession();

    useEffect(() => {
        if (!activeInstitute?.id) return;
        // Fetch stats from API
        fetch(`/api/admin/notifications/stats?instituteId=${activeInstitute.id}`)
            .then(res => res.json())
            .then(data => {
                setStats(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [activeInstitute?.id]);

    if (loading) return <div className="p-8 text-center">Loading Analytics...</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">নোটিফিকেশন এনালাইটিক্স</h1>
                <p className="text-slate-500">আপনার প্রতিষ্ঠানের যোগাযোগের মাধ্যম কতটুকু কার্যকর তা এখানে দেখুন</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'মোট পাঠানো হয়েছে', value: stats.totalSent, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'মোট দেখা হয়েছে', value: stats.totalSeen, icon: BarChart3, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'সিন রেট (Seen)', value: `${stats.reachRate}%`, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'এনগেজমেন্ট (CTR)', value: `${stats.ctr}%`, icon: ArrowUpRight, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${item.bg} ${item.color}`}>
                            <item.icon size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                            <p className="text-2xl font-black text-slate-800">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">সাম্প্রতিক কার্যক্রম</h2>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="সার্চ..." className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 w-64" />
                        </div>
                        <button className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-slate-100 transition-all">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">ধরন</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">বার্তা</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">পাঠানো হয়েছে</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">এনগেজমেন্ট</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">তারিখ</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">বিস্তারিত</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {stats.recentEvents.map((event: any, i: number) => {
                                const seenPct = event.reach > 0 ? (event.seen / event.reach) * 100 : 0;
                                const clickPct = event.reach > 0 ? (event.clicks / event.reach) * 100 : 0;
                                const isExpanded = expandedBatch === event.batchId;

                                return (
                                    <React.Fragment key={i}>
                                        <tr className={`transition-all ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {event.type === 'TASK_COMPLETED' ? <CheckCircle2 className="text-emerald-500" size={16} /> : <AlertCircle className="text-amber-500" size={16} />}
                                                    <span className="text-sm font-bold text-slate-700">{event.type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-slate-800">{event.title || 'নোটিফিকেশন'}</p>
                                                <p className="text-[11px] text-slate-500 line-clamp-1">{event.message}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Users size={14} className="text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-700">{event.reach}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-32 space-y-1.5">
                                                    <div className="flex justify-between text-[10px] font-bold">
                                                        <span className="text-slate-500">Seen: {event.seen}</span>
                                                        <span className="text-emerald-600">{Math.round(seenPct)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${seenPct}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                                                {new Date(event.createdAt).toLocaleDateString('bn-BD', {
                                                    day: 'numeric', month: 'short', year: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setExpandedBatch(isExpanded ? null : event.batchId)}
                                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                                                >
                                                    {isExpanded ? <ArrowUpRight size={18} className="rotate-180" /> : <ArrowDownRight size={18} className="-rotate-90" />}
                                                </button>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={6} className="px-0 py-0 bg-slate-50/50">
                                                    <div className="px-8 py-6 border-y border-slate-100 shadow-inner">
                                                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                            <Users size={16} className="text-blue-500" />
                                                            প্রাপকদের তালিকা
                                                        </h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {event.recipients?.map((recipient: any, idx: number) => (
                                                                <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                                                                    <div>
                                                                        <p className="text-sm font-bold text-slate-700">{recipient.name || 'Unknown User'}</p>
                                                                        <p className="text-[10px] text-slate-500">{recipient.phone || 'No phone'}</p>
                                                                    </div>
                                                                    <div>
                                                                        {recipient.status === 'CLICKED' ? (
                                                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-md uppercase tracking-widest">ক্লিক করেছে</span>
                                                                        ) : recipient.status === 'READ' ? (
                                                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[9px] font-black rounded-md uppercase tracking-widest">দেখেছে</span>
                                                                        ) : (
                                                                            <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[9px] font-black rounded-md uppercase tracking-widest">পাঠানো হয়েছে</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    );
}


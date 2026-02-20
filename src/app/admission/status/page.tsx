'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, Search, CheckCircle2, Clock, XCircle, ArrowLeft, LogIn, Building2 } from 'lucide-react';
import Toast from '@/components/Toast';

export default function AdmissionStatusPage() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusData, setStatusData] = useState<any>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleCheckStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatusData(null);

        try {
            const res = await fetch('/api/public/admission/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const data = await res.json();

            if (res.ok) {
                setStatusData(data.status);
            } else {
                setToast({ message: data.message || 'ডাটা পাওয়া যায়নি।', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'সার্ভার এরর। কিছুক্ষণ পর আবার চেষ্টা করুন।', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusUI = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return {
                    icon: <CheckCircle2 className="text-green-500" size={48} />,
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-100',
                    textColor: 'text-green-800',
                    label: 'অনুমোদিত (Approved)',
                    desc: 'আপনার ভর্তি আবেদনটি সফলভাবে অনুমোদিত হয়েছে। এখন আপনি ড্যাশবোর্ডে লগইন করতে পারবেন।'
                };
            case 'REJECTED':
                return {
                    icon: <XCircle className="text-red-500" size={48} />,
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-100',
                    textColor: 'text-red-800',
                    label: 'প্রত্যাখ্যাত (Rejected)',
                    desc: 'দুঃখিত, আপনার আবেদনটি বাতিল করা হয়েছে। বিস্তারিত জানতে প্রতিষ্ঠানের সাথে যোগাযোগ করুন।'
                };
            default:
                return {
                    icon: <Clock className="text-amber-500" size={48} />,
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-100',
                    textColor: 'text-amber-800',
                    label: 'পেন্ডিং (Pending)',
                    desc: 'আপনার আবেদনটি বর্তমানে রিভিউ করা হচ্ছে। অনুগ্রহ করে অপেক্ষ করুন।'
                };
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-bengali">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-[#045c84] border-4 border-white ring-8 ring-slate-100/50">
                        <Search size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 leading-tight">ভর্তি স্ট্যাটাস চেক</h1>
                        <p className="text-slate-500 font-medium">আবেদন করার পর প্রাপ্ত আইডি ও পাসওয়ার্ড ব্যবহার করুন</p>
                    </div>
                </div>

                {/* Form or Status Result */}
                <div className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden transition-all duration-500">
                    <div className="h-2 bg-[#045c84] w-full" />

                    {!statusData ? (
                        <form onSubmit={handleCheckStatus} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">আইডি / মোবাইল নম্বর</label>
                                <input
                                    type="text"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-bold text-black"
                                    placeholder="আপনার ফোন নম্বর দিন"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-wider ml-1">পাসওয়ার্ড</label>
                                <input
                                    type="password"
                                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-bold text-black"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-[#045c84] hover:bg-[#034d6e] text-white font-black rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
                                <span>স্ট্যাটাস দেখুন</span>
                            </button>
                            <Link
                                href="/entrance"
                                className="w-full py-4 flex items-center justify-center gap-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
                            >
                                <ArrowLeft size={16} />
                                <span>ফিরে যান</span>
                            </Link>
                        </form>
                    ) : (
                        <div className="p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            {(() => {
                                const ui = getStatusUI(statusData.admissionStatus);
                                return (
                                    <>
                                        <div className={`flex flex-col items-center text-center p-6 rounded-3xl border-2 ${ui.bgColor} ${ui.borderColor} space-y-4`}>
                                            <div className="bg-white p-2 rounded-2xl shadow-sm italic">
                                                {ui.icon}
                                            </div>
                                            <div className="space-y-1">
                                                <h2 className={`text-xl font-black ${ui.textColor} uppercase tracking-wide`}>{ui.label}</h2>
                                                <p className="text-sm text-slate-600 font-medium leading-relaxed">{ui.desc}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                                <Building2 className="text-slate-400" size={20} />
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">শিক্ষা প্রতিষ্ঠান</p>
                                                    <p className="text-sm font-black text-slate-900">{statusData.instituteName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-lg">
                                                    {statusData.studentName?.[0]}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">শিক্ষার্থীর নাম</p>
                                                    <p className="text-sm font-black text-slate-900">{statusData.studentName}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            {statusData.admissionStatus === 'APPROVED' && (
                                                <Link
                                                    href="/entrance"
                                                    className="w-full py-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black rounded-2xl shadow-lg shadow-green-100 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                                                >
                                                    <LogIn size={24} />
                                                    <span>লগইন করুন</span>
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => setStatusData(null)}
                                                className="w-full py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm flex items-center justify-center gap-2"
                                            >
                                                <ArrowLeft size={16} />
                                                <span>অন্য স্ট্যাটাস চেক করুন</span>
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="text-center">
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                        ভর্তি সংক্রান্ত কোনো সমস্যার জন্য দয়া করে সংশ্লিষ্ট শিক্ষা প্রতিষ্ঠানের প্রশাসনিক বিভাগে যোগাযোগ করুন।
                    </p>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

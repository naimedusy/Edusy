'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Building2,
    MapPin,
    ChevronRight,
    Loader2,
    UserPlus,
    School,
    ArrowLeft
} from 'lucide-react';

interface Institute {
    id: string;
    name: string;
    address: string;
    type: string;
    logo?: string;
    coverImage?: string;
}

interface PublicInstituteSearchProps {
    onSelect: (institute: Institute) => void;
    onBack?: () => void;
    role: string;
}

export default function PublicInstituteSearch({ onSelect, onBack, role }: PublicInstituteSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Institute[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                handleSearch();
            } else if (query.trim() === '') {
                setResults([]);
                setHasSearched(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSearch = async () => {
        setLoading(true);
        setHasSearched(true);
        try {
            const res = await fetch(`/api/public/institutes/search?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 font-bengali animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-[#045c84] hover:border-[#045c84] transition-all active:scale-95 shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">
                        শিক্ষা প্রতিষ্ঠান খুঁজুন
                    </h2>
                    <p className="text-slate-500 text-sm font-medium mt-1">
                        আপনার পছন্দের প্রতিষ্ঠানের নাম বা ঠিকানা দিয়ে সার্চ করুন।
                    </p>
                </div>
            </div>

            {/* Search Input */}
            <div className="relative group mb-10">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#045c84] transition-colors">
                    <Search size={24} />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="প্রতিষ্ঠানের নাম বা এলাকা লিখুন..."
                    className="w-full pl-14 pr-4 py-5 bg-white border-2 border-slate-100 rounded-[28px] focus:ring-4 focus:ring-blue-100 focus:border-[#045c84] outline-none transition-all text-slate-800 font-bold text-lg shadow-xl shadow-blue-900/5 placeholder:text-slate-300"
                />
                {loading && (
                    <div className="absolute inset-y-0 right-0 pr-5 flex items-center">
                        <Loader2 className="animate-spin text-[#045c84]" size={24} />
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.length > 0 ? (
                    results.map((inst) => (
                        <button
                            key={inst.id}
                            onClick={() => onSelect(inst)}
                            className="group relative bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all text-left flex flex-col active:scale-[0.98]"
                        >
                            {/* Cover Image */}
                            <div className="h-28 w-full bg-slate-100 relative overflow-hidden">
                                {inst.coverImage ? (
                                    <img src={inst.coverImage} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#045c84] to-[#047cac] opacity-80" />
                                )}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#045c84] uppercase tracking-widest shadow-sm">
                                    {inst.type}
                                </div>
                            </div>

                            <div className="p-6 pt-12 relative">
                                {/* Logo Overlay */}
                                <div className="absolute -top-10 left-6 w-20 h-20 bg-white rounded-2xl p-1 shadow-xl border-4 border-white group-hover:scale-105 transition-transform overflow-hidden">
                                    {inst.logo ? (
                                        <img src={inst.logo} className="w-full h-full object-contain" alt="Logo" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300 italic font-black text-2xl">
                                            {inst.name[0]}
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-2 truncate group-hover:text-[#045c84] transition-colors">
                                    {inst.name}
                                </h3>
                                <div className="flex items-start gap-2 text-slate-500 mb-4">
                                    <MapPin size={16} className="shrink-0 mt-0.5" />
                                    <p className="text-sm font-medium line-clamp-2 leading-tight">
                                        {inst.address || 'ঠিকানা দেওয়া নেই'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <span className="text-[10px] font-black text-[#045c84] uppercase tracking-widest flex items-center gap-1">
                                        {role === 'TEACHER' ? (
                                            <><Briefcase size={12} /> জয়েন করুন</>
                                        ) : (
                                            <><UserPlus size={12} /> ভর্তি আবেদন</>
                                        )}
                                    </span>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-[#045c84] group-hover:text-white transition-all">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                ) : hasSearched && !loading ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <School size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">কোনো প্রতিষ্ঠান পাওয়া যায়নি</h3>
                        <p className="text-slate-400 font-medium">সঠিক বানান চেক করুন অথবা এলাকা দিয়ে সার্চ করুন।</p>
                    </div>
                ) : (
                    <div className="col-span-full py-20 text-center">
                        <div className="max-w-xs mx-auto space-y-4 opacity-30">
                            <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto" />
                            <div className="h-4 bg-blue-50 rounded-full w-full" />
                            <div className="h-4 bg-blue-50 rounded-full w-2/3 mx-auto" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import { Briefcase } from 'lucide-react';

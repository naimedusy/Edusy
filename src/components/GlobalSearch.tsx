'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    LayoutDashboard,
    Building2,
    GraduationCap,
    Users,
    HeartPulse,
    BookOpen,
    CreditCard,
    Calendar,
    Settings,
    LogOut,
    UserPlus,
    Command,
    ChevronRight,
    MapPin,
    Hash,
    Phone,
    FileText,
    MousePointer2,
    Info,
    ArrowUpRight,
    Loader2,
    X,
    ArrowLeft
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';

interface SearchResult {
    id: string;
    name: string;
    path: string;
    icon: any;
    href?: string;
    action?: () => void;
    category: 'Pages' | 'Data' | 'Actions' | 'UI Elements';
    keywords?: string[];
}

export default function GlobalSearch() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [dynamicResults, setDynamicResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const { logout } = useSession();
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const staticIndex: SearchResult[] = [
        { id: 'p-dash', name: 'ড্যাশবোর্ড ওভারভিউ', path: 'Dashboard / Overview', icon: LayoutDashboard, href: '/dashboard', category: 'Pages' },
        { id: 'p-inst', name: 'প্রতিষ্ঠান ব্যবস্থাপনা', path: 'Dashboard / Institutions', icon: Building2, href: '/dashboard/institute', category: 'Pages' },
        { id: 'p-teach', name: 'শিক্ষক তালিকা', path: 'Dashboard / Teachers', icon: GraduationCap, href: '/dashboard/teachers', category: 'Pages' },
        { id: 'p-stud', name: 'শিক্ষার্থী তালিকা', path: 'Dashboard / Students', icon: Users, href: '/dashboard/students', category: 'Pages' },
        { id: 'p-guard', name: 'অভিভাবক ডাটাবেস', path: 'Dashboard / Guardians', icon: HeartPulse, href: '/dashboard/guardians', category: 'Pages' },
        { id: 'p-acc', name: 'হিসাব ও লেনদেন', path: 'Dashboard / Accounts', icon: CreditCard, href: '/dashboard/accounts', category: 'Pages' },
        { id: 'p-cal', name: 'একাডেমিক ক্যালেন্ডার', path: 'Dashboard / Calendar', icon: Calendar, href: '/dashboard/calendar', category: 'Pages' },
        { id: 'p-set', name: 'অ্যাপ সেটিংস', path: 'Dashboard / Settings', icon: Settings, href: '/dashboard/settings', category: 'Pages' },
        { id: 'l-act-stud', name: 'সক্রিয় শিক্ষার্থী', path: 'Dashboard / Students / Active', icon: Info, href: '/dashboard/students', category: 'UI Elements', keywords: ['total', 'count', 'active'] },
        { id: 'l-app-stud', name: 'আবেদনসমূহ', path: 'Dashboard / Students / Applications', icon: FileText, href: '/dashboard/students', category: 'UI Elements', keywords: ['pending', 'apply'] },
        { id: 'l-books', name: 'বইয়ের তালিকা', path: 'Dashboard / Students / Books', icon: BookOpen, href: '/dashboard/students', category: 'UI Elements' },
        { id: 'a-add-stud', name: 'নতুন শিক্ষার্থী যোগ', path: 'Students / Actions / Add', icon: UserPlus, href: '/dashboard/students?action=add', category: 'Actions', keywords: ['button', 'plus', 'create'] },
        { id: 'a-add-teach', name: 'নতুন শিক্ষক যোগ', path: 'Teachers / Actions / Add', icon: UserPlus, href: '/dashboard/teachers?action=add', category: 'Actions' },
        { id: 'a-logout', name: 'লগ আউট (প্রস্থান)', path: 'Account / Security / Logout', icon: LogOut, action: logout, category: 'Actions', keywords: ['exit', 'signoff'] },
    ];

    useEffect(() => {
        if (query.length < 2) {
            setDynamicResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    const results: SearchResult[] = data.map((item: any) => {
                        const isBook = item.type === 'BOOK';
                        return {
                            id: `d-${item.id}`,
                            name: item.name,
                            path: isBook
                                ? `Dashboard / Students / Books / ${item.className || 'General'}`
                                : `Dashboard / ${item.type === 'STUDENT' ? 'Students' : 'Teachers'} / Records / ${item.id}`,
                            icon: isBook ? BookOpen : (item.type === 'STUDENT' ? Users : GraduationCap),
                            href: isBook
                                ? `/dashboard/students?tab=books&id=${item.id}`
                                : `/dashboard/${item.type.toLowerCase()}s?id=${item.id}`,
                            category: 'Data',
                            keywords: isBook
                                ? [item.author, item.code].filter(Boolean)
                                : [item.studentId, item.rollNumber, item.phone].filter(Boolean)
                        };
                    });
                    setDynamicResults(results);
                }
            } catch (err) {
                console.error('Search failed:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const filteredStatic = staticIndex.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.path.toLowerCase().includes(query.toLowerCase()) ||
        item.keywords?.some(k => k.toLowerCase().includes(query.toLowerCase()))
    );

    const allResults = [...filteredStatic, ...dynamicResults].slice(0, 10);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsExpanded(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            if (e.key === '/') {
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    e.preventDefault();
                    setIsExpanded(true);
                    setTimeout(() => inputRef.current?.focus(), 100);
                }
            }
            if (e.key === 'Escape') setIsExpanded(false);
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsExpanded(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (item: SearchResult) => {
        setIsExpanded(false);
        setQuery('');
        if (item.action) item.action();
        else if (item.href) router.push(item.href);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') setSelectedIndex(prev => (prev + 1) % allResults.length);
        else if (e.key === 'ArrowUp') setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
        else if (e.key === 'Enter' && allResults[selectedIndex]) handleSelect(allResults[selectedIndex]);
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Desktop View Support */}
            <div className={`hidden xl:flex items-center transition-all duration-300 ${isExpanded ? 'w-[400px] md:w-[500px]' : 'w-64'
                }`}>
                <div className={`relative w-full flex items-center group ${isExpanded ? 'bg-white border-slate-300 ring-4 ring-slate-100' : 'bg-slate-100 border-transparent'
                    } border rounded-xl transition-all`}>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-[#045c84] transition-colors">
                        {isSearching ? <Loader2 size={18} className="animate-spin text-[#045c84]" /> : <Search size={18} />}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onFocus={() => setIsExpanded(true)}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="খুঁজুন..."
                        className="w-full pl-10 pr-10 py-2.5 bg-transparent border-none outline-none text-sm font-medium text-slate-800 placeholder:text-slate-400"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {isExpanded ? (
                            <button onClick={() => { setIsExpanded(false); setQuery(''); }} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16} /></button>
                        ) : (
                            <kbd className="flex items-center gap-1 font-sans text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200"><Command size={10} /> K</kbd>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile View Support (Hides header when expanded) */}
            <div className="xl:hidden">
                {!isExpanded ? (
                    <button onClick={() => { setIsExpanded(true); setTimeout(() => inputRef.current?.focus(), 100); }} className="p-2 text-slate-500 hover:text-[#045c84] hover:bg-slate-50 rounded-xl transition-all">
                        <Search size={22} />
                    </button>
                ) : (
                    <div className="fixed inset-x-0 top-0 h-[73px] bg-white z-[60] flex items-center px-4 border-b border-slate-200 animate-in slide-in-from-top duration-300">
                        <button onClick={() => setIsExpanded(false)} className="p-2 text-slate-500 mr-2"><ArrowLeft size={22} /></button>
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="যেকোনো কিছু খুঁজুন..."
                                className="w-full bg-slate-50 border-none rounded-xl pl-4 pr-10 py-2.5 outline-none text-base font-medium text-slate-800"
                            />
                            {query.length > 0 && (
                                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={18} /></button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Dropdown Results (Positioned relative to container or header) */}
            {(isExpanded && (query.length > 0 || allResults.length > 0)) && (
                <div className={`fixed xl:absolute left-0 right-0 top-[73px] xl:top-full mt-0 xl:mt-2 bg-white xl:rounded-2xl shadow-2xl border-x border-b xl:border border-slate-200 overflow-hidden z-[55] animate-in fade-in slide-in-from-top-2 duration-200 ${isExpanded && 'xl:w-[500px]'
                    }`}>
                    <div className="max-h-[70vh] xl:max-h-[50vh] overflow-y-auto p-2 scrollbar-hide">
                        {allResults.length > 0 ? (
                            <div className="space-y-1">
                                {allResults.map((item, index) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all relative overflow-hidden group/item ${selectedIndex === index
                                            ? 'bg-[#045c84] text-white shadow-lg'
                                            : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${selectedIndex === index ? 'bg-white/20' : 'bg-slate-100'
                                                }`}>
                                                <item.icon size={20} className={selectedIndex === index ? 'text-white' : 'text-[#045c84]'} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-base leading-tight flex items-center gap-2">
                                                    {item.name}
                                                    {item.category === 'Data' && <ArrowUpRight size={14} className="opacity-40" />}
                                                </p>
                                                <p className={`text-[11px] font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5 ${selectedIndex === index ? 'text-white/60' : 'text-slate-400'
                                                    }`}>
                                                    {item.path.split(' / ').map((p, i, arr) => (
                                                        <React.Fragment key={p}>
                                                            <span className={i === arr.length - 1 ? 'text-[#ffc107]' : ''}>{p}</span>
                                                            {i < arr.length - 1 && <span className="opacity-30">/</span>}
                                                        </React.Fragment>
                                                    ))}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query.length >= 2 ? (
                            <div className="py-20 text-center flex flex-col items-center">
                                <Search size={48} className="text-slate-100 mb-4" />
                                <p className="text-lg font-bold text-slate-800">কোনো ফলাফল পাওয়া যায়নি</p>
                                <p className="text-sm text-slate-400 mt-2 px-10">সঠিক নাম, আইডি বা কি-ওয়ার্ড ব্যবহার করে চেষ্টা করুন</p>
                            </div>
                        ) : (
                            <div className="py-8 px-6 text-center text-slate-400">
                                <Search size={32} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium italic">শিক্ষার্থী বা পেজ খুঁজতে টাইপ করুন...</p>
                            </div>
                        )}
                    </div>

                    {/* Desktop-only footer */}
                    <div className="hidden xl:flex p-3.5 bg-slate-50 border-t border-slate-100 items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5"><kbd className="bg-white border-2 border-slate-200 px-1.5 py-0.5 rounded-lg shadow-sm text-slate-800 font-sans">↵</kbd><span>নির্বাচন</span></div>
                            <div className="flex items-center gap-1.5"><kbd className="bg-white border-2 border-slate-200 px-1.5 py-0.5 rounded-lg shadow-sm text-slate-800 font-sans">↑↓</kbd><span>টগল</span></div>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#045c84]/5 text-[#045c84] rounded-full"><Command size={12} /><span>DEEP SEARCH</span></div>
                    </div>
                </div>
            )}
        </div>
    );
}

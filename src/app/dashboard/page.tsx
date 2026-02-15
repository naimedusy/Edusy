'use client';

import React, { useState, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    GraduationCap,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    ShieldCheck,
    Loader2,
    Calendar,
    Bell,
    Settings,
    Camera,
    Activity,
    Server,
    Globe,
    AlertCircle
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import InstituteProfileModal from '@/components/InstituteProfileModal';

export default function DashboardPage() {
    const { activeRole, activeInstitute, switchInstitute, user, setAllInstitutes } = useSession();
    const [statsData, setStatsData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const hasFetchedInstitutes = React.useRef(false);

    // Effect 1: Auto-fetch institutes if missing from session
    useEffect(() => {
        if (user?.id && !user.institutes && !hasFetchedInstitutes.current) {
            hasFetchedInstitutes.current = true;
            fetch(`/api/institute?userId=${user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        console.log('Auto-fetched institutes:', data);
                        setAllInstitutes(data);
                        // Also set active institute if none selected
                        if (!activeInstitute && data.length > 0) {
                            const defaultInst = data.find((i: any) => i.id === user.defaultInstituteId) || data[0];
                            switchInstitute(defaultInst);
                        }
                    }
                })
                .catch(err => {
                    console.error('Failed to auto-fetch institutes:', err);
                    // improved error handling: don't reset flag on error to avoid infinite retry loop
                });
        }
    }, [user?.id, user?.institutes, setAllInstitutes, switchInstitute, activeInstitute, user?.defaultInstituteId]);

    // Effect 2: Initialize active institute for Admins if null (and institutes already exist)
    useEffect(() => {
        if (activeRole === 'ADMIN' && !activeInstitute && user?.institutes && user.institutes.length > 0) {
            const defaultInst = user.institutes.find((i: any) => i.id === user.defaultInstituteId) || user.institutes[0];
            switchInstitute(defaultInst);
        }
    }, [activeRole, activeInstitute, user?.institutes, user?.defaultInstituteId, switchInstitute]);

    // Effect 3: Super Admin Stats
    useEffect(() => {
        if (activeRole === 'SUPER_ADMIN') {
            setLoading(true);
            fetch('/api/admin/stats')
                .then(res => res.json())
                .then(data => {
                    setStatsData(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch stats:', err);
                    setLoading(false);
                });
        }
    }, [activeRole]);

    if (activeRole === 'SUPER_ADMIN') {
        return <SuperAdminDashboard statsData={statsData} loading={loading} />;
    }

    return <AdminDashboard activeInstitute={activeInstitute} />;
}

// --- Super Admin Dashboard (System Oversight) ---
function SuperAdminDashboard({ statsData, loading }: { statsData: any, loading: boolean }) {
    const stats = statsData ? [
        { name: 'মোট প্রতিষ্ঠান', value: statsData.institutes.toLocaleString('bn-BD'), icon: Building2, color: 'blue', change: '+২', up: true },
        { name: 'মোট ইউজার', value: statsData.users.toLocaleString('bn-BD'), icon: Users, color: 'sky', change: '+৫%', up: true },
        { name: 'অ্যাডমিন ইউজার', value: (statsData.roleBreakdown.ADMIN || 0).toLocaleString('bn-BD'), icon: ShieldCheck, color: 'teal', change: '+১', up: true },
        { name: 'শিক্ষার্থী', value: (statsData.roleBreakdown.STUDENT || 0).toLocaleString('bn-BD'), icon: GraduationCap, color: 'cyan', change: '+১০%', up: true },
    ] : [];

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 uppercase tracking-tight flex items-center gap-3">
                        <ShieldCheck className="text-[#045c84]" size={32} />
                        সিস্টেম ওভারসাইট
                    </h1>
                    <p className="text-slate-500 font-medium font-bengali">পুরো প্লাটফর্মের বর্তমান অবস্থা এবং পরিসংখ্যান এখানে দেখুন।</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-widest border border-emerald-100">
                        <Activity size={14} />
                        সিস্টেম অনলাইন
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-[#045c84] mb-4" size={40} />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-bengali">তথ্য লোড হচ্ছে...</p>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {stats.map((stat) => (
                            <div key={stat.name} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}>
                                        <stat.icon size={26} />
                                    </div>
                                    <div className={`flex items-center gap-1 text-sm font-medium ${stat.up ? 'text-emerald-700' : 'text-orange-600'}`}>
                                        {stat.change}
                                        {stat.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    </div>
                                </div>
                                <p className="text-slate-500 font-bold uppercase text-xs tracking-wider font-bengali">{stat.name}</p>
                                <h3 className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Server Health */}
                        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
                            <h3 className="text-xl font-bold text-slate-800 mb-8 uppercase tracking-tight flex items-center gap-2 font-bengali">
                                <Server className="text-[#045c84]" />
                                সার্ভার পারফরম্যান্স
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase text-slate-500 tracking-wider font-bengali">
                                        <span>CPU ইউসেজ</span>
                                        <span>২৫%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#045c84] w-1/4 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase text-slate-500 tracking-wider font-bengali">
                                        <span>মেমোরি ইউসেজ</span>
                                        <span>৪২%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-sky-500 w-[42%] rounded-full"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase text-slate-500 tracking-wider font-bengali">
                                        <span>ডিস্ক স্পেস</span>
                                        <span>৬৫%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 w-[65%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent System Alerts */}
                        <div className="bg-[#045c84] rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            <h3 className="text-xl font-bold mb-6 uppercase tracking-tight flex items-center gap-2 font-bengali">
                                <AlertCircle />
                                গুরুত্বপূর্ণ এলার্ট
                            </h3>
                            <div className="space-y-4 relative z-10 font-bengali">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <p className="text-sm font-bold">নতুন ৫টি প্রতিষ্ঠান অনুমোদনের অপেক্ষায়</p>
                                    <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest font-bold text-sky-200">২ ঘণ্টা আগে</p>
                                </div>
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                                    <p className="text-sm font-bold">সার্ভার ব্যাকআপ সম্পন্ন হয়েছে</p>
                                    <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest font-bold text-sky-200">৫ ঘণ্টা আগে</p>
                                </div>
                            </div>
                            <button className="w-full mt-8 py-4 bg-white text-[#045c84] font-bold rounded-2xl text-xs uppercase tracking-[0.2em] hover:bg-sky-50 transition-all shadow-lg active:scale-95 font-bengali">
                                সমস্ত লগ দেখুন
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

import InstituteOnboarding from '@/components/InstituteOnboarding';

// ... (other imports)

// --- Admin Dashboard ---
function AdminDashboard({ activeInstitute }: { activeInstitute: any }) {
    const { user, setAllInstitutes } = useSession();
    const [isInstModalOpen, setIsInstModalOpen] = useState(false);
    const [showInstituteSwitcher, setShowInstituteSwitcher] = useState(false);

    // Check if user has institutes (or activeInstitute found). 
    // If not, show Onboarding.
    // Note: session provider usually auto-fetches, so we rely on user.institutes length check
    // Logic: if loaded user but no institutes -> onboarding

    // We need to double check if "loading" state allows this check.
    // user.institutes can be undefined initially.
    // Assuming if activeInstitute is null AND user.institutes is explicitly empty array

    const [statsData, setStatsData] = useState<any>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        if (activeInstitute?.id) {
            setStatsLoading(true);
            fetch(`/api/admin/institutes/stats?instituteId=${activeInstitute.id}`)
                .then(res => res.json())
                .then(data => {
                    setStatsData(data);
                    setStatsLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch institute stats:', err);
                    setStatsLoading(false);
                });
        }
    }, [activeInstitute?.id]);

    const showOnboarding = user?.institutes && user.institutes.length === 0;

    const handleOnboardingComplete = () => {
        // Force reload of page or re-fetch institutes is handled by the component calling refreshSession
        // But we might need to update local state here if not fully reactive
        window.location.reload();
    };

    if (showOnboarding) {
        return <InstituteOnboarding onComplete={handleOnboardingComplete} />;
    }

    const stats = [
        {
            name: 'মোট শিক্ষার্থী',
            value: statsLoading ? '...' : (statsData?.students ?? 0).toLocaleString('bn-BD'),
            icon: Users,
            color: 'blue',
            change: '+০%',
            up: true
        },
        {
            name: 'মোট শিক্ষক',
            value: statsLoading ? '...' : (statsData?.teachers ?? 0).toLocaleString('bn-BD'),
            icon: GraduationCap,
            color: 'sky',
            change: '+০',
            up: true
        },
        {
            name: 'মোট আয়',
            value: statsLoading ? '...' : `৳${(statsData?.revenue ?? 0).toLocaleString('bn-BD')}`,
            icon: CreditCard,
            color: 'teal',
            change: '০%',
            up: true
        },
        {
            name: 'উপস্থিতি',
            value: statsLoading ? '...' : (statsData?.attendance ?? '০%'),
            icon: TrendingUp,
            color: 'cyan',
            change: '০%',
            up: true
        },
    ];

    console.log('ADMIN DASHBOARD ACTIVE INST:', activeInstitute);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* Header Section with Cover Image */}
            <div className="relative">
                {activeInstitute?.coverImage ? (
                    <div className="w-full h-[150px] relative overflow-hidden group">
                        <img
                            src={activeInstitute.coverImage}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    </div>
                ) : (
                    <div className="w-full h-[150px] bg-gradient-to-r from-[#045c84] via-[#047cac] to-[#639fb0] relative overflow-hidden shadow-[inset_0_-60px_60px_-30px_rgba(0,0,0,0.3)]">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    </div>
                )}

                {/* Switch Institute Button - Top Right on Cover (Mobile Only) */}
                <div className="md:hidden absolute top-4 right-4 z-20">
                    <button
                        onClick={() => setShowInstituteSwitcher(true)}
                        className="px-4 py-2 bg-white/90 backdrop-blur-md border border-white/50 text-slate-700 font-bold rounded-xl shadow-lg hover:bg-white transition-all active:scale-95 text-xs uppercase tracking-wider font-bengali"
                    >
                        প্রতিষ্ঠান পরিবর্তন
                    </button>
                </div>

                {/* Profile Circle and Info */}
                <div className="px-4 md:px-8 flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12 relative z-10">
                    {/* Logo - Centered on Mobile */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-[6px] border-white bg-slate-100 shadow-xl overflow-hidden relative flex items-center justify-center text-[#045c84] text-5xl font-black italic shadow-blue-900/10">
                            {activeInstitute?.logo ? (
                                <img src={activeInstitute.logo} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                activeInstitute?.name ? activeInstitute.name[0] : 'E'
                            )}
                        </div>
                    </div>

                    {/* Institute Info - Centered on Mobile */}
                    <div className="flex-1 pb-2 text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                            {activeInstitute?.name || 'এডুসি ইনস্টিটিউট'}
                        </h1>
                        <div className="flex items-center justify-center md:justify-start gap-4 mt-1 text-slate-500 font-medium font-bengali flex-wrap">
                            <span className="flex items-center gap-1 text-sm bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                <Building2 size={14} className="text-[#045c84]" />
                                {activeInstitute?.type || 'জেনারেল প্রোফাইল'}
                            </span>
                            <span className="flex items-center gap-1 text-sm bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                <Users size={14} className="text-[#045c84]" />
                                {statsLoading ? '...' : (statsData?.students ?? 0).toLocaleString('bn-BD')} শিক্ষার্থী
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons - Hidden on Mobile, Shown on Desktop */}
                    <div className="hidden md:flex pb-2 items-center gap-3">
                        <button
                            onClick={() => setShowInstituteSwitcher(true)}
                            className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95 text-sm uppercase tracking-wider font-bengali"
                        >
                            প্রতিষ্ঠান পরিবর্তন
                        </button>

                        <button className="px-6 py-3 bg-[#045c84] text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all active:scale-95 text-sm uppercase tracking-wider font-bengali">
                            রিপোর্ট ডাউনলোড
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Stats and Content */}
            <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in-up font-bengali">
                <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    {stats.map((stat) => (
                        <div key={stat.name} className="bg-white p-3 md:p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-2 md:mb-4">
                                <div className={`p-2 md:p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}>
                                    <stat.icon size={20} className="md:w-[26px] md:h-[26px]" />
                                </div>
                                <div className={`flex items-center gap-1 text-xs md:text-sm font-medium ${stat.up ? 'text-emerald-700' : 'text-orange-600'}`}>
                                    {stat.change}
                                    {stat.up ? <ArrowUpRight size={12} className="md:w-[14px] md:h-[14px]" /> : <ArrowDownRight size={12} className="md:w-[14px] md:h-[14px]" />}
                                </div>
                            </div>
                            <p className="text-slate-500 font-bold uppercase text-[10px] md:text-xs tracking-wider">{stat.name}</p>
                            <h3 className="text-xl md:text-3xl font-black text-slate-800 mt-1 break-words">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Only keep the left chart section, full width */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <TrendingUp className="text-[#045c84]" />
                            ভর্তি সংক্রান্ত তথ্য
                        </h3>
                        <select className="bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold px-4 py-2 outline-none text-slate-700 w-auto">
                            <option className="text-slate-700">এই সপ্তাহ</option>
                            <option className="text-slate-700">এই মাস</option>
                        </select>
                    </div>
                    <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-medium italic">
                        ভর্তি তথ্যের গ্রাফ এখানে প্রদর্শিত হবে
                    </div>
                </div>
            </div>

            {/* Institute Profile Modal */}
            <InstituteProfileModal
                isOpen={isInstModalOpen}
                onClose={() => setIsInstModalOpen(false)}
                institute={activeInstitute}
            />

            <SwitchInstituteModal
                isOpen={showInstituteSwitcher}
                onClose={() => setShowInstituteSwitcher(false)}
            />
        </div>
    );
}

// --- Switch Institute Modal ---
function SwitchInstituteModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { user, switchInstitute, activeInstitute } = useSession();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-in">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 font-bengali">
                        <Building2 className="text-[#045c84]" size={20} />
                        প্রতিষ্ঠান পরিবর্তন করুন
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowDownRight className="rotate-45" size={20} />
                    </button>
                </div>

                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                    {user?.institutes?.map((inst: any, index: number) => (
                        <button
                            key={inst?.id || `institute-${index}`}
                            onClick={() => {
                                switchInstitute(inst);
                                onClose();
                            }}
                            className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left group relative overflow-hidden ${activeInstitute?.id === inst.id
                                ? 'bg-[#045c84] border-[#045c84] text-white shadow-lg shadow-blue-900/20'
                                : 'bg-white border-slate-200 hover:border-[#045c84] hover:shadow-md'
                                }`}
                        >
                            {/* Cover Image Background */}
                            {inst.coverImage && (
                                <div className="absolute inset-0 z-0">
                                    <img src={inst.coverImage} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity" />
                                    <div className={`absolute inset-0 ${activeInstitute?.id === inst.id ? 'bg-[#045c84]/80' : 'bg-white/40 group-hover:bg-white/20'}`}></div>
                                </div>
                            )}

                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black shrink-0 relative z-10 ${activeInstitute?.id === inst.id
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-[#045c84] group-hover:bg-[#045c84] group-hover:text-white transition-colors'
                                }`}>
                                {inst.logo ? (
                                    <img src={inst.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    inst.name[0]
                                )}
                            </div>

                            <div className="flex-1 min-w-0 relative z-10">
                                <p className={`font-bold text-sm truncate ${activeInstitute?.id === inst.id ? 'text-white' : 'text-slate-800'}`}>
                                    {inst.name}
                                </p>
                                <p className={`text-xs mt-0.5 truncate ${activeInstitute?.id === inst.id ? 'text-blue-100' : 'text-slate-500 font-medium'}`}>
                                    {inst.type}
                                </p>
                            </div>

                            {activeInstitute?.id === inst.id && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-[#045c84] p-1.5 rounded-full shadow-sm z-10">
                                    <ShieldCheck size={14} />
                                </div>
                            )}
                        </button>
                    ))}

                    {(!user?.institutes || user.institutes.length === 0) && (
                        <div className="text-center py-8 text-slate-400 font-medium italic">
                            কোন প্রতিষ্ঠান পাওয়া যায়নি
                        </div>
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                        onClick={onClose}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-widest"
                    >
                        বাতিল করুন
                    </button>
                </div>
            </div>
        </div>
    );
}

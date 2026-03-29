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
    Edit2,
    Trash2,
    Plus,
    Calendar,
    Users,
    ChevronRight,
    ChevronDown,
    Check,
    Loader2,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    Wallet,
    Receipt,
    PlusCircle
} from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeBengaliDigits } from '@/utils/digit-utils';
import AddCategoryModal from '@/components/AddCategoryModal';


export default function AccountsPage() {
    const { activeInstitute } = useSession();
    const [activeMainTab, setActiveMainTab] = useState('transactions'); // 'transactions' | 'fee_types'
    const [activeSubTab, setActiveSubTab] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [addTrigger, setAddTrigger] = useState(0);
    const [accountData, setAccountData] = useState<{ summary: any, transactions: any[] }>({
        summary: null,
        transactions: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccounts = async () => {
            if (!activeInstitute?.id) return;
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/accounts?instituteId=${activeInstitute.id}`);
                const data = await res.json();
                if (res.ok) {
                    setAccountData(data);
                }
            } catch (err) {
                console.error("Fetch accounts error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, [activeInstitute?.id]);

    const stats = useMemo(() => {
        const s = accountData.summary;
        return [
            { label: 'মোট আয়', value: `৳ ${s?.totalIncome?.toLocaleString() || '০'}`, change: s?.incomeChange || '+০%', trend: 'up', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'মোট ব্যয়', value: `৳ ${s?.totalExpense?.toLocaleString() || '০'}`, change: s?.expenseChange || '+০%', trend: 'up', icon: TrendingDown, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'বকেয়া ফি', value: `৳ ${s?.pendingFees?.toLocaleString() || '০'}`, change: s?.pendingChange || '-০%', trend: 'down', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'বর্তমান ব্যালেন্স', value: `৳ ${s?.balance?.toLocaleString() || '০'}`, change: s?.balanceChange || '+০%', trend: 'up', icon: Wallet, color: 'text-[#045c84]', bg: 'bg-blue-50' },
        ];
    }, [accountData.summary]);

    const filteredTransactions = useMemo(() => {
        let txns = accountData.transactions || [];
        
        // Filter by tab
        if (activeSubTab === 'income') {
            txns = txns.filter(t => t.type?.toUpperCase() === 'INCOME' && t.status?.toUpperCase() === 'COMPLETED');
        } else if (activeSubTab === 'expense') {
            txns = txns.filter(t => t.type?.toUpperCase() === 'EXPENSE' && t.status?.toUpperCase() === 'COMPLETED');
        } else if (activeSubTab === 'pending') {
            txns = txns.filter(t => t.status?.toUpperCase() === 'PENDING');
        } else if (activeSubTab === 'overview') {
            // Only show completed transactions in overview for a cleaner view
            txns = txns.filter(t => t.status?.toUpperCase() === 'COMPLETED').slice(0, 10);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            txns = txns.filter(t => 
                t.category?.toLowerCase().includes(q) || 
                t.studentName?.toLowerCase().includes(q) ||
                t.note?.toLowerCase().includes(q)
            );
        }

        return txns;
    }, [accountData.transactions, activeSubTab, searchQuery]);

    const renderStatus = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full"><CheckCircle2 size={12} /> সফল</span>;
            case 'PENDING':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1 rounded-full"><Clock size={12} /> পেন্ডিং</span>;
            case 'CANCELLED':
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-3 py-1 rounded-full"><AlertCircle size={12} /> বাতিল</span>;
            default:
                return <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full"><AlertCircle size={12} /> {status}</span>;
        }
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in font-bengali min-h-screen bg-slate-50/50">
            {/* Global Dashboard Header - Unified Navigation and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm transition-all duration-300">
                {/* Main Navigation Tabs */}
                <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
                    <button
                        onClick={() => setActiveMainTab('transactions')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 ${activeMainTab === 'transactions'
                            ? 'bg-[#045c84] text-white shadow-lg'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <Receipt size={14} /> লেনদেন ও রিপোর্ট
                    </button>
                    <button
                        onClick={() => setActiveMainTab('fee_types')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 ${activeMainTab === 'fee_types'
                            ? 'bg-[#045c84] text-white shadow-lg'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <PlusCircle size={14} /> ফি-এর ধরণ
                    </button>
                </div>

                {/* Global Search and Actions */}
                <div className="flex items-center gap-4 flex-1 lg:max-w-2xl justify-end">
                    <div className="relative group flex-1 max-w-sm">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84] transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder={activeMainTab === 'transactions' ? "লেনদেন খুঁজুন..." : "খাত খুঁজুন..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-bold placeholder:text-slate-400 focus:ring-1 focus:ring-[#045c84]/10 w-full transition-all"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                                <Plus className="rotate-45" size={16} />
                            </button>
                        )}
                    </div>
                    {activeMainTab === 'transactions' ? (
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center">
                                <Filter size={18} />
                            </button>
                            <button className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-600 hover:bg-slate-100 transition-all flex items-center justify-center">
                                <Download size={18} />
                            </button>
                        </div>
                    ) : (
                        <button 
                            id="add-category-btn-global"
                            onClick={() => setAddTrigger(prev => prev + 1)}
                            className="px-6 py-2.5 bg-[#045c84] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-blue-100 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={16} /> নতুন খাত
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeMainTab === 'transactions' ? (
                    <motion.div
                        key="transactions"
                        initial={{ opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -30 }}
                        transition={{ 
                            type: "spring",
                            damping: 25,
                            stiffness: 200,
                            mass: 0.8
                        }}
                        className="space-y-10"
                    >
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group overflow-hidden">
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center shadow-sm`}>
                                                <stat.icon size={24} />
                                            </div>
                                            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {stat.change}
                                                {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-0.5">{stat.label}</h3>
                                            <p className="text-2xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Main Content Area (Table & Sub-tabs) */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col transition-all">
                            {/* Sub-tab Navigation */}
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl w-fit">
                                    {['overview', 'income', 'expense', 'pending'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveSubTab(tab)}
                                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === tab
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
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredTransactions.length}টি লেনদেন</p>
                                </div>
                            </div>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSubTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex-1 overflow-x-auto"
                                >
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-8 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">আইডি</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">বিবরণ, খাত ও ব্যক্তি</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">পরিমাণ</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">তারিখ</th>
                                                <th className="px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">অবস্থা</th>
                                                <th className="px-8 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {loading ? (
                                                [...Array(5)].map((_, i) => (
                                                    <tr key={i} className="animate-pulse">
                                                        <td colSpan={7} className="px-8 py-6"><div className="h-4 bg-slate-50 rounded-full w-full" /></td>
                                                    </tr>
                                                ))
                                            ) : filteredTransactions.length > 0 ? (
                                                filteredTransactions.map((txn: any) => (
                                                    <tr key={txn.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                                        <td className="px-8 py-4">
                                                            <span className="font-mono text-[9px] font-black text-slate-300 bg-slate-50 px-2 py-1 rounded-lg tracking-tighter">#{txn.id.slice(-6).toUpperCase()}</span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${txn.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                    <Receipt size={14} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-xs text-slate-800">{txn.category}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 tracking-tight">{txn.studentName || 'অজানা'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className={`px-6 py-4 text-right font-black text-xs ${txn.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            ৳ {txn.amount?.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-[10px] font-black text-slate-400">
                                                            {new Date(txn.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {renderStatus(txn.status)}
                                                        </td>
                                                        <td className="px-8 py-4 text-right">
                                                            <button className="w-8 h-8 bg-slate-50 text-slate-300 hover:text-[#045c84] rounded-lg transition-all flex items-center justify-center">
                                                                <MoreVertical size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={7} className="px-10 py-32 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-40">
                                                            <Search size={48} className="text-slate-200" />
                                                            <p className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">লেনদেন পাওয়া যায়নি</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </motion.div>
                            </AnimatePresence>

                            {/* Enhanced Pagination Controls */}
                            <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-between bg-white">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">১-৫ (মোট ২,৪৫০টি)</p>
                                <div className="flex items-center gap-3">
                                    <button className="px-4 py-2 rounded-xl bg-slate-50 text-slate-300 font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all">পূর্ববর্তী</button>
                                    <button className="px-4 py-2 rounded-xl bg-[#045c84] text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 transition-all">পরবর্তী</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="fee_types"
                        initial={{ opacity: 0, scale: 0.98, x: -30 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.98, x: 30 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Categories View Card */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 min-h-[600px]">
                            <CategoryManagementView 
                                externalSearchQuery={searchQuery} 
                                addTrigger={addTrigger}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Insight Banner */}
            <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="max-w-xl text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-blue-300 text-[10px] font-black uppercase tracking-widest mb-3">
                            <TrendingUp size={12} /> AI এনালিটিক্স
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tighter mb-2 leading-tight">
                            আপনার প্রতিষ্ঠানের ফিন্যান্সিয়াল <br />
                            <span className="text-blue-400">রিপোর্ট তৈরি হচ্ছে</span>
                        </h2>
                        <p className="text-slate-400 font-bold leading-relaxed text-[11px]">
                            ভুল বা অসামঞ্জস্যপূর্ণ লেনদেন শনাক্ত করতে স্মার্ট অ্যালগরিদম কাজ করছে।
                        </p>
                    </div>
                    <button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-blue-50 transition-all">
                        অডিট রিপোর্ট দেখুন
                    </button>
                </div>
            </div>
        </div>
    );
}

function CategoryManagementView({ externalSearchQuery, addTrigger }: { externalSearchQuery: string, addTrigger: number }) {
    const { activeInstitute } = useSession();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);

    // Sync external add trigger
    useEffect(() => {
        if (addTrigger > 0) handleAdd();
    }, [addTrigger]);

    const fetchCategories = async () => {
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/accounts/categories?instituteId=${activeInstitute.id}`);
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch categories error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [activeInstitute?.id]);

    const handleAdd = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const handleEdit = (category: any) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleDelete = async (category: any) => {
        if (!confirm('আপনি কি এই খাতটি মুছে ফেলতে চান?')) return;
        try {
            const res = await fetch(`/api/admin/accounts/categories?id=${category.id}`, {
                method: 'DELETE'
            });
            if (res.ok) fetchCategories();
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const handleSave = async (data: any) => {
        try {
            const res = await fetch('/api/admin/accounts/categories', {
                method: selectedCategory ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, instituteId: activeInstitute.id })
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchCategories();
            }
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const formatInterval = (interval: string) => {
        switch (interval) {
            case 'monthly': return 'মাসিক';
            case 'weekly': return 'সাপ্তাহিক';
            case 'semester': return 'সামাসিক';
            case 'yearly': return 'বার্ষিক';
            case 'one_time_year': return 'বছরে একবার';
            case 'one_time_ever': return 'এককালীন';
            default: return 'মাসিক';
        }
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.filter(c => c.name.toLowerCase().includes(externalSearchQuery.toLowerCase())).map((cat) => (
                    <div key={cat.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${cat.type?.toLowerCase() === 'income' ? 'bg-emerald-50' : 'bg-rose-50'} rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform`} />
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    cat.type?.toLowerCase() === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                }`}>
                                    {cat.type?.toLowerCase() === 'income' ? 'আয়' : 'ব্যয়'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleEdit(cat)}
                                        className="p-2 text-slate-400 hover:text-[#045c84] transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(cat)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-black text-slate-800 mb-2 truncate">{cat.name}</h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-6">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {formatInterval(cat.config?.interval || cat.interval)}</span>
                                <span className="flex items-center gap-1"><Users size={14} /> {cat.totalRecipients || '০'} জন</span>
                            </div>

                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">সম্ভাব্য পরিমাণ</div>
                                <div className="text-lg font-black text-slate-800">৳ {cat.totalDue || '০'}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <AddCategoryModal 
                    onClose={() => setIsModalOpen(false)}
                    initialData={selectedCategory}
                    onSave={handleSave}
                />
            )}
        </div>
    );
}

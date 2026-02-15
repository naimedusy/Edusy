'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, BookOpen, CreditCard, ChevronRight, User, Edit, ChevronDown, ChevronUp, Printer, Trash2 } from 'lucide-react';
import { useSession } from './SessionProvider';
import PrintLayout from './PrintLayout';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
    onEdit?: (student: any) => void;
}

export default function StudentProfileModal({ isOpen, onClose, student, onEdit }: StudentProfileModalProps) {
    const { activeInstitute } = useSession();
    const [activeTab, setActiveTab] = useState<'fees' | 'attendance' | 'assignments'>('fees');
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [mounted, setMounted] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen || !student) return null;

    const tabs = [
        { id: 'fees', label: 'ফি', icon: CreditCard },
        { id: 'attendance', label: 'উপস্থিতি', icon: Calendar },
        { id: 'assignments', label: 'অ্যাসাইনমেন্ট', icon: BookOpen },
    ];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl animate-scale-in overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 flex items-center justify-between pb-2 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 font-bengali">শিক্ষার্থীর প্রোফাইল</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit?.(student)}
                            className="p-2 text-slate-400 hover:text-[#045c84] hover:bg-slate-100 rounded-full transition-all"
                            title="সম্পাদনা করুন"
                        >
                            <Edit size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Profile Top Section */}
                <div className="flex flex-col items-center pb-6 shrink-0 font-bengali">
                    <div className="w-24 h-24 rounded-full bg-[#CCF2F4] border-4 border-white shadow-sm flex items-center justify-center text-[#045c84] font-bold text-3xl mb-4 overflow-hidden">
                        {student.metadata?.studentPhoto ? (
                            <img src={student.metadata.studentPhoto} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            student.name?.[0] || 'S'
                        )}
                    </div>
                    <h3 className="text-[18px] font-bold text-slate-800 uppercase tracking-tight">{student.name}</h3>
                    <p className="text-slate-500 text-[9px] font-bold">শিক্ষার্থী আইডি: {student.metadata?.studentId || 'নেই'}</p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-4 text-sm font-bold transition-all relative font-bengali ${activeTab === tab.id
                                ? 'text-blue-600'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            {tab.label}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide font-bengali">
                    {activeTab === 'fees' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Total Due Card */}
                            <div className="bg-[#FFF5F5] p-6 rounded-2xl flex items-center justify-between border border-red-50">
                                <div>
                                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">মোট বকেয়া</p>
                                    <h4 className="text-2xl font-bold text-slate-800">৳ ১,২০০</h4>
                                </div>
                                <button className="px-6 py-2.5 bg-[#F43F5E] text-white font-bold rounded-xl shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95 text-sm">
                                    পরিশোধ করুন
                                </button>
                            </div>

                            {/* Detailed Due List */}
                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">বকেয়া তালিকা (Due List)</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-sm font-bold text-slate-700 font-bengali">মাসিক ফি (ডিসেম্বর)</span>
                                        <span className="text-sm font-bold text-red-500 font-bengali">৳ ১,০০০</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <span className="text-sm font-bold text-slate-700 font-bengali">কো-কারিকুলার ফি</span>
                                        <span className="text-sm font-bold text-red-500 font-bengali">৳ ২০০</span>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction History Expandable */}
                            <div className="space-y-4">
                                <button
                                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                    className="w-full flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-all font-bengali"
                                >
                                    <span>লেনদেনের ইতিহাস ({isHistoryExpanded ? 'বন্ধ করুন' : 'দেখুন'})</span>
                                    {isHistoryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>

                                {isHistoryExpanded && (
                                    <div className="space-y-2 animate-fade-in">
                                        <TransactionItem label="মাসিক ফি (নভেম্বর)" date="নভেম্বর ০৫, ২০২৫" status="পরিশোধিত" amount="৳১,০০০" isPaid />
                                        <TransactionItem label="পরীক্ষার ফি" date="অক্টোবর ১২, ২০২৫" status="পরিশোধিত" amount="৳৫০০" isPaid />
                                        <TransactionItem label="ক্রীড়া তহবিল (ডিলেটেড টেস্ট)" date="শেষ তারিখ: ডিসেম্বর ১০ (বাতিল: ২ দিন আগে)" status="বাতিলকৃত" amount="৳২০০" isPaid={false} isDeleted />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'attendance' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Attendance Overview Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-[#EBFAF2] p-6 rounded-2xl text-center border border-green-50">
                                    <h4 className="text-2xl font-bold text-[#10B981]">৯২%</h4>
                                    <p className="text-xs font-bold text-[#10B981]/80 mt-1">উপস্থিত</p>
                                </div>
                                <div className="bg-[#FFF5F5] p-6 rounded-2xl text-center border border-red-50">
                                    <h4 className="text-2xl font-bold text-[#F43F5E]">৩</h4>
                                    <p className="text-xs font-bold text-[#F43F5E]/80 mt-1">অনুপস্থিত দিন</p>
                                </div>
                            </div>

                            {/* Recent Status List */}
                            <div className="space-y-4">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">সাম্প্রতিক পরিসংখ্যান</h5>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 pb-3">
                                        <span className="text-sm font-bold text-slate-600">আজ</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-bold rounded-lg">উপস্থিত</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 pb-3">
                                        <span className="text-sm font-bold text-slate-600">গতকাল</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-600 text-[10px] font-bold rounded-lg">উপস্থিত</span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0 pb-3">
                                        <span className="text-sm font-bold text-slate-600">নভেম্বর ২৮</span>
                                        <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-bold rounded-lg">অনুপস্থিত</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assignments' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* English Essay Card */}
                            <div className="p-5 border border-slate-100 rounded-2xl space-y-3 hover:border-[#045c84]/30 transition-all">
                                <div className="flex justify-between items-start">
                                    <h5 className="text-sm font-bold text-slate-800">ইংরেজি রচনা (English Essay)</h5>
                                    <span className="px-3 py-1 bg-orange-50 text-orange-500 text-[10px] font-bold rounded-lg border border-orange-100">চলমান</span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                    "আমার দেশ" (২০০ শব্দ) সম্পর্কে লিখুন। (Write about "My Country" - 200 words).
                                </p>
                                <p className="text-[10px] font-bold text-red-500 uppercase">জমার শেষ সময়: আগামীকাল</p>
                            </div>

                            {/* Math Exercise Card */}
                            <div className="p-5 border border-slate-100 rounded-2xl space-y-3 hover:border-[#045c84]/30 transition-all">
                                <div className="flex justify-between items-start">
                                    <h5 className="text-sm font-bold text-slate-800">গণিত অনুশীলন ৪.১ (Math Exercise 4.1)</h5>
                                    <span className="px-3 py-1 bg-green-50 text-green-500 text-[10px] font-bold rounded-lg border border-green-100">জমা দেওয়া হয়েছে</span>
                                </div>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                    ১ থেকে ১০ পর্যন্ত সমস্যাগুলো সমাধান করুন।
                                </p>
                                <p className="text-[10px] font-bold text-slate-400">জমা দেওয়া হয়েছে: নভেম্বর ২৮</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-slate-50 flex items-center justify-end gap-3 shrink-0 font-bengali">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95 text-sm"
                    >
                        বন্ধ করুন
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-8 py-3 bg-[#2563EB] text-white font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 text-sm flex items-center gap-2"
                    >
                        <Printer size={18} />
                        <span>ফি কার্ড প্রিন্ট</span>
                    </button>
                </div>

                {/* Formal Print Version (Visible only during print) */}
                {isPrinting && (
                    <div className="hidden">
                        <PrintLayout title="ফি ক্লিয়ারেন্স কার্ড (Fee Clearance Card)" institute={activeInstitute}>
                            <div className="space-y-8">
                                {/* Student Snapshot */}
                                <div className="grid grid-cols-2 gap-10 border-2 border-slate-100 p-6 rounded-2xl">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">নাম (Name)</p>
                                            <p className="text-2xl font-black text-slate-900">{student.name}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">আইডি (Student ID)</p>
                                            <p className="text-xl font-bold text-slate-700">{student.metadata?.studentId || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 text-right">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">শ্রেণী (Class)</p>
                                            <p className="text-xl font-bold text-slate-700">{student.metadata?.className || 'N/A'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">রোল (Roll)</p>
                                            <p className="text-xl font-bold text-slate-700">{student.metadata?.roll || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Fee Status Table */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-black text-slate-900 border-b-2 border-slate-900 pb-2 uppercase tracking-wide">লেনদেন ও বকেয়া (Transactions & Dues)</h3>
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-100">
                                                <th className="border border-slate-300 px-4 py-2 text-left text-sm font-bold">বিবরণ (Description)</th>
                                                <th className="border border-slate-300 px-4 py-2 text-right text-sm font-bold">পরিমাণ (Amount)</th>
                                                <th className="border border-slate-300 px-4 py-2 text-center text-sm font-bold">অবস্থা (Status)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200">
                                            <tr>
                                                <td className="border border-slate-300 px-4 py-3 text-sm font-medium">মাসিক ফি (ডিসেম্বর)</td>
                                                <td className="border border-slate-300 px-4 py-3 text-right text-sm font-bold">৳ ১,০০০</td>
                                                <td className="border border-slate-300 px-4 py-3 text-center text-sm font-bold text-red-600">বকেয়া</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-slate-300 px-4 py-3 text-sm font-medium">কো-কারিকুলার ফি</td>
                                                <td className="border border-slate-300 px-4 py-3 text-right text-sm font-bold">৳ ২০০</td>
                                                <td className="border border-slate-300 px-4 py-3 text-center text-sm font-bold text-red-600">বকেয়া</td>
                                            </tr>
                                            <tr className="bg-slate-50">
                                                <td className="border border-slate-300 px-4 py-3 text-sm font-black text-right">মোট বকেয়া (Total Due):</td>
                                                <td className="border border-slate-300 px-4 py-3 text-right text-lg font-black text-red-600">৳ ১,২০০</td>
                                                <td className="border border-slate-300 px-4 py-3 text-center font-bold text-red-600 uppercase text-xs">Unpaid</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Important Instructions */}
                                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">নির্দেশনা (Instructions):</p>
                                    <ul className="text-[10px] text-slate-600 list-disc pl-4 space-y-1">
                                        <li>আগামী ১০ তারিখের মধ্যে বকেয়া ফি পরিশোধ করার জন্য অনুরোধ করা হলো।</li>
                                        <li>এই কার্ডটি সংরক্ষিত রাখুন এবং ফি পরিশোধের সময় সাথে আনুন।</li>
                                        <li>যেকোন জিজ্ঞাসায় অফিস চলাকালীন সময়ে যোগাযোগ করুন।</li>
                                    </ul>
                                </div>
                            </div>
                        </PrintLayout>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}

function TransactionItem({ label, date, status, amount, isPaid, isDeleted }: { label: string, date: string, status: string, amount: string, isPaid: boolean, isDeleted?: boolean }) {
    return (
        <div className={`flex items-center justify-between p-4 rounded-xl border border-slate-50 transition-all ${isDeleted ? 'bg-red-50/50 border-red-100 scale-[0.98]' : 'hover:bg-slate-50 hover:border-slate-100'}`}>
            <div className="flex-1">
                <p className={`text-sm font-bold ${isDeleted ? 'text-red-400' : 'text-slate-800'}`}>{label}</p>
                <p className={`text-[10px] font-medium ${isDeleted ? 'text-red-300' : (isPaid ? 'text-slate-400' : 'text-red-400')}`}>{date}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                    <p className={`text-sm font-bold ${isDeleted ? 'text-red-300' : 'text-slate-700'}`}>{amount}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isDeleted ? 'text-red-300' : (isPaid ? 'text-green-500' : 'text-red-500')}`}>
                        {status}
                    </p>
                </div>
                {!isDeleted && (
                    <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" title="রশিদ প্রিন্ট">
                            <Printer size={16} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="মুছে ফেলুন">
                            <Trash2 size={16} />
                        </button>
                    </div>
                )}
                {isDeleted && (
                    <div className="text-[10px] font-bold text-red-400 italic px-2">
                        ৭ দিনের মধ্যে মুছে ফেলা হবে
                    </div>
                )}
            </div>
        </div>
    );
}

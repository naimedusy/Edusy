'use client';

import React from 'react';
import { Building2 } from 'lucide-react';

interface PrintLayoutProps {
    title: string;
    institute?: any;
    children: React.ReactNode;
    date?: string;
}

export default function PrintLayout({ title, institute, children, date = new Date().toLocaleDateString('bn-BD') }: PrintLayoutProps) {
    return (
        <div className="print-area bg-white p-8 font-serif text-black border-4 border-double border-slate-300 m-2 min-h-[10.5in]">
            {/* Institute Header */}
            <div className="flex flex-col items-center text-center space-y-3 mb-8 border-b-2 border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                    {institute?.logo ? (
                        <img src={institute.logo} alt={institute.name} className="w-20 h-20 object-contain" />
                    ) : (
                        <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center">
                            <Building2 size={40} className="text-slate-400" />
                        </div>
                    )}
                    <div className="text-left">
                        <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 leading-tight">
                            {institute?.name || 'Education Institute'}
                        </h1>
                        <p className="text-lg font-bold text-slate-600">
                            {institute?.address || 'Address not provided'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Document Title & Date */}
            <div className="flex justify-between items-center mb-10">
                <div className="bg-slate-900 text-white px-8 py-2 rounded-lg font-black text-xl uppercase tracking-widest">
                    {title}
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">তারিখ (Date)</p>
                    <p className="text-lg font-black text-slate-800">{date}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
                {children}
            </div>

            {/* Signature Area */}
            <div className="mt-20 pt-10 grid grid-cols-3 gap-10 text-center items-end">
                <div className="space-y-2 border-t border-slate-300 pt-2">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">অভিভাবকের স্বাক্ষর</p>
                    <p className="text-[10px] text-slate-300">(Guardian's Signature)</p>
                </div>
                <div className="space-y-2 border-t border-slate-300 pt-2">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">হিসাবরক্ষকের স্বাক্ষর</p>
                    <p className="text-[10px] text-slate-300">(Accountant's Signature)</p>
                </div>
                <div className="space-y-2 border-t border-slate-300 pt-2">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">অধ্যক্ষের স্বাক্ষর</p>
                    <p className="text-[10px] text-slate-300">(Principal's Signature)</p>
                </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-12 text-center text-[10px] text-slate-400 italic">
                <p>This is an electronically generated official document from {institute?.name || 'Edusy'}.</p>
                <p>Powered by Edusy - Software for Educational Institutions</p>
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-area, .print-area * {
                        visibility: visible;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        height: 100%;
                        margin: 0;
                        padding: 2rem;
                        border: none;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

'use client';

import React, { useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    BookOpen,
    CheckCircle2,
    Calendar as CalendarIcon
} from 'lucide-react';

interface AssignmentCalendarProps {
    assignments: any[];
    selectedDate: string;
    onDateSelect: (date: string) => void;
}

const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const MONTHS_BN = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export default function AssignmentCalendar({ assignments, selectedDate, onDateSelect }: AssignmentCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate || new Date()));

    const daysInMonth = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Fill empty slots for leading days
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        // Fill real dates
        for (let i = 1; i <= lastDate; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentMonth]);

    const navigateMonth = (direction: number) => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
        setCurrentMonth(newMonth);
    };

    // Group assignments by date string
    const assignmentsByDate = useMemo(() => {
        const map: Record<string, { count: number, submissions: number, subjects: string[] }> = {};
        assignments.forEach(a => {
            const dateStr = new Date(a.scheduledDate).toISOString().split('T')[0];
            if (!map[dateStr]) {
                map[dateStr] = { count: 0, submissions: 0, subjects: [] };
            }
            map[dateStr].count += 1;
            map[dateStr].submissions += (a._count?.submissions || 0);
            if (a.book?.name && !map[dateStr].subjects.includes(a.book.name)) {
                map[dateStr].subjects.push(a.book.name);
            }
        });
        return map;
    }, [assignments]);

    const isSelected = (date: Date) => {
        return date.toISOString().split('T')[0] === selectedDate;
    };

    const isToday = (date: Date) => {
        return date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    };

    return (
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            {/* Calendar Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#045c84] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#045c84]/20">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                            {MONTHS_BN[currentMonth.getMonth()]}, {currentMonth.getFullYear()}
                        </h2>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">ক্লাস ডাইরি হিস্টোরি ক্যালেন্ডার</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 text-slate-600 shadow-sm"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-200 transition-all uppercase tracking-tight"
                    >
                        আজকে
                    </button>
                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-95 text-slate-600 shadow-sm"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-6">
                <div className="grid grid-cols-7 mb-4">
                    {DAYS_BN.map(day => (
                        <div key={day} className="py-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((date, idx) => {
                        if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;

                        const dateStr = date.toISOString().split('T')[0];
                        const data = assignmentsByDate[dateStr];
                        const selected = isSelected(date);
                        const today = isToday(date);

                        return (
                            <button
                                key={dateStr}
                                onClick={() => onDateSelect(dateStr)}
                                className={`group relative aspect-square rounded-2xl border transition-all flex flex-col p-2 items-start justify-between
                                    ${selected
                                        ? 'bg-[#045c84] border-[#045c84] shadow-lg shadow-[#045c84]/20 -translate-y-1'
                                        : today
                                            ? 'bg-blue-50 border-blue-200 text-blue-800'
                                            : 'bg-white border-slate-100 hover:border-[#045c84]/30 hover:shadow-md hover:-translate-y-0.5'
                                    }
                                `}
                            >
                                <span className={`text-sm font-black ${selected ? 'text-white' : 'text-slate-600'}`}>
                                    {date.getDate()}
                                </span>

                                {data && (
                                    <div className="flex flex-col gap-1 w-full items-start overflow-hidden">
                                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm
                                            ${selected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}
                                        `}>
                                            <BookOpen size={10} />
                                            {data.count}
                                        </div>
                                        {data.submissions > 0 && (
                                            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black shadow-sm
                                                ${selected ? 'bg-emerald-400/30 text-emerald-100' : 'bg-emerald-100 text-emerald-700'}
                                            `}>
                                                <CheckCircle2 size={10} />
                                                {data.submissions}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Hover Info Bubble / Subjects concept */}
                                {data && !selected && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-900 text-white text-[9px] p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 shadow-2xl">
                                        <p className="font-black mb-1 text-slate-300 border-b border-white/10 pb-1">বিষয়সমূহ:</p>
                                        <div className="space-y-0.5">
                                            {data.subjects.slice(0, 3).map((s, i) => (
                                                <p key={i} className="truncate">• {s}</p>
                                            ))}
                                            {data.subjects.length > 3 && <p className="opacity-50">+{data.subjects.length - 3} আরও</p>}
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Legend / Info Footer */}
            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-6 items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-100 border border-blue-200 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">আজকের দিন</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#045c84] rounded-full" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">নির্বাচিত দিন</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <BookOpen size={12} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-700">সংখ্যা = অ্য়াইনমেন্ট</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-700">সংখ্যা = সাবমিশন</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

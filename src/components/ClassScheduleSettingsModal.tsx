'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Calendar, Save, Loader2, CheckCircle2 } from 'lucide-react';

const DAYS = [
    { key: 'sun', label: 'রবি', en: 'Sunday' },
    { key: 'mon', label: 'সোম', en: 'Monday' },
    { key: 'tue', label: 'মঙ্গল', en: 'Tuesday' },
    { key: 'wed', label: 'বুধ', en: 'Wednesday' },
    { key: 'thu', label: 'বৃহঃ', en: 'Thursday' },
    { key: 'fri', label: 'শুক্র', en: 'Friday' },
    { key: 'sat', label: 'শনি', en: 'Saturday' },
];

interface DaySchedule {
    startTime: string;
    releaseTime: string;
}

interface ClassSchedule {
    activeDays: string[];           // e.g. ['sun', 'mon', 'tue', 'wed', 'thu']
    globalStartTime: string;
    globalEndTime: string;
    globalReleaseTime: string;
    tiffinStart: string;
    tiffinEnd: string;
    perDayStartTime: boolean;
    perDayReleaseTime: boolean;
    daySchedules: Record<string, DaySchedule>;
    fees: number;
    lateThreshold: number;
}

const DEFAULT_SCHEDULE: ClassSchedule = {
    activeDays: ['sun', 'mon', 'tue', 'wed', 'thu'],
    globalStartTime: '09:00',
    globalEndTime: '14:00',
    globalReleaseTime: '06:00',
    tiffinStart: '11:00',
    tiffinEnd: '11:30',
    perDayStartTime: false,
    perDayReleaseTime: false,
    daySchedules: {},
    fees: 0,
    lateThreshold: 15
};

interface ClassScheduleSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    className: string;
    existingData?: any;
    onSuccess?: () => void;
}

export default function ClassScheduleSettingsModal({
    isOpen,
    onClose,
    classId,
    className,
    existingData,
    onSuccess
}: ClassScheduleSettingsModalProps) {
    const [schedule, setSchedule] = useState<ClassSchedule>(() => {
        const base = existingData?.schedule || DEFAULT_SCHEDULE;
        return {
            ...DEFAULT_SCHEDULE,
            ...base,
            fees: existingData?.fees || base.fees || 0,
            lateThreshold: existingData?.lateThreshold || base.lateThreshold || 15,
            globalEndTime: existingData?.endTime || base.globalEndTime || '14:00',
            tiffinStart: existingData?.tiffinStart || base.tiffinStart || '11:00',
            tiffinEnd: existingData?.tiffinEnd || base.tiffinEnd || '11:30',
        };
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            const base = existingData?.schedule || DEFAULT_SCHEDULE;
            setSchedule({
                ...DEFAULT_SCHEDULE,
                ...base,
                fees: existingData?.fees || base.fees || 0,
                lateThreshold: existingData?.lateThreshold || base.lateThreshold || 15,
                globalEndTime: existingData?.endTime || base.globalEndTime || '14:00',
                tiffinStart: existingData?.tiffinStart || base.tiffinStart || '11:00',
                tiffinEnd: existingData?.tiffinEnd || base.tiffinEnd || '11:30',
            });
            setSaved(false);
            // Lock body scroll only if not already locked by another modal (or just force it)
            document.body.style.overflow = 'hidden';
        } else {
            // Only unlock if we are the ones who locked it (simplified check)
            // In a better system we'd use a stack, but for now this works as most modals use the same logic
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, existingData]);

    const toggleDay = (day: string) => {
        setSchedule(prev => ({
            ...prev,
            activeDays: prev.activeDays.includes(day)
                ? prev.activeDays.filter(d => d !== day)
                : [...prev.activeDays, day]
        }));
    };

    const updateDaySchedule = (day: string, field: 'startTime' | 'releaseTime', value: string) => {
        setSchedule(prev => ({
            ...prev,
            daySchedules: {
                ...prev.daySchedules,
                [day]: {
                    startTime: prev.daySchedules[day]?.startTime || prev.globalStartTime,
                    releaseTime: prev.daySchedules[day]?.releaseTime || prev.globalReleaseTime,
                    [field]: value
                }
            }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/classes/${classId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schedule,
                    fees: schedule.fees,
                    lateThreshold: schedule.lateThreshold,
                    startTime: schedule.globalStartTime,
                    endTime: schedule.globalEndTime,
                    tiffinStart: schedule.tiffinStart,
                    tiffinEnd: schedule.tiffinEnd
                })
            });
            if (res.ok) {
                setSaved(true);
                if (onSuccess) onSuccess();
                setTimeout(() => {
                    setSaved(false);
                    onClose();
                }, 1200);
            }
        } catch (err) {
            console.error('Failed to save schedule:', err);
        } finally {
            setSaving(false);
        }
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            data-lenis-prevent
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl shadow-slate-900/20 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 z-10">

                {/* Header */}
                <div className="bg-gradient-to-r from-[#045c84] to-[#047cac] px-6 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">ক্লাস সেটিংস</p>
                        <h2 className="text-white text-xl font-black mt-0.5">{className}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-[82vh] overflow-y-auto custom-scrollbar">
                    <div className="p-6 space-y-6">

                        {/* Active Days */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-[#045c84]" />
                                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">সক্রিয় দিন (ক্লাস থাকে)</h3>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {DAYS.map(day => {
                                    const isActive = schedule.activeDays.includes(day.key);
                                    return (
                                        <button
                                            key={day.key}
                                            onClick={() => toggleDay(day.key)}
                                            className={`px-4 py-2.5 rounded-lg text-xs font-black transition-all border ${isActive
                                                ? 'bg-[#045c84] text-white border-[#045c84] shadow-lg shadow-[#045c84]/20'
                                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:border-[#045c84]/30'
                                                }`}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Start & End Time Section */}
                        <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-emerald-500" />
                                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">ক্লাস সময়সূচী</h3>
                                </div>
                                {/* Per-day toggle for Start Time */}
                                <button
                                    onClick={() => setSchedule(p => ({ ...p, perDayStartTime: !p.perDayStartTime }))}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${schedule.perDayStartTime
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                        : 'bg-white text-slate-400 border border-slate-200'
                                        }`}
                                >
                                    {schedule.perDayStartTime ? '✓ প্রতিদিন আলাদা' : 'সব দিন একই'}
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ক্লাস শুরু</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={schedule.globalStartTime}
                                            onChange={e => setSchedule(p => ({ ...p, globalStartTime: e.target.value }))}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-[#045c84]/20 focus:border-[#045c84] transition-all cursor-pointer appearance-none"
                                        />
                                        <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ক্লাস শেষ</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={schedule.globalEndTime}
                                            onChange={e => setSchedule(p => ({ ...p, globalEndTime: e.target.value }))}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-[#045c84]/20 focus:border-[#045c84] transition-all cursor-pointer appearance-none"
                                        />
                                        <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {schedule.perDayStartTime && (
                                <div className="space-y-2 pt-2 border-t border-slate-200">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">প্রতিদিনের শুরুর সময়:</p>
                                    {DAYS.filter(d => schedule.activeDays.includes(d.key)).map(day => (
                                        <div key={day.key} className="flex items-center gap-3 relative group/input">
                                            <span className="text-xs font-black text-slate-600 w-14 text-center px-2 py-1 bg-white rounded-lg border border-slate-200">
                                                {day.label}
                                            </span>
                                            <div className="relative flex-1">
                                                <input
                                                    type="time"
                                                    value={schedule.daySchedules[day.key]?.startTime || schedule.globalStartTime}
                                                    onChange={e => updateDaySchedule(day.key, 'startTime', e.target.value)}
                                                    onClick={(e) => e.currentTarget.showPicker()}
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-[#045c84]/20 focus:border-[#045c84] transition-all cursor-pointer appearance-none"
                                                />
                                                <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/input:text-[#045c84]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tiffin Section */}
                        <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-sky-500" />
                                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">টিফিন সময়</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">শুরু</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={schedule.tiffinStart}
                                            onChange={e => setSchedule(p => ({ ...p, tiffinStart: e.target.value }))}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all cursor-pointer appearance-none"
                                        />
                                        <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">শেষ</label>
                                    <div className="relative">
                                        <input
                                            type="time"
                                            value={schedule.tiffinEnd}
                                            onChange={e => setSchedule(p => ({ ...p, tiffinEnd: e.target.value }))}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-all cursor-pointer appearance-none"
                                        />
                                        <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Settings */}
                        <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-rose-500" />
                                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">হাজিরা সেটিংস</h3>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">দেরি হওয়ার সীমা (মিনিট)</label>
                                    <span className="text-[10px] font-black text-rose-500">{schedule.lateThreshold} মিনিট পর 'দেরি' হিসেবে গণ্য হবে</span>
                                </div>
                                <input
                                    type="number"
                                    value={schedule.lateThreshold}
                                    onChange={e => setSchedule(p => ({ ...p, lateThreshold: parseInt(e.target.value) || 0 }))}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition-all shadow-sm"
                                    placeholder="মিনিট উল্লেখ করুন"
                                />
                            </div>
                        </div>

                        {/* Fees Section */}
                        <div className="space-y-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex items-center gap-2">
                                <Save size={16} className="text-violet-500" />
                                <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">আর্থিক তথ্য</h3>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">মাসিক বেতন (টাকা)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={schedule.fees}
                                        onChange={e => setSchedule(p => ({ ...p, fees: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 transition-all shadow-sm pl-12"
                                        placeholder="টাকার পরিমাণ"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400">৳</span>
                                </div>
                            </div>
                        </div>

                        {/* Release Time Section */}
                        <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-amber-500" />
                                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest">ক্লাস ডাইরি রিলিজ সময়</h3>
                                </div>
                                <button
                                    onClick={() => setSchedule(p => ({ ...p, perDayReleaseTime: !p.perDayReleaseTime }))}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${schedule.perDayReleaseTime
                                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                        : 'bg-white text-slate-400 border border-slate-200'
                                        }`}
                                >
                                    {schedule.perDayReleaseTime ? '✓ প্রতিদিন আলাদা' : 'সব দিন একই'}
                                </button>
                            </div>

                            {!schedule.perDayReleaseTime ? (
                                <div className="flex items-center gap-3 relative group/input">
                                    <span className="text-xs text-slate-500 font-bold w-20">সব দিন</span>
                                    <div className="relative flex-1">
                                        <input
                                            type="time"
                                            value={schedule.globalReleaseTime}
                                            onChange={e => setSchedule(p => ({ ...p, globalReleaseTime: e.target.value }))}
                                            onClick={(e) => e.currentTarget.showPicker()}
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all cursor-pointer appearance-none"
                                        />
                                        <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/input:text-amber-500" />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {DAYS.filter(d => schedule.activeDays.includes(d.key)).map(day => (
                                        <div key={day.key} className="flex items-center gap-3 relative group/input">
                                            <span className="text-xs font-black text-slate-600 w-14 text-center px-2 py-1 bg-white rounded-lg border border-slate-200">
                                                {day.label}
                                            </span>
                                            <div className="relative flex-1">
                                                <input
                                                    type="time"
                                                    value={schedule.daySchedules[day.key]?.releaseTime || schedule.globalReleaseTime}
                                                    onChange={e => updateDaySchedule(day.key, 'releaseTime', e.target.value)}
                                                    onClick={(e) => e.currentTarget.showPicker()}
                                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all cursor-pointer appearance-none"
                                                />
                                                <Clock size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within/input:text-amber-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-[10px] text-slate-400 font-medium">শিক্ষার্থীরা এই সময়ে ক্লাস ডাইরি দেখতে পাবে</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white">
                    <button
                        onClick={handleSave}
                        disabled={saving || saved}
                        className={`w-full py-4 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${saved
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                            : 'bg-[#045c84] text-white shadow-lg shadow-[#045c84]/20 hover:bg-[#034d6e] active:scale-98'
                            }`}
                    >
                        {saving ? (
                            <><Loader2 size={18} className="animate-spin" /> সেভ হচ্ছে...</>
                        ) : saved ? (
                            <><CheckCircle2 size={18} /> সেভ হয়েছে!</>
                        ) : (
                            <><Save size={18} /> সেটিংস সেভ করুন</>
                        )}
                    </button>
                </div>
            </div>
            <style jsx global>{`
                input[type="time"]::-webkit-calendar-picker-indicator {
                    background: transparent;
                    bottom: 0;
                    color: transparent;
                    cursor: pointer;
                    height: auto;
                    left: 0;
                    position: absolute;
                    right: 0;
                    top: 0;
                    width: auto;
                }
            `}</style>
        </div>,
        document.body
    );
}

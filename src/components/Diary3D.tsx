'use client';

import React, { useMemo } from 'react';
import { BookOpen, CheckCircle2, Paperclip, Clock, ShieldCheck } from 'lucide-react';

interface Diary3DProps {
    coverImage?: string;
    title?: string;
    className?: string;
    classTitle?: string;
    accentColor?: string;
    stats?: {
        total: number;
        released: number;
        submitted: number;
        notSubmitted: number;
        approved: number;
    };
}

const getThemeColor = (title: string) => {
    const colors = [
        '#818cf8', // Indigo/Purple
        '#06b6d4', // Cyan
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#ec4899', // Pink
        '#3b82f6', // Blue
        '#f97316'  // Orange
    ];
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

export default function Diary3D({
    coverImage,
    title,
    className = '',
    classTitle = 'DAILY DIARY',
    accentColor = '#1d6074',
    stats
}: Diary3DProps) {

    const themeColor = useMemo(() => getThemeColor(classTitle), [classTitle]);

    const progress = stats && stats.total > 0
        ? Math.round(((stats.submitted + stats.approved) / stats.total) * 100)
        : 0;

    // Multi-segment bar widths (of 100%)
    const total = stats?.total || 1;
    const releasedPct = ((stats?.released ?? 0) / total) * 100;
    const submittedPct = ((stats?.submitted ?? 0) / total) * 100;
    const approvedPct = ((stats?.approved ?? 0) / total) * 100;
    const pendingPct = ((stats?.notSubmitted ?? 0) / total) * 100;

    const statItems = stats ? [
        { count: stats.total,                   label: 'বিষয়',  color: themeColor },
        { count: stats.released,                label: 'কাজ',   color: themeColor },
        { count: stats.released,                label: 'প্রকাঃ', color: '#818cf8' },
        { count: total - (stats.released ?? 0), label: 'অপ্রঃ', color: '#94a3b8' },
        { count: stats.submitted,               label: 'জমা',   color: '#10b981' },
        { count: stats.approved,                label: 'অনুঃ',   color: '#14b8a6' },
    ] : [];

    return (
        <div className={`relative w-full max-w-[280px] aspect-[10/14] min-h-[280px] mx-auto [perspective:1500px] bg-slate-50 rounded-xl group ${className}`}>
            <div className="relative w-full h-full [transform-style:preserve-3d] transition-transform duration-700 [transform:rotateY(-10deg)] group-hover:[transform:rotateY(-20deg)_translateY(-5px)] shadow-lg rounded-xl">

                {/* Book Pages (Back) */}
                <div className="absolute w-[98%] h-[98%] bg-white right-[-2px] inset-y-[1%] rounded-r-lg shadow-[2px_2px_5px_rgba(0,0,0,0.08)] border border-slate-200 z-[5] [transform:translateZ(-5px)]"></div>
                <div className="absolute w-[98%] h-[98%] bg-white right-[-4px] inset-y-[1%] rounded-r-lg shadow-[2px_2px_5px_rgba(0,0,0,0.08)] border border-slate-200 z-[4] [transform:translateZ(-10px)]"></div>
                <div className="absolute w-[98%] h-[98%] bg-slate-50 right-[-6px] inset-y-[1%] rounded-r-lg shadow-[2px_2px_5px_rgba(0,0,0,0.08)] border border-slate-200 z-[3] [transform:translateZ(-15px)]"></div>

                {/* Front Cover */}
                <div className="absolute inset-0 bg-white rounded-l rounded-r-xl shadow-[-4px_4px_18px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden z-[10] origin-left">
                    {/* Spine Shadow */}
                    <div className="absolute left-0 inset-y-0 w-3 bg-gradient-to-r from-black/15 via-black/5 to-transparent z-[15] border-r border-black/5"></div>

                    <div className="relative w-full h-full bg-white">
                        {coverImage ? (
                            <img src={coverImage} alt={title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col relative overflow-hidden">

                                {/* Top Wave */}
                                <div className="absolute inset-x-0 top-0 h-[65px] z-[1]">
                                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
                                        <path d="M0,0 L500,0 L500,60 C300,10 150,110 0,60 Z" style={{ fill: accentColor }}></path>
                                    </svg>
                                </div>

                                {/* Bottom Wave */}
                                <div className="absolute inset-x-0 bottom-0 h-[65px] z-[1]">
                                    <svg viewBox="0 0 500 150" preserveAspectRatio="none" className="w-full h-full">
                                        <path d="M0,150 L500,150 L500,90 C300,140 150,40 0,90 Z" style={{ fill: accentColor }}></path>
                                    </svg>
                                </div>

                                {/* Center Content: icon at top, class name below */}
                                <div className="flex-1 flex flex-col items-center z-[2] pt-[48px] pb-[150px] px-4">
                                    {/* Icon Pill — top */}
                                    <div
                                        className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105"
                                        style={{ backgroundColor: `${themeColor}22` }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: themeColor }}>
                                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                                        </svg>
                                    </div>

                                    {/* Class Name */}
                                    <h3
                                        className="text-[15px] font-black tracking-wide text-center leading-tight mb-1"
                                        style={{ color: accentColor }}
                                    >
                                        {classTitle}
                                    </h3>
                                    <span className="text-[7px] font-bold tracking-[3px] text-slate-400 uppercase">Academic Diary</span>
                                </div>

                                {/* Stats Panel - pushed low */}
                                {stats && (
                                    <div className="absolute inset-x-2 bottom-[62px] z-[10] bg-white/98 rounded-xl pt-2 px-2.5 pb-2 shadow-[0_4px_16px_rgba(0,0,0,0.09)] border border-slate-100">

                                        {/* Class Name + % on one line */}
                                        <div className="mb-1.5 pb-1 border-b border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-black truncate" style={{ color: accentColor }}>{classTitle}</span>
                                            <span className="text-[9px] font-black ml-2 shrink-0" style={{ color: themeColor }}>{progress}%</span>
                                        </div>

                                        {/* Individual stat rows */}
                                        <div className="space-y-1">
                                            {statItems.map(({ count, label, color }, i) => (
                                                <div key={i} className="flex items-center gap-1.5">
                                                    <span className="text-[7px] font-semibold text-slate-400 w-7 shrink-0 text-right leading-none">{label}</span>
                                                    <div className="flex-1 h-[3px] rounded-full overflow-hidden bg-slate-100">
                                                        <div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                width: `${total > 0 ? Math.round((count / total) * 100) : 0}%`,
                                                                backgroundColor: color
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-[8px] font-black w-3 text-left shrink-0 leading-none" style={{ color }}>{count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}


                            </div>
                        )}

                        {/* Sheen */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5 pointer-events-none z-[20]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

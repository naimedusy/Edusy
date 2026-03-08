'use client';

import React from 'react';
import { BookOpen, Star, Trash2, MoreVertical } from 'lucide-react';

interface BookCardProps {
    book: {
        id: string;
        name: string;
        coverImage?: string | null;
        author?: string | null;
        rating?: number | null;
        pdfUrl?: string | null;
        readLink?: string | null;
        totalMarks?: number | null;
        class?: {
            name: string;
        };
        groupId?: string | null;
        group?: {
            name: string;
        } | null;
    };
    onDelete?: (id: string) => void;
    onClick?: (book: any) => void;
    onRead?: (book: any) => void;
    isAdmin?: boolean;
    isReadOnly?: boolean;
    viewMode?: 'card' | 'cover';
    onMenuClick?: (e: React.MouseEvent, book: any) => void;
}

const BookCard: React.FC<BookCardProps> = ({
    book,
    onDelete,
    onClick,
    onRead,
    onMenuClick,
    isAdmin = false,
    isReadOnly = false,
    viewMode = 'card'
}) => {
    const hasReadOption = !!(book.pdfUrl || book.readLink);
    const showMenu = !isReadOnly && isAdmin;
    const totalMarks = book.totalMarks || 100;
    const rating = book.rating || 4.5; // Mock rating if not provided

    // Generate a consistent "Book Material" color based on the name
    const materialColors = [
        { cover: 'bg-[#5c1d1d]', spine: 'bg-[#4a1717]', text: 'text-amber-100/40' }, // Maroon
        { cover: 'bg-[#1d2d5c]', spine: 'bg-[#17234a]', text: 'text-indigo-100/40' }, // Navy
        { cover: 'bg-[#1d5c2d]', spine: 'bg-[#174a23]', text: 'text-emerald-100/40' }, // Forest
        { cover: 'bg-[#3d3d3d]', spine: 'bg-[#2d2d2d]', text: 'text-slate-100/30' },  // Charcoal
    ];
    const colorIdx = (book.name?.length || 0) % materialColors.length;
    const theme = materialColors[colorIdx];

    if (viewMode === 'cover') {
        return (
            <div
                onClick={() => onClick?.(book)}
                className="group relative transition-all duration-500 flex flex-col items-center text-center cursor-pointer [perspective:1200px]"
            >
                {/* 3D Physical Book Object Container */}
                <div className="relative mb-5 w-full aspect-[3/4.4] [transform-style:preserve-3d] group-hover:[transform:rotateY(-18deg)_rotateX(2deg)] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] origin-left">

                    {/* The Book Body (Paper Thickness - Top/Right Edges) */}
                    <div className="absolute inset-0 bg-[#f8f5f0] rounded-r-[3px] shadow-[2px_0_5px_rgba(0,0,0,0.1)_inset] border-y border-r border-[#e8e2d4] translate-x-[2px] -translate-y-[1px]" />

                    {/* Back Cover / Thickness Base */}
                    <div className={`absolute inset-0 ${theme.spine} rounded-r-[0.5rem] rounded-l-[0.2rem] shadow-[20px_20px_40px_rgba(0,0,0,0.25)] group-hover:shadow-[35px_35px_70px_rgba(0,0,0,0.35)] transition-shadow duration-700`} />

                    {/* Spine Gradient Overlay */}
                    <div className="absolute top-0 left-0 w-[14px] h-full bg-gradient-to-r from-black/30 via-transparent to-black/10 z-20 rounded-l-[0.2rem] border-r border-white/5" />

                    {/* Front Cover Front-Face */}
                    <div className={`relative w-full h-full rounded-r-[0.5rem] rounded-l-[0.2rem] overflow-hidden ${theme.cover} flex items-center justify-center border-l-[4px] border-black/20 z-10`}>
                        {book.coverImage ? (
                            <img src={book.coverImage} alt={book.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                            <div className="flex flex-col items-center justify-center p-6 w-full h-full text-center relative overflow-hidden">
                                {/* Leather Texture Overlay */}
                                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none" />

                                <BookOpen size={42} className={`mb-4 ${theme.text} opacity-50 relative z-10`} />
                                <span className={`text-[11px] font-black ${theme.text} uppercase tracking-[0.22em] lg:tracking-[0.25em] line-clamp-4 px-2 italic leading-relaxed drop-shadow-md relative z-10`}>
                                    {book.name}
                                </span>

                                {/* Decorative Foil Lines */}
                                <div className={`absolute top-6 inset-x-6 h-[1px] ${theme.text} opacity-20`} />
                                <div className={`absolute bottom-6 inset-x-6 h-[1px] ${theme.text} opacity-20`} />
                            </div>
                        )}

                        {/* Realistic Lighting Effects */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/15 pointer-events-none mix-blend-overlay" />
                        <div className="absolute inset-y-0 left-3 w-[1px] bg-white/20 pointer-events-none" />
                    </div>
                </div>

                {/* Info Text Below the Book */}
                <div className="w-full px-1">
                    <h3 className="text-[14px] font-black text-slate-800 line-clamp-2 h-9 group-hover:text-[#045c84] transition-colors leading-[1.2] mb-1.5" title={book.name}>
                        {book.name}
                    </h3>
                    <div className="flex flex-col items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-all duration-300">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] truncate max-w-full italic leading-none">
                            {book.author || 'নির্ধারিত লেখক নেই'}
                        </p>
                        {book.group?.name && (
                            <span className="text-[8px] font-black text-[#045c84] bg-[#045c84]/5 px-3 py-1 rounded-full uppercase border border-[#045c84]/10 tracking-wider">
                                {book.group.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Simplified Menu Button */}
                {showMenu && onMenuClick && (
                    <div className="absolute top-2 right-0 opacity-0 group-hover:opacity-100 transition-all duration-300 z-40 translate-x-1 group-hover:translate-x-0">
                        <button
                            onClick={(e) => { e.stopPropagation(); onMenuClick(e, book); }}
                            className="p-1.5 text-slate-400 hover:text-[#045c84] hover:bg-white rounded-xl shadow-2xl bg-white/90 backdrop-blur-md transition-all border border-slate-100"
                        >
                            <MoreVertical size={16} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Wide Card Style (Default)
    return (
        <div
            onClick={() => onClick?.(book)}
            className="group relative bg-white rounded-[1.75rem] p-3.5 border border-slate-100 hover:border-[#045c84]/20 transition-all duration-500 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.08)] flex gap-5 cursor-pointer overflow-hidden items-center group/card"
        >
            {/* Left: Enhanced Realistic Cover */}
            <div className="relative w-20 h-24 flex-shrink-0 [perspective:500px] group/cover">
                <div className="relative w-full h-full rounded-r-lg rounded-l-sm overflow-hidden bg-slate-50 shadow-[4px_4px_10px_rgba(0,0,0,0.1)] group-hover/card:[transform:rotateY(-10deg)] transition-transform duration-500 origin-left border-l-[2.5px] border-black/10">
                    {book.coverImage ? (
                        <img src={book.coverImage} alt={book.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200 bg-slate-100">
                            <BookOpen size={24} className="opacity-20" />
                        </div>
                    )}
                </div>
                {/* Score Tag */}
                <div className="absolute top-1.5 left-2 bg-black/60 backdrop-blur-md text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest border border-white/10 z-10 shadow-lg">
                    {totalMarks}M
                </div>
                {/* Spine Effect */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-black/10 z-20 pointer-events-none rounded-l-sm" />
            </div>

            {/* Middle: Rich Info */}
            <div className="flex-1 min-w-0 py-1">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="text-[15px] font-black text-slate-800 line-clamp-1 group-hover:text-[#045c84] transition-colors leading-none pt-0.5">
                        {book.name}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                        <Star size={10} fill="#f59e0b" className="text-amber-500" />
                        <span className="text-[10px] font-black text-amber-700">{rating.toFixed(1)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2.5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                        {book.author || 'নির্ধারিত নেই'}
                    </p>
                    {book.class?.name && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-black text-[#045c84] bg-[#045c84]/5 px-2 py-0.5 rounded-lg uppercase border border-[#045c84]/10">
                                {book.class.name}
                            </span>
                        </div>
                    )}
                    {book.group?.name && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase border border-indigo-100">
                                {book.group.name}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {hasReadOption && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onRead?.(book); }}
                            className="group/btn flex items-center gap-2 px-4 py-2 bg-[#045c84] text-white text-[11px] font-black rounded-xl hover:bg-[#056da0] active:scale-95 transition-all shadow-lg shadow-blue-900/10"
                        >
                            <BookOpen size={13} className="group-hover/btn:rotate-12 transition-transform" />
                            <span>বইটি পড়ুন</span>
                        </button>
                    )}
                    <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] hidden sm:inline">
                        FULL DETAILS
                    </span>
                </div>
            </div>

            {/* Right: Actions Menu */}
            {showMenu && onMenuClick && (
                <button
                    onClick={(e) => { e.stopPropagation(); onMenuClick(e, book); }}
                    className="p-3 text-slate-300 hover:text-[#045c84] hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 active:scale-90"
                >
                    <MoreVertical size={20} />
                </button>
            )}
        </div>
    );
};

export default BookCard;

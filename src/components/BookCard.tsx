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
        class?: {
            name: string;
        };
    };
    onDelete?: (id: string) => void;
    onClick?: (book: any) => void;
    isAdmin?: boolean;
    isReadOnly?: boolean;
    viewMode?: 'card' | 'cover';
    onMenuClick?: (e: React.MouseEvent, book: any) => void;
}

const BookCard: React.FC<BookCardProps> = ({
    book,
    onDelete,
    onClick,
    onMenuClick,
    isAdmin = false,
    isReadOnly = false,
    viewMode = 'card'
}) => {
    const hasReadOption = !!(book.pdfUrl || book.readLink);
    const showMenu = !isReadOnly && isAdmin;

    if (viewMode === 'cover') {
        return (
            <div
                onClick={() => onClick?.(book)}
                className="group relative bg-white rounded-3xl p-4 transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] border border-slate-100 hover:border-slate-200 flex flex-col items-center text-center cursor-pointer"
            >
                {/* Book Cover Container */}
                <div className="relative mb-4 w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:scale-[1.02] transition-transform duration-500">
                    {book.coverImage ? (
                        <img src={book.coverImage} alt={book.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-slate-200 p-4">
                            <BookOpen size={48} className="mb-2 opacity-20" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center line-clamp-2">
                                {book.name}
                            </span>
                        </div>
                    )}
                    {hasReadOption && (
                        <div className="absolute bottom-2 right-2 z-10">
                            <div className="bg-[#045c84] text-white p-1.5 rounded-lg shadow-lg">
                                <BookOpen size={14} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full px-1">
                    <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-[#045c84] transition-colors" title={book.name}>
                        {book.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 line-clamp-1 h-4 uppercase tracking-tighter">
                        {book.author || book.class?.name || ''}
                    </p>
                </div>

                {showMenu && onMenuClick && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-30">
                        <button
                            onClick={(e) => { e.stopPropagation(); onMenuClick(e, book); }}
                            className="p-2 text-slate-400 hover:text-[#045c84] hover:bg-slate-50 rounded-xl shadow-lg bg-white/90 backdrop-blur-sm transition-all border border-slate-100"
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
            className="group relative bg-white rounded-3xl p-3 border border-slate-100 hover:border-slate-200 transition-all duration-300 hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] flex gap-4 cursor-pointer overflow-hidden items-center"
        >
            {/* Left: Compact Cover */}
            <div className="relative w-16 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                {book.coverImage ? (
                    <img src={book.coverImage} alt={book.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <BookOpen size={20} />
                    </div>
                )}
            </div>

            {/* Right: Info */}
            <div className="flex-1 min-w-0 pr-6">
                <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-[#045c84] transition-colors">
                    {book.name}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                    {book.author || 'নির্ধারিত নয়'}
                </p>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-yellow-500">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-black text-slate-600">4.0</span>
                    </div>
                    {book.class?.name && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter">
                            {book.class.name}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions */}
            {showMenu && onMenuClick && (
                <button
                    onClick={(e) => { e.stopPropagation(); onMenuClick(e, book); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-[#045c84] hover:bg-slate-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                    <MoreVertical size={18} />
                </button>
            )}
        </div>
    );
};

export default BookCard;

'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ExternalLink, Download, Maximize2, Minimize2, Bookmark, BookmarkPlus, ChevronLeft, ChevronRight, FileText, Columns2, Trash2, Plus, Loader2 } from 'lucide-react';

interface PdfBookmark {
    label: string;
    page: number;
}

interface PdfReaderModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    title: string;
    bookmarks?: PdfBookmark[];
    onUpdateBookmarks?: (bookmarks: PdfBookmark[]) => void;
}

const PdfReaderModal: React.FC<PdfReaderModalProps> = ({
    isOpen,
    onClose,
    pdfUrl,
    title,
    bookmarks = [],
    onUpdateBookmarks
}) => {
    const [mounted, setMounted] = useState(false);
    const [isFull, setIsFull] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [viewMode, setViewMode] = useState<'single' | 'double'>('single');
    const [newBookmark, setNewBookmark] = useState({ label: '', page: 1 });
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
        if (!isOpen) {
            setIsFull(false);
            setShowSidebar(true);
        } else {
            // Initial URL with params
            setIframeUrl(`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`);
        }
        return () => setMounted(false);
    }, [isOpen, pdfUrl]);

    const handleJumpToPage = (page: number) => {
        const viewParam = viewMode === 'double' ? '&view=FitH&pagemode=thumbs' : '&view=FitH';
        setIframeUrl(`${pdfUrl}#page=${page}${viewParam}`);
    };

    const handleAddBookmark = () => {
        if (!newBookmark.label || newBookmark.page < 1) return;
        const updated = [...bookmarks, newBookmark].sort((a, b) => a.page - b.page);
        onUpdateBookmarks?.(updated);
        setNewBookmark({ label: '', page: 1 });
    };

    const handleRemoveBookmark = (index: number) => {
        const updated = bookmarks.filter((_, i) => i !== index);
        onUpdateBookmarks?.(updated);
    };

    const toggleViewMode = (mode: 'single' | 'double') => {
        setViewMode(mode);
        if (!iframeUrl) return;
        const currentUrl = iframeUrl.split('#')[0];
        const currentParams = iframeUrl.split('#')[1] || '';
        const pageMatch = currentParams.match(/page=(\d+)/);
        const currentPage = pageMatch ? pageMatch[1] : '1';

        const viewParam = mode === 'double' ? '&view=FitH&pagemode=thumbs' : '&view=FitH';
        setIframeUrl(`${currentUrl}#page=${currentPage}${viewParam}`);
    };

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-2 md:p-10">
            {/* Main Container */}
            <div className={`
                bg-white flex flex-col shadow-2xl transition-all duration-300 ease-in-out border border-slate-200 overflow-hidden
                ${isFull ? 'fixed inset-0 z-[100001] rounded-none p-0' : 'w-full max-w-4xl h-[80vh] rounded-none sm:rounded-3xl'}
            `}>
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between shadow-sm shrink-0">
                    <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 shrink-0"
                        >
                            <X size={20} />
                        </button>
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className={`p-2 rounded-lg transition-colors shrink-0 ${showSidebar ? 'bg-[#045c84]/10 text-[#045c84]' : 'hover:bg-slate-100 text-slate-500'}`}
                            title="বুকমার্ক ও সেকশন"
                        >
                            <Bookmark size={20} />
                        </button>
                        <div className="overflow-hidden hidden xs:block">
                            <h2 className="text-sm font-black text-slate-800 tracking-tight truncate">{title}</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">বইটি পড়ছেন (Reading Mode)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {/* View Modes */}
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl mr-2 hidden md:flex">
                            <button
                                onClick={() => toggleViewMode('single')}
                                className={`p-1.5 px-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'single' ? 'bg-white text-[#045c84] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText size={16} />
                                <span>১ পাতা</span>
                            </button>
                            <button
                                onClick={() => toggleViewMode('double')}
                                className={`p-1.5 px-3 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'double' ? 'bg-white text-[#045c84] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Columns2 size={16} />
                                <span>২ পাতা</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setIsFull(!isFull)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-[#045c84] flex items-center gap-2 text-xs font-bold"
                            title={isFull ? "ছোট করুন" : "বড় করুন"}
                        >
                            {isFull ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                            <span className="hidden lg:inline">{isFull ? 'ছোট করুন' : 'বড় করুন'}</span>
                        </button>
                        <button
                            onClick={() => window.open(pdfUrl, '_blank')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600 focus:outline-none"
                            title="নতুন ট্যাবে খুলুন"
                        >
                            <ExternalLink size={18} />
                        </button>
                        <a
                            href={pdfUrl}
                            download
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-emerald-600"
                            title="ডাউনলোড করুন"
                        >
                            <Download size={18} />
                        </a>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className={`
                        bg-slate-50 border-r border-slate-200 transition-all duration-300 overflow-hidden flex flex-col
                        ${showSidebar ? 'w-64 sm:w-72' : 'w-0 border-r-0'}
                    `}>
                        <div className="p-4 border-b border-slate-200 bg-white">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <BookmarkPlus size={14} className="text-[#045c84]" />
                                বুকমার্ক যোগ করুন
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 ml-1">পৃষ্ঠা নম্বর</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white transition-all outline-none"
                                        placeholder="উদা: ১৫"
                                        value={newBookmark.page}
                                        onChange={(e) => setNewBookmark({ ...newBookmark, page: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 ml-1">বুকমার্কের নাম</label>
                                    <input
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white transition-all outline-none"
                                        placeholder="উদা: ২য় অধ্যায়"
                                        value={newBookmark.label}
                                        onChange={(e) => setNewBookmark({ ...newBookmark, label: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={handleAddBookmark}
                                    className="w-full py-2 bg-[#045c84] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-blue-100"
                                >
                                    <Plus size={14} />
                                    বুকমার্ক সেভ করুন
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">আপনার বুকমার্ক সমূহ</h3>

                            {bookmarks.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Bookmark size={18} className="text-slate-300" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400">কোন বুকমার্ক নেই</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {bookmarks.map((bm, i) => (
                                        <div
                                            key={i}
                                            className="group relative flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:border-[#045c84]/30 hover:shadow-lg hover:shadow-blue-900/5 transition-all"
                                            onClick={() => handleJumpToPage(bm.page)}
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-[#045c84]/5 text-[#045c84] flex items-center justify-center text-[11px] font-black shrink-0">
                                                {bm.page}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="text-[11px] font-black text-slate-700 truncate">{bm.label}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">পৃষ্ঠা - {bm.page}</p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveBookmark(i);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all shrink-0"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Viewer */}
                    <div className="flex-1 bg-slate-100 overflow-hidden relative">
                        {iframeUrl ? (
                            <iframe
                                key={iframeUrl}
                                src={iframeUrl}
                                className="w-full h-full border-none"
                                title={title}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Loader2 size={32} className="animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PdfReaderModal;

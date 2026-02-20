'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, CloudUpload, Link as LinkIcon, BookOpen, Trash2, Loader2, ExternalLink, Star, Edit } from 'lucide-react';
import Modal from './Modal'; // Assuming a generic Modal component exists based on the page.tsx usage

interface Book {
    id: string;
    name: string;
    nameBangla?: string | null;
    nameEnglish?: string | null;
    nameArabic?: string | null;
    description?: string | null;
    coverImage?: string | null;
    author?: string | null;
    rating?: number | null;
    pdfUrl?: string | null;
    readLink?: string | null;
    class?: {
        name: string;
    };
}

interface BookDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: Book | null;
    isAdmin?: boolean;
    onUpdate?: () => void;
    onRead?: () => void;
    setToast?: (toast: { message: string, type: 'success' | 'error' } | null) => void;
}

const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
    isOpen,
    onClose,
    book,
    isAdmin = false,
    onUpdate = () => { },
    onRead,
    setToast = () => { }
}) => {
    const [formData, setFormData] = useState<Partial<Book>>({});
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (book) {
            setFormData({ ...book });
            setIsEditing(false); // Reset to view mode when book changes
        }
    }, [book, isOpen]);

    if (!book) return null;

    const handleSave = async () => {
        if (!book.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/books/${book.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setToast({ message: 'বইয়ের তথ্য সফলভাবে আপডেট করা হয়েছে!', type: 'success' });
                onUpdate();
                setIsEditing(false);
            } else {
                setToast({ message: 'তথ্য আপডেট করতে সমস্যা হয়েছে', type: 'error' });
            }
        } catch (error) {
            console.error('Update failed', error);
            setToast({ message: 'সার্ভারে সমস্যা হয়েছে', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'coverImage' | 'pdfUrl') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        setLoading(true);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (data.url) {
                setFormData({ ...formData, [field]: data.url });
            }
        } catch (error) {
            console.error('Upload failed', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setIsEditing(false);
                onClose();
            }}
            title={isEditing ? "বইয়ের তথ্য পরিবর্তন করুন" : "বইয়ের বিস্তারিত"}
            maxWidth="max-w-2xl"
        >
            <div className="flex flex-col md:flex-row h-full">
                {/* Left: Book Cover & Quick Info */}
                <div className="w-full md:w-1/3 p-6 bg-slate-50/50 border-r border-slate-100 flex flex-col items-center">
                    <div className="relative w-40 h-56 rounded-2xl overflow-hidden shadow-2xl border border-white group/cover mb-4">
                        {formData.coverImage ? (
                            <img src={formData.coverImage} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                <BookOpen size={48} />
                            </div>
                        )}
                        {isAdmin && isEditing && (
                            <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer text-white">
                                <CloudUpload size={24} className="mb-1" />
                                <span className="text-[10px] font-bold">কভার পরিবর্তন</span>
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'coverImage')} />
                            </label>
                        )}
                    </div>

                    <div className="text-center w-full">
                        <h2 className="text-xl font-black text-slate-800 line-clamp-2 mb-1">{formData.name}</h2>
                        <p className="text-sm font-bold text-[#045c84] mb-2">{formData.author || 'নির্ধারিত নয়'}</p>
                        <div className="flex items-center justify-center gap-1 text-yellow-500 mb-4">
                            <Star size={16} fill="currentColor" />
                            <span className="font-black text-slate-800">{formData.rating?.toFixed(1) || '4.0'}</span>
                        </div>
                    </div>

                    {!isEditing && (formData.pdfUrl || formData.readLink) && (
                        <button
                            onClick={() => {
                                if (onRead) {
                                    onRead();
                                } else {
                                    window.open(formData.pdfUrl || formData.readLink || '', '_blank');
                                }
                            }}
                            className="w-full py-3 bg-[#045c84] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:scale-105 transition-all mb-4"
                        >
                            <BookOpen size={18} />
                            <span>বইটি পড়ুন</span>
                        </button>
                    )}

                    {isAdmin && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all border-dashed"
                        >
                            <Edit size={18} className="text-[#045c84]" />
                            <span>এডিট করুন</span>
                        </button>
                    )}
                </div>

                {/* Right: Detailed Fields */}
                <div className="flex-1 p-6 md:p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Dynamic View/Edit render helper */}
                        {(() => {
                            const renderField = (label: string, field: keyof Book, value: string | null | undefined, placeholder: string = 'নির্ধারিত নয়') => (
                                <div className="space-y-0.5">
                                    <label className="text-[11px] font-black text-slate-400 ml-1">{label}</label>
                                    {isEditing ? (
                                        <input
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/5 transition-all outline-none font-bold text-slate-800"
                                            value={(formData as any)[field] || ''}
                                            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                            placeholder={placeholder}
                                        />
                                    ) : (
                                        <div className="text-sm font-black text-slate-700 ml-1">
                                            {value || placeholder}
                                        </div>
                                    )}
                                </div>
                            );

                            return (
                                <>
                                    <div className="space-y-4">
                                        {renderField('বইয়ের নাম', 'name', formData.name)}
                                        {renderField('লেখক/ক্যাটাগরি', 'author', formData.author)}
                                    </div>

                                    {isEditing && (
                                        <div className="space-y-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100 italic">
                                            <h3 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] border-b border-emerald-50 pb-2 mb-2">অনুবাদ (Multilingual)</h3>
                                            <div className="space-y-4">
                                                {renderField('বইয়ের নাম (বাংলা)', 'nameBangla', formData.nameBangla, 'বাংলা নাম দিন')}
                                                {renderField('বইয়ের নাম (English)', 'nameEnglish', formData.nameEnglish, 'English Name')}
                                                {renderField('বইয়ের নাম (Arabic)', 'nameArabic', formData.nameArabic, 'Arabic Name')}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1 pt-2">
                                        <label className="text-[11px] font-black text-slate-400 ml-1">বিবরণ</label>
                                        {isEditing ? (
                                            <textarea
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/5 transition-all outline-none font-medium min-h-[100px] resize-none text-slate-800"
                                                value={formData.description || ''}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="বই সম্পর্কে কিছু লিখুন..."
                                            />
                                        ) : (
                                            <div className="px-1 py-1 font-medium text-slate-600 text-sm leading-relaxed">
                                                {formData.description || 'বিবরণ দেওয়া হয়নি।'}
                                            </div>
                                        )}
                                    </div>

                                    {isEditing && (
                                        <div className="space-y-4 p-4 bg-blue-50/30 rounded-2xl border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BookOpen size={16} className="text-[#045c84]" />
                                                <h3 className="text-xs font-black text-[#045c84] uppercase tracking-widest">পড়ার মাধ্যম (Resources)</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <label className="text-[10px] font-bold text-slate-500 ml-1">PDF ফাইল লিঙ্ক</label>
                                                        <input
                                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                                            value={formData.pdfUrl || ''}
                                                            onChange={(e) => setFormData({ ...formData, pdfUrl: e.target.value })}
                                                            placeholder="https://..."
                                                        />
                                                    </div>
                                                    <label className="mt-5 p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-all">
                                                        <CloudUpload size={18} className="text-slate-500" />
                                                        <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'pdfUrl')} />
                                                    </label>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-slate-500 ml-1">এক্সটার্নাল লিঙ্ক</label>
                                                    <input
                                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                                        value={formData.readLink || ''}
                                                        onChange={(e) => setFormData({ ...formData, readLink: e.target.value })}
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {isEditing && (
                        <div className="pt-4 flex items-center gap-3 border-t border-slate-100">
                            <button
                                disabled={loading}
                                onClick={handleSave}
                                className="flex-1 py-3 bg-[#045c84] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-[#034a6b] transition-all disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                <span>সেভ করুন</span>
                            </button>
                            <button
                                onClick={() => {
                                    setFormData({ ...book });
                                    setIsEditing(false);
                                }}
                                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            >
                                বাতিল
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default BookDetailsModal;

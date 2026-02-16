'use client';

import React from 'react';
import {
    X, Phone, Mail, MessageCircle, Copy, Check,
    User, BookOpen, Fingerprint, Hash, Trash2,
    ShieldCheck, Calendar
} from 'lucide-react';
import Modal from './Modal';

interface GuardianDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    guardian: any;
    allStudents: any[];
    classes: any[];
    onDelete?: (id: string, name: string) => void;
    onDeleteConfirm?: () => Promise<void>;
    onRefresh?: () => void;
}

export default function GuardianDetailsModal({
    isOpen,
    onClose,
    guardian,
    allStudents,
    classes,
    onDelete,
    onDeleteConfirm,
    onRefresh
}: GuardianDetailsModalProps) {
    const [copiedField, setCopiedField] = React.useState<string | null>(null);
    const [isLinking, setIsLinking] = React.useState(false);
    const [studentSearch, setStudentSearch] = React.useState('');
    const [selectedClassId, setSelectedClassId] = React.useState('all');
    const [linkingLoading, setLinkingLoading] = React.useState(false);
    const [linkRelationship, setLinkRelationship] = React.useState('বাবা');
    const [confirmUnlink, setConfirmUnlink] = React.useState<{ show: boolean, studentId: string, studentName: string } | null>(null);
    const [confirmDeleteGuardian, setConfirmDeleteGuardian] = React.useState(false);

    if (!guardian) return null;

    const name = guardian.name || 'অভিভাবক';
    const phone = guardian.phone;
    const email = guardian.email;

    // Find all linked students
    const childIds = guardian.metadata?.childrenIds || (guardian.metadata?.studentId ? [guardian.metadata.studentId] : []);
    const linkedStudents = allStudents.filter(s => childIds.includes(s.id));

    const handleCopy = (text: string, field: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCall = () => {
        if (phone) window.open(`tel:${phone}`, '_self');
    };

    const handleWhatsApp = () => {
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
    };

    const handleLinkStudent = async (studentId: string) => {
        setLinkingLoading(true);
        try {
            const res = await fetch('/api/admin/guardians/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guardianId: guardian.id,
                    studentId,
                    relationship: linkRelationship
                }),
            });

            if (res.ok) {
                onRefresh?.();
                setIsLinking(false);
                setStudentSearch('');
            }
        } catch (error) {
            console.error('Link student error:', error);
        } finally {
            setLinkingLoading(false);
        }
    };

    const handleUnlinkStudent = (studentId: string, studentName: string) => {
        setConfirmUnlink({ show: true, studentId, studentName });
    };

    const confirmUnlinkStudent = async () => {
        if (!confirmUnlink) return;

        try {
            const res = await fetch(`/api/admin/guardians/link?guardianId=${guardian.id}&studentId=${confirmUnlink.studentId}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setConfirmUnlink(null);
                onRefresh?.();
            }
        } catch (error) {
            console.error('Unlink student error:', error);
        }
    };

    const filteredSearchStudents = allStudents.filter(s => {
        if (childIds.includes(s.id)) return false; // Hide already linked

        const matchesSearch = studentSearch === '' ||
            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.metadata?.studentId?.toLowerCase().includes(studentSearch.toLowerCase()) ||
            s.metadata?.rollNumber?.includes(studentSearch);

        const matchesClass = selectedClassId === 'all' || s.metadata?.classId === selectedClassId;

        return matchesSearch && matchesClass;
    });

    const initials = name[0]?.toUpperCase() || 'G';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="অভিভাবকের বিস্তারিত তথ্য"
            maxWidth="max-w-md"
        >
            <div className={`p-6 space-y-8 ${isLinking ? 'hidden' : 'block'}`}>
                {/* Profile Header */}
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-[#045c84] via-[#067ab8] to-[#045c84] text-white flex items-center justify-center text-4xl font-black shadow-xl shadow-blue-900/20 ring-4 ring-white">
                        {initials}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">{name}</h3>
                        <div className="inline-flex items-center px-3 py-1 bg-blue-50 text-[#045c84] text-xs font-bold rounded-full border border-blue-100 mt-2 uppercase tracking-wider">
                            অভিভাবক
                        </div>
                    </div>
                </div>

                {/* Contact Actions Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleCall}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-[#045c84] text-white rounded-2xl font-bold hover:bg-[#034a6b] transition-all active:scale-95 shadow-lg shadow-blue-900/10"
                    >
                        <Phone size={18} fill="currentColor" />
                        <span>কল করুন</span>
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-900/10"
                    >
                        <MessageCircle size={18} fill="currentColor" />
                        <span>হোয়াটসঅ্যাপ</span>
                    </button>
                </div>

                {/* Contact Info List */}
                <div className="space-y-3">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group transition-all hover:bg-white hover:border-blue-200">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white text-[#045c84] flex items-center justify-center shadow-sm">
                                <Phone size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">ফোন নম্বর</p>
                                <p className="text-sm font-black text-slate-700 font-sans">{phone || 'N/A'}</p>
                            </div>
                        </div>
                        {phone && (
                            <button
                                onClick={() => handleCopy(phone, 'phone')}
                                className="p-2 text-slate-400 hover:text-[#045c84] transition-colors"
                            >
                                {copiedField === 'phone' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                            </button>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group transition-all hover:bg-white hover:border-blue-200">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white text-blue-500 flex items-center justify-center shadow-sm">
                                <Mail size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">ইমেইল</p>
                                <p className="text-sm font-black text-slate-700 font-sans truncate">{email || 'N/A'}</p>
                            </div>
                        </div>
                        {email && (
                            <button
                                onClick={() => handleCopy(email, 'email')}
                                className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                            >
                                {copiedField === 'email' ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                            </button>
                        )}
                    </div>
                </div>

                {/* Linked Students List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pr-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">সংযুক্ত শিক্ষার্থী ({linkedStudents.length})</label>
                        <button
                            onClick={() => setIsLinking(true)}
                            className="text-[10px] font-bold text-[#045c84] flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg hover:bg-[#045c84] hover:text-white transition-all shadow-sm border border-blue-100/50"
                        >
                            <BookOpen size={12} />
                            নতুন শিক্ষার্থী
                        </button>
                    </div>

                    {linkedStudents.length > 0 ? (
                        <div className="space-y-3">
                            {linkedStudents.map(student => (
                                <div key={student.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-3xl relative overflow-hidden group">
                                    <button
                                        onClick={() => handleUnlinkStudent(student.id, student.name)}
                                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-red-100/50"
                                        title="সরান"
                                    >
                                        <X size={14} />
                                    </button>
                                    <div className="relative flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-white text-[#045c84] flex items-center justify-center text-lg font-black shadow-sm ring-2 ring-white shrink-0">
                                            {student.name?.[0] || 'S'}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-base font-black text-slate-800 truncate">{student.name}</h4>
                                                <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 bg-blue-50 text-[#045c84] rounded-md border border-blue-100/50">
                                                    {student.metadata?.guardianRelation || 'অন্যান্য'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 text-slate-400">
                                                <div className="flex items-center gap-1 text-[10px] font-bold">
                                                    <BookOpen size={10} />
                                                    <span>{student.metadata?.className || classes.find(c => c.id === student.metadata?.classId)?.name || 'N/A'}</span>
                                                </div>
                                                <span className="text-[10px] font-bold opacity-60">ID: {student.metadata?.studentId || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="shrink-0">
                                            <ShieldCheck className="text-emerald-500" size={20} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                            <p className="text-xs font-bold text-slate-400 italic">কোনো শিক্ষার্থী সংযুক্ত নেই</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 flex flex-col gap-3">
                    {onDelete && (
                        <button
                            onClick={() => setConfirmDeleteGuardian(true)}
                            className="w-full flex items-center justify-center gap-2 p-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100 group"
                        >
                            <Trash2 size={18} className="group-hover:shake" />
                            <span>অভিভাবক মুছে ফেলুন</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Linking Interface */}
            <div className={`p-6 space-y-6 ${isLinking ? 'block' : 'hidden'} animate-in slide-in-from-right duration-300`}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsLinking(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                    <h3 className="text-lg font-black text-slate-800">নতুন শিক্ষার্থী যুক্ত করুন</h3>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#045c84]/10 text-slate-800 placeholder:text-slate-400"
                                placeholder="ছাত্র খুঁজুন..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#045c84]/10 text-slate-700"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            <option value="all">সকল ক্লাস</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">ছাত্রের সাথে সম্পর্ক</label>
                        <div className="flex flex-wrap gap-2">
                            {['বাবা', 'মা', 'ভাই', 'বোন', 'চাচা', 'খালা', 'অন্যান্য'].map(rel => (
                                <button
                                    key={rel}
                                    type="button"
                                    onClick={() => setLinkRelationship(rel)}
                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${linkRelationship === rel
                                        ? 'bg-[#045c84] border-[#045c84] text-white'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'
                                        }`}
                                >
                                    {rel}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto scrollbar-hide space-y-2 pt-2">
                        {filteredSearchStudents.length > 0 ? (
                            filteredSearchStudents.map(s => (
                                <button
                                    key={s.id}
                                    disabled={linkingLoading}
                                    onClick={() => handleLinkStudent(s.id)}
                                    className="w-full flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl hover:border-[#045c84] hover:shadow-md transition-all group disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-[#045c84] flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-blue-50">
                                            {s.name?.[0] || 'S'}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-slate-700">{s.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400">ID: {s.metadata?.studentId} | Roll: {s.metadata?.rollNumber}</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#045c84] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Check size={16} />
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-10 text-center text-xs text-slate-400 italic">
                                কোনো শিক্ষার্থী পাওয়া যায়নি
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Confirmation Modal for Guardian Deletion */}
            {confirmDeleteGuardian && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">অভিভাবক মুছে ফেলুন?</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    আপনি কি নিশ্চিত যে আপনি <span className="font-bold text-slate-800">"{name}"</span> কে মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
                                </p>
                            </div>
                            <div className="flex gap-3 w-full pt-2">
                                <button
                                    onClick={() => setConfirmDeleteGuardian(false)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    বাতিল
                                </button>
                                <button
                                    onClick={() => {
                                        setConfirmDeleteGuardian(false);
                                        onDelete?.(guardian.id, name);
                                    }}
                                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                                >
                                    মুছে ফেলুন
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal for Unlinking */}
            {confirmUnlink?.show && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                                <X size={32} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">শিক্ষার্থী সরান?</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    আপনি কি নিশ্চিত যে আপনি <span className="font-bold text-slate-800">"{confirmUnlink.studentName}"</span> কে এই অভিভাবক থেকে সরাতে চান?
                                </p>
                            </div>
                            <div className="flex gap-3 w-full pt-2">
                                <button
                                    onClick={() => setConfirmUnlink(null)}
                                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    বাতিল
                                </button>
                                <button
                                    onClick={confirmUnlinkStudent}
                                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                                >
                                    সরান
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

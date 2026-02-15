'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Save, CloudUpload, CheckCircle2, Building2 } from 'lucide-react';
import { FieldDefinition } from '@/components/FieldLibrary';
import Toast from '@/components/Toast';

export default function PublicAdmissionPage() {
    const params = useParams();
    const instituteId = params.instituteId as string;

    const [loading, setLoading] = useState(true);
    const [institute, setInstitute] = useState<any>(null);
    const [formConfig, setFormConfig] = useState<FieldDefinition[]>([]);
    const [formData, setFormData] = useState<any>({
        name: '',
        phone: '',
        email: '',
        metadata: {}
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [classes, setClasses] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!instituteId) return;
            try {
                // 1. Fetch Institute Details (Using existing public/admin API or simple fetch if we had one. 
                // Since there's no public institute details API usually, we might need to rely on what we can get or generic error.
                // For now, let's assume valid ID and just fetch form config which is what we need mostly.
                // Ideally we should have `GET /api/public/institute/${id}`.
                // Let's try to fetch form config first.

                const configRes = await fetch(`/api/admin/institutes/form-config?instituteId=${instituteId}`);
                if (configRes.ok) {
                    const configData = await configRes.json();
                    setFormConfig(Array.isArray(configData) ? configData : []);
                }

                // Fetch Classes for dropdowns
                const classesRes = await fetch(`/api/admin/classes?instituteId=${instituteId}`);
                if (classesRes.ok) {
                    const classesData = await classesRes.json();
                    setClasses(Array.isArray(classesData) ? classesData : []);
                }

                // We might want to fetch institute name for header. 
                // If we don't have a dedicated public endpoint, we can display a generic header or try to fetch from somewhere else.
                // For now, let's just show "Admission Form".

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [instituteId]);

    const fetchGroups = async (classId: string) => {
        try {
            const res = await fetch(`/api/admin/groups?classId=${classId}`);
            const data = await res.json();
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Fetch groups error:', error);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        try {
            // Check if upload API is public... usually standard upload APIs are protected in many systems.
            // If it fails, we might need a public upload endpoint.
            // Assuming /api/upload works for now (auth check might be loose or we need to fix it).
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (data.url) {
                setFormData({
                    ...formData,
                    metadata: { ...formData.metadata, [fieldId]: data.url }
                });
            }
        } catch (error) {
            console.error('Upload failed', error);
            setToast({ message: 'ফাইল আপলোড ব্যর্থ হয়েছে।', type: 'error' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            const res = await fetch('/api/public/admission', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    instituteId
                })
            });

            const data = await res.json();

            if (res.ok) {
                setSubmitted(true);
            } else {
                setToast({ message: data.message || 'আবেদন ব্যর্থ হয়েছে।', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'সার্ভার এরর।', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bengali">
                <Loader2 className="animate-spin text-[#045c84]" size={40} />
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-bengali">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 mb-2">আবেদন সফল হয়েছে!</h1>
                        <p className="text-slate-500">আপনার ভর্তি আবেদনটি সফলভাবে জমা দেওয়া হয়েছে। প্রতিষ্ঠান কর্তৃপক্ষ শীঘ্রই আপনার সাথে যোগাযোগ করবে।</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-left space-y-2">
                        <p className="text-xs font-bold text-blue-800 uppercase">লগইন তথ্য</p>
                        <p className="text-sm text-slate-700">ব্যবহারকারী আইডি (মোবাইল): <span className="font-bold">{formData.phone || formData.metadata.phone}</span></p>
                        <p className="text-sm text-slate-700">পাসওয়ার্ড: <span className="font-bold">{formData.phone || formData.metadata.phone}</span></p>
                    </div>
                    <p className="text-xs text-slate-400">এই তথ্যটি সংরক্ষণ করে রাখুন।</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 font-bengali">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-[#045c84] mb-4">
                        <Building2 size={32} />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">ভর্তি ফর্ম</h1>
                    <p className="text-slate-500 font-medium">নিচের ফর্মটি সঠিকভাবে পূরণ করে জমা দিন।</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="h-2 bg-[#045c84] w-full" />
                    <form onSubmit={handleSubmit} className="p-6 md:p-10 space-y-8">

                        {/* Basic Fields */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">মৌলিক তথ্য</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">পুরো নাম <span className="text-red-500">*</span></label>
                                    <input
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                        placeholder="আপনার নাম"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">মোবাইল নম্বর (লগইন আইডি) <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                        placeholder="017xxxxxxxx"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">ইমেইল (অপশনাল)</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                        placeholder="example@mail.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Fields */}
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">বিস্তারিত তথ্য</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {formConfig.map((field) => (
                                    <div key={field.id} className={`space-y-2 ${field.type === 'attachment' ? 'md:col-span-2' : ''}`}>
                                        {field.id === 'guardianName' && (
                                            <div className="flex gap-2 mb-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formData.metadata.fathersName && formData.metadata.fathersPhone) {
                                                            setFormData({
                                                                ...formData,
                                                                metadata: {
                                                                    ...formData.metadata,
                                                                    guardianName: formData.metadata.fathersName,
                                                                    guardianPhone: formData.metadata.fathersPhone,
                                                                    guardianRelation: 'বাবা'
                                                                }
                                                            });
                                                        } else {
                                                            setToast({ message: 'পিতার তথ্য আগে পূরণ করুন।', type: 'error' });
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                                                >
                                                    অভিভাবক হিসেবে পিতা
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formData.metadata.mothersName && formData.metadata.mothersPhone) {
                                                            setFormData({
                                                                ...formData,
                                                                metadata: {
                                                                    ...formData.metadata,
                                                                    guardianName: formData.metadata.mothersName,
                                                                    guardianPhone: formData.metadata.mothersPhone,
                                                                    guardianRelation: 'মা'
                                                                }
                                                            });
                                                        } else {
                                                            setToast({ message: 'মাতার তথ্য আগে পূরণ করুন।', type: 'error' });
                                                        }
                                                    }}
                                                    className="px-3 py-1 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold hover:bg-pink-100 transition-colors"
                                                >
                                                    অভিভাবক হিসেবে মাতা
                                                </button>
                                            </div>
                                        )}
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>

                                        {field.type === 'select' ? (
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black appearance-none"
                                                    value={formData.metadata[field.id] || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        metadata: { ...formData.metadata, [field.id]: e.target.value }
                                                    })}
                                                    required={field.required}
                                                >
                                                    <option value="">নির্বাচন করুন</option>
                                                    {field.options?.map(opt => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : field.type === 'attachment' ? (
                                            <div className="relative">
                                                <div className={`w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-between transition-all ${formData.metadata[field.id] ? 'border-green-200 bg-green-50/30' : 'hover:border-[#045c84]'}`}>
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <CloudUpload className={formData.metadata[field.id] ? 'text-green-500' : 'text-slate-400'} size={20} />
                                                        <span className="text-sm font-medium text-slate-600 truncate">
                                                            {formData.metadata[field.id] ? 'ফাইল আপলোড হয়েছে' : 'ফাইল নির্বাচন করুন'}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="file"
                                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                                        onChange={(e) => handleFileUpload(e, field.id)}
                                                        required={field.required && !formData.metadata[field.id]}
                                                    />
                                                    {formData.metadata[field.id] && (
                                                        <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                                            <Save size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : field.type === 'class-lookup' ? (
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black appearance-none"
                                                    value={formData.metadata[field.id] || ''}
                                                    onChange={(e) => {
                                                        const classId = e.target.value;
                                                        setFormData({
                                                            ...formData,
                                                            metadata: { ...formData.metadata, [field.id]: classId, groupId: '' }
                                                        });
                                                        if (classId) fetchGroups(classId);
                                                        else setGroups([]);
                                                    }}
                                                    required={field.required}
                                                >
                                                    <option value="">শ্রেণী নির্বাচন করুন</option>
                                                    {classes.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : field.type === 'group-lookup' ? (
                                            <div className="relative">
                                                <select
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black appearance-none"
                                                    value={formData.metadata[field.id] || ''}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        metadata: { ...formData.metadata, [field.id]: e.target.value }
                                                    })}
                                                    required={field.required}
                                                    disabled={!formData.metadata.classId}
                                                >
                                                    <option value="">গ্রুপ নির্বাচন করুন</option>
                                                    {groups.map(g => (
                                                        <option key={g.id} value={g.id}>{g.name}</option>
                                                    ))}
                                                </select>
                                                {!formData.metadata.classId && (
                                                    <p className="text-[10px] text-amber-600 font-bold mt-1">প্রথমে শ্রেণী নির্বাচন করুন</p>
                                                )}
                                            </div>
                                        ) : (
                                            <input
                                                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none font-medium text-black"
                                                placeholder={field.placeholder || `${field.label}`}
                                                value={formData.metadata[field.id] || ''}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    metadata: { ...formData.metadata, [field.id]: e.target.value }
                                                })}
                                                required={field.required}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full md:w-auto px-8 py-4 bg-[#045c84] hover:bg-[#034d6e] text-white font-black rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {actionLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                <span>জমা দিন</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

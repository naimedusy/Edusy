'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Save, CloudUpload, CheckCircle2, Building2, Printer } from 'lucide-react';
import { FieldDefinition } from '@/components/FieldLibrary';
import Toast from '@/components/Toast';
import PrintLayout from '@/components/PrintLayout';

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
    const [isPrinting, setIsPrinting] = useState(false);
    const [printMode, setPrintMode] = useState<'receipt' | 'form'>('receipt');
    const [draftStatus, setDraftStatus] = useState<'saved' | 'saving' | 'recovered' | null>(null);

    const draftKey = `edusy_admission_draft_${instituteId}`;

    useEffect(() => {
        const fetchData = async () => {
            if (!instituteId) return;
            try {
                // Fetch Institute Summary (Public API)
                const summaryRes = await fetch(`/api/public/institute/${instituteId}/summary`);
                if (summaryRes.ok) {
                    const summaryData = await summaryRes.json();
                    setInstitute(summaryData);
                }

                // Fetch Form Config
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

            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Load Draft from LocalStorage
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setFormData(parsed);
                setDraftStatus('recovered');
                setTimeout(() => setDraftStatus(null), 3000);
            } catch (e) {
                console.error("Draft recovery error", e);
            }
        }
    }, [instituteId]);

    // Auto-save logic
    useEffect(() => {
        if (!instituteId || submitted) return;

        const timer = setTimeout(() => {
            setDraftStatus('saving');
            localStorage.setItem(draftKey, JSON.stringify(formData));
            setTimeout(() => setDraftStatus('saved'), 500);
            setTimeout(() => setDraftStatus(null), 2500);
        }, 1000);

        return () => clearTimeout(timer);
    }, [formData, instituteId, submitted]);

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
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: uploadData
            });
            const data = await res.json();
            if (data.url) {
                setFormData((prev: any) => ({
                    ...prev,
                    metadata: { ...prev.metadata, [fieldId]: data.url }
                }));
            }
        } catch (error) {
            console.error('Upload failed', error);
            setToast({ message: 'ফাইল আপলোড ব্যর্থ হয়েছে।', type: 'error' });
        }
    };

    const handleAutoGenerate = async (fieldId: string, providedClassId?: string, force = false) => {
        if (!instituteId) return;

        // Suggest if empty or forced
        const currentValue = formData.metadata?.[fieldId];
        if (currentValue && !force) return;

        try {
            const classId = providedClassId || formData.metadata?.classId || '';
            const res = await fetch(`/api/admin/students/next-ids?instituteId=${instituteId}&classId=${classId}`);
            const data = await res.json();

            if (fieldId === 'studentId') {
                setFormData((prev: any) => ({
                    ...prev,
                    metadata: { ...prev.metadata, studentId: data.nextStudentId }
                }));
            } else if (fieldId === 'rollNumber') {
                if (!classId) return;
                setFormData((prev: any) => ({
                    ...prev,
                    metadata: { ...prev.metadata, rollNumber: data.nextRollNumber }
                }));
            }
        } catch (error) {
            console.error('Auto generate failed', error);
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
                localStorage.removeItem(draftKey);
            } else {
                setToast({ message: data.message || 'আবেদন ব্যর্থ হয়েছে।', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'সার্ভার এরর।', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handlePrint = (mode: 'receipt' | 'form' = 'receipt') => {
        setPrintMode(mode);
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 500);
    };

    const handleReapply = () => {
        setSubmitted(false);
        setFormData({
            name: '',
            phone: '',
            email: '',
            metadata: {}
        });
        localStorage.removeItem(draftKey);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-bengali">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
                        <CheckCircle2 size={40} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 mb-2">আবেদন সফল হয়েছে!</h1>
                        <p className="text-slate-500">আপনার ভর্তি আবেদনটি সফলভাবে জমা দেওয়া হয়েছে এবং বর্তমানে <b>পেন্ডিং (Pending)</b> অবস্থায় আছে। প্রতিষ্ঠান কর্তৃপক্ষ শীঘ্রই আপনার সাথে যোগাযোগ করবে।</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-left space-y-2">
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">লগইন তথ্য (যেকোন সময় চেক করার জন্য)</p>
                        <p className="text-sm text-slate-700 font-bold">আইডি: <span className="bg-white px-2 py-0.5 rounded border border-blue-200">{formData.phone}</span></p>
                        <p className="text-sm text-slate-700 font-bold">পাসওয়ার্ড: <span className="bg-white px-2 py-0.5 rounded border border-blue-200">{formData.phone}</span></p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handlePrint('receipt')}
                                className="flex items-center justify-center gap-2 px-6 py-4 bg-[#045c84] text-white font-black rounded-2xl shadow-lg shadow-blue-100 hover:bg-[#034d6e] transition-all active:scale-95 text-xs"
                            >
                                <Printer size={16} />
                                <span>রশিদ প্রিন্ট</span>
                            </button>
                            <button
                                onClick={() => handlePrint('form')}
                                className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-50 text-[#045c84] border border-blue-100 font-black rounded-2xl hover:bg-blue-100 transition-all active:scale-95 text-xs"
                            >
                                <Printer size={16} />
                                <span>ফর্ম প্রিন্ট</span>
                            </button>
                        </div>
                        <button
                            onClick={handleReapply}
                            className="w-full px-6 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                        >
                            পূনরায় আবেদন করুন
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">রশিদ বা ফর্মটি প্রিন্ট করে অথবা স্ক্রিনশট নিয়ে সংরক্ষণ করুন।</p>
                </div>

                {/* Formal Receipt for Print */}
                {isPrinting && (
                    <div className="hidden">
                        <PrintLayout title={printMode === 'receipt' ? "ভর্তি আবেদন রশিদ (Admission Receipt)" : "ভর্তি আবেদন ফর্ম (Admission Application)"} institute={institute}>
                            {printMode === 'receipt' ? (
                                <div className="space-y-10">
                                    <div className="p-8 border-2 border-slate-100 rounded-3xl space-y-8 bg-slate-50/30">
                                        <div className="grid grid-cols-2 gap-12">
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">নাম (Name)</p>
                                                    <p className="text-2xl font-black text-slate-900">{formData.name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">মোবাইল (Mobile)</p>
                                                    <p className="text-xl font-bold text-slate-700">{formData.phone}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">আবেদন আইডি (App ID)</p>
                                                    <p className="text-xl font-bold text-slate-700">ADM-{Date.now().toString().slice(-6)}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">লগইন পাসওয়ার্ড</p>
                                                    <p className="text-xl font-bold text-[#045c84]">{formData.phone}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-black text-slate-800 border-b-2 border-slate-800 pb-2 uppercase tracking-wide">আবেদনের বিবরণ (Application Details)</h3>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="flex justify-between border-b border-slate-100 py-2">
                                                <span className="text-slate-500 font-bold">আবেদনকৃত শ্রেণী:</span>
                                                <span className="text-slate-900 font-black">{classes.find(c => c.id === formData.metadata.classId)?.name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-100 py-2">
                                                <span className="text-slate-500 font-bold">আবেদনকৃত গ্রুপ:</span>
                                                <span className="text-slate-900 font-black">{groups.find(g => g.id === formData.metadata.groupId)?.name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-100 py-2">
                                                <span className="text-slate-500 font-bold">পিতার নাম:</span>
                                                <span className="text-slate-900 font-black">{formData.metadata.fathersName || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-slate-100 py-2">
                                                <span className="text-slate-500 font-bold">মাতার নাম:</span>
                                                <span className="text-slate-900 font-black">{formData.metadata.mothersName || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
                                        <p className="text-xs text-blue-800 font-bold leading-relaxed">
                                            প্রতিষ্ঠানে ভর্তির সময় এই রশিদের একটি কপি এবং প্রয়োজনীয় কাগজপত্র (জন্ম নিবন্ধন, ছবি ইত্যাদি) সাথে নিয়ে আসার জন্য বলা হলো।
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">নাম (Full Name)</p>
                                                <p className="text-lg font-black text-slate-900">{formData.name}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">মোবাইল (Mobile)</p>
                                                <p className="text-lg font-bold text-slate-800">{formData.phone}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ইমেইল (Email)</p>
                                                <p className="text-lg font-bold text-slate-800">{formData.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className="w-32 h-40 border-2 border-slate-200 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden">
                                                {formData.metadata.studentPhoto ? (
                                                    <img src={formData.metadata.studentPhoto} alt="Student" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-300 text-center px-4 uppercase">Passport Size Photo</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-sm font-black text-slate-800 border-b-2 border-slate-800 pb-1 uppercase tracking-widest">বিস্তারিত তথ্য (Detailed Information)</h3>
                                        <div className="grid grid-cols-2 gap-y-4 gap-x-10">
                                            {formConfig
                                                .filter(f => !['name', 'email', 'password', 'studentPhoto'].includes(f.id))
                                                .map(field => {
                                                    let value = formData.metadata[field.id];
                                                    if (field.type === 'class-lookup') {
                                                        value = classes.find(c => c.id === value)?.name;
                                                    } else if (field.type === 'group-lookup') {
                                                        value = groups.find(g => g.id === value)?.name;
                                                    }

                                                    return (
                                                        <div key={field.id} className="border-b border-slate-100 pb-1 flex justify-between gap-4">
                                                            <span className="text-[11px] font-bold text-slate-500 uppercase">{field.label}:</span>
                                                            <span className="text-[11px] font-black text-slate-900 text-right">{value || '-'}</span>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>

                                    <div className="pt-20 flex justify-between items-end">
                                        <div className="text-center space-y-2">
                                            <div className="w-40 border-t border-slate-900 pt-1">
                                                <p className="text-[10px] font-bold text-slate-900">অভিভাবকের স্বাক্ষর</p>
                                            </div>
                                        </div>
                                        <div className="text-center space-y-2">
                                            <div className="w-40 border-t border-slate-900 pt-1">
                                                <p className="text-[10px] font-bold text-slate-900">অধ্যক্ষের স্বাক্ষর</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </PrintLayout>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-10 px-4 font-bengali">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="text-center space-y-6">
                    <div className="relative inline-block">
                        <div className="w-28 h-28 bg-white rounded-[2rem] shadow-xl flex items-center justify-center mx-auto text-[#045c84] overflow-hidden border-4 border-white ring-8 ring-slate-100/50">
                            {institute?.logo ? (
                                <img src={institute.logo} alt={institute.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 size={48} className="opacity-20" />
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                            {institute?.name || 'ভর্তি ফর্ম'}
                        </h1>
                        {institute?.address && (
                            <p className="text-slate-500 font-medium max-w-xl mx-auto leading-relaxed text-lg">
                                {institute.address}
                            </p>
                        )}
                    </div>

                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#045c84] text-white rounded-full text-sm font-bold uppercase tracking-widest shadow-lg shadow-blue-100 italic relative">
                        <span className="w-2 h-2 bg-blue-300 rounded-full animate-pulse" />
                        ভর্তি আবেদনপত্র

                        {draftStatus && (
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-white border border-blue-100 text-[#045c84] text-[10px] font-black rounded-xl shadow-sm animate-fade-in whitespace-nowrap not-italic">
                                {draftStatus === 'saving' && <Loader2 size={12} className="animate-spin" />}
                                {draftStatus === 'saved' && <Save size={12} />}
                                {draftStatus === 'recovered' && <CheckCircle2 size={12} />}
                                <span>
                                    {draftStatus === 'saving' && 'ড্রাফট সেভ হচ্ছে...'}
                                    {draftStatus === 'saved' && 'ড্রাফট সেভ হয়েছে'}
                                    {draftStatus === 'recovered' && 'আগের ড্রাফট লোড হয়েছে'}
                                </span>
                            </div>
                        )}
                    </div>
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
                                    <div key={field.id} className={`space-y-2 group/field ${field.type === 'attachment' ? 'md:col-span-2' : ''}`}>
                                        {field.id === 'guardianName' && (
                                            <div className="flex gap-2 mb-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (formData.metadata.fathersName || formData.metadata.fathersPhone) {
                                                            setFormData({
                                                                ...formData,
                                                                metadata: {
                                                                    ...formData.metadata,
                                                                    guardianName: formData.metadata.fathersName || formData.metadata.guardianName,
                                                                    guardianPhone: formData.metadata.fathersPhone || formData.metadata.guardianPhone,
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
                                                        if (formData.metadata.mothersName || formData.metadata.mothersPhone) {
                                                            setFormData({
                                                                ...formData,
                                                                metadata: {
                                                                    ...formData.metadata,
                                                                    guardianName: formData.metadata.mothersName || formData.metadata.guardianName,
                                                                    guardianPhone: formData.metadata.mothersPhone || formData.metadata.guardianPhone,
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
                                                        if (classId) {
                                                            fetchGroups(classId);
                                                            handleAutoGenerate('rollNumber', classId, true);
                                                        }
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
                                            <div className="relative group/field">
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
                                                {(field.id === 'rollNumber' || field.id === 'studentId') && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAutoGenerate(field.id, undefined, true)}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white border border-slate-200 text-[#045c84] text-[10px] font-bold rounded-xl shadow-sm hover:bg-[#045c84] hover:text-white transition-all md:opacity-0 md:group-hover/field:opacity-100 opacity-60"
                                                    >
                                                        AUTO
                                                    </button>
                                                )}
                                            </div>
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

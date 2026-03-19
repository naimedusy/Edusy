"use client";

import { useState, useEffect } from 'react';
import { Bell, Save, Loader2, Info, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUI } from '@/components/UIProvider';

const NOTIFICATION_TYPES = [
    { 
        id: 'TASK_COMPLETED', 
        name: 'টাস্ক আপডেট', 
        icon: CheckCircle2, 
        color: 'text-emerald-600',
        variables: ['studentName', 'bookName', 'instituteName'] 
    },
    { 
        id: 'ATTENDANCE_ALERT', 
        name: 'হাজিরা নিশ্চিতকরণ', 
        icon: AlertCircle, 
        color: 'text-amber-600',
        variables: ['studentName', 'time', 'date', 'instituteName'] 
    },
    { 
        id: 'SYSTEM', 
        name: 'সিস্টেম মেসেজ', 
        icon: Info, 
        color: 'text-blue-600',
        variables: ['instituteName'] 
    }
];

export default function NotificationSettingsPage() {
    const router = useRouter();
    const { alert } = useUI();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        // Fetch current settings
        fetch('/api/admin/settings/notifications')
            .then(res => res.json())
            .then(data => {
                setSettings(data || {});
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                await alert('সেটিংস সফলভাবে সংরক্ষিত হয়েছে!');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">নোটিফিকেশন কাস্টমাইজেশন</h1>
                    <p className="text-slate-500 text-sm">প্রত্যেকটি বার্তার ভাষা নিজের মতো করে সাজিয়ে নিন</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-[#045c84] text-white px-6 py-3 rounded-2xl hover:bg-[#034a6a] transition-all font-bold disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    পরিবর্তন সেভ করুন
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {NOTIFICATION_TYPES.map(type => (
                    <div key={type.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                            <div className={`p-3 rounded-2xl bg-white shadow-sm ${type.color}`}>
                                <type.icon size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{type.name}</h2>
                                <p className="text-xs text-slate-500">Variables: {type.variables.map(v => `{{${v}}}`).join(', ')}</p>
                            </div>
                        </div>
                        
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Teacher Template */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#045c84]">শিক্ষকের জন্য বার্তা (Teacher)</h3>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 tracking-wider">টাইটেল</label>
                                    <input 
                                        type="text"
                                        value={settings[type.id]?.teacher?.title || ''}
                                        onChange={(e) => setSettings({...settings, [type.id]: {...(settings[type.id] || {}), teacher: {...(settings[type.id]?.teacher || {}), title: e.target.value}}})}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        placeholder="উদা: নতুন টাস্ক আপডেট"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 tracking-wider">মেসেজ</label>
                                    <textarea 
                                        rows={3}
                                        value={settings[type.id]?.teacher?.message || ''}
                                        onChange={(e) => setSettings({...settings, [type.id]: {...(settings[type.id] || {}), teacher: {...(settings[type.id]?.teacher || {}), message: e.target.value}}})}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                        placeholder="উদা: {{studentName}} এর থেকে একটি আপডেট এসেছে।"
                                    />
                                </div>
                            </div>

                            {/* Guardian Template */}
                            <div className="space-y-4 border-l pl-8 border-slate-100">
                                <h3 className="text-xs font-black uppercase tracking-widest text-emerald-600">অভিভাবকের জন্য বার্তা (Guardian)</h3>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 tracking-wider">টাইটেল</label>
                                    <input 
                                        type="text"
                                        value={settings[type.id]?.guardian?.title || ''}
                                        onChange={(e) => setSettings({...settings, [type.id]: {...(settings[type.id] || {}), guardian: {...(settings[type.id]?.guardian || {}), title: e.target.value}}})}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-1 tracking-wider">মেসেজ</label>
                                    <textarea 
                                        rows={3}
                                        value={settings[type.id]?.guardian?.message || ''}
                                        onChange={(e) => setSettings({...settings, [type.id]: {...(settings[type.id] || {}), guardian: {...(settings[type.id]?.guardian || {}), message: e.target.value}}})}
                                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

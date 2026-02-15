"use client";

import { useState, useEffect } from 'react';
import { Upload, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function BrandingSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [appName, setAppName] = useState('Edusy');
    const [introduction, setIntroduction] = useState('');
    const [supportEmail, setSupportEmail] = useState('');
    const [supportPhone, setSupportPhone] = useState('');
    const [logo, setLogo] = useState<string | null>(null);
    const [coverImage, setCoverImage] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/public/site-settings');
            if (res.ok) {
                const data = await res.json();
                setAppName(data.appName || 'Edusy');
                setIntroduction(data.introduction || '');
                setSupportEmail(data.supportEmail || '');
                setSupportPhone(data.supportPhone || '');
                setLogo(data.logo);
                setCoverImage(data.coverImage);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Check if upload API exists, otherwise this will fail
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (type === 'logo') setLogo(data.url);
                if (type === 'cover') setCoverImage(data.url);
            } else {
                alert('Image upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error uploading image');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/public/site-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appName,
                    logo,
                    coverImage,
                    introduction,
                    supportEmail,
                    supportPhone
                })
            });

            if (res.ok) {
                alert('Settings saved successfully!');
                router.refresh();
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">App Branding & Settings</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* General Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-700 mb-4">General Information</h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">App Name</label>
                        <input
                            type="text"
                            value={appName}
                            onChange={(e) => setAppName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Introduction (Welcome Text)</label>
                        <textarea
                            value={introduction}
                            onChange={(e) => setIntroduction(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Welcome message related to the app..."
                        />
                    </div>
                </div>

                {/* Support Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                    <h2 className="text-lg font-semibold text-slate-700 mb-4">Support & Feedback</h2>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Support Email</label>
                        <input
                            type="email"
                            value={supportEmail}
                            onChange={(e) => setSupportEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="support@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Support Phone</label>
                        <input
                            type="text"
                            value={supportPhone}
                            onChange={(e) => setSupportPhone(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="+880 1..."
                        />
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4 md:col-span-2">
                    <h2 className="text-lg font-semibold text-slate-700 mb-4">Images</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">App Logo</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] relative bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {logo ? (
                                    <div className="relative w-32 h-32">
                                        <Image src={logo} alt="Logo" fill className="object-contain" />
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <Upload className="w-8 h-8 mx-auto mb-2" />
                                        <span className="text-sm">Upload Logo</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Cover Image Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Login Cover Image</label>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[160px] relative bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'cover')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                {coverImage ? (
                                    <div className="relative w-full h-32">
                                        <Image src={coverImage} alt="Cover" fill className="object-cover rounded-lg" />
                                    </div>
                                ) : (
                                    <div className="text-center text-slate-400">
                                        <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                                        <span className="text-sm">Upload Cover Image</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

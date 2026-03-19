"use client";

import React, { useState } from 'react';
import { Building2, Save, Upload, MapPin, Phone, Globe, Mail, BookOpen, Loader2 } from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import { useUI } from '@/components/UIProvider';
import Image from 'next/image';

interface InstituteOnboardingProps {
    onComplete: () => void;
}

export default function InstituteOnboarding({ onComplete }: InstituteOnboardingProps) {
    const { user, setAllInstitutes, login } = useSession();
    const { alert } = useUI();
    const [loading, setLoading] = useState(false);
    const [logo, setLogo] = useState<string | null>(null);
    const [coverImage, setCoverImage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'School',
        address: '',
        phone: '',
        email: '',
        website: ''
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Create local preview
            const localUrl = URL.createObjectURL(file);
            if (type === 'logo') setLogo(localUrl);
            if (type === 'cover') setCoverImage(localUrl);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                // Update with the permanent Cloudinary URL
                if (type === 'logo') setLogo(data.url);
                if (type === 'cover') setCoverImage(data.url);
            } else {
                const errorData = await res.json();
                // Clear local preview if upload failed to prevent saving blob URLs
                if (type === 'logo') setLogo(null);
                if (type === 'cover') setCoverImage(null);
                await alert(`Upload failed: ${errorData.message || 'Please check your Cloudinary configuration.'}`);
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (type === 'logo') setLogo(null);
            if (type === 'cover') setCoverImage(null);
            await alert('Image upload failed due to a network error.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return await alert('Institute name is required');

        setLoading(true);

        try {
            const res = await fetch('/api/institute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id,
                    ...formData,
                    logo,
                    coverImage
                })
            });

            if (res.ok) {
                const { institute, user: updatedUser } = await res.json();

                if (updatedUser) {
                    // Update session with new role and institutes
                    login(updatedUser);
                    onComplete();
                } else {
                    // Fallback to manual refresh if user object missing
                    const institutesRes = await fetch(`/api/institute?userId=${user?.id}`);
                    const institutes = await institutesRes.json();
                    if (Array.isArray(institutes)) {
                        setAllInstitutes(institutes);
                        onComplete();
                    } else {
                        window.location.reload();
                    }
                }
            } else {
                await alert('Failed to create institute');
            }
        } catch (error) {
            console.error('Error creating institute:', error);
            await alert('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-bengali">
            <div className="bg-white max-w-4xl w-full rounded-3xl shadow-xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">

                {/* Left Side - Visuals */}
                <div className="bg-[#045c84] text-white p-10 md:w-1/3 flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                            <Building2 size={32} />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-4">স্বাগতম!</h2>
                        <p className="text-blue-100 font-medium leading-relaxed">
                            আপনার প্রতিষ্ঠানের যাত্রা শুরু করার জন্য নিচের তথ্যগুলো পূরণ করুন। এটি আপনার ড্যাশবোর্ডের মূল প্রোফাইল হিসেবে কাজ করবে।
                        </p>
                    </div>

                    <div className="relative z-10 mt-12">
                        <div className="flex items-center gap-3 text-sm font-bold opacity-80 mb-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            সহজ সেটআপ
                        </div>
                        <div className="flex items-center gap-3 text-sm font-bold opacity-80">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            পূর্ণাঙ্গ নিয়ন্ত্রণ
                        </div>
                    </div>

                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
                </div>

                {/* Right Side - Form */}
                <div className="p-10 md:w-2/3">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BookOpen className="text-[#045c84]" size={20} />
                        প্রতিষ্ঠানের তথ্য
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Name & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">প্রতিষ্ঠানের নাম</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#045c84] outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                    placeholder="উদাঃ এডুসি স্কুল"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">ধরণ</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#045c84] outline-none transition-all text-slate-800"
                                >
                                    <option value="School">স্কুল</option>
                                    <option value="College">কলেজ</option>
                                    <option value="Madrasa">মাদ্রাসা</option>
                                    <option value="Coaching">কোচিং</option>
                                    <option value="Kindergarten">কিন্ডারগার্টেন</option>
                                    <option value="University">বিশ্ববিদ্যালয়</option>
                                </select>
                            </div>
                        </div>

                        {/* Address & Contact */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <MapPin size={12} /> ঠিকানা
                                </label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#045c84] outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                    placeholder="পূর্ণ ঠিকানা লিখুন"
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Phone size={12} /> ফোন
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#045c84] outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                        placeholder="+৮৮০..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        <Mail size={12} /> ইমেইল
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#045c84] outline-none transition-all text-slate-800 placeholder:text-slate-400"
                                        placeholder="example@mail.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Image Uploads */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            {/* Logo Upload */}
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:bg-slate-50 transition-colors cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'logo')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {logo ? (
                                    <div className="relative w-16 h-16">
                                        <Image src={logo} alt="Logo" fill className="object-contain" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <Upload size={18} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">লোগো আপলোড</span>
                                    </>
                                )}
                            </div>

                            {/* Cover Upload */}
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center relative hover:bg-slate-50 transition-colors cursor-pointer group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, 'cover')}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {coverImage ? (
                                    <div className="relative w-full h-16">
                                        <Image src={coverImage} alt="Cover" fill className="object-cover rounded-lg" />
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                            <Upload size={18} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-500">কভার ফটো আপলোড</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#045c84] text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 hover:shadow-xl hover:bg-[#034a6b] transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <>
                                    <Save size={18} />
                                    প্রতিষ্ঠান তৈরি করুন
                                </>
                            )}
                        </button>

                    </form>
                </div>
            </div>
        </div>
    );
}

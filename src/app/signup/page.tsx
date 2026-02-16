'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthLayout from '../../components/AuthLayout';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Briefcase, ChevronDown, Rocket, Loader2, AlertCircle } from 'lucide-react';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });


            if (res.ok) {
                router.push('/entrance');
            } else {
                const data = await res.json();
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }

    };

    return (
        <AuthLayout title="শুরু করুন!" subtitle="আজই আপনার ফ্রি অ্যাকাউন্ট তৈরি করুন">

            {error && (
                <div className="bg-blue-50 border-l-4 border-[#047cac] text-[#045c84] p-4 mb-6 rounded-r-xl shadow-sm animate-fade-in-up flex items-center gap-3" role="alert">
                    <AlertCircle size={24} />
                    <div>
                        <p className="font-normal text-red-600">দুঃখিত!</p>
                        <p>{error}</p>
                    </div>
                </div>
            )}


            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <label className="block text-sm text-slate-900 mb-2 uppercase tracking-wide" htmlFor="name">
                        পুরো নাম
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#047cac] group-focus-within:text-[#045c84] transition-colors">

                            <User size={20} />
                        </div>
                        <input
                            className="w-full pl-11 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-[#045c84] transition-all bg-slate-50 focus:bg-white text-black placeholder-slate-400 shadow-sm"

                            id="name"
                            type="text"
                            placeholder="আপনার নাম"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <label className="block text-sm text-slate-900 mb-2 uppercase tracking-wide" htmlFor="email">
                        ইমেইল অ্যাড্রেস
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#047cac] group-focus-within:text-[#045c84] transition-colors">

                            <Mail size={20} />
                        </div>
                        <input
                            className="w-full pl-11 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-[#045c84] transition-all bg-slate-50 focus:bg-white text-black placeholder-slate-400 shadow-sm"

                            id="email"
                            type="email"
                            placeholder="name@edusy.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <label className="block text-sm text-slate-900 mb-2 uppercase tracking-wide" htmlFor="password">
                        পাসওয়ার্ড
                    </label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#047cac] group-focus-within:text-[#045c84] transition-colors">

                            <Lock size={20} />
                        </div>
                        <input
                            className="w-full pl-11 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-[#045c84] transition-all bg-slate-50 focus:bg-white text-black placeholder-slate-400 shadow-sm"

                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>

                    <input
                        id="terms"
                        name="terms"
                        type="checkbox"
                        className="h-5 w-5 text-[#047cac] focus:ring-[#045c84] border-gray-300 rounded-lg cursor-pointer transition-all"

                        required
                    />
                    <label htmlFor="terms" className="ml-2 block text-sm font-medium text-slate-800">
                        আমি <a href="#" className="font-medium text-[#045c84] hover:text-[#023c57] underline decoration-2 decoration-blue-200">শর্তাবলী</a> এবং <a href="#" className="font-medium text-[#045c84] hover:text-[#023c57] underline decoration-2 decoration-blue-200">গোপনীয়তা নীতি</a> এর সাথে একমত

                    </label>
                </div>

                <button
                    className={`w-full py-4 px-4 bg-gradient-to-r from-[#045c84] via-[#047cac] to-[#639fb0] hover:from-[#034d6e] hover:via-[#036993] hover:to-[#558b99] text-white font-extrabold text-lg rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 animate-fade-in-up flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}

                    type="submit"
                    disabled={loading}
                    style={{ animationDelay: '0.6s' }}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={24} />
                            <span>অ্যাকাউন্ট তৈরি হচ্ছে...</span>
                        </>
                    ) : (
                        <>
                            <span>অ্যাকাউন্ট তৈরি করুন</span>
                            <Rocket size={24} />
                        </>
                    )}
                </button>

            </form>

            <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
                <p className="text-sm text-slate-500 font-medium">
                    ইতোমধ্যে অ্যাকাউন্ট আছে?{' '}
                    <Link href="/entrance" className="font-medium text-[#045c84] hover:text-[#023c57] transition-colors underline decoration-2 underline-offset-4 decoration-blue-200 hover:decoration-blue-300">
                        লগ ইন করুন
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}

import React, { useEffect, useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import Image from 'next/image';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}


interface SiteSettings {
    name: string; // Keep for backward compatibility/api response structure
    appName?: string;
    logo: string | null;
    coverImage: string | null;
    introduction: string | null;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/public/site-settings');
                if (res.ok) {
                    const data = await res.json();
                    setSettings(data);
                }
            } catch (error) {
                console.error('Failed to fetch site settings', error);
            }
        };

        fetchSettings();
    }, []);

    const appName = settings?.appName || settings?.name || 'Edusy';

    return (
        <div className="flex min-h-screen items-center justify-center bg-white font-sans overflow-hidden relative">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                {settings?.coverImage ? (
                    <>
                        <Image
                            src={settings.coverImage}
                            alt="Background"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
                    </>
                ) : (
                    <div className="w-full h-full bg-[#ffffff] relative">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_farthest-corner_at_50%_50%,_#e0f2fe_0%,_transparent_50%),_radial-gradient(circle_farthest-corner_at_0%_0%,_#f0f9ff_0%,_transparent_50%),_radial-gradient(circle_farthest-corner_at_100%_0%,_#e0f7fa_0%,_transparent_50%),_radial-gradient(circle_farthest-corner_at_100%_100%,_#f1f5f9_0%,_transparent_50%),_radial-gradient(circle_farthest-corner_at_0%_100%,_#eef2ff_0%,_transparent_50%)] animate-float-delayed opacity-80 mix-blend-multiply blur-3xl"></div>
                        <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-[128px] animate-pulse"></div>
                        <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-400/20 rounded-full blur-[128px] animate-pulse delay-1000"></div>
                    </div>
                )}
            </div>

            {/* Form Container */}
            <div className="w-full max-w-xl z-10 animate-fade-in-up p-6">
                <div className="bg-white/90 rounded-[2.5rem] shadow-2xl p-8 lg:p-12 border border-white/50 backdrop-blur-md relative overflow-hidden">
                    {/* Subtle top glare/highlight */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

                    <div className="mb-8 text-center relative z-10">
                        <div className="flex justify-center mb-6">
                            {settings?.logo ? (
                                <div className="relative w-32 h-32 transform hover:scale-105 transition-transform duration-300">
                                    <Image
                                        src={settings.logo}
                                        alt={appName}
                                        fill
                                        style={{ objectFit: 'contain' }}
                                        className="drop-shadow-md"
                                        priority
                                    />
                                </div>
                            ) : (
                                <div className="inline-flex p-3 rounded-2xl bg-[#045c84]/5 text-[#045c84] shadow-sm border border-[#045c84]/10">
                                    <Gamepad2 size={32} strokeWidth={1.5} />
                                </div>
                            )}
                        </div>

                        <h2 className="text-3xl font-extrabold text-[#045c84] pb-1">
                            {title}
                        </h2>
                        {settings?.introduction ? (
                            <p className="mt-2 text-slate-600 font-medium text-sm whitespace-pre-wrap">{settings.introduction}</p>
                        ) : (
                            <p className="mt-2 text-slate-500 font-medium">{subtitle}</p>
                        )}

                    </div>

                    <div className="relative z-10">
                        {children}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-400 font-bold tracking-widest uppercase flex items-center justify-center gap-2 relative z-10">
                        &copy; {new Date().getFullYear()} {appName} <span className="text-[#047cac]">•</span> Crafted with ❤️
                    </div>
                </div>
            </div>
        </div>
    );
};


export default AuthLayout;

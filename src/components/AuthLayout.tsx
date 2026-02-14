import React from 'react';
import { Gamepad2, Rocket } from 'lucide-react';


interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="flex min-h-screen bg-white overflow-hidden font-sans">
            <div className="hidden w-1/2 relative lg:flex lg:flex-col lg:justify-center lg:items-center overflow-hidden">
                {/* Animated Background - Professional Blue / Teal Palette */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#045c84] via-[#047cac] to-[#639fb0] animate-gradient-x z-0"></div>


                {/* Geometric Shapes - "Tech/Professional" feel */}
                <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-3xl transform rotate-45 backdrop-blur-md animate-float border border-white/20"></div>
                <div className="absolute bottom-32 right-24 w-48 h-48 bg-[#72d4f5]/30 rounded-full blur-2xl animate-float-delayed mix-blend-overlay"></div>
                <div className="absolute top-1/3 right-10 w-16 h-16 bg-[#9ad2a9]/40 rounded-full blur-xl animate-bounce-custom"></div>


                {/* Glassmorphism Content Card */}
                <div className="relative z-10 p-12 glass-panel rounded-[2.5rem] max-w-lg text-center mx-12 shadow-2xl shadow-[#045c84]/10">


                    <div className="mb-6 inline-flex p-5 rounded-2xl bg-white/20 text-white backdrop-blur-md shadow-lg transform hover:scale-110 transition-transform duration-300 border border-white/40">
                        <Gamepad2 size={56} strokeWidth={1.5} />
                    </div>
                    <h1 className="text-6xl font-black mb-4 text-white tracking-tight drop-shadow-sm">Edusy</h1>
                    <p className="text-xl text-white font-medium leading-relaxed opacity-95">
                        মাদ্রাসা ও কিন্ডারগার্টেনের জন্য <br />
                        <span className="bg-white/25 px-3 py-1 rounded-xl text-white font-bold inline-block mt-2 backdrop-blur-sm">স্মার্ট ম্যানেজমেন্ট</span> সলিউশন।
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex flex-col justify-center w-full p-6 lg:w-1/2 lg:px-24 bg-white relative">
                {/* Mobile Background Gradient */}
                <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-[#047cac]/10 to-[#9ad2a9]/10 z-0 pointer-events-none opacity-80"></div>


                <div className="max-w-md mx-auto w-full z-10 animate-fade-in-up">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#045c84] to-[#047cac] pb-1">
                            {title}
                        </h2>

                        <p className="mt-3 text-slate-500 font-medium text-lg">{subtitle}</p>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-2 lg:p-0">
                        {children}
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-100 text-center text-xs text-slate-400 font-bold tracking-widest uppercase items-center justify-center gap-2">
                        &copy; {new Date().getFullYear()} Edusy <span className="text-[#047cac]">•</span> Crafted by Edusy Team

                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthLayout;

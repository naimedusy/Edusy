'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users,
    BookOpen,
    LayoutDashboard,
    Settings,
    LogOut,
    Bell,
    Search,
    Menu,
    X,
    CreditCard,
    GraduationCap,
    Calendar,
    Building2,
    ShieldCheck,
    HeartPulse
} from 'lucide-react';

import { useSession } from '@/components/SessionProvider';
import RoleSwitcher from '@/components/RoleSwitcher';
import ProfileModal from '@/components/ProfileModal';
import InstituteSwitcher from '@/components/InstituteSwitcher';
import NotificationDropdown from '@/components/NotificationDropdown';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const { user, activeRole, logout } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        const handleOpenProfile = () => setIsProfileModalOpen(true);
        window.addEventListener('open-user-profile', handleOpenProfile);
        return () => window.removeEventListener('open-user-profile', handleOpenProfile);
    }, []);


    const menuItems = [
        { name: 'ড্যাশবোর্ড', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'প্রতিষ্ঠান', icon: Building2, href: '/dashboard/institute', adminOnly: true },
        { name: 'শিক্ষক', icon: GraduationCap, href: '/dashboard/teachers' },
        { name: 'শিক্ষার্থী', icon: Users, href: '/dashboard/students' },
        { name: 'অভিভাবক', icon: HeartPulse, href: '/dashboard/guardians' },
        { name: 'ক্লাস', icon: BookOpen, href: '/dashboard/classes' },
        { name: 'হিসাব', icon: CreditCard, href: '/dashboard/accounts' },
        { name: 'ক্যালেন্ডার', icon: Calendar, href: '/dashboard/calendar' },
        { name: 'সেটিংস', icon: Settings, href: '/dashboard/settings' },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        if (activeRole === 'SUPER_ADMIN') {
            return item.href === '/dashboard';
        }
        if (item.adminOnly) {
            return activeRole === 'ADMIN';
        }
        return true;
    });



    const adminLinks = [
        { name: 'ইউজার ডাটাবেস', icon: Users, href: '/dashboard/admin/users' },
        { name: 'প্রতিষ্ঠানসমূহ', icon: Building2, href: '/dashboard/admin/institutes' },
    ];


    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 text-black transition-transform duration-300 lg:translate-x-0 shadow-lg ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="p-8 flex items-center gap-4 bg-[#045c84] text-white">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner">
                            <GraduationCap size={24} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-widest flex-1">EDUSY</h1>
                        <button className="lg:hidden text-white/80 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>


                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 py-4">
                        <nav className="px-4 space-y-3 pb-8">
                            {filteredMenuItems.map((item) => {
                                const isActive = item.href === '/dashboard'
                                    ? pathname === '/dashboard'
                                    : pathname?.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-5 px-5 py-4 rounded-2xl transition-all font-medium group text-lg ${isActive
                                            ? 'bg-[#045c84] text-white shadow-lg shadow-blue-200'
                                            : 'text-zinc-900 hover:bg-slate-100'
                                            }`}
                                    >
                                        <item.icon size={24} className={`transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-[#045c84]'}`} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {activeRole === 'SUPER_ADMIN' && (
                            <div className="px-4 mb-4">
                                <div className="px-5 mb-2 flex items-center gap-2 text-[#045c84]">
                                    <ShieldCheck size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">অ্যাডমিন ওভারসাইট</span>
                                </div>
                                <div className="space-y-1">
                                    {adminLinks.map((item) => {
                                        const isActive = pathname?.startsWith(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setIsSidebarOpen(false)}
                                                className={`flex items-center gap-4 px-5 py-3 rounded-xl transition-all font-medium group text-sm ${isActive
                                                    ? 'bg-[#045c84]/10 text-[#045c84] font-bold'
                                                    : 'text-slate-600 hover:bg-[#045c84]/5'
                                                    }`}
                                            >
                                                <item.icon size={18} className={`transition-opacity ${isActive ? 'opacity-100 text-[#045c84]' : 'opacity-70 group-hover:opacity-100 text-[#045c84]'}`} />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* <InstituteSwitcher /> */}
                        <RoleSwitcher />
                    </div>



                    <div className="p-6 border-t border-slate-100">
                        <button
                            onClick={logout}
                            className="flex items-center gap-5 w-full px-5 py-4 rounded-2xl hover:bg-red-50 transition-all font-medium text-red-600 text-lg"
                        >
                            <LogOut size={24} />
                            <span>লগ আউট</span>
                        </button>
                    </div>

                </div>
            </aside>


            {/* Main Content */}
            <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
                {/* Topbar */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 text-slate-500" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="relative hidden md:block w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="খুঁজুন..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-[#047cac]/20 transition-all text-sm outline-none"

                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all"
                            >
                                <div className={`transition-transform duration-300 ${isNotificationOpen ? 'rotate-90' : 'rotate-0'}`}>
                                    {isNotificationOpen ? <X size={22} /> : <Bell size={22} />}
                                </div>
                                {!isNotificationOpen && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#9ad2a9] rounded-full ring-2 ring-white"></span>
                                )}
                            </button>
                            <NotificationDropdown
                                isOpen={isNotificationOpen}
                                onClose={() => setIsNotificationOpen(false)}
                            />
                        </div>
                        <div
                            onClick={() => setIsProfileModalOpen(true)}
                            className="flex items-center gap-3 pl-2 border-l border-slate-200 cursor-pointer group hover:bg-slate-50 p-1 rounded-xl transition-all"
                        >
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-black group-hover:text-[#045c84] transition-colors">{user?.name || 'ব্যবহারকারী'}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-tighter">{activeRole?.replace('_', ' ')}</p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-tr from-[#045c84] to-[#047cac] rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform">
                                {user?.name ? user.name[0] : 'U'}
                            </div>
                        </div>

                    </div>

                </header>

                {/* Page Content */}
                <main className="flex-1">
                    {children}
                </main>

                {/* Profile Modal */}
                <ProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    user={user}
                />
            </div>
        </div>
    );
}

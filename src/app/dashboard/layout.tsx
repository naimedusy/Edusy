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
    HeartPulse,
    Presentation, // Classroom
    Library,      // Library
    ClipboardList,// Assignment
    Megaphone,    // Notice
    Zap,           // Attendance
    TrendingUp
} from 'lucide-react';

import { useSession } from '@/components/SessionProvider';
import RoleSwitcher from '@/components/RoleSwitcher';
import ProfileModal from '@/components/ProfileModal';
import NotificationBell from '@/components/NotificationBell';
import GlobalSearch from '@/components/GlobalSearch';
import GlobalAssignmentModal from '@/components/GlobalAssignmentModal';
import { useUI } from '@/components/UIProvider';
import { PenTool } from 'lucide-react';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const { openAssignmentModal } = useUI();
    const { user, activeRole, logout, isLoading } = useSession();
    const pathname = usePathname();

    useEffect(() => {
        const handleOpenProfile = () => setIsProfileModalOpen(true);
        window.addEventListener('open-user-profile', handleOpenProfile);
        return () => window.removeEventListener('open-user-profile', handleOpenProfile);
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <GraduationCap className="absolute inset-0 m-auto text-primary animate-pulse" size={24} />
                    </div>
                    <p className="text-slate-500 font-black text-xs uppercase tracking-[0.3em] animate-pulse">EDUSY লোড হচ্ছে...</p>
                </div>
            </div>
        );
    }

    // Client-side auth guard: if the session loaded but no user found, redirect to login
    if (!user) {
        if (typeof window !== 'undefined') {
            window.location.replace('/entrance?redirect=' + encodeURIComponent(window.location.pathname));
        }
        return null;
    }


    // ...
    const menuItems = [
        { name: 'ড্যাশবোর্ড', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'হাজিরা', icon: Zap, href: '/dashboard/attendance/scan', roles: ['ADMIN', 'TEACHER'] },
        { name: 'রিপোর্টস', icon: TrendingUp, href: '/dashboard/reports', roles: ['ADMIN', 'TEACHER'] },
        { name: 'প্রতিষ্ঠান', icon: Building2, href: '/dashboard/institute', adminOnly: true },
        { name: 'শিক্ষক', icon: GraduationCap, href: '/dashboard/teachers' },
        {
            name: activeRole === 'GUARDIAN' ? 'আমার সন্তান' : 'শিক্ষার্থী / বই',
            icon: Users,
            href: activeRole === 'GUARDIAN' ? '/dashboard/guardian/children' : '/dashboard/students'
        },
        { name: 'অভিভাবক', icon: HeartPulse, href: '/dashboard/guardians' },
        { name: 'হিসাব', icon: CreditCard, href: '/dashboard/accounts' },
        { name: 'ক্লাস রুম', icon: Presentation, href: '/dashboard/classroom' },
        // Role-specific Library Links
        { name: 'লাইব্রেরি', icon: Library, href: '/dashboard/library', roles: ['STUDENT'] },
        { name: 'লাইব্রেরি', icon: Library, href: '/dashboard/admin/library', roles: ['ADMIN', 'SUPER_ADMIN'] },

        { name: 'ক্লাস ডাইরি', icon: ClipboardList, href: '/dashboard/assignments' },
        { name: 'নোটিশ', icon: Megaphone, href: '/dashboard/notices' },
        { name: 'ক্যালেন্ডার', icon: Calendar, href: '/dashboard/calendar' },
        { name: 'সেটিংস', icon: Settings, href: '/dashboard/settings' },
    ];

    const filteredMenuItems = menuItems.filter(item => {
        // Role based filtering if 'roles' property exists
        if ((item as any).roles && !(item as any).roles.includes(activeRole)) {
            return false;
        }

        if (activeRole === 'SUPER_ADMIN') {
            return item.href === '/dashboard' || item.href === '/dashboard/admin/library';
        }
        if (activeRole === 'STUDENT') {
            return ['/dashboard', '/dashboard/notices', '/dashboard/classroom', '/dashboard/library', '/dashboard/assignments'].includes(item.href);
        }
        if (activeRole === 'GUARDIAN') {
            return ['/dashboard', '/dashboard/guardian/children', '/dashboard/assignments', '/dashboard/settings'].includes(item.href);
        }
        if ((item as any).adminOnly) {
            return activeRole === 'ADMIN';
        }
        return true;
    });



    const adminLinks = [
        { name: 'ইউজার ডাটাবেস', icon: Users, href: '/dashboard/admin/users' },
        { name: 'প্রতিষ্ঠানসমূহ', icon: Building2, href: '/dashboard/admin/institutes' },
        { name: 'অ্যাপ ব্র্যান্ডিং', icon: Settings, href: '/dashboard/admin/settings/branding' },
    ];


    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Backdrop Overlay - only visible on mobile when sidebar is open */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 text-black transition-transform duration-300 lg:translate-x-0 shadow-lg ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} h-screen`}>
                <div className="flex flex-col h-full">
                    <div className="p-8 flex items-center gap-4 bg-primary text-white shrink-0">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-inner">
                            <GraduationCap size={24} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-black tracking-widest flex-1">
                            {activeRole === 'GUARDIAN' ? 'অভিভাবক' : 'EDUSY'}
                        </h1>
                        <button className="lg:hidden text-white/80 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>


                    {/* Scrollable Content Area */}
                    <div
                        className="flex-1 overflow-y-auto custom-scrollbar py-4"
                        data-lenis-prevent
                    >
                        <nav className="px-4 space-y-3 pb-8">
                            {filteredMenuItems.map((item) => {
                                const isActive = item.href === '/dashboard'
                                    ? ['/dashboard', '/dashboard/teacher', '/dashboard/student', '/dashboard/guardian'].includes(pathname)
                                    : pathname?.startsWith(item.href);

                                return (
                                    <Link
                                        key={item.href}
                                        href={
                                            activeRole === 'GUARDIAN' && item.href === '/dashboard' ? '/dashboard/guardian' :
                                                activeRole === 'GUARDIAN' && item.href === '/dashboard/guardian/children' ? '/dashboard/guardian/children' :
                                                    activeRole === 'STUDENT' && item.href === '/dashboard/students' ? '/dashboard/student' :
                                                        activeRole === 'TEACHER' && item.href === '/dashboard/teachers' ? '/dashboard/teacher' :
                                                            item.href
                                        }
                                        onClick={() => setIsSidebarOpen(false)}
                                        className={`flex items-center gap-5 px-5 py-4 rounded-2xl transition-all font-medium group text-lg ${isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-zinc-900 hover:bg-slate-100'
                                            }`}
                                    >
                                        <item.icon size={24} className={`transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-primary'}`} />
                                        <span>{activeRole === 'GUARDIAN' && item.name === 'শিক্ষার্থী / বই' ? 'আমার সন্তান' : item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {activeRole === 'SUPER_ADMIN' && (
                            <div className="px-4 mb-4">
                                <div className="px-5 mb-2 flex items-center gap-2 text-primary">
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
                                                    ? 'bg-primary/10 text-primary font-bold'
                                                    : 'text-slate-600 hover:bg-primary/5'
                                                    }`}
                                            >
                                                <item.icon size={18} className={`transition-opacity ${isActive ? 'opacity-100 text-primary' : 'opacity-70 group-hover:opacity-100 text-primary'}`} />
                                                <span>{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <RoleSwitcher />

                        <div className="p-4 mt-4 lg:hidden">
                            <button
                                onClick={logout}
                                className="flex items-center gap-5 w-full px-5 py-4 rounded-2xl hover:bg-red-50 transition-all font-medium text-red-600 text-lg"
                            >
                                <LogOut size={24} />
                                <span>লগ আউট</span>
                            </button>
                        </div>
                    </div>



                    <div className="p-6 border-t border-slate-100 hidden lg:block shrink-0 bg-white">
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
            <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                        <button className="lg:hidden p-2 text-slate-500 shrink-0" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>

                        {/* Page Title */}
                        <div className="flex items-center min-w-0">
                            <h2 className="text-xl font-black text-slate-800 font-bengali">
                                {pathname === '/dashboard/guardian' ? 'অভিভাবক ড্যাশবোর্ড' :
                                    pathname?.includes('/dashboard/students') ? (activeRole === 'GUARDIAN' ? 'আমার সন্তান' : 'শিক্ষার্থী / বই') :
                                        pathname?.includes('/dashboard/teachers') ? 'শিক্ষক' :
                                            pathname?.includes('/dashboard/institute') ? 'প্রতিষ্ঠানসমূহ' :
                                                pathname?.includes('/dashboard/accounts') ? 'হিসাব' :
                                                    pathname?.includes('/dashboard/settings') ? 'সেটিংস' :
                                                        pathname?.includes('/dashboard/guardians') ? 'অভিভাবক' :
                                                            pathname?.includes('/dashboard/calendar') ? 'ক্যালেন্ডার' :
                                                                pathname?.includes('/dashboard/assignments') ? 'ক্লাস ডাইরি' :
                                                                    pathname?.includes('/dashboard/attendance') ? 'হাজিরা' :
                                                                        pathname?.includes('/dashboard') ? 'ড্যাশবোর্ড' : ''}
                            </h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Header Actions Portal Target */}
                        <div id="dashboard-header-actions" className="flex items-center gap-2"></div>

                        <div className="flex items-center gap-2">
                            <GlobalSearch />
                            <NotificationBell />
                        </div>
                        <div
                            onClick={() => setIsProfileModalOpen(true)}
                            className="flex items-center gap-3 pl-2 border-l border-slate-200 cursor-pointer group hover:bg-slate-50 p-1 rounded-xl transition-all"
                        >
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium text-black group-hover:text-primary transition-colors">{user?.name || 'ব্যবহারকারী'}</p>
                                <p className="text-xs text-slate-500 uppercase tracking-tighter">
                                    {activeRole === 'SUPER_ADMIN' ? 'সুপার অ্যাডমিন' :
                                        activeRole === 'ADMIN' ? 'অ্যাডমিন' :
                                            activeRole === 'TEACHER' ? 'শিক্ষক' :
                                                activeRole === 'STUDENT' ? 'শিক্ষার্থী' :
                                                    activeRole === 'GUARDIAN' ? 'অভিভাবক' :
                                                        activeRole?.replace('_', ' ')}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-tr from-primary to-secondary rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform">
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
                {/* Global Assignment Modal */}
                <GlobalAssignmentModal />
            </div>
        </div>
    );
}

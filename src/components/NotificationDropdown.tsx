import { Bell, X, Building2, ClipboardList, PenTool, CheckCircle2, AlertCircle, MessageSquare, Info, Calendar } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { useRouter } from 'next/navigation';
import { useUI } from '@/components/UIProvider';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
    onRead?: () => void;
}

export default function NotificationDropdown({ isOpen, onClose, onRead }: NotificationDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [hasOpened, setHasOpened] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const { user } = useSession();
    const [invitations, setInvitations] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const router = useRouter();
    const { openAssignmentDetails } = useUI();
    const [isNavigating, setIsNavigating] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
                setHasOpened(false);
            }
        };

        if (isOpen) {
            setShouldRender(true);
            document.addEventListener('mousedown', handleClickOutside);
            setTimeout(() => setHasOpened(true), 10);

            // Fetch invitations when opened
            if (user?.id) {
                fetch(`/api/user/invitations?userId=${user.id}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) setInvitations(data);
                    })
                    .catch(err => console.error(err));

                // Fetch notifications
                fetch(`/api/notifications?userId=${user.id}`)
                    .then(res => res.json())
                    .then(data => {
                        if (Array.isArray(data)) setNotifications(data);
                    })
                    .catch(err => console.error(err));
            }

        } else {
            setHasOpened(false);
            const timer = setTimeout(() => setShouldRender(false), 500);
            return () => clearTimeout(timer);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, user?.id]);

    const handleInvitationClick = () => {
        router.push('/dashboard/invitations');
        onClose();
    };

    if (!shouldRender) return null;

    return (
        <div
            ref={dropdownRef}
            className={`fixed left-0 right-0 lg:left-auto lg:right-8 lg:w-[400px] bg-white shadow-2xl lg:rounded-3xl border border-slate-200 overflow-hidden z-30 transition-all duration-500 ease-in-out ${hasOpened ? 'top-[73px] lg:top-[85px] opacity-100 translate-y-0' : 'top-[73px] lg:top-[85px] -translate-y-full opacity-0'
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Bell className="text-[#045c84]" size={18} />
                    নোটিফিকেশন
                </h3>
            </div>

            {/* List */}
            <div 
                className="max-h-[400px] overflow-y-auto font-sans custom-scrollbar"
                data-lenis-prevent
            >
                <div className="p-2 space-y-2">
                    {/* Invitations Section */}
                    {invitations.length > 0 && (
                        <div className="mb-2 flex flex-col gap-[5px]">
                            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">ইনভাইটেশন</div>
                            {invitations.map(invitation => (
                                <div
                                    key={invitation.id}
                                    onClick={handleInvitationClick}
                                    className="mx-2 p-3 bg-blue-50 border border-blue-100 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors flex items-start gap-3"
                                >
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {invitation.institute?.name} আপনাকে শিক্ষক হিসেবে যোগ দিতে আমন্ত্রণ জানিয়েছে।
                                        </p>
                                        <p className="text-xs text-blue-600 font-bold mt-1">এখনই দেখুন &rarr;</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Notifications Section */}
                    {notifications.length > 0 && (
                        <div className="mb-2 flex flex-col gap-[5px]">
                            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">সাধারণ বিজ্ঞপ্তি</div>
                            {notifications.slice(0, 10).map((notif: any) => (
                                <div
                                    key={notif.id}
                                    onClick={async () => {
                                        // Mark as read/clicked
                                        if (notif.status !== 'CLICKED') {
                                            fetch(`/api/notifications/${notif.id}`, { 
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ status: 'CLICKED' })
                                            }).catch(e => console.error(e));
                                            
                                            setNotifications(prev =>
                                                prev.map(n => n.id === notif.id ? { ...n, status: 'CLICKED', read: true } : n)
                                            );
                                            if (onRead) onRead();
                                        }

                                        // Handle Navigation
                                        setIsNavigating(notif.id);
                                        try {
                                            if (notif.type === 'TASK_COMPLETED' && notif.metadata?.assignmentId) {
                                                const res = await fetch(`/api/assignments/${notif.metadata.assignmentId}?instituteId=${notif.metadata.instituteId}`);
                                                if (res.ok) {
                                                    const assignment = await res.json();
                                                    openAssignmentDetails(assignment);
                                                    onClose();
                                                }
                                            } else if (notif.type === 'ATTENDANCE_ALERT') {
                                                router.push('/dashboard/attendance');
                                                onClose();
                                            } else if (notif.type === 'INVITATION') {
                                                router.push('/dashboard/invitations');
                                                onClose();
                                            } else if (notif.type === 'PERMISSION_UPDATE') {
                                                router.push('/dashboard/settings'); // Or specific permissions page
                                                onClose();
                                            }
                                        } catch (error) {
                                            console.error('Navigation error:', error);
                                        } finally {
                                            setIsNavigating(null);
                                        }
                                    }}
                                    className={`relative mx-2 p-4 rounded-2xl cursor-pointer transition-all flex items-start gap-4 mb-2 group ${notif.read || notif.status === 'CLICKED'
                                        ? 'bg-white hover:bg-slate-50 border border-slate-100 shadow-sm'
                                        : 'bg-blue-50/50 hover:bg-blue-50 border border-blue-100 shadow-md shadow-blue-500/5'
                                        } ${isNavigating === notif.id ? 'opacity-70 pointer-events-none' : ''}`}
                                >
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                                        notif.type === 'TASK_COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                        notif.type === 'ATTENDANCE_ALERT' ? 'bg-amber-50 text-amber-600' :
                                        notif.type === 'MESSAGE' ? 'bg-indigo-50 text-indigo-600' :
                                        'bg-blue-50 text-blue-600'
                                    }`}>
                                        {notif.type === 'TASK_COMPLETED' ? <CheckCircle2 size={24} /> :
                                         notif.type === 'ATTENDANCE_ALERT' ? <AlertCircle size={24} /> :
                                         notif.type === 'MESSAGE' ? <MessageSquare size={24} /> :
                                         <Bell size={24} />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-sm font-bold truncate ${notif.read ? 'text-slate-600' : 'text-slate-900 group-hover:text-blue-700'}`}>
                                                {notif.title}
                                            </p>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                                                <Calendar size={10} />
                                                {new Date(notif.createdAt).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })}
                                            </div>
                                        </div>

                                        <p className={`text-[13px] leading-relaxed ${notif.read ? 'text-slate-500' : 'text-slate-700'}`}>
                                            {notif.message}
                                        </p>

                                        {notif.metadata?.instituteName && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-[#045c84] bg-blue-50 px-2 py-0.5 rounded-md">
                                                    {notif.metadata.instituteName}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {!notif.read && (
                                        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                    )}

                                    {isNavigating === notif.id && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-2xl">
                                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {!invitations.length && !notifications.length && (
                        <div className="p-8 text-center text-slate-400">
                            <Bell className="mx-auto mb-2 opacity-50" size={24} />
                            <p className="text-sm">কোনো নতুন নোটিফিকেশন নেই</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

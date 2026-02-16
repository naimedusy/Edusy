import { Bell, X, Building2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { useRouter } from 'next/navigation';

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
            <div className="max-h-[400px] overflow-y-auto font-sans">
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
                                        // Mark as read
                                        if (!notif.read) {
                                            await fetch(`/api/notifications/${notif.id}`, { method: 'PATCH' });
                                            setNotifications(prev =>
                                                prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                                            );
                                            if (onRead) onRead();
                                        }
                                    }}
                                    className={`mx-2 p-3 rounded-xl cursor-pointer transition-colors flex items-start gap-3 ${notif.read
                                        ? 'bg-slate-50 hover:bg-slate-100 border border-slate-100'
                                        : 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
                                        }`}
                                >
                                    {!notif.read && (
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-slate-800">{notif.title}</p>
                                            <p className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                {new Date(notif.createdAt).toLocaleString('bn-BD')}
                                            </p>
                                        </div>

                                        {notif.type === 'PERMISSION_UPDATE' && notif.metadata ? (
                                            <div className="mt-2 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    {notif.metadata.instituteLogo ? (
                                                        <img
                                                            src={notif.metadata.instituteLogo}
                                                            alt="Logo"
                                                            className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <Building2 size={16} />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs font-bold text-[#045c84]">{notif.metadata.instituteName}</p>
                                                        <p className="text-[10px] text-slate-500">{notif.metadata.instituteAddress}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                    <p className="text-xs font-bold text-slate-700 mb-1">অনুমতিসমূহ:</p>
                                                    <div className="space-y-1">
                                                        {Array.isArray(notif.metadata.permissionDetails) && notif.metadata.permissionDetails.map((detail: string, idx: number) => (
                                                            <p key={idx} className="text-[11px] text-slate-600 flex items-start gap-1">
                                                                <span className="mt-1 w-1 h-1 rounded-full bg-slate-400 shrink-0"></span>
                                                                {detail}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
                                                {/* <p className="text-xs text-slate-400 mt-1">
                                                    {new Date(notif.createdAt).toLocaleString('bn-BD')}
                                                </p> */}
                                            </>
                                        )}
                                    </div>
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

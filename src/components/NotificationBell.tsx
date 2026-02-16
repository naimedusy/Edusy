'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import NotificationDropdown from '@/components/NotificationDropdown';

export default function NotificationBell() {
    const { user } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnread = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/notifications?userId=${user.id}&unreadOnly=true`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setUnreadCount(data.length);
            }
        } catch (error) {
            console.error('Failed to fetch unread notifications:', error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchUnread();

        // Poll every 60 seconds
        const interval = setInterval(fetchUnread, 60000);
        return () => clearInterval(interval);
    }, [user?.id]);

    const handleClose = () => {
        setIsOpen(false);
        // Re-fetch when closing to ensure count is accurate if multiple were read
        fetchUnread();
    };

    const handleRead = () => {
        // Optimistically decrease count, or just refetch. 
        // Refetching is safer as we don't track which ID was read here easily.
        fetchUnread();
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-all"
            >
                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
                    {isOpen ? <X size={22} /> : <Bell size={22} />}
                </div>

                {/* Red Dot - Only show if unreadCount > 0 and dropdown is closed */}
                {unreadCount > 0 && !isOpen && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
            </button>
            <NotificationDropdown
                isOpen={isOpen}
                onClose={handleClose}
                onRead={handleRead}
            />
        </div>
    );
}

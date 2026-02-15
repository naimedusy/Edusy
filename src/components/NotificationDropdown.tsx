'use client';

import { Bell, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface NotificationDropdownProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [hasOpened, setHasOpened] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                // Close immediately (bell icon rotates instantly)
                onClose();
                // But keep panel visible for smooth slide-up animation
                setHasOpened(false);
            }
        };

        if (isOpen) {
            setShouldRender(true);
            document.addEventListener('mousedown', handleClickOutside);

            // Trigger smooth open animation
            setTimeout(() => setHasOpened(true), 10);
        } else {
            // Start closing animation
            setHasOpened(false);
            // Wait for animation to complete before unmounting
            const timer = setTimeout(() => setShouldRender(false), 500);

            return () => clearTimeout(timer);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!shouldRender) return null;

    return (
        <div
            ref={dropdownRef}
            className={`fixed left-0 right-0 lg:left-auto lg:right-8 lg:w-[450px] bg-white shadow-2xl lg:rounded-3xl border border-slate-200 overflow-hidden z-30 transition-all duration-500 ease-in-out ${hasOpened ? 'top-[73px] lg:top-[85px] opacity-100 translate-y-0' : 'top-[73px] lg:top-[85px] -translate-y-full opacity-0'
                }`}
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    <Bell className="text-[#045c84]" size={18} />
                    সাম্প্রতিক নোটিশ
                </h3>
            </div>

            {/* Notices List */}
            <div className="max-h-[400px] overflow-y-auto font-sans">
                <div className="p-4 flex flex-col gap-3">
                    {[1, 2, 3, 4, 5, 6].map((_, i) => (
                        <div
                            key={i}
                            className="flex gap-3 p-3 rounded-xl bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer group shadow-sm"
                        >
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-[#045c84] font-bold text-sm group-hover:bg-[#045c84] group-hover:text-white transition-all shrink-0">
                                {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">পরীক্ষার রুটিন প্রকাশ</p>
                                <p className="text-xs text-slate-500 mt-0.5 font-medium">২ ঘণ্টা আগে</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button className="w-full md:w-auto px-8 py-3 bg-[#045c84] hover:bg-[#034d6e] text-white rounded-xl text-xs font-bold transition-all uppercase tracking-widest shadow-lg shadow-blue-200">
                    সবগুলো দেখুন
                </button>
            </div>
        </div>
    );
}

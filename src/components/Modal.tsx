'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: string;
    headerActions?: React.ReactNode;
    noScroll?: boolean;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl', headerActions, noScroll = false }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`bg-white w-full ${maxWidth} rounded-3xl shadow-2xl animate-scale-in overflow-hidden relative z-10 flex flex-col max-h-[90vh] font-bengali`}>
                <div className="px-5 md:px-6 py-3.5 md:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                    <h2 className="text-base md:text-xl font-semibold text-slate-800 uppercase tracking-tight">
                        {title}
                    </h2>
                    <div className="flex items-center gap-2">
                        {headerActions}
                        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} className="md:w-6 md:h-6" />
                        </button>
                    </div>
                </div>
                <div
                    className={`flex-1 flex flex-col min-h-0 ${!noScroll ? 'overflow-y-auto custom-scrollbar' : ''}`}
                    data-lenis-prevent
                >
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

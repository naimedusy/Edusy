'use client';

import React from 'react';
import { MoreVertical, Trash2, Phone, Mail, Copy, Check, MessageCircle, User, ShieldCheck } from 'lucide-react';

interface GuardianCardProps {
    guardian: any;
    students?: any[];
    onCardClick?: (guardian: any) => void;
    onDelete?: (guardianId: string, name: string) => void;
    isReadOnly?: boolean;
}

export default function GuardianCard({
    guardian,
    students = [],
    onCardClick,
    onDelete,
    isReadOnly = false
}: GuardianCardProps) {
    const [copiedField, setCopiedField] = React.useState<string | null>(null);

    const name = guardian.name || 'অভিভাবক';
    const initials = name[0]?.toUpperCase() || 'G';
    const phone = guardian.phone;
    const email = guardian.email;
    const relationship = guardian.metadata?.relationship || students[0]?.metadata?.guardianRelation || 'অভিভাবক';

    const handleCopy = (e: React.MouseEvent, text: string, field: string) => {
        e.stopPropagation();
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (phone) window.open(`tel:${phone}`, '_self');
    };

    const handleWhatsApp = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            window.open(`https://wa.me/${cleanPhone}`, '_blank');
        }
    };

    return (
        <div
            onClick={() => onCardClick?.(guardian)}
            className="group relative bg-white rounded-3xl border border-slate-100 p-4 hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
        >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#045c84]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl pointer-events-none" />


            <div className="flex items-center gap-4">
                {/* Profile Section - Smaller */}
                <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-[#045c84] via-[#067ab8] to-[#045c84] text-white flex items-center justify-center text-lg font-black shadow-md shadow-blue-900/10 group-hover:scale-105 transition-transform duration-500 ring-2 ring-white">
                        {initials}
                    </div>
                </div>

                {/* Name & Relation Section */}
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                        <h3 className="text-base font-black text-slate-800 truncate tracking-tight group-hover:text-[#045c84] transition-colors">{name}</h3>
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-[#045c84] text-[8px] font-bold rounded-md border border-blue-100/50 uppercase leading-none">
                            {relationship}
                        </span>
                    </div>

                    {students.length > 0 && (
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1 leading-tight truncate">
                            <span className="text-[#045c84]/60">ছাত্র:</span>
                            {students.length === 1
                                ? students[0].name
                                : `${students[0].name} সহ আরও ${students.length - 1} জন`
                            }
                        </p>
                    )}
                </div>

                {/* Compact Call Button */}
                <button
                    onClick={handleCall}
                    className="p-3 bg-[#045c84] text-white rounded-2xl hover:bg-[#034a6b] hover:shadow-lg shadow-blue-900/10 transition-all active:scale-90"
                    title="কল করুন"
                >
                    <Phone size={18} fill="currentColor" />
                </button>
            </div>
        </div>
    );
}

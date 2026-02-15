'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/components/SessionProvider';
import { Building2, Check, X, Users, BookOpen, GraduationCap, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import Toast from '@/components/Toast';

export default function InvitationsPage() {
    const { user } = useSession();
    const [invitations, setInvitations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvitation, setSelectedInvitation] = useState<any>(null);
    const [instituteSummary, setInstituteSummary] = useState<any>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const fetchInvitations = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/user/invitations?userId=${user.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setInvitations(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, [user?.id]);

    const handleViewDetails = async (invitation: any) => {
        setSelectedInvitation(invitation);
        setSummaryLoading(true);
        try {
            const res = await fetch(`/api/public/institute/${invitation.instituteId}/summary`);
            const data = await res.json();
            setInstituteSummary(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load institute details', 'error');
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleAction = async (action: 'ACCEPT' | 'REJECT') => {
        if (!selectedInvitation) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/teacher/invitation/${selectedInvitation.id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                showToast(action === 'ACCEPT' ? 'Invitation Accepted!' : 'Invitation Rejected', 'success');
                setSelectedInvitation(null);
                setInstituteSummary(null);
                // Refresh list or redirect
                if (action === 'ACCEPT') {
                    // Redirect to home/dashboard so they can see new institute
                    window.location.href = '/dashboard';
                } else {
                    fetchInvitations();
                }
            } else {
                showToast('Action failed', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Something went wrong', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return (
        <div className="p-8 space-y-8 animate-fade-in-up font-bengali min-h-screen pb-20">
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#045c84]" size={32} />
                </div>
            ) : invitations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {invitations.map(invitation => (
                        <div key={invitation.id} className="bg-white p-6 rounded-[24px] border border-slate-200 hover:shadow-lg transition-all group">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                                    {invitation.institute?.logo ? (
                                        <img src={invitation.institute.logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={32} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-slate-800 truncate">{invitation.institute?.name}</h3>
                                    <p className="text-sm text-slate-500 truncate">{invitation.institute?.address || 'ঠিকানা নেই'}</p>
                                    <span className="inline-block mt-2 px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-md border border-yellow-100 uppercase tracking-wider">
                                        Pending Request
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleViewDetails(invitation)}
                                className="w-full py-3 bg-[#045c84] text-white rounded-xl font-bold hover:bg-[#034a6b] transition-colors shadow-lg shadow-blue-900/20 active:scale-95"
                            >
                                বিস্তারিত দেখুন ও যুক্ত হোন
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center text-slate-400">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 className="opacity-20 text-slate-600" size={40} />
                    </div>
                    <p className="text-xl font-bold text-slate-600">কোনো ইনভাইটেশন নেই</p>
                    <p className="text-sm mt-2 max-w-sm mx-auto">বর্তমানে আপনার জন্য কোনো নতুন ইনভাইটেশন নেই।</p>
                </div>
            )
            }

            {/* Details Modal */}
            <Modal
                isOpen={!!selectedInvitation}
                onClose={() => setSelectedInvitation(null)}
                title={instituteSummary?.name || "ইনস্টিটিউট ডিটেইলস"}
                maxWidth="max-w-xl"
            >
                <div className="font-bengali">
                    {summaryLoading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-[#045c84]" size={32} />
                        </div>
                    ) : instituteSummary ? (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="text-center">
                                <div className="w-24 h-24 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-slate-100">
                                    {instituteSummary.logo ? (
                                        <img src={instituteSummary.logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Building2 size={40} className="text-slate-400" />
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">{instituteSummary.name}</h2>
                                <p className="text-slate-500 font-medium">{instituteSummary.address}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 text-[#045c84]">
                                        <GraduationCap size={20} />
                                    </div>
                                    <div className="text-xl font-bold text-slate-800">{instituteSummary.stats?.students || 0}</div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">শিক্ষার্থী</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 text-purple-600">
                                        <Users size={20} />
                                    </div>
                                    <div className="text-xl font-bold text-slate-800">{instituteSummary.stats?.teachers || 0}</div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">শিক্ষক</div>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600">
                                        <BookOpen size={20} />
                                    </div>
                                    <div className="text-xl font-bold text-slate-800">{instituteSummary.stats?.classes || 0}</div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">ক্লাস</div>
                                </div>
                            </div>

                            {/* Info Rows */}
                            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm">
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/50 pb-2">
                                    <span className="text-slate-500 font-medium">ধরন</span>
                                    <span className="font-bold text-slate-800">{instituteSummary.type || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-1 border-b border-slate-200/50 pb-2">
                                    <span className="text-slate-500 font-medium">ফোন</span>
                                    <span className="font-bold text-slate-800">{instituteSummary.phone || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center py-1">
                                    <span className="text-slate-500 font-medium">ইমেইল</span>
                                    <span className="font-bold text-slate-800">{instituteSummary.email || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleAction('REJECT')}
                                    disabled={actionLoading}
                                    className="flex-1 py-3.5 bg-white border-2 border-red-100 text-red-500 rounded-xl font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <><X size={18} /> প্রত্যাখ্যান করুন</>}
                                </button>
                                <button
                                    onClick={() => handleAction('ACCEPT')}
                                    disabled={actionLoading}
                                    className="flex-1 py-3.5 bg-[#045c84] text-white rounded-xl font-bold hover:bg-[#034a6b] transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin" /> : <><Check size={18} /> জয়েন করুন</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-10 text-red-400">তথ্য লোড করা যায়নি</div>
                    )}
                </div>
            </Modal>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div >
    );
}

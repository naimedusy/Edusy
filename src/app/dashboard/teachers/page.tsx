'use client';

import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, Search, Plus, MoreVertical, Shield, Settings, Trash2 } from 'lucide-react';
import { useSession } from '@/components/SessionProvider';
import AddTeacherModal from '@/components/AddTeacherModal';
import TeacherPermissionModal from '@/components/TeacherPermissionModal';
import Toast from '@/components/Toast';

export default function TeachersPage() {
    const { user, activeInstitute } = useSession();
    const [teachers, setTeachers] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [permissionModalData, setPermissionModalData] = useState<any>(null); // null means closed

    // Toast
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    const fetchTeachers = async () => {
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/teacher?instituteId=${activeInstitute.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setTeachers(data);
            }
        } catch (error) {
            console.error(error);
            showToast('শিক্ষক তালিকা লোড করতে সমস্যা হয়েছে', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchClasses = async () => {
        if (!activeInstitute?.id) return;
        try {
            const res = await fetch(`/api/admin/classes?instituteId=${activeInstitute.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setClasses(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchTeachers();
        fetchClasses();
    }, [activeInstitute?.id]);

    const handleAddTeacher = async (data: any) => {
        if (!activeInstitute?.id) return;
        try {
            const res = await fetch('/api/teacher/invite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, instituteId: activeInstitute.id }),
            });
            const result = await res.json();

            if (res.ok) {
                showToast('শিক্ষক সফলভাবে যুক্ত করা হয়েছে', 'success');
                fetchTeachers(); // Refresh list
            } else {
                showToast(result.error || 'শিক্ষক যুক্ত করতে ব্যর্থ হয়েছে', 'error');
            }
        } catch (error) {
            showToast('সার্ভার এরর, পুনরায় চেষ্টা করুন', 'error');
        }
    };

    const handleUpdatePermissions = async (teacherId: string, updates: any) => {
        try {
            const res = await fetch(`/api/teacher/${teacherId}/permissions`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updates,
                    adminId: user?.id,
                    instituteId: activeInstitute?.id
                }),
            });

            if (res.ok) {
                showToast('পারমিশন আপডেট করা হয়েছে', 'success');
                fetchTeachers(); // Refresh to update local state logic if needed
            } else {
                const data = await res.json();
                showToast(data.error || 'পারমিশন আপডেট ব্যর্থ হয়েছে', 'error');
            }
        } catch (error) {
            showToast('আপডেট ব্যর্থ হয়েছে', 'error');
        }
    };

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filteredTeachers = teachers.filter(t => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        const name = t.user.name?.toLowerCase() || '';
        const email = t.user.email?.toLowerCase() || '';
        const phone = t.user.phone || '';

        return name.includes(query) || email.includes(query) || phone.includes(query);
    });

    return (
        <div className="p-4 md:p-8 space-y-8 animate-fade-in-up font-bengali min-h-screen pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#045c84]/10 transition-all outline-none text-black font-medium shadow-sm w-full md:w-64 placeholder:text-slate-400"
                            placeholder="শিক্ষক খুঁজুন..."
                        />
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-6 py-3 bg-[#045c84] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:bg-[#034a6b] transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">নতুন শিক্ষক</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-[#045c84]/30 border-t-[#045c84] rounded-full mx-auto mb-4"></div>
                    <p className="text-slate-400 font-bold">লোড হচ্ছে...</p>
                </div>
            ) : filteredTeachers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher) => (
                        <div
                            key={teacher.id}
                            onClick={() => setPermissionModalData(teacher)}
                            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all cursor-pointer group relative h-full"
                        >
                            {/* Badges */}
                            <div className="absolute top-4 right-16 flex items-center gap-2">
                                {teacher.userId === user?.id && (
                                    <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 border border-green-100">
                                        ✓ আপনি
                                    </div>
                                )}
                                {teacher.isAdmin && (
                                    <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 border border-red-100">
                                        <Shield size={12} />
                                        ADMIN
                                    </div>
                                )}
                                {teacher.status === 'PENDING' && (
                                    <div className="bg-yellow-50 text-yellow-600 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 border border-yellow-100">
                                        🕒 PENDING
                                    </div>
                                )}
                            </div>

                            {/* Three-dot menu */}
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Toggle menu or show dropdown
                                        const menu = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (menu) {
                                            menu.classList.toggle('hidden');
                                        }
                                    }}
                                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all z-10"
                                >
                                    <MoreVertical size={20} />
                                </button>

                                {/* Dropdown menu */}
                                <div className="hidden absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-20">
                                    {!teacher.isAdmin && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (!window.confirm(`আপনি কি নিশ্চিত যে ${teacher.user.name} কে সরাতে চান?`)) return;

                                                try {
                                                    const res = await fetch(`/api/teacher/${teacher.userId}?instituteId=${activeInstitute.id}&adminId=${user?.id}`, {
                                                        method: 'DELETE'
                                                    });

                                                    if (res.ok) {
                                                        showToast('শিক্ষক সফলভাবে সরানো হয়েছে', 'success');
                                                        fetchTeachers();
                                                    } else {
                                                        const data = await res.json();
                                                        showToast(data.error || 'সরাতে ব্যর্থ হয়েছে', 'error');
                                                    }
                                                } catch (err) {
                                                    showToast('সার্ভার এরর', 'error');
                                                }
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            মুছে ফেলুন
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Card content */}
                            <div className="flex items-center gap-4">
                                {/* Profile circle */}
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#045c84] to-[#067ab8] text-white flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg">
                                    {teacher.user.name[0].toUpperCase()}
                                </div>

                                {/* Teacher info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-800 truncate">{teacher.user.name}</h3>
                                    <p className="text-[#045c84] text-sm font-bold mb-1">{teacher.designation || 'শিক্ষক'}</p>
                                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium font-sans">
                                        <span>{teacher.user.phone || 'N/A'}</span>
                                        <span className="truncate">{teacher.user.email}</span>
                                    </div>
                                </div>

                                {/* Permissions badges */}
                                <div className="flex flex-wrap gap-2 shrink-0">
                                    {teacher.permissions?.canCollectFees && (
                                        <span className="text-[10px] uppercase font-bold px-2 py-1 bg-purple-50 text-purple-600 rounded-md border border-purple-100">Fees</span>
                                    )}
                                    {teacher.permissions?.canManageResult && (
                                        <span className="text-[10px] uppercase font-bold px-2 py-1 bg-blue-50 text-blue-600 rounded-md border border-blue-100">Result</span>
                                    )}
                                    {teacher.permissions?.canTakeAttendance && (
                                        <span className="text-[10px] uppercase font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">Attendance</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-slate-200 p-20 text-center text-slate-400">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <GraduationCap className="opacity-20 text-slate-600" size={40} />
                    </div>
                    <p className="text-xl font-bold text-slate-600">কোনো শিক্ষক পাওয়া যায়নি</p>
                    <p className="text-sm mt-2 max-w-sm mx-auto">নতুন শিক্ষক যুক্ত করতে উপরের "নতুন শিক্ষক" বাটনে ক্লিক করুন।</p>
                </div>
            )}

            <AddTeacherModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddTeacher}
                instituteId={activeInstitute?.id}
                instituteName={activeInstitute?.name}
            />

            <TeacherPermissionModal
                isOpen={!!permissionModalData}
                onClose={() => setPermissionModalData(null)}
                teacher={permissionModalData}
                classes={classes}
                onSave={handleUpdatePermissions}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Check, Shield, BookOpen, CreditCard, Calendar, FileText, UserCheck, AlertCircle } from 'lucide-react';

interface Class {
    id: string;
    name: string;
}

interface TeacherProfile {
    id: string;
    userId: string;
    instituteId: string;
    designation: string;
    permissions: any;
    assignedClassIds: string[];
    isAdmin: boolean;
    user: {
        name: string;
        email: string;
        phone: string;
    }
}

interface TeacherPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: TeacherProfile | null;
    classes: Class[];
    onSave: (teacherId: string, updates: any) => Promise<void>;
}

export default function TeacherPermissionModal({ isOpen, onClose, teacher, classes, onSave }: TeacherPermissionModalProps) {
    const [permissions, setPermissions] = useState<any>({
        canCollectFees: false,
        canManageResult: false,
        canTakeAttendance: true,
        canManageExam: false,
        canManageRoutine: false,
    });
    const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (teacher) {
            setPermissions(teacher.permissions || {
                canCollectFees: false,
                canManageResult: false,
                canTakeAttendance: true,
                canManageExam: false,
                canManageRoutine: false,
            });
            setAssignedClassIds(teacher.assignedClassIds || []);
            setIsAdmin(teacher.isAdmin || false);
        }
    }, [teacher]);

    const handlePermissionChange = (key: string) => {
        setPermissions((prev: any) => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleClassToggle = (classId: string) => {
        setAssignedClassIds(prev =>
            prev.includes(classId)
                ? prev.filter(id => id !== classId)
                : [...prev, classId]
        );
    };

    const handleSave = async () => {
        if (!teacher) return;
        setLoading(true);
        try {
            await onSave(teacher.id, {
                permissions,
                assignedClassIds,
                isAdmin
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !teacher) return null;

    const permissionConfig = [
        { key: 'canTakeAttendance', label: 'উপস্থিতি গ্রহণ', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { key: 'canManageResult', label: 'ফলাফল তৈরি', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
        { key: 'canCollectFees', label: 'ফি কালেকশন', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
        { key: 'canManageExam', label: 'পরীক্ষা নিয়ন্ত্রণ', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
        { key: 'canManageRoutine', label: 'রুটিন ম্যানেজমেন্ট', icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50' },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="শিক্ষকের পারমিশন ও ক্লাস" maxWidth="max-w-4xl">
            <div className="space-y-8 p-1 font-bengali">
                {/* Header Info */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-[#045c84] text-white flex items-center justify-center text-xl font-bold">
                        {teacher.user.name[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{teacher.user.name}</h3>
                        <p className="text-sm text-slate-500">{teacher.designation || 'শিক্ষক'} • {teacher.user.phone || teacher.user.email}</p>
                    </div>
                    {isAdmin && (
                        <div className="ml-auto px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold border border-red-100 flex items-center gap-2">
                            <Shield size={14} />
                            অ্যাডমিন এক্সেস আছে
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Role & Permissions */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                <Shield size={18} className="text-[#045c84]" />
                                রোল ও পারমিশন
                            </h4>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isAdmin ? 'bg-red-500' : 'bg-slate-200'}`}>
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isAdmin ? 'translate-x-4' : ''}`} />
                                </div>
                                <input type="checkbox" className="hidden" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
                                <span className={`text-sm font-bold ${isAdmin ? 'text-red-600' : 'text-slate-500'}`}>অ্যাডমিন</span>
                            </label>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            {permissionConfig.map((perm, idx) => (
                                <label key={perm.key} className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${idx !== permissionConfig.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${perm.bg} ${perm.color}`}>
                                            <perm.icon size={20} />
                                        </div>
                                        <span className="font-bold text-slate-700">{perm.label}</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${permissions[perm.key] ? 'bg-[#045c84] border-[#045c84]' : 'border-slate-300'}`}>
                                        {permissions[perm.key] && <Check size={14} className="text-white" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={permissions[perm.key] || false}
                                        onChange={() => handlePermissionChange(perm.key)}
                                        disabled={isAdmin} // Admins usually have all permissions, or handled separately
                                    />
                                </label>
                            ))}
                        </div>
                        {isAdmin && <p className="text-xs text-orange-500 font-medium bg-orange-50 p-2 rounded-lg">* অ্যাডমিন হিসেবে সিলেক্ট করলে সকল ফিচারে এক্সেস থাকবে।</p>}
                    </div>

                    {/* Right: Class Assignment */}
                    <div className="space-y-6">
                        <h4 className="font-bold text-slate-700 flex items-center gap-2">
                            <BookOpen size={18} className="text-[#045c84]" />
                            ক্লাস অ্যাসাইনমেন্ট
                        </h4>

                        <div className="bg-white rounded-2xl border border-slate-200 p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                            {classes.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2">
                                    {classes.map((cls) => (
                                        <label key={cls.id} className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${assignedClassIds.includes(cls.id) ? 'border-[#045c84] bg-blue-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}>
                                            <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${assignedClassIds.includes(cls.id) ? 'bg-[#045c84] border-[#045c84]' : 'border-slate-300 bg-white'}`}>
                                                {assignedClassIds.includes(cls.id) && <Check size={12} className="text-white" />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={assignedClassIds.includes(cls.id)}
                                                onChange={() => handleClassToggle(cls.id)}
                                            />
                                            <span className={`font-bold ${assignedClassIds.includes(cls.id) ? 'text-[#045c84]' : 'text-slate-600'}`}>{cls.name}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400">
                                    কোনো ক্লাস পাওয়া যায়নি
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium bg-slate-50 p-3 rounded-xl">
                            * নির্বাচিত ক্লাসগুলোর জন্যই কেবল এই শিক্ষক কাজ করতে পারবেন (যেমন: রেসাল্ট এন্ট্রি, হাজিরা)।
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                        বাতিল
                    </button>
                    <button onClick={handleSave} disabled={loading} className="px-8 py-2.5 rounded-xl font-bold bg-[#045c84] text-white hover:bg-[#034a6b] transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center gap-2">
                        {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        সংরক্ষণ করুন
                    </button>
                </div>
            </div>
        </Modal>
    );
}

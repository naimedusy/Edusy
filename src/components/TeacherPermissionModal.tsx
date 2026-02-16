import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { Check, Shield, BookOpen, CreditCard, Calendar, FileText, UserCheck, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

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
    isReadOnly?: boolean;
}

const PERMISSION_CONFIG = [
    { key: 'canTakeAttendance', label: 'উপস্থিতি', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'canManageResult', label: 'ফলাফল', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'canCollectFees', label: 'ফি কালেকশন', icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'canManageAdmission', label: 'ভর্তি ও স্টুডেন্ট', icon: UserCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' }, // Added this line
    { key: 'canManageExam', label: 'পরীক্ষা', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'canManageRoutine', label: 'রুটিন', icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50' },
];

export default function TeacherPermissionModal({ isOpen, onClose, teacher, classes, onSave, isReadOnly = false }: TeacherPermissionModalProps) {
    // Structure: { [classId]: ["perm1", "perm2"] }
    const [classWisePermissions, setClassWisePermissions] = useState<Record<string, string[]>>({});
    const [expandedClasses, setExpandedClasses] = useState<string[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (teacher) {
            setIsAdmin(teacher.isAdmin || false);

            // Migrate legacy permissions or use existing class-wise structure
            if (teacher.permissions?.classWise) {
                setClassWisePermissions(teacher.permissions.classWise);
            } else {
                // Legacy migration: If they had global permissions, apply them to ALL currently assigned classes
                // Or just start empty/based on assignedClassIds
                const initialPermissions: Record<string, string[]> = {};
                const legacyPerms = teacher.permissions || {};

                // Get list of active permissions from legacy object
                const activeLegacyPerms = Object.keys(legacyPerms).filter(k => legacyPerms[k] === true);

                if (teacher.assignedClassIds && teacher.assignedClassIds.length > 0) {
                    teacher.assignedClassIds.forEach(classId => {
                        initialPermissions[classId] = [...activeLegacyPerms];
                    });
                }
                setClassWisePermissions(initialPermissions);
            }
            // Expand all classes by default for better visibility if not too many
            if (classes.length < 5) {
                setExpandedClasses(classes.map(c => c.id));
            }
        }
    }, [teacher, classes]);

    const toggleClassExpansion = (classId: string) => {
        setExpandedClasses(prev =>
            prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
        );
    };

    const togglePermission = (classId: string, permKey: string) => {
        if (isReadOnly) return;
        setClassWisePermissions(prev => {
            const currentClassPerms = prev[classId] || [];
            const isEnabled = currentClassPerms.includes(permKey);

            let newClassPerms;
            if (isEnabled) {
                newClassPerms = currentClassPerms.filter(k => k !== permKey);
            } else {
                newClassPerms = [...currentClassPerms, permKey];
            }

            // If no permissions left for this class, we can still keep the key to show it's "assigned" but empty, 
            // or just clean it up. Keeping it allows "assigned but no permission" state if needed.
            return {
                ...prev,
                [classId]: newClassPerms
            };
        });
    };

    const toggleAllForClass = (classId: string) => {
        if (isReadOnly) return;
        setClassWisePermissions(prev => {
            const currentClassPerms = prev[classId] || [];
            const allKeys = PERMISSION_CONFIG.map(p => p.key);

            // If all are selected, deselect all. Otherwise, select all.
            const isAllSelected = allKeys.every(k => currentClassPerms.includes(k));

            return {
                ...prev,
                [classId]: isAllSelected ? [] : allKeys
            };
        });
    };

    const handleSave = async () => {
        if (!teacher) return;
        setLoading(true);
        try {
            // Generate assignedClassIds based on which classes have entries in classWisePermissions
            // Note: If we want to allow "assigning" a class without any permissions, we need to handle that.
            // For now, let's assume if a class key exists in the object (even with empty array), it is assigned.
            // OR we can explicitly manage assignedClassIds separate from permissions if needed.
            // Let's stick to the plan: explicit assignedClassIds + permission object.

            // We'll update assignedClassIds to be the keys of classWisePermissions that have at least one permission?
            // User request implies "Class 1 Fee Collection", so likely they want to explicitly enable classes.
            // Let's rely on the keys of `classWisePermissions`. If a user interacts with a class, it gets added.

            // Better approach: keys of classWisePermissions are the assigned classes.
            const derivedAssignedClassIds = Object.keys(classWisePermissions);

            await onSave(teacher.id, {
                permissions: {
                    classWise: classWisePermissions
                },
                assignedClassIds: derivedAssignedClassIds,
                isAdmin
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to check if a class is "active" (has any permission set)
    const isClassActive = (classId: string) => {
        return classWisePermissions[classId] !== undefined;
        // Note: undefined check allows empty array (assigned but no permissions yet) to be distinct from unassigned
    };

    const toggleClassAssignment = (classId: string) => {
        if (isReadOnly) return;
        setClassWisePermissions(prev => {
            const next = { ...prev };
            if (next[classId] !== undefined) {
                delete next[classId]; // Unassign
            } else {
                next[classId] = []; // Assign with no permissions initially
                if (!expandedClasses.includes(classId)) {
                    setExpandedClasses(prevExp => [...prevExp, classId]);
                }
            }
            return next;
        });
    };

    if (!isOpen || !teacher) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="শিক্ষকের পারমিশন ও ক্লাস" maxWidth="max-w-4xl">
            <div className="space-y-6 p-1 font-bengali">
                {/* Header Info */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="w-12 h-12 rounded-full bg-[#045c84] text-white flex items-center justify-center text-xl font-bold">
                        {teacher.user.name[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">{teacher.user.name}</h3>
                        <p className="text-sm text-slate-500">{teacher.designation || 'শিক্ষক'} • {teacher.user.phone || teacher.user.email}</p>
                    </div>
                    <label className={`ml-auto flex items-center gap-2 group ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isAdmin ? 'bg-red-500' : 'bg-slate-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isAdmin ? 'translate-x-4' : ''}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={isAdmin} onChange={(e) => !isReadOnly && setIsAdmin(e.target.checked)} disabled={isReadOnly} />
                        <span className={`text-sm font-bold ${isAdmin ? 'text-red-600' : 'text-slate-500'}`}>অ্যাডমিন</span>
                    </label>
                </div>

                {isAdmin && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 text-red-700">
                        <Shield className="shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="font-bold text-sm">অ্যাডমিন এক্সেস সক্রিয়</p>
                            <p className="text-xs opacity-80 mt-1">অ্যাডমিন হিসেবে সিলেক্ট করলে নিচের ক্লাস বা পারমিশন সেটিং ছাড়াও সকল ফিচারে পূর্ণ এক্সেস থাকবে।</p>
                        </div>
                    </div>
                )}

                <div className={`space-y-4 ${isAdmin ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <BookOpen size={18} className="text-[#045c84]" />
                        ক্লাস অনুযায়ী পারমিশন
                    </h4>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        <div className="max-h-[500px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                            {classes.length > 0 ? classes.map((cls) => {
                                const isAssigned = isClassActive(cls.id);
                                const isExpanded = expandedClasses.includes(cls.id);
                                const activePerms = classWisePermissions[cls.id] || [];
                                const activeCount = activePerms.length;

                                return (
                                    <div key={cls.id} className={`transition-colors ${isAssigned ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                                        {/* Class Header Row */}
                                        <div className="flex items-center p-4 gap-3">
                                            <button
                                                onClick={() => toggleClassAssignment(cls.id)}
                                                disabled={isReadOnly}
                                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isAssigned ? 'bg-[#045c84] border-[#045c84]' : 'border-slate-300'} ${!isReadOnly && 'hover:border-[#045c84]'}`}
                                            >
                                                {isAssigned && <Check size={12} className="text-white" />}
                                            </button>

                                            <div
                                                className="flex-1 flex items-center justify-between cursor-pointer select-none"
                                                onClick={() => isAssigned && toggleClassExpansion(cls.id)}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={`font-bold ${isAssigned ? 'text-[#045c84]' : 'text-slate-600'}`}>{cls.name}</span>
                                                    {isAssigned && (
                                                        <span className="text-xs text-slate-400">
                                                            {activeCount === 0 ? 'কোনো পারমিশন নেই' : `${activeCount} টি পারমিশন সক্রিয়`}
                                                        </span>
                                                    )}
                                                </div>

                                                {isAssigned && (
                                                    <button
                                                        className="p-1 text-slate-400 hover:text-[#045c84] hover:bg-white rounded-full transition-all"
                                                    >
                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Permissions Grid (Expandable) */}
                                        {isAssigned && isExpanded && (
                                            <div className="px-12 pb-4 animate-fade-in">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    {PERMISSION_CONFIG.map((perm) => (
                                                        <label
                                                            key={perm.key}
                                                            className={`
                                                                flex items-center gap-3 p-2 rounded-lg border transition-all select-none
                                                                ${activePerms.includes(perm.key)
                                                                    ? 'bg-white border-[#045c84] shadow-sm'
                                                                    : 'bg-transparent border-transparent'}
                                                                ${!isReadOnly ? 'cursor-pointer hover:bg-black/5' : ''}
                                                            `}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="hidden"
                                                                checked={activePerms.includes(perm.key)}
                                                                onChange={() => togglePermission(cls.id, perm.key)}
                                                                disabled={isReadOnly}
                                                            />
                                                            <div className={`p-1.5 rounded-md ${perm.bg} ${perm.color}`}>
                                                                <perm.icon size={14} />
                                                            </div>
                                                            <span className={`text-sm font-medium ${activePerms.includes(perm.key) ? 'text-[#045c84]' : 'text-slate-600'}`}>
                                                                {perm.label}
                                                            </span>
                                                        </label>
                                                    ))}

                                                    {/* Select All / None */}
                                                    {!isReadOnly && (
                                                        <button
                                                            onClick={() => toggleAllForClass(cls.id)}
                                                            className="flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:text-[#045c84] hover:border-[#045c84] hover:bg-white transition-all text-xs font-bold"
                                                        >
                                                            {activePerms.length === PERMISSION_CONFIG.length ? 'সব মুছুন' : 'সব সিলেক্ট'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="p-10 text-center text-slate-400">
                                    কোনো ক্লাস পাওয়া যায়নি
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                        {isReadOnly ? 'বন্ধ করুন' : 'বাতিল'}
                    </button>
                    {!isReadOnly && (
                        <button onClick={handleSave} disabled={loading} className="px-8 py-2.5 rounded-xl font-bold bg-[#045c84] text-white hover:bg-[#034a6b] transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center gap-2">
                            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            সংরক্ষণ করুন
                        </button>
                    )}
                </div>
            </div>
        </Modal>
    );
}


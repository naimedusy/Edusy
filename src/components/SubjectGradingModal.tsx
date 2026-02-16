'use client';

import React, { useState } from 'react';
import {
    X, Save, Copy, ChevronRight, Settings2,
    BookOpen, Layers, Target, Merge,
    CheckCircle, List, Settings, TrendingUp,
    Menu, ArrowLeft
} from 'lucide-react';
import Modal from './Modal';
import GradingRulesModal from './GradingRulesModal';

interface Subject {
    id: string;
    nameBangla: string;
    nameEnglish: string;
    totalMarks: number;
    grade?: string;
    point?: string;
}

interface SubjectGradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjects: any[];
    initialSubjectId?: string | null;
    onSave?: (subjectId: string, data: { totalMarks: number, gradingRules: GradingRule[] }) => Promise<void>;
}

interface GradingRule {
    minMarks: number;
    grade: string;
    point: string;
}

const TABS = [
    { id: 'basic', label: 'Basic', icon: Settings2 },
    { id: 'subtopic', label: 'Sub Topic', icon: Layers },
    { id: 'passlogic', label: 'Pass Logic', icon: Target },
    { id: 'merge', label: 'Merge Papers', icon: Merge },
    { id: 'optional', label: 'Optional Subject', icon: CheckCircle },
];

const DEFAULT_RULES: GradingRule[] = [
    { minMarks: 80, grade: 'A+', point: '5' },
    { minMarks: 70, grade: 'A', point: '4' },
    { minMarks: 60, grade: 'A-', point: '3.5' },
    { minMarks: 50, grade: 'B', point: '3' },
    { minMarks: 40, grade: 'C', point: '2' },
    { minMarks: 33, grade: 'D', point: '1' },
    { minMarks: 0, grade: 'F', point: '0' },
];

export default function SubjectGradingModal({
    isOpen,
    onClose,
    subjects,
    initialSubjectId,
    onSave
}: SubjectGradingModalProps) {
    const [selectedSubject, setSelectedSubject] = useState<any>(subjects[0] || null);
    const [subjectMarks, setSubjectMarks] = useState<{ [key: string]: number }>({});
    const [subjectRules, setSubjectRules] = useState<{ [key: string]: GradingRule[] }>({});
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);

    // Update selected subject and initialize marks when subjects list changes or modal opens
    React.useEffect(() => {
        if (!isOpen) return;

        // Initialize marks and rules for subjects that don't have them yet
        const initialMarks = { ...subjectMarks };
        const initialRules = { ...subjectRules };
        subjects.forEach(sub => {
            // Always update if it's the first initialization for this mount or if the prop changed and we don't have local changes
            // (Simplification: just initialize if missing, and we'll handle prop updates more carefully if needed)
            if (initialMarks[sub.id] === undefined) {
                initialMarks[sub.id] = sub.totalMarks || 100;
            }

            if (initialRules[sub.id] === undefined && sub.gradingRules) {
                initialRules[sub.id] = sub.gradingRules;
            } else if (initialRules[sub.id] === undefined) {
                initialRules[sub.id] = DEFAULT_RULES;
            }
        });
        setSubjectMarks(initialMarks);
        setSubjectRules(initialRules);

        if (subjects.length > 0) {
            if (initialSubjectId) {
                const target = subjects.find(s => s.id === initialSubjectId);
                if (target) {
                    setSelectedSubject(target);
                } else {
                    setSelectedSubject(subjects[0]);
                }
            } else if (!selectedSubject) {
                setSelectedSubject(subjects[0]);
            } else {
                const found = subjects.find(s => s.id === selectedSubject.id);
                if (!found) {
                    setSelectedSubject(subjects[0]);
                }
            }
        }
    }, [subjects, isOpen]);

    const [activeTab, setActiveTab] = useState('basic');
    const [demoScore, setDemoScore] = useState(80);

    const calculateGrade = (score: number, total: number, rules: GradingRule[]) => {
        const percentage = (score / total) * 100;
        // Sort rules by minMarks descending to find the highest match
        const sortedRules = [...rules].sort((a, b) => b.minMarks - a.minMarks);

        const match = sortedRules.find(r => percentage >= r.minMarks);
        if (match) {
            return { grade: match.grade, point: match.point, status: match.grade === 'F' ? 'FAIL' : 'PASS' };
        }
        return { grade: 'F', point: '0.00', status: 'FAIL' };
    };

    const handleSave = async () => {
        if (!selectedSubject || !onSave) return;

        setIsSaving(true);
        try {
            await onSave(selectedSubject.id, {
                totalMarks: subjectMarks[selectedSubject.id] || 100,
                gradingRules: subjectRules[selectedSubject.id] || DEFAULT_RULES
            });
            setShowSaved(true);
            setTimeout(() => setShowSaved(false), 2000);
        } finally {
            setIsSaving(false);
        }
    };

    const currentTotal = selectedSubject ? (subjectMarks[selectedSubject.id] || 100) : 100;
    const currentRules = selectedSubject ? (subjectRules[selectedSubject.id] || DEFAULT_RULES) : DEFAULT_RULES;
    const { grade, point, status } = calculateGrade(demoScore, currentTotal, currentRules);

    const handleSaveRules = (newRules: GradingRule[], newTotal: number) => {
        if (selectedSubject) {
            setSubjectRules({ ...subjectRules, [selectedSubject.id]: newRules });
            setSubjectMarks({ ...subjectMarks, [selectedSubject.id]: newTotal });
            setIsRulesModalOpen(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={selectedSubject ? (selectedSubject.nameBangla || selectedSubject.name) : "বিষয় সেটিংস"}
                maxWidth="max-w-5xl"
            >
                <div className="flex flex-col md:flex-row h-[85vh] md:h-[80vh] bg-white relative overflow-hidden">
                    {/* Left Pane: Subject List (Mobile Drawer & Desktop Sidebar) */}
                    <div className={`
                        fixed md:static inset-y-0 left-0 z-50 w-72 bg-white md:bg-slate-50/50 border-r border-slate-100 flex flex-col p-4 md:p-5 space-y-4 shrink-0 transition-transform duration-300 ease-in-out
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                    `}>
                        <div className="flex items-center justify-between mb-1">
                            <div>
                                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">বিষয় তালিকা</h3>
                                <p className="text-[9px] font-medium text-slate-400">ব্যালেন্স সিলেক্ট করুন</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white text-[#045c84] rounded-lg text-[10px] font-semibold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
                                    <Copy size={11} />
                                    <span>Copy</span>
                                </button>
                                <button
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="md:hidden p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:text-slate-600"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 space-y-1.5 overflow-y-auto px-1 custom-scrollbar -mx-1">
                            {subjects.map((sub, idx) => (
                                <button
                                    key={sub.id}
                                    onClick={() => {
                                        setSelectedSubject(sub);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border text-left ${selectedSubject?.id === sub.id
                                        ? 'bg-white border-[#045c84] shadow-sm z-10'
                                        : 'bg-transparent border-transparent hover:bg-white/50 hover:border-slate-200 opacity-70'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className="text-[10px] font-medium text-slate-400">{idx + 1}.</span>
                                        <div className="flex flex-col">
                                            <span className={`text-[13px] font-semibold leading-tight ${selectedSubject?.id === sub.id ? 'text-[#045c84]' : 'text-slate-700'}`}>
                                                {sub.nameBangla || sub.name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] font-semibold text-slate-800">{subjectMarks[sub.id] || 100}</span>
                                            <span className="text-[7px] font-semibold text-slate-400 uppercase leading-none">Marks</span>
                                        </div>
                                        <ChevronRight size={12} className={selectedSubject?.id === sub.id ? 'text-[#045c84]' : 'text-slate-300'} />
                                    </div>
                                </button>
                            ))}
                            {subjects.length === 0 && (
                                <div className="py-8 text-center text-slate-400">
                                    <BookOpen size={20} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-[9px] font-semibold uppercase">কোন বিষয় পাওয়া যায়নি</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Sidebar Overlay */}
                    {isSidebarOpen && (
                        <div
                            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden"
                            onClick={() => setIsSidebarOpen(false)}
                        />
                    )}

                    <div className="flex-1 flex flex-col min-w-0 bg-white">
                        <div className="p-4 md:px-8 md:py-4 pb-1 border-b border-slate-100 flex items-center gap-4 shrink-0 overflow-hidden">
                            {/* Mobile Hamburger Button */}
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="md:hidden p-1.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-200"
                            >
                                <Menu size={18} />
                            </button>

                            {/* Tabs */}
                            <div className="flex-1 flex items-center gap-0.5 overflow-x-auto no-scrollbar scrollbar-hide">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`relative px-3.5 py-2.5 text-[10px] md:text-[11px] font-semibold tracking-wider transition-all rounded-t-lg flex items-center gap-1.5 shrink-0 ${activeTab === tab.id
                                            ? 'text-[#045c84] bg-white border-t border-x border-slate-100'
                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'
                                            }`}
                                    >
                                        <tab.icon size={12} />
                                        <span>{tab.label}</span>
                                        {activeTab === tab.id && (
                                            <div className="absolute -bottom-[1.5px] left-0 right-0 h-[1.5px] bg-white z-10" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 p-4 md:p-6 pt-4 overflow-y-auto space-y-4">
                            {/* Clean wide Demo Score Bar */}
                            <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-2 px-3 md:px-5 flex items-center justify-between gap-4 w-full group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white text-[#045c84] rounded-lg shadow-sm flex items-center justify-center border border-slate-200/50">
                                        <TrendingUp size={15} />
                                    </div>
                                    <div className="flex items-center gap-2 md:gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">ফলাফল যাচাই</span>
                                            <div className="flex items-center gap-2 bg-white rounded-xl p-1 px-3 border border-slate-200 shadow-sm focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                                                <input
                                                    type="number"
                                                    value={demoScore === 0 ? '' : demoScore}
                                                    placeholder="০"
                                                    onFocus={(e) => e.target.select()}
                                                    onChange={(e) => {
                                                        const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                        setDemoScore(Math.min(currentTotal, Math.max(0, val)));
                                                    }}
                                                    className="w-16 md:w-24 px-0 py-1 md:py-1.5 text-base md:text-xl font-bold text-[#045c84] focus:outline-none rounded-lg text-center bg-transparent appearance-none"
                                                />
                                                <span className="text-xs md:text-sm font-semibold text-slate-300">/ {currentTotal}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 md:gap-10 shrink-0">
                                    <div className="flex items-center gap-4 md:gap-8">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">পয়েন্ট</span>
                                            <span className="text-base md:text-lg font-semibold text-slate-800 tabular-nums">{point}</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[7px] font-semibold text-slate-400 uppercase tracking-widest leading-none mb-1">গ্রেড</span>
                                            <span className="text-lg md:text-xl font-semibold text-indigo-600 leading-none">{grade}</span>
                                        </div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-semibold tracking-widest shadow-sm border transition-all ${status === 'PASS'
                                        ? 'bg-emerald-500 text-white border-emerald-600'
                                        : 'bg-red-500 text-white border-red-600'
                                        }`}>
                                        {status === 'PASS' ? 'পাস' : 'ফেইল'}
                                    </div>
                                </div>
                            </div>

                            {/* Configuration Rows */}
                            <div className="space-y-3">
                                {/* Total Marks Setting */}
                                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 px-4 flex items-center justify-between gap-6 group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white text-[#045c84] rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
                                            <BookOpen size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="text-[10px] md:text-[11px] font-semibold text-slate-800 uppercase tracking-widest">বিষয়ের পূর্ণমান</h4>
                                            <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight">
                                                ফলাফল হিসেবের জন্য মোট নম্বর নির্ধারণ করুন
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={subjectMarks[selectedSubject?.id] || ''}
                                            placeholder="১০০"
                                            onFocus={(e) => e.target.select()}
                                            onChange={(e) => {
                                                if (selectedSubject) {
                                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                                    setSubjectMarks({ ...subjectMarks, [selectedSubject.id]: val });
                                                }
                                            }}
                                            className="w-24 md:w-32 bg-white border border-slate-200 rounded-xl px-4 py-2 text-lg md:text-xl font-semibold text-center text-[#045c84] focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Grading System Setting */}
                                <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 px-4 flex items-center justify-between gap-6 group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
                                            <Settings size={16} />
                                        </div>
                                        <div className="flex flex-col">
                                            <h4 className="text-[10px] md:text-[11px] font-semibold text-slate-800 uppercase tracking-widest">গ্রেডিং সিস্টেম</h4>
                                            <p className="text-[9px] font-medium text-slate-400 leading-relaxed uppercase tracking-tight">
                                                {currentRules.length}টি নিয়ম ব্যবহৃত হচ্ছে (কাস্টম ম্যাপিং)
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setIsRulesModalOpen(true)}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-[10px] md:text-[11px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
                                    >
                                        <Settings2 size={15} />
                                        <span>পরিবর্তন</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 md:p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3 md:gap-4 shrink-0">
                            <button
                                onClick={onClose}
                                className="px-6 md:px-8 py-3 md:py-3.5 bg-white border border-slate-200 text-slate-500 rounded-xl font-semibold text-[11px] md:text-sm hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <X size={16} className="md:w-5 md:h-5 opacity-70" />
                                <span>বাতিল</span>
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || showSaved}
                                className={`px-8 md:px-12 py-3 md:py-3.5 rounded-xl font-semibold text-[11px] md:text-sm shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed ${showSaved
                                    ? 'bg-emerald-500 text-white shadow-emerald-100'
                                    : 'bg-gradient-to-r from-[#045c84] to-[#0374a8] text-white shadow-[#045c84]/40'
                                    }`}
                            >
                                {showSaved ? (
                                    <>
                                        <CheckCircle size={16} className="md:w-5 md:h-5" />
                                        <span>সেভ করা হয়েছে!</span>
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} className={`md:w-5 md:h-5 ${isSaving ? 'animate-spin' : ''}`} />
                                        <span>{isSaving ? "সংরক্ষণ হচ্ছে..." : "সেভ করুন"}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>

            <GradingRulesModal
                isOpen={isRulesModalOpen}
                onClose={() => setIsRulesModalOpen(false)}
                subjectName={selectedSubject?.nameBangla || selectedSubject?.name || ''}
                totalMarks={currentTotal}
                initialRules={currentRules}
                onSave={handleSaveRules}
            />
        </>
    );
}

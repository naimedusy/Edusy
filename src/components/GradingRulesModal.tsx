'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RotateCcw } from 'lucide-react';
import Modal from './Modal';

interface GradingRule {
    minMarks: number;
    grade: string;
    point: string;
}

interface GradingRulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    subjectName: string;
    totalMarks: number;
    onSave: (rules: GradingRule[], totalMarks: number) => void;
    initialRules?: GradingRule[];
}

const DEFAULT_RULES: GradingRule[] = [
    { minMarks: 80, grade: 'A+', point: '5' },
    { minMarks: 70, grade: 'A', point: '4' },
    { minMarks: 60, grade: 'A-', point: '3.5' },
    { minMarks: 50, grade: 'B', point: '3' },
    { minMarks: 40, grade: 'C', point: '2' },
    { minMarks: 33, grade: 'D', point: '1' },
    { minMarks: 0, grade: 'F', point: '0' },
];

const MADRASA_RULES: GradingRule[] = [
    { minMarks: 80, grade: 'মুমতাজ', point: '5' },
    { minMarks: 70, grade: 'জাইয়্যিদ জিদ্দান', point: '4' },
    { minMarks: 60, grade: 'জাইয়্যিদ', point: '3.5' },
    { minMarks: 50, grade: 'মাকবুল', point: '3' },
    { minMarks: 33, grade: 'রাসেব (পাস)', point: '1' },
    { minMarks: 0, grade: 'রাসেব (ফেল)', point: '0' },
];

export default function GradingRulesModal({
    isOpen,
    onClose,
    subjectName,
    totalMarks: initialTotalMarks,
    onSave,
    initialRules
}: GradingRulesModalProps) {
    const [rules, setRules] = useState<GradingRule[]>(initialRules || DEFAULT_RULES);
    const [localTotalMarks, setLocalTotalMarks] = useState(initialTotalMarks);
    const [activePreset, setActivePreset] = useState<number | 'Custom'>(
        [100, 50, 25].includes(initialTotalMarks) ? initialTotalMarks : 'Custom'
    );
    const [gradingType, setGradingType] = useState<'General' | 'Madrasa'>('General');

    useEffect(() => {
        if (isOpen) {
            setRules(initialRules || DEFAULT_RULES);
            setLocalTotalMarks(initialTotalMarks);
            setActivePreset([100, 50, 25].includes(initialTotalMarks) ? initialTotalMarks : 'Custom');

            // Guess grading type based on existing rules
            const isMadrasa = initialRules?.some(r => r.grade.includes('মুমতাজ') || r.grade.includes('জাইয়্যিদ'));
            setGradingType(isMadrasa ? 'Madrasa' : 'General');

            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initialRules, initialTotalMarks]);

    const handleAddRow = () => {
        setRules([...rules, { minMarks: 0, grade: '', point: '' }]);
    };

    const handleRemoveRow = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const handleUpdateRule = (index: number, field: keyof GradingRule, value: string | number) => {
        const newRules = [...rules];
        newRules[index] = { ...newRules[index], [field]: value };
        setRules(newRules);
    };

    const handleReset = () => {
        const targetRules = gradingType === 'General' ? DEFAULT_RULES : MADRASA_RULES;
        setRules(targetRules);
    };

    const handlePresetChange = (preset: number | 'Custom') => {
        setActivePreset(preset);
        if (typeof preset === 'number') {
            setLocalTotalMarks(preset);
        }
    };

    const handleTypeChange = (type: 'General' | 'Madrasa') => {
        setGradingType(type);
        setRules(type === 'General' ? DEFAULT_RULES : MADRASA_RULES);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${subjectName} (ডিফল্ট)`}
            maxWidth="max-w-[840px]"
        >
            <div className="w-full bg-white overflow-hidden flex flex-col">
                <div className="p-5 md:p-10">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-slate-400 text-[10px] md:text-xs font-medium">সর্বোচ্চ মার্কস থেকে শুরু করে সর্বনিম্ন মার্কস পর্যন্ত সাজান।</p>

                            <div className="flex p-0.5 md:p-1 bg-slate-100/80 rounded-xl border border-slate-200/50">
                                <button
                                    onClick={() => handleTypeChange('General')}
                                    className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-semibold transition-all ${gradingType === 'General'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    General
                                </button>
                                <button
                                    onClick={() => handleTypeChange('Madrasa')}
                                    className={`px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-[11px] font-semibold transition-all ${gradingType === 'Madrasa'
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    Madrasa
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 border border-blue-100/50 rounded-2xl p-4 flex items-center justify-between mb-6">
                            <div className="flex flex-col">
                                <span className="text-[10px] md:text-xs font-semibold text-slate-800 tracking-tight">Total Marks</span>
                                <span className="hidden md:block text-[10px] font-medium text-slate-400">Normalized to 100%.</span>
                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={localTotalMarks}
                                    onFocus={(e) => e.target.select()}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setLocalTotalMarks(val);
                                        setActivePreset([100, 75, 50, 25].includes(val) ? val : 'Custom');
                                    }}
                                    className="bg-white px-4 md:px-8 py-2 md:py-3 rounded-xl border border-slate-200 text-lg md:text-xl font-semibold text-slate-800 w-24 md:w-32 text-center focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-2 mb-8">
                            {[100, 75, 50, 25, 'Custom'].map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => handlePresetChange(preset as any)}
                                    className={`px-3 md:px-5 py-1.5 md:py-2 rounded-lg text-[10px] md:text-xs font-semibold transition-all border ${activePreset === preset
                                        ? 'bg-blue-50 border-[#045c84] text-[#045c84]'
                                        : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
                                        }`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div
                        className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 md:pr-3 custom-scrollbar mb-8"
                        data-lenis-prevent
                    >
                        <div className="grid grid-cols-[0.7fr_1.3fr_0.7fr_32px] md:grid-cols-[0.6fr_1.6fr_0.6fr_60px] gap-1.5 md:gap-6 mb-1 px-0.5">
                            <span className="text-[8px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center">Marks</span>
                            <span className="text-[8px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center">Grade</span>
                            <span className="text-[8px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center">Point</span>
                            <span className="text-[8px] md:text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-center">X</span>
                        </div>

                        {rules.map((rule, idx) => {
                            // Calculate display value based on current total marks
                            // Internal minMarks is always a percentage (0-100)
                            const displayValue = Math.round((rule.minMarks * localTotalMarks) / 100);

                            return (
                                <div key={idx} className="grid grid-cols-[0.7fr_1.3fr_0.7fr_32px] md:grid-cols-[0.6fr_1.6fr_0.6fr_60px] gap-1.5 md:gap-6 items-center animate-in fade-in slide-in-from-left-1 duration-200">
                                    <input
                                        type="number"
                                        value={displayValue}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 0;
                                            const perc = (val / localTotalMarks) * 100;
                                            handleUpdateRule(idx, 'minMarks', perc);
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-center"
                                    />
                                    <input
                                        type="text"
                                        value={rule.grade}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => handleUpdateRule(idx, 'grade', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 md:px-5 py-2 md:py-2.5 text-[11px] md:text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-center"
                                    />
                                    <input
                                        type="text"
                                        value={rule.point}
                                        onFocus={(e) => e.target.select()}
                                        onChange={(e) => handleUpdateRule(idx, 'point', e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-2 md:px-4 py-2 md:py-2.5 text-[11px] md:text-sm font-semibold text-slate-700 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-center"
                                    />
                                    <button
                                        onClick={() => handleRemoveRow(idx)}
                                        className="w-full h-8 md:h-10 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-all"
                                    >
                                        <Trash2 size={14} className="md:w-5 md:h-5" />
                                    </button>
                                </div>
                            );
                        })}

                        <button
                            onClick={handleAddRow}
                            className="flex items-center gap-2 px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition-all mb-4"
                        >
                            <Plus size={16} />
                            <span>নতুন রো</span>
                        </button>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-2 px-6 py-3 bg-orange-400 hover:bg-orange-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-orange-100 transition-all"
                        >
                            <RotateCcw size={16} />
                            <span>ডিফল্ট রিসেট</span>
                        </button>

                        <div className="flex items-center gap-3 md:gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 md:px-10 py-3.5 md:py-4 bg-white border border-slate-200 text-slate-500 rounded-xl text-sm md:text-base font-semibold hover:bg-slate-50 hover:text-slate-600 transition-all active:scale-95"
                            >
                                বাতিল
                            </button>
                            <button
                                onClick={() => onSave(rules, localTotalMarks)}
                                className="px-10 md:px-16 py-3.5 md:py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-sm md:text-base font-semibold shadow-[0_10px_20px_-10px_rgba(79,70,229,0.4)] hover:shadow-[0_15px_25px_-10px_rgba(79,70,229,0.5)] hover:-translate-y-0.5 active:scale-95 transition-all"
                            >
                                সেভ করুন
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

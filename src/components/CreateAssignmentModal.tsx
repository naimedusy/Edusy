'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    ClipboardList,
    Calendar,
    BookOpen,
    Type,
    FileText,
    Target,
    Plus,
    Trash2,
    Link as LinkIcon,
    Check,
    List,
    MessageSquare,
    Users,
    Search,
    User
} from 'lucide-react';

interface CreateAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    classes: any[];
    books: any[];
    teacherId: string;
    instituteId: string;
    initialClassId?: string | null;
    initialBookId?: string | null;
    scheduledDate?: string;
}

// Quick Tags Configuration
const QUICK_TAGS = [
    { label: 'পড়া', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { label: 'লেখা', color: 'bg-blue-50 text-[#045c84] border-blue-100' },
    { label: 'মুখস্থ', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { label: 'নোট', color: 'bg-slate-50 text-slate-600 border-slate-200' },
    { label: 'অনুশীলনী', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' }
];

// Comment Chips Configuration
const COMMENT_CHIPS = [
    { label: 'উপকরণ নেই', text: 'আজ ক্লাসে {subject} এর উপকরণ আনেনি।' },
    { label: 'মনোযোগী ছিল না', text: 'আজ ক্লাসে অমনোযোগী ছিল।' },
    { label: 'ভালো করেছে', text: 'আজকের পারফর্মেন্স খুব ভালো ছিল।' },
    { label: 'পড়া শিখেনি', text: 'আজকের পড়া শিখেনি।' },
    { label: 'বাড়ির কাজ করেনি', text: 'আজকের বাড়ির কাজ জমা দেয়নি।' }
];

interface TaskLine {
    id: string;
    text: string;
}

export default function CreateAssignmentModal({
    isOpen,
    onClose,
    onSave,
    classes,
    books,
    teacherId,
    instituteId,
    initialClassId,
    initialBookId,
    scheduledDate
}: CreateAssignmentModalProps) {
    const [loading, setLoading] = useState(false);

    // 3 Distinct Task Sections
    const [classworkTasks, setClassworkTasks] = useState<TaskLine[]>([{ id: 'cw-1', text: '' }]);
    const [prepTasks, setPrepTasks] = useState<TaskLine[]>([{ id: 'pr-1', text: '' }]);
    const [homeworkTasks, setHomeworkTasks] = useState<TaskLine[]>([{ id: 'hw-1', text: '' }]);

    const [comment, setComment] = useState('');
    const [showStudentPicker, setShowStudentPicker] = useState(false);
    const [classStudents, setClassStudents] = useState<any[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const studentPickerRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        type: 'HOMEWORK',
        deadline: '',
        classId: initialClassId || '',
        groupId: '',
        bookId: initialBookId || '',
        resources: [] as any[],
        releaseAt: ''
    });

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                title: '',
                resources: [],
                classId: initialClassId || prev.classId,
                bookId: initialBookId || prev.bookId
            }));
            setClassworkTasks([{ id: Date.now().toString() + 'cw', text: '' }]);
            setPrepTasks([{ id: Date.now().toString() + 'pr', text: '' }]);
            setHomeworkTasks([{ id: Date.now().toString() + 'hw', text: '' }]);
            setComment('');
            setStudentSearch('');
            if (initialClassId) {
                fetchClassStudents(initialClassId);
            }
        }
    }, [isOpen, initialClassId, initialBookId]);

    // Fetch students when class changes
    useEffect(() => {
        if (formData.classId && isOpen) {
            fetchClassStudents(formData.classId);
        }
    }, [formData.classId, isOpen]);

    const fetchClassStudents = async (classId: string) => {
        try {
            const res = await fetch(`/api/admin/users?role=STUDENT&instituteId=${instituteId}&classId=${classId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setClassStudents(data);
            }
        } catch (error) {
            console.error('Failed to fetch students:', error);
        }
    };

    // Close student picker on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (studentPickerRef.current && !studentPickerRef.current.contains(event.target as Node)) {
                setShowStudentPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const syncCWToPR = () => {
        setPrepTasks(classworkTasks.map(task => ({
            ...task,
            id: Date.now().toString() + 'pr' + Math.random(),
        })));
    };

    // Task Helpers
    const handleTaskChange = (section: 'cw' | 'pr' | 'hw', id: string, value: string) => {
        const setter = section === 'cw' ? setClassworkTasks : section === 'pr' ? setPrepTasks : setHomeworkTasks;
        setter(prev => prev.map(t => t.id === id ? { ...t, text: value } : t));
    };

    const addTaskLine = (section: 'cw' | 'pr' | 'hw') => {
        const setter = section === 'cw' ? setClassworkTasks : section === 'pr' ? setPrepTasks : setHomeworkTasks;
        setter(prev => [...prev, { id: Date.now().toString() + section, text: '' }]);
    };

    const removeTaskLine = (section: 'cw' | 'pr' | 'hw', id: string) => {
        const setter = section === 'cw' ? setClassworkTasks : section === 'pr' ? setPrepTasks : setHomeworkTasks;
        setter(prev => {
            if (prev.length === 1) return prev;
            return prev.filter(t => t.id !== id);
        });
    };

    const appendTagToTask = (section: 'cw' | 'pr' | 'hw', tagLabel: string) => {
        const tasks = section === 'cw' ? classworkTasks : section === 'pr' ? prepTasks : homeworkTasks;
        const lastTask = tasks[tasks.length - 1];
        const newText = lastTask.text ? `${lastTask.text} - [${tagLabel}]` : `[${tagLabel}] `;
        handleTaskChange(section, lastTask.id, newText);
    };

    // Comment Helpers
    const insertComment = (text: string) => {
        const selectedBook = books.find(b => b.id === formData.bookId);
        const bookName = selectedBook ? selectedBook.name : 'বিষয়';
        const processedText = text.replace(/{subject}/g, bookName);

        setComment(prev => prev ? `${prev}\n${processedText}` : processedText);
    };

    const insertStudentName = (name: string) => {
        setComment(prev => prev ? `${prev} ${name} ` : `${name} `);
        setShowStudentPicker(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Serialize structured data into description
        let structuredDescription = '';

        const formatSection = (title: string, tasks: TaskLine[]) => {
            const validTasks = tasks.map(t => t.text.trim()).filter(t => t);
            if (validTasks.length > 0) {
                return `### ${title}\n${validTasks.map(t => `- ${t}`).join('\n')}\n\n`;
            }
            return '';
        };

        structuredDescription += formatSection('ক্লাসের পড়া (Classwork)', classworkTasks);
        structuredDescription += formatSection('আগামীকাল ক্লাসের পড়া (Preparation)', prepTasks);
        structuredDescription += formatSection('বাড়ির কাজ (Homework)', homeworkTasks);

        if (comment.trim()) {
            structuredDescription += `### মন্তব্য (Comments)\n${comment.trim()}`;
        }

        // If nothing entered, don't submit empty
        if (!structuredDescription.trim() && !formData.title) {
            setLoading(false);
            return;
        }

        // If no title provided, auto-generate one from the first task or default
        let finalTitle = formData.title;
        if (!finalTitle) {
            const firstTask = classworkTasks[0]?.text || prepTasks[0]?.text || homeworkTasks[0]?.text;
            finalTitle = firstTask ? firstTask.substring(0, 30) + (firstTask.length > 30 ? '...' : '') : 'Daily Assignment';
        }

        try {
            await onSave({
                ...formData,
                title: finalTitle,
                description: structuredDescription,
                teacherId,
                instituteId,
                scheduledDate
            });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = classStudents.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(studentSearch.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-bengali">
            <div className="bg-white rounded-[32px] w-full max-w-4xl overflow-hidden shadow-2xl animate-scale-in flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#045c84] to-[#067ab8] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-900/20">
                            <Plus size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">অ্যাসাইনমেন্ট তৈরি করুন</h3>
                            <p className="text-[10px] text-[#045c84] font-black uppercase tracking-widest mt-0.5">
                                {scheduledDate && scheduledDate !== new Date().toISOString().split('T')[0]
                                    ? <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">⚠️ {scheduledDate} (অতীত রেকর্ড)</span>
                                    : 'শিক্ষার্থীদের জন্য আজকের কাজ'
                                }
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                    <div className="p-8 space-y-8">

                        {/* 1. Selectors */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ক্লাস</label>
                                <div className="relative group">
                                    <Target className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84]" size={16} />
                                    <select
                                        required
                                        value={formData.classId}
                                        onChange={(e) => setFormData({ ...formData, classId: e.target.value, groupId: '' })}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none font-bold text-sm text-slate-700"
                                    >
                                        <option value="">ক্লাস নির্বাচন করুন</option>
                                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">বিষয় / বই</label>
                                <div className="relative group">
                                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84]" size={16} />
                                    <select
                                        required
                                        value={formData.bookId}
                                        onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none font-bold text-sm text-slate-700"
                                    >
                                        <option value="">বই নির্বাচন করুন</option>
                                        {books.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Optional Title */}
                        <div className="space-y-1">
                            <input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-3 bg-white border-b-2 border-slate-100 focus:border-[#045c84] transition-colors outline-none font-black text-xl text-slate-800 placeholder:text-slate-300"
                                placeholder="কাজের শিরোনাম (ঐচ্ছিক)"
                            />
                        </div>

                        {/* Scheduling Settings */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-6">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                    <Calendar size={12} />
                                    রিলিজ টাইম (Release Time)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.releaseAt}
                                    onChange={(e) => setFormData({ ...formData, releaseAt: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none font-bold text-sm text-slate-700"
                                />
                                <p className="text-[9px] text-slate-400 font-medium ml-1">ঐচ্ছিক: এই সময়ের আগে শিক্ষার্থীরা এটি দেখতে পাবে না। খালি রাখলে সাথে সাথে রিলিজ হবে।</p>
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                    <Calendar size={12} />
                                    ডেডলাইন (Deadline)
                                </label>
                                <input
                                    type="datetime-local"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none font-bold text-sm text-slate-700"
                                />
                                <p className="text-[9px] text-slate-400 font-medium ml-1">ঐচ্ছিক: শিক্ষার্থীরা এই সময়ের পর কাজ জমা দিতে পারবে না।</p>
                            </div>
                        </div>


                        {/* 2. Categorized Task Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Left Column: Classwork & Prep */}
                            <div className="space-y-6">
                                {/* Classwork */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-[#045c84] uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-[#045c84]"></span>
                                            ক্লাসের পড়া (Classwork)
                                        </label>
                                        <button
                                            type="button"
                                            onClick={syncCWToPR}
                                            className="text-[9px] font-bold text-[#045c84] bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-all border border-blue-100"
                                        >
                                            <LinkIcon size={10} className="inline mr-1" />
                                            আগামীকালের পড়ায় যোগ করুন
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {classworkTasks.map((task, idx) => (
                                            <div key={task.id} className="flex gap-2">
                                                <input
                                                    value={task.text}
                                                    onChange={(e) => handleTaskChange('cw', task.id, e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-blue-50/30 border border-blue-100 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none text-sm font-medium"
                                                    placeholder="ক্লাসে কি পড়ানো হয়েছে..."
                                                />
                                                {classworkTasks.length > 1 && (
                                                    <button type="button" onClick={() => removeTaskLine('cw', task.id)} className="text-slate-300 hover:text-red-400"><X size={16} /></button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => addTaskLine('cw')} className="text-[10px] font-bold text-[#045c84] hover:underline">+ লাইন যোগ করুন</button>
                                            <div className="flex gap-1 ml-auto">
                                                {QUICK_TAGS.slice(0, 3).map(tag => (
                                                    <button key={tag.label} type="button" onClick={() => appendTagToTask('cw', tag.label)} className={`text-[9px] px-2 py-0.5 rounded ${tag.color} opacity-70 hover:opacity-100`}>{tag.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Preparation (Tomorrow) */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                                            আগামীকাল ক্লাসের পড়া
                                        </label>
                                        <button
                                            type="button"
                                            onClick={syncCWToPR}
                                            className="text-[9px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded transition-all border border-purple-100"
                                        >
                                            <LinkIcon size={10} className="inline mr-1" />
                                            আজকের পড়া থেকে কপি করুন
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        {prepTasks.map((task, idx) => (
                                            <div key={task.id} className="flex gap-2">
                                                <input
                                                    value={task.text}
                                                    onChange={(e) => handleTaskChange('pr', task.id, e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-purple-50/30 border border-purple-100 rounded-lg focus:ring-2 focus:ring-purple-200 outline-none text-sm font-medium"
                                                    placeholder="আগামীকাল কি পড়ে আসতে হবে..."
                                                />
                                                {prepTasks.length > 1 && (
                                                    <button type="button" onClick={() => removeTaskLine('pr', task.id)} className="text-slate-300 hover:text-red-400"><X size={16} /></button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => addTaskLine('pr')} className="text-[10px] font-bold text-purple-600 hover:underline">+ লাইন যোগ করুন</button>
                                            <div className="flex gap-1 ml-auto">
                                                {QUICK_TAGS.map(tag => (
                                                    <button key={tag.label} type="button" onClick={() => appendTagToTask('pr', tag.label)} className={`text-[9px] px-2 py-0.5 rounded ${tag.color} opacity-70 hover:opacity-100`}>{tag.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Homework & Comments */}
                            <div className="space-y-6">
                                {/* Homework */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-600"></span>
                                            বাড়ির কাজ (Homework)
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        {homeworkTasks.map((task, idx) => (
                                            <div key={task.id} className="flex gap-2">
                                                <input
                                                    value={task.text}
                                                    onChange={(e) => handleTaskChange('hw', task.id, e.target.value)}
                                                    className="flex-1 px-3 py-2 bg-orange-50/30 border border-orange-100 rounded-lg focus:ring-2 focus:ring-orange-200 outline-none text-sm font-medium"
                                                    placeholder="বাড়িতে কি কাজ করতে হবে..."
                                                />
                                                {homeworkTasks.length > 1 && (
                                                    <button type="button" onClick={() => removeTaskLine('hw', task.id)} className="text-slate-300 hover:text-red-400"><X size={16} /></button>
                                                )}
                                            </div>
                                        ))}
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => addTaskLine('hw')} className="text-[10px] font-bold text-orange-600 hover:underline">+ লাইন যোগ করুন</button>
                                            <div className="flex gap-1 ml-auto">
                                                {QUICK_TAGS.filter(t => t.label === 'বাড়ির কাজ' || t.label === 'লেখা' || t.label === 'অনুশীলনী').map(tag => (
                                                    <button key={tag.label} type="button" onClick={() => appendTagToTask('hw', tag.label)} className={`text-[9px] px-2 py-0.5 rounded ${tag.color} opacity-70 hover:opacity-100`}>{tag.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Comments Section */}
                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={14} />
                                        মন্তব্য (Comments)
                                    </label>

                                    <div className="relative">
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#045c84]/20 outline-none text-sm font-medium resize-none"
                                            placeholder="ক্লাস সম্পর্কে বা নির্দিষ্ট শিক্ষার্থীর জন্য মন্তব্য লিখুন..."
                                        />

                                        {/* Student Tagging Button */}
                                        <div className="absolute bottom-3 right-3">
                                            <div className="relative" ref={studentPickerRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowStudentPicker(!showStudentPicker)}
                                                    className="p-1.5 bg-slate-200 hover:bg-[#045c84] hover:text-white rounded-lg transition-colors text-slate-500"
                                                    title="শিক্ষার্থী সিলেক্ট করুন"
                                                >
                                                    <Users size={16} />
                                                </button>

                                                {/* Student Picker Popup */}
                                                {showStudentPicker && (
                                                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                                                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                                                            <div className="relative">
                                                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                                                                <input
                                                                    type="text"
                                                                    value={studentSearch}
                                                                    onChange={(e) => setStudentSearch(e.target.value)}
                                                                    className="w-full pl-7 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#045c84]"
                                                                    placeholder="শিক্ষার্থী খুঁজুন..."
                                                                    autoFocus
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-48 overflow-y-auto p-1">
                                                            {loading ? (
                                                                <p className="text-center py-4 text-xs text-slate-400">লোড হচ্ছে...</p>
                                                            ) : filteredStudents.length > 0 ? (
                                                                filteredStudents.map(student => (
                                                                    <button
                                                                        key={student.id}
                                                                        type="button"
                                                                        onClick={() => insertStudentName(student.name)}
                                                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center gap-2 group transition-colors"
                                                                    >
                                                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-500 font-bold group-hover:bg-[#045c84] group-hover:text-white">
                                                                            {student.name.charAt(0)}
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-xs font-bold text-slate-700 truncate">{student.name}</p>
                                                                            <p className="text-[10px] text-slate-400 truncate">{student.studentId || 'No ID'}</p>
                                                                        </div>
                                                                    </button>
                                                                ))
                                                            ) : (
                                                                <p className="text-center py-4 text-xs text-slate-400">কোন শিক্ষার্থী পাওয়া যায়নি</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Comment Chips */}
                                    <div className="flex flex-wrap gap-2">
                                        {COMMENT_CHIPS.map(chip => (
                                            <button
                                                key={chip.label}
                                                type="button"
                                                onClick={() => insertComment(chip.text)}
                                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-600 transition-colors"
                                            >
                                                {chip.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                        >
                            বাতিল করুন
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.classId || !formData.bookId}
                            className="flex-[2] px-6 py-4 bg-[#045c84] text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-1 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    সংরক্ষণ হচ্ছে...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    অ্যাসাইনমেন্ট সেভ করুন
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

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
    User,
    ArrowLeft,
    Save
} from 'lucide-react';
import Modal from './Modal';

interface AssignmentEditorPanelProps {
    onBack: () => void;
    onSave: (data: any) => Promise<void>;
    classes: any[];
    books: any[];
    teacherId: string;
    instituteId: string;
    initialClassId?: string | null;
    initialBookId?: string | null;
    scheduledDate?: string;
    initialAssignment?: any;
}

// Comprehensive Tag Library
const ALL_TAGS = [
    { id: 'read', label: 'পড়া', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'write', label: 'লেখা', color: 'bg-blue-50 text-[#045c84] border-blue-200' },
    { id: 'memo', label: 'মুখস্থ', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { id: 'notes', label: 'নোট', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'exercise', label: 'অনুশীলনী', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    { id: 'chapter', label: 'অধ্যায়', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'lesson', label: 'পাঠ', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    { id: 'meaning', label: 'শব্দার্থ', color: 'bg-lime-50 text-lime-700 border-lime-200' },
    { id: 'qa', label: 'প্রশ্ন-উত্তর', color: 'bg-violet-50 text-violet-700 border-violet-200' },
    { id: 'grammar', label: 'ব্যাকরণ', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
    { id: 'test', label: 'পরীক্ষা', color: 'bg-red-50 text-red-700 border-red-200' },
    { id: 'correction', label: 'সংশোধন', color: 'bg-yellow-50 text-yellow-800 border-yellow-300' },
    { id: 'drawing', label: 'ছবি/চিত্র', color: 'bg-pink-50 text-pink-700 border-pink-200' },
    { id: 'map', label: 'মানচিত্র', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    { id: 'mcq', label: 'MCQ', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { id: 'creative', label: 'সৃজনশীল', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    { id: 'excellent', label: 'চমৎকার', color: 'bg-blue-50 text-[#045c84] border-blue-200' },
    { id: 'attentive', label: 'মনোযোগী', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'improving', label: 'উন্নতি করছে', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'incomplete', label: 'অসম্পূর্ণ', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'late', label: 'দেরি', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'parent-call', label: 'অভিভাবক সাক্ষাত', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { id: 'behavior', label: 'আচরণ ভালো', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
];

const DEFAULT_PINNED_TAG_IDS = {
    cw: ['read', 'meaning', 'qa', 'notes'],
    pr: ['read', 'lesson', 'chapter', 'notes'],
    hw: ['exercise', 'mcq', 'creative', 'write'],
    cm: ['excellent', 'attentive', 'behavior', 'incomplete']
};

// Comment Chips Configuration
interface CommentChip {
    label: string;
    isDynamic: boolean;
    items?: string[];
    template: string;
}

const COMMENT_CHIPS: CommentChip[] = [
    {
        label: 'উপকরণ নেই',
        isDynamic: true,
        items: ['কলম', 'পেন্সিল', 'খাতা', 'বই', 'জ্যামিতি বক্স', 'রাবার', 'ক্যালকুলেটর', 'রং পেন্সিল', 'স্কেল'],
        template: 'আজ ক্লাসে {subject} এর {item} আনেনি।'
    },
    {
        label: 'খাতা শেষ',
        isDynamic: true,
        items: ['বাংলা খাতা', 'ইংরেজি খাতা', 'গণিত খাতা', 'বিজ্ঞান খাতা', 'খেলা খাতা', 'অনুশীলন খাতা'],
        template: 'আজকে {item} শেষ হয়ে গেছে।'
    },
    { label: 'মনোযোগী ছিল না', isDynamic: false, template: 'আজ ক্লাসে অমনোযোগী ছিল।' },
    { label: 'ভালো করেছে', isDynamic: false, template: 'আজকের পারফর্মেন্স খুব ভালো ছিল।' },
    { label: 'পড়া শিখেনি', isDynamic: false, template: 'আজকের পড়া শিখেনি।' },
    { label: 'বাড়ির কাজ করেনি', isDynamic: false, template: 'আজকের বাড়ির কাজ জমা দেয়নি।' },
    { label: 'অনুপস্থিত ছিল', isDynamic: false, template: 'আজ ক্লাসে অনুপস্থিত ছিল।' },
    { label: 'নোট সম্পূর্ণ নয়', isDynamic: false, template: 'ক্লাসের নোট সম্পূর্ণ করেনি।' },
    { label: 'পরীক্ষার প্রস্তুতি', isDynamic: false, template: 'আগামী পরীক্ষার জন্য ভালোভাবে প্রস্তুতি নিতে হবে।' }
];

interface Segment {
    id: string;
    type: 'text' | 'tag';
    value: string;
}

interface TaskLine {
    id: string;
    segments: Segment[];
    targetStudents?: string[];  // Student IDs for per-line targeting
}

export default function AssignmentEditorPanel({
    onBack,
    onSave,
    classes,
    books,
    teacherId,
    instituteId,
    initialClassId,
    initialBookId,
    scheduledDate,
    initialAssignment
}: AssignmentEditorPanelProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'CW' | 'PR' | 'HW' | 'CM'>('CW');

    // 3 Distinct Task Sections
    const [classworkTasks, setClassworkTasks] = useState<TaskLine[]>([
        { id: 'cw-1', segments: [{ id: 'seg-1', type: 'text', value: '' }] }
    ]);
    const [prepTasks, setPrepTasks] = useState<TaskLine[]>([
        { id: 'pr-1', segments: [{ id: 'seg-1', type: 'text', value: '' }] }
    ]);
    const [homeworkTasks, setHomeworkTasks] = useState<TaskLine[]>([
        { id: 'hw-1', segments: [{ id: 'seg-1', type: 'text', value: '' }] }
    ]);
    const [commentTasks, setCommentTasks] = useState<TaskLine[]>([
        { id: 'cm-1', segments: [{ id: 'seg-1', type: 'text', value: '' }] }
    ]);

    const [pageNumber, setPageNumber] = useState('');
    const [showStudentPicker, setShowStudentPicker] = useState(false);
    const [showTagLibrary, setShowTagLibrary] = useState(false);
    const [pinnedTagIds, setPinnedTagIds] = useState(DEFAULT_PINNED_TAG_IDS);
    const [classStudents, setClassStudents] = useState<any[]>([]);
    const [classGroups, setClassGroups] = useState<any[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const studentPickerRef = useRef<HTMLDivElement>(null);
    const tagLibraryRef = useRef<HTMLDivElement>(null);
    const [focusedTaskInfo, setFocusedTaskInfo] = useState<{ section: string, id: string, segmentId: string, cursorOffset: number } | null>(null);
    const [openStudentPickerTask, setOpenStudentPickerTask] = useState<{ section: string, id: string } | null>(null);

    const syncCWToPR = () => {
        setPrepTasks(classworkTasks.map(task => ({
            ...task,
            id: `pr-sync-${Date.now()}-${Math.random()}`,
            segments: task.segments.map(seg => ({ ...seg, id: `seg-sync-${Date.now()}-${Math.random()}` }))
        })));
        // Optional: Scroll to top or show toast?
    };

    // ... (helper functions)



    const [formData, setFormData] = useState({
        title: '',
        type: 'HOMEWORK',
        deadline: '',
        classId: initialClassId || '',
        groupId: '',
        bookId: initialBookId || '',
        resources: [] as any[],
        releaseAt: '',
        requireFaceVerify: initialAssignment?.requireFaceVerify || false
    });

    // Helper to get current tasks based on section
    const getTasksBySection = (section: string) => {
        switch (section) {
            case 'cw': return classworkTasks;
            case 'pr': return prepTasks;
            case 'hw': return homeworkTasks;
            case 'cm': return commentTasks;
            default: return [];
        }
    };

    const setTasksBySection = (section: string, newTasks: TaskLine[] | ((prev: TaskLine[]) => TaskLine[])) => {
        switch (section) {
            case 'cw': setClassworkTasks(newTasks); break;
            case 'pr': setPrepTasks(newTasks); break;
            case 'hw': setHomeworkTasks(newTasks); break;
            case 'cm': setCommentTasks(newTasks); break;
        }
    };

    const addTaskLine = (section: 'cw' | 'pr' | 'hw' | 'cm') => {
        const newId = `${section}-${Date.now()}`;
        const newSegmentId = `seg-${Date.now()}`;
        const newLine: TaskLine = { id: newId, segments: [{ id: newSegmentId, type: 'text', value: '' }] };

        setTasksBySection(section, (prev) => [...prev, newLine]);
    };

    const removeTaskLine = (section: 'cw' | 'pr' | 'hw' | 'cm', id: string) => {
        setTasksBySection(section, (prev) => prev.filter(t => t.id !== id));
    };

    const handleTaskChange = (section: 'cw' | 'pr' | 'hw' | 'cm', taskId: string, segmentId: string, value: string) => {
        setTasksBySection(section, (prev) => prev.map(task => {
            if (task.id !== taskId) return task;
            return {
                ...task,
                segments: task.segments.map(seg => seg.id === segmentId ? { ...seg, value } : seg)
            };
        }));
    };

    // Keyboard navigation helper
    const handleKeyDown = (section: 'cw' | 'pr' | 'hw' | 'cm', task: TaskLine, segmentId: string, e: React.KeyboardEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        const cursorPos = input.selectionStart || 0;
        const segmentIdx = task.segments.findIndex(s => s.id === segmentId);

        // Backspace at the beginning of a text segment - delete previous tag
        if (e.key === 'Backspace' && cursorPos === 0 && segmentIdx > 0) {
            const prevSegment = task.segments[segmentIdx - 1];
            if (prevSegment.type === 'tag') {
                e.preventDefault();
                removeTagFromTask(section as 'cw' | 'pr' | 'hw', task.id, prevSegment.id);
            }
        }

        // Delete at the end of a text segment - delete next tag
        if (e.key === 'Delete' && cursorPos === input.value.length && segmentIdx < task.segments.length - 1) {
            const nextSegment = task.segments[segmentIdx + 1];
            if (nextSegment.type === 'tag') {
                e.preventDefault();
                removeTagFromTask(section as 'cw' | 'pr' | 'hw', task.id, nextSegment.id);
            }
        }
    };

    // Initialize from initialAssignment if provided
    useEffect(() => {
        if (initialAssignment) {
            // Set basic form data
            setFormData({
                title: initialAssignment.title || '',
                type: initialAssignment.type || 'HOMEWORK',
                deadline: initialAssignment.deadline ? new Date(initialAssignment.deadline).toISOString().slice(0, 16) : '',
                classId: initialAssignment.classId || initialClassId || '',
                groupId: initialAssignment.groupId || '',
                bookId: initialAssignment.bookId || initialBookId || '',
                resources: initialAssignment.resources || [],
                releaseAt: initialAssignment.releaseAt ? new Date(initialAssignment.releaseAt).toISOString().slice(0, 16) : '',
                requireFaceVerify: initialAssignment.requireFaceVerify || false
            });

            // Parse description to populate tasks
            if (initialAssignment.description) {
                try {
                    const parsed = JSON.parse(initialAssignment.description);
                    if (parsed.version === '2.0' && parsed.sections) {
                        parsed.sections.forEach((section: any) => {
                            const tasks = section.tasks.map((t: any) => ({
                                id: t.id || `task-${Date.now()}-${Math.random()}`,
                                segments: t.segments,
                                targetStudents: t.targetStudents
                            }));

                            if (section.title.includes('Classwork')) setClassworkTasks(tasks);
                            if (section.title.includes('Preparation')) setPrepTasks(tasks);
                            if (section.title.includes('Homework')) setHomeworkTasks(tasks);
                            if (section.title.includes('Comments')) setCommentTasks(tasks);
                        });
                    }
                } catch (e) {
                    console.error("Failed to parse existing assignment description", e);
                }
            }
        }
    }, [initialAssignment]);

    // Initialize (Original Logic)
    useEffect(() => {
        if (initialClassId && !initialAssignment) {
            fetchClassStudents(initialClassId);
            fetchClassGroups(initialClassId);
        }
    }, [initialClassId, initialAssignment]);

    // Fetch students when class changes
    useEffect(() => {
        if (formData.classId) {
            fetchClassStudents(formData.classId);
            fetchClassGroups(formData.classId);
        }
    }, [formData.classId]);

    const fetchClassGroups = async (classId: string) => {
        try {
            const res = await fetch(`/api/admin/groups?classId=${classId}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setClassGroups(data);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        }
    };

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

    // Close student picker or tag library on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (studentPickerRef.current && !studentPickerRef.current.contains(event.target as Node)) {
                setShowStudentPicker(false);
            }
            if (tagLibraryRef.current && !tagLibraryRef.current.contains(event.target as Node)) {
                setShowTagLibrary(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTagPin = (tagId: string) => {
        if (activeTab === 'CM') return;
        const section = activeTab === 'CW' ? 'cw' : activeTab === 'PR' ? 'pr' : 'hw';

        setPinnedTagIds(prev => {
            const currentSectionPins = prev[section as keyof typeof prev];
            const isPinned = currentSectionPins.includes(tagId);
            return {
                ...prev,
                [section]: isPinned
                    ? currentSectionPins.filter(id => id !== tagId)
                    : [...currentSectionPins, tagId]
            };
        });
    };


    // Task Student Selection Helpers
    const toggleStudentForTask = (section: 'cw' | 'pr' | 'hw' | 'cm', taskId: string, studentId: string) => {
        setTasksBySection(section, prev => prev.map(t => {
            if (t.id !== taskId) return t;
            const currentStudents = t.targetStudents || [];
            const isSelected = currentStudents.includes(studentId);
            return {
                ...t,
                targetStudents: isSelected
                    ? currentStudents.filter(id => id !== studentId)
                    : [...currentStudents, studentId]
            };
        }));
    };

    const toggleAllStudentsForTask = (section: 'cw' | 'pr' | 'hw' | 'cm', taskId: string, select: boolean) => {
        setTasksBySection(section, prev => prev.map(t => {
            if (t.id !== taskId) return t;
            return {
                ...t,
                targetStudents: select ? classStudents.map(s => s.id) : []
            };
        }));
    };

    const toggleGroupStudentsForTask = (section: 'cw' | 'pr' | 'hw' | 'cm', taskId: string, groupId: string) => {
        const groupStudents = classStudents.filter(s => s.metadata?.groupId === groupId).map(s => s.id);
        if (groupStudents.length === 0) return;

        setTasksBySection(section, prev => prev.map(t => {
            if (t.id !== taskId) return t;
            const currentStudents = t.targetStudents || [];
            const allInGroupSelected = groupStudents.every(id => currentStudents.includes(id));

            let nextStudents;
            if (allInGroupSelected) {
                // Deselect all in group
                nextStudents = currentStudents.filter(id => !groupStudents.includes(id));
            } else {
                // Select all in group (add only missing ones)
                nextStudents = [...new Set([...currentStudents, ...groupStudents])];
            }

            return {
                ...t,
                targetStudents: nextStudents
            };
        }));
    };


    // Task Helpers



    const appendTagToTask = (section: 'cw' | 'pr' | 'hw' | 'cm', tagId: string) => {
        setTasksBySection(section, prev => {
            let targetLineIdx = prev.findIndex(t => t.id === focusedTaskInfo?.id);
            if (targetLineIdx === -1 || focusedTaskInfo?.section !== section) {
                targetLineIdx = prev.length - 1;
            }

            const updated = [...prev];
            const line = updated[targetLineIdx];

            // Find target segment to split
            let segmentIdx = line.segments.findIndex(s => s.id === focusedTaskInfo?.segmentId);
            if (segmentIdx === -1) {
                segmentIdx = line.segments.length - 1;
            }

            const segment = line.segments[segmentIdx];
            const newTagSegment: Segment = { id: 'seg-' + Date.now() + '-tag', type: 'tag', value: tagId };

            if (segment.type === 'text' && focusedTaskInfo?.cursorOffset !== undefined) {
                const offset = focusedTaskInfo.cursorOffset;
                const textBefore = segment.value.slice(0, offset);
                const textAfter = segment.value.slice(offset);

                const newSegments: Segment[] = [
                    ...line.segments.slice(0, segmentIdx),
                    { ...segment, value: textBefore },
                    newTagSegment,
                    { id: 'seg-' + (Date.now() + 1) + '-text', type: 'text', value: textAfter },
                    ...line.segments.slice(segmentIdx + 1)
                ];
                updated[targetLineIdx] = { ...line, segments: newSegments };
            } else {
                // Just append if not splitting text
                updated[targetLineIdx] = {
                    ...line,
                    segments: [...line.segments, newTagSegment, { id: 'seg-' + (Date.now() + 1) + '-text', type: 'text', value: '' }]
                };
            }

            return updated;
        });
    };

    const removeTagFromTask = (section: 'cw' | 'pr' | 'hw' | 'cm', taskId: string, segmentId: string) => {
        setTasksBySection(section, prev => prev.map(t => {
            if (t.id !== taskId) return t;

            const filtered = t.segments.filter(s => s.id !== segmentId);
            const merged: Segment[] = [];

            filtered.forEach(seg => {
                const last = merged[merged.length - 1];
                if (last && last.type === 'text' && seg.type === 'text') {
                    last.value += seg.value;
                } else {
                    merged.push({ ...seg });
                }
            });

            return { ...t, segments: merged.length > 0 ? merged : [{ id: 'seg-' + Date.now(), type: 'text', value: '' }] };
        }));
    };

    const [activeDynamicChip, setActiveDynamicChip] = useState<CommentChip | null>(null);

    // Comment Helpers
    const insertComment = (template: string, item?: string) => {
        const selectedBook = books.find(b => b.id === formData.bookId);
        const bookName = selectedBook ? selectedBook.name : 'বিষয়';
        let processedText = template.replace(/{subject}/g, bookName);

        if (item) {
            processedText = processedText.replace(/{item}/g, item);
        }

        // Add to currently focused comment task or append new one
        if (focusedTaskInfo && focusedTaskInfo.section === 'cm') {
            handleTaskChange('cm', focusedTaskInfo.id, focusedTaskInfo.segmentId, processedText);
        } else {
            // Find the last empty task or create new one
            const lastTask = commentTasks[commentTasks.length - 1];
            const lastSegment = lastTask?.segments[lastTask.segments.length - 1];

            if (lastTask && lastSegment && !lastSegment.value.trim()) {
                handleTaskChange('cm', lastTask.id, lastSegment.id, processedText);
            } else {
                addTaskLine('cm');
                // We need to wait for state update in a real app, but here we can't easily.
                // For now, let's just update the last one if it's empty, otherwise user has to manually add line.
                // Improved logic: actually just setting the state directly for the new line
                const newId = `cm-${Date.now()}`;
                const newSegmentId = `seg-${Date.now()}`;

                setCommentTasks(prev => [
                    ...prev,
                    { id: newId, segments: [{ id: newSegmentId, type: 'text', value: processedText }] }
                ]);
            }
        }

        setActiveDynamicChip(null);
    };

    const handleChipClick = (chip: CommentChip) => {
        if (chip.isDynamic) {
            setActiveDynamicChip(activeDynamicChip?.label === chip.label ? null : chip);
        } else {
            insertComment(chip.template);
        }
    };

    const insertStudentName = (name: string) => {
        // This function was used for the single textarea, now we have per-line targeting.
        // We can adapt it to target students for the focused line.
        if (focusedTaskInfo && focusedTaskInfo.section === 'cm') {
            // For comments, we might want to just insert the name in text if not using the picker
            // But better to use the student picker UI for targeting.
            // If this is called from the general student picker (which we might remove for comments tab now),
            // let's just insert name into text.
            handleTaskChange('cm', focusedTaskInfo.id, focusedTaskInfo.segmentId, name);
        }
        setShowStudentPicker(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Serialize structured data into description
        let structuredDescription = '';

        const formatSection = (title: string, tasks: TaskLine[]) => {
            const validTasks = tasks.map(line => {
                const taskText = line.segments.map(seg => {
                    if (seg.type === 'tag') {
                        const tag = ALL_TAGS.find(att => att.id === seg.value);
                        if (!tag) return '';

                        const colorMap: Record<string, { bg: string, text: string, border: string }> = {
                            'read': { bg: '#ecfdf5', text: '#059669', border: '#d1fae5' },
                            'write': { bg: '#eff6ff', text: '#045c84', border: '#dbeafe' },
                            'memo': { bg: '#f5f3ff', text: '#7c3aed', border: '#ede9fe' },
                            'notes': { bg: '#f8fafc', text: '#475569', border: '#f1f5f9' },
                            'exercise': { bg: '#ecfeff', text: '#0891b2', border: '#cffafe' },
                            'chapter': { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' },
                            'lesson': { bg: '#fff7ed', text: '#ea580c', border: '#ffedd5' },
                            'meaning': { bg: '#f7fee7', text: '#4d7c0f', border: '#ecfccb' },
                            'qa': { bg: '#f5f3ff', text: '#7c3aed', border: '#ede9fe' },
                            'grammar': { bg: '#fdf4ff', text: '#a21caf', border: '#fae8ff' },
                            'test': { bg: '#fef2f2', text: '#dc2626', border: '#fee2e2' },
                            'correction': { bg: '#fefce8', text: '#a16207', border: '#fef9c3' },
                            'drawing': { bg: '#fdf2f8', text: '#db2777', border: '#fce7f3' },
                            'map': { bg: '#ecfdf5', text: '#047857', border: '#d1fae5' },
                            'mcq': { bg: '#fff1f2', text: '#e11d48', border: '#ffe4e6' },
                            'creative': { bg: '#f0fdfa', text: '#0d9488', border: '#ccfbf1' },
                            'excellent': { bg: '#eff6ff', text: '#045c84', border: '#dbeafe' },
                            'attentive': { bg: '#ecfdf5', text: '#059669', border: '#d1fae5' },
                            'improving': { bg: '#eef2ff', text: '#4f46e5', border: '#e0e7ff' },
                            'incomplete': { bg: '#fffbeb', text: '#d97706', border: '#fef3c7' },
                            'late': { bg: '#f8fafc', text: '#475569', border: '#f1f5f9' },
                            'parent-call': { bg: '#fff1f2', text: '#e11d48', border: '#ffe4e6' },
                            'behavior': { bg: '#ecfeff', text: '#0891b2', border: '#cffafe' }
                        };

                        const style = colorMap[seg.value] || { bg: '#f1f5f9', text: '#475569', border: '#e2e8eb' };
                        return `<span style="background-color: ${style.bg}; color: ${style.text}; border: 1px solid ${style.border}; padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800; margin-right: 4px; display: inline-block;">${tag.label}</span>`;
                    }
                    return seg.value;
                }).join('');

                // Append student names if targeted
                if (line.targetStudents && line.targetStudents.length > 0) {
                    const targetedStudentNames = line.targetStudents
                        .map(studentId => classStudents.find(s => s.id === studentId)?.name)
                        .filter(Boolean)
                        .join(', ');
                    if (targetedStudentNames) {
                        return `${taskText} <strong style="color: #2563eb;">→ Only for: ${targetedStudentNames}</strong>`;
                    }
                }

                return taskText;
            }).filter(t => t.trim());

            if (validTasks.length > 0) {
                return `### ${title}\n${validTasks.map(t => `- ${t}`).join('\n')}\n\n`;
            }
            return '';
        };

        structuredDescription += formatSection('ক্লাসের পড়া (Classwork)', classworkTasks);
        structuredDescription += formatSection('আগামীকাল ক্লাসের পড়া (Preparation)', prepTasks);
        structuredDescription += formatSection('বাড়ির কাজ (Homework)', homeworkTasks);
        structuredDescription += formatSection('মন্তব্য (Comments)', commentTasks);

        const structuredData = {
            version: '2.0',
            sections: [
                { title: 'ক্লাসের পড়া (Classwork)', tasks: classworkTasks },
                { title: 'আগামীকাল ক্লাসের পড়া (Preparation)', tasks: prepTasks },
                { title: 'বাড়ির কাজ (Homework)', tasks: homeworkTasks },
                { title: 'মন্তব্য (Comments)', tasks: commentTasks }
            ],
            fullMarkdown: structuredDescription
        };

        const finalDescription = JSON.stringify(structuredData);

        // If nothing entered, don't submit empty
        if (!structuredDescription.trim() && !formData.title) {
            setLoading(false);
            return;
        }

        let finalTitle = formData.title || '';
        if (!finalTitle) {
            if (classworkTasks[0]?.segments?.some(s => s.value)) {
                finalTitle = classworkTasks[0].segments.map(s => s.value).join(' ').substring(0, 50) + '...';
            } else {
                finalTitle = 'আজকের কাজ - ' + (scheduledDate || new Date().toISOString().split('T')[0]);
            }
        }

        const assignmentData = {
            title: finalTitle,
            type: formData.type,
            description: finalDescription,
            deadline: formData.deadline,
            classId: formData.classId,
            groupId: formData.groupId,
            bookId: formData.bookId,
            teacherId: teacherId,
            instituteId: instituteId,
            pageNumber: pageNumber,
            requireFaceVerify: formData.requireFaceVerify,
            scheduledDate: scheduledDate || null,
            resources: formData.resources,
            releaseAt: formData.releaseAt || null
        };

        try {
            await onSave(assignmentData);
        } catch (error) {
            console.error('Failed to save assignment:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = classStudents.filter(s =>
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.studentId?.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const selectedClassName = classes.find(c => c.id === formData.classId)?.name || 'Unknown Class';
    const selectedBookName = books.find(b => b.id === formData.bookId)?.name || 'Unknown Subject';

    const TABS = [
        { id: 'CW', label: 'ক্লাসের পড়া (CW)', icon: <Check size={14} />, color: 'text-[#018571]', bg: 'bg-[#018571]/5' },
        { id: 'PR', label: 'আগামীকালের পড়া (PR)', icon: <List size={14} />, color: 'text-[#5B3A57]', bg: 'bg-[#5B3A57]/5' },
        { id: 'HW', label: 'বাড়ির কাজ (HW)', icon: <FileText size={14} />, color: 'text-[#A6611A]', bg: 'bg-[#A6611A]/5' },
        { id: 'CM', label: 'মন্তব্য (CM)', icon: <MessageSquare size={14} />, color: 'text-[#473B06]', bg: 'bg-[#473B06]/5' }
    ];

    return (
        <div className="bg-white rounded-none md:rounded-[32px] border-b md:border border-slate-200 shadow-sm overflow-hidden md:overflow-visible animate-fade-in font-bengali min-h-screen md:min-h-[98vh] flex flex-col">
            {/* Sticky Header & Tabs Container */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md rounded-t-none md:rounded-t-[32px] border-b border-slate-100 shadow-sm">
                {/* Header */}
                <div className="p-4 md:p-6 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-700 hover:shadow-sm"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                {selectedBookName}
                                <span className="text-slate-400 font-medium">| {selectedClassName}</span>
                            </h3>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-[#045c84] font-black uppercase tracking-widest">
                                    {scheduledDate && scheduledDate !== new Date().toISOString().split('T')[0]
                                        ? <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shadow-sm">⚠️ {scheduledDate} (অতীত রেকর্ড)</span>
                                        : 'শিক্ষার্থীদের জন্য আজকের কাজ'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-4 px-6 py-2 bg-slate-50 rounded-2xl border border-slate-100 mr-2">
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black text-slate-800">ফেস আইডি সাবমিশন</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Face Verify</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={formData.requireFaceVerify}
                                    onChange={(e) => setFormData(prev => ({ ...prev, requireFaceVerify: e.target.checked }))}
                                />
                                <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-[#045c84]/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#045c84]"></div>
                            </label>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={loading || !formData.classId || !formData.bookId}
                            className="px-6 py-3 bg-[#045c84] text-white font-black rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-[#034a6b] hover:-translate-y-1 transition-all uppercase tracking-widest text-xs disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    সংরক্ষণ হচ্ছে...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    সেভ করুন
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="px-8 py-4 flex items-center gap-2 overflow-x-auto scrollbar-hide border-t border-slate-50">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all border whitespace-nowrap ${activeTab === tab.id
                                ? `${tab.bg} ${tab.color} border-current shadow-sm h-[44px]`
                                : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Body */}
            <div className="p-4 md:p-6 pb-12">


                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Classwork */}
                    {activeTab === 'CW' && (
                        <div className="bg-[#018571]/5 p-5 md:p-6 rounded-[32px] border border-[#018571]/10 shadow-inner">
                            <div className="mb-6 flex items-center justify-between">
                                <label className="text-sm md:text-base font-black text-[#018571] uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#018571] shadow-sm"></span>
                                    আজ ক্লাসের পড়া
                                </label>
                                <button
                                    type="button"
                                    onClick={syncCWToPR}
                                    className="h-9 px-3 text-xs font-black text-[#018571] bg-white hover:bg-[#018571]/10 rounded-xl flex items-center gap-2 transition-all border border-[#018571]/20 shadow-sm"
                                >
                                    <LinkIcon size={14} />
                                    আগামীকালের পড়ায় যোগ করুন
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5 mb-4 overflow-visible">
                                <div className="flex flex-wrap gap-2 justify-end">
                                    {ALL_TAGS.filter(t => pinnedTagIds.cw.includes(t.id)).map(tag => (
                                        <button key={tag.id} type="button" onClick={() => appendTagToTask('cw', tag.id)} className={`text-[11px] md:text-xs px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl font-black ${tag.color} border border-white/50 hover:shadow-md transition-all shadow-white/50 animate-in fade-in zoom-in-50`}>{tag.label}</button>
                                    ))}
                                </div>

                                {/* Tag Library Button */}
                                <div className="relative" ref={tagLibraryRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowTagLibrary(!showTagLibrary)}
                                        className="p-1.5 bg-white text-[#018571] border border-[#018571]/20 rounded-lg hover:bg-[#018571] hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={18} />
                                    </button>

                                    {showTagLibrary && (
                                        <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 z-[60] animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">ট্যাগ লাইব্রেরি (Shortcut Picker)</p>
                                            <div className="flex flex-wrap gap-2.5">
                                                {ALL_TAGS.map(tag => {
                                                    const currentSection = activeTab === 'CW' ? 'cw' : activeTab === 'PR' ? 'pr' : 'hw';
                                                    const isPinned = pinnedTagIds[currentSection as keyof typeof pinnedTagIds].includes(tag.id);
                                                    return (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => toggleTagPin(tag.id)}
                                                            className={`text-[11px] px-3 py-2 rounded-xl font-black border transition-all flex items-center gap-2 ${isPinned
                                                                ? `${tag.color} border-current opacity-100 shadow-sm`
                                                                : 'bg-white text-slate-500 border-slate-100 opacity-60'
                                                                }`}
                                                        >
                                                            {isPinned && <Check size={10} />}
                                                            {tag.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {classworkTasks.map((task, idx) => (
                                    <div key={task.id} className={`flex gap-2 group/line relative ${openStudentPickerTask?.id === task.id ? 'z-50' : 'z-0'}`}>
                                        {/* Student Selector Button */}
                                        <div className="relative flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setOpenStudentPickerTask({ section: 'cw', id: task.id })}
                                                className={`h-12 px-3 rounded-xl transition-all flex items-center gap-2 border shadow-sm ${task.targetStudents && task.targetStudents.length > 0
                                                    ? 'bg-[#018571] text-white border-[#018571]'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Users size={16} />
                                                <span className="text-xs font-black uppercase tracking-tight shrink-0">
                                                    {task.targetStudents && task.targetStudents.length > 0
                                                        ? task.targetStudents.length
                                                        : 'All'}
                                                </span>
                                            </button>
                                        </div>

                                        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 bg-white border border-[#018571]/20 rounded-xl focus-within:ring-4 focus-within:ring-[#018571]/10 focus-within:border-[#018571]/40 transition-all shadow-sm min-h-[48px]">
                                            {task.segments.map((seg, sIdx) => (
                                                <React.Fragment key={seg.id}>
                                                    {seg.type === 'tag' ? (
                                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-lg border border-white/40 shadow-sm animate-in zoom-in-50 ${ALL_TAGS.find(t => t.id === seg.value)?.color}`}>
                                                            {ALL_TAGS.find(t => t.id === seg.value)?.label}
                                                            <button type="button" onClick={() => removeTagFromTask('cw', task.id, seg.id)} className="hover:scale-110 transition-transform p-0.5 ml-0.5">
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ) : (
                                                        <div className="relative flex-1 min-w-[30px] inline-flex items-center">
                                                            <input
                                                                value={seg.value}
                                                                onChange={(e) => handleTaskChange('cw', task.id, seg.id, e.target.value)}
                                                                onFocus={(e) => setFocusedTaskInfo({
                                                                    section: 'cw',
                                                                    id: task.id,
                                                                    segmentId: seg.id,
                                                                    cursorOffset: e.target.selectionStart || 0
                                                                })}
                                                                onKeyDown={(e) => handleKeyDown('cw', task, seg.id, e)}
                                                                onKeyUp={(e: any) => setFocusedTaskInfo(prev => prev?.segmentId === seg.id ? { ...prev, cursorOffset: e.target.selectionStart || 0 } : prev)}
                                                                onClick={(e: any) => setFocusedTaskInfo(prev => prev?.segmentId === seg.id ? { ...prev, cursorOffset: e.target.selectionStart || 0 } : prev)}
                                                                className="w-full bg-transparent outline-none text-[15px] font-bold text-slate-900 placeholder:text-slate-400 py-1"
                                                                placeholder={sIdx === 0 && task.segments.length === 1 ? "আজ ক্লাসে যা পড়ানো হয়েছে..." : ""}
                                                            />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        {
                                            classworkTasks.length > 1 && (
                                                <button type="button" onClick={() => removeTaskLine('cw', task.id)} className="h-12 w-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-red-100"><Trash2 size={18} /></button>
                                            )
                                        }
                                    </div>
                                ))}
                                <button type="button" onClick={() => addTaskLine('cw')} className="h-12 px-6 border-2 border-dashed border-[#018571]/20 text-[#018571] text-xs font-black rounded-2xl hover:border-[#018571]/50 hover:bg-[#018571]/5 transition-all flex items-center gap-2 bg-white/50 w-full md:w-fit justify-center md:justify-start shadow-sm">
                                    <Plus size={18} /> নতুন লাইন যোগ করুন
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preparation (Tomorrow) */}
                    {activeTab === 'PR' && (
                        <div className="bg-[#5B3A57]/5 p-5 md:p-6 rounded-[32px] border border-[#5B3A57]/10 shadow-inner">
                            <div className="mb-6 flex items-center justify-between">
                                <label className="text-sm md:text-base font-black text-[#5B3A57] uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#5B3A57] shadow-sm"></span>
                                    আগামীকাল ক্লাসের পড়া
                                </label>
                                <button
                                    type="button"
                                    onClick={syncCWToPR}
                                    className="h-9 px-3 text-xs font-black text-[#5B3A57] bg-white hover:bg-[#5B3A57]/10 rounded-xl flex items-center gap-2 transition-all border border-[#5B3A57]/20 shadow-sm"
                                >
                                    <LinkIcon size={12} />
                                    আজকের পড়া থেকে কপি করুন
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                {ALL_TAGS.filter(t => pinnedTagIds.pr.includes(t.id)).map(tag => (
                                    <button key={tag.id} type="button" onClick={() => appendTagToTask('pr', tag.id)} className={`text-[11px] md:text-xs px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl font-black ${tag.color} border border-white/50 hover:shadow-sm transition-all shadow-white/50 animate-in fade-in zoom-in-50`}>{tag.label}</button>
                                ))}

                                {/* Tag Library Button */}
                                <div className="relative" ref={tagLibraryRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowTagLibrary(!showTagLibrary)}
                                        className="p-1 px-2 bg-white text-[#5B3A57] border border-[#5B3A57]/20 rounded-lg hover:bg-[#5B3A57] hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={18} />
                                    </button>

                                    {showTagLibrary && (
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[60] animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">ট্যাগ লাইব্রেরি (Shortcut Picker)</p>
                                            <div className="flex flex-wrap gap-2">
                                                {ALL_TAGS.map(tag => {
                                                    const isPinned = pinnedTagIds.pr.includes(tag.id);
                                                    return (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => toggleTagPin(tag.id)}
                                                            className={`text-[11px] px-3 py-2 rounded-xl font-black border transition-all flex items-center gap-2 ${isPinned
                                                                ? `${tag.color} border-current opacity-100 shadow-sm`
                                                                : 'bg-white text-slate-500 border-slate-100 opacity-60'
                                                                }`}
                                                        >
                                                            {isPinned && <Check size={10} />}
                                                            {tag.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {prepTasks.map((task, idx) => (
                                    <div key={task.id} className={`flex gap-2 group/line relative ${openStudentPickerTask?.id === task.id ? 'z-50' : 'z-0'}`}>
                                        {/* Student Selector Button */}
                                        <div className="relative flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setOpenStudentPickerTask({ section: 'pr', id: task.id })}
                                                className={`h-12 px-3 rounded-xl transition-all flex items-center gap-2 border shadow-sm ${task.targetStudents && task.targetStudents.length > 0
                                                    ? 'bg-[#5B3A57] text-white border-[#5B3A57]'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Users size={16} />
                                                <span className="text-xs font-black uppercase tracking-tight shrink-0">
                                                    {task.targetStudents && task.targetStudents.length > 0
                                                        ? task.targetStudents.length
                                                        : 'All'}
                                                </span>
                                            </button>
                                        </div>

                                        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 bg-white border border-[#5B3A57]/20 rounded-xl focus-within:ring-4 focus-within:ring-[#5B3A57]/10 focus-within:border-[#5B3A57]/40 transition-all shadow-sm min-h-[48px]">
                                            {task.segments.map((seg, sIdx) => (
                                                <React.Fragment key={seg.id}>
                                                    {seg.type === 'tag' ? (
                                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-lg border border-white/40 shadow-sm animate-in zoom-in-50 ${ALL_TAGS.find(t => t.id === seg.value)?.color}`}>
                                                            {ALL_TAGS.find(t => t.id === seg.value)?.label}
                                                            <button type="button" onClick={() => removeTagFromTask('pr', task.id, seg.id)} className="hover:scale-110 transition-transform p-0.5 ml-0.5">
                                                                <X size={12} />
                                                            </button>
                                                        </span>
                                                    ) : (
                                                        <div className="relative flex-1 min-w-[30px] inline-flex items-center">
                                                            <input
                                                                value={seg.value}
                                                                onChange={(e) => handleTaskChange('pr', task.id, seg.id, e.target.value)}
                                                                onFocus={(e) => setFocusedTaskInfo({
                                                                    section: 'pr',
                                                                    id: task.id,
                                                                    segmentId: seg.id,
                                                                    cursorOffset: e.target.selectionStart || 0
                                                                })}
                                                                onKeyDown={(e) => handleKeyDown('pr', task, seg.id, e)}
                                                                onKeyUp={(e: any) => setFocusedTaskInfo(prev => prev?.segmentId === seg.id ? { ...prev, cursorOffset: e.target.selectionStart || 0 } : prev)}
                                                                onClick={(e: any) => setFocusedTaskInfo(prev => prev?.segmentId === seg.id ? { ...prev, cursorOffset: e.target.selectionStart || 0 } : prev)}
                                                                className="w-full bg-transparent outline-none text-[15px] font-bold text-slate-900 placeholder:text-slate-400 py-1"
                                                                placeholder={sIdx === 0 && task.segments.length === 1 ? "আগামীকাল কি পড়ে আসতে হবে..." : ""}
                                                            />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        {
                                            prepTasks.length > 1 && (
                                                <button type="button" onClick={() => removeTaskLine('pr', task.id)} className="h-12 w-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-red-100"><Trash2 size={18} /></button>
                                            )
                                        }
                                    </div>
                                ))}
                                <button type="button" onClick={() => addTaskLine('pr')} className="h-12 px-6 border-2 border-dashed border-[#5B3A57]/20 text-[#5B3A57] text-xs font-black rounded-2xl hover:border-[#5B3A57]/50 hover:bg-[#5B3A57]/5 transition-all flex items-center gap-2 bg-white/50 w-full md:w-fit justify-center md:justify-start shadow-sm">
                                    <Plus size={18} /> নতুন লাইন যোগ করুন
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Homework */}
                    {activeTab === 'HW' && (
                        <div className="bg-[#A6611A]/5 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-[#A6611A]/10 shadow-inner">
                            <div className="mb-6">
                                <label className="text-sm md:text-base font-black text-[#A6611A] uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#A6611A] shadow-sm"></span>
                                    বাড়ির কাজ (Homework)
                                </label>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                {ALL_TAGS.filter(t => pinnedTagIds.hw.includes(t.id)).map(tag => (
                                    <button key={tag.id} type="button" onClick={() => appendTagToTask('hw', tag.id)} className={`text-[11px] md:text-xs px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl font-black ${tag.color} border border-white/50 hover:shadow-sm transition-all shadow-white/50 animate-in fade-in zoom-in-50`}>{tag.label}</button>
                                ))}

                                {/* Tag Library Button */}
                                <div className="relative" ref={tagLibraryRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowTagLibrary(!showTagLibrary)}
                                        className="p-1 px-2 bg-white text-[#A6611A] border border-[#A6611A]/20 rounded-lg hover:bg-[#A6611A] hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={14} />
                                    </button>

                                    {showTagLibrary && (
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[60] animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">ট্যাগ লাইব্রেরি (Shortcut Picker)</p>
                                            <div className="flex flex-wrap gap-2">
                                                {ALL_TAGS.map(tag => {
                                                    const isPinned = pinnedTagIds.hw.includes(tag.id);
                                                    return (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => toggleTagPin(tag.id)}
                                                            className={`text-[11px] px-3 py-2 rounded-xl font-black border transition-all flex items-center gap-2 ${isPinned
                                                                ? `${tag.color} border-current opacity-100 shadow-sm`
                                                                : 'bg-white text-slate-500 border-slate-100 opacity-60'
                                                                }`}
                                                        >
                                                            {isPinned && <Check size={10} />}
                                                            {tag.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-3">
                                {homeworkTasks.map((task, idx) => (
                                    <div key={task.id} className={`flex gap-2 group/line relative ${openStudentPickerTask?.id === task.id ? 'z-50' : 'z-0'}`}>
                                        {/* Student Selector Button */}
                                        <div className="relative flex-shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => setOpenStudentPickerTask({ section: 'hw', id: task.id })}
                                                className={`h-12 px-3 rounded-xl transition-all flex items-center gap-2 border shadow-sm ${task.targetStudents && task.targetStudents.length > 0
                                                    ? 'bg-[#A6611A] text-white border-[#A6611A]'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Users size={16} />
                                                <span className="text-xs font-black uppercase tracking-tight shrink-0">
                                                    {task.targetStudents && task.targetStudents.length > 0
                                                        ? task.targetStudents.length
                                                        : 'All'}
                                                </span>
                                            </button>
                                        </div>

                                        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 bg-white border border-[#A6611A]/10 rounded-xl focus-within:ring-4 focus-within:ring-[#A6611A]/10 focus-within:border-[#A6611A]/30 transition-all shadow-sm min-h-[48px]">
                                            {task.segments.map((seg, sIdx) => (
                                                <React.Fragment key={seg.id}>
                                                    {seg.type === 'tag' ? (
                                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-lg border border-white/40 shadow-sm animate-in zoom-in-50 ${ALL_TAGS.find(t => t.id === seg.value)?.color}`}>
                                                            {ALL_TAGS.find(t => t.id === seg.value)?.label}
                                                            <button type="button" onClick={() => removeTagFromTask('hw', task.id, seg.id)} className="hover:scale-110 transition-transform p-0.5">
                                                                <X size={10} />
                                                            </button>
                                                        </span>
                                                    ) : (
                                                        <div className="relative flex-1 min-w-[30px] inline-flex items-center">
                                                            <input
                                                                value={seg.value}
                                                                onChange={(e) => handleTaskChange('hw', task.id, seg.id, e.target.value)}
                                                                onFocus={(e) => setFocusedTaskInfo({
                                                                    section: 'hw',
                                                                    id: task.id,
                                                                    segmentId: seg.id,
                                                                    cursorOffset: e.target.selectionStart || 0
                                                                })}
                                                                onKeyDown={(e) => handleKeyDown('hw', task, seg.id, e)}
                                                                onKeyUp={(e: any) => setFocusedTaskInfo(prev => prev?.segmentId === seg.id ? { ...prev, cursorOffset: e.target.selectionStart || 0 } : prev)}
                                                                onClick={(e: any) => setFocusedTaskInfo(prev => prev?.segmentId === seg.id ? { ...prev, cursorOffset: e.target.selectionStart || 0 } : prev)}
                                                                className="w-full bg-transparent outline-none text-[15px] font-bold text-slate-900 placeholder:text-slate-400 py-1"
                                                                placeholder={sIdx === 0 && task.segments.length === 1 ? "বাড়িতে কি কাজ করতে হবে..." : ""}
                                                            />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        {
                                            homeworkTasks.length > 1 && (
                                                <button type="button" onClick={() => removeTaskLine('hw', task.id)} className="h-12 w-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-red-100"><Trash2 size={18} /></button>
                                            )
                                        }
                                    </div>
                                ))}
                                <button type="button" onClick={() => addTaskLine('hw')} className="h-12 px-6 border-2 border-dashed border-[#A6611A]/20 text-[#A6611A] text-xs font-black rounded-2xl hover:border-[#A6611A]/50 hover:bg-[#A6611A]/5 transition-all flex items-center gap-2 bg-white/50 w-full md:w-fit justify-center md:justify-start shadow-sm">
                                    <Plus size={18} /> নতুন লাইন যোগ করুন
                                </button>
                            </div>
                        </div>
                    )
                    }

                    {/* Comments Section */}
                    {
                        activeTab === 'CM' && (
                            <div className="bg-[#473B06]/5 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-[#473B06]/10 shadow-inner">
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-sm md:text-base font-black text-[#473B06] uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={18} className="text-[#473B06]" />
                                        মন্তব্য (Comments)
                                    </label>

                                    <div className="flex items-center gap-1.5 overflow-visible">
                                        <div className="flex flex-wrap gap-1.5 justify-end">
                                            {ALL_TAGS.filter(t => pinnedTagIds.cm.includes(t.id)).map(tag => (
                                                <button key={tag.id} type="button" onClick={() => appendTagToTask('cm', tag.id)} className={`text-[12px] px-3.5 py-1.5 rounded-xl font-black ${tag.color} border border-white/50 hover:shadow-sm transition-all shadow-white/50 animate-in fade-in zoom-in-50`}>{tag.label}</button>
                                            ))}
                                        </div>

                                        {/* Tag Library Button */}
                                        <div className="relative" ref={tagLibraryRef}>
                                            <button
                                                type="button"
                                                onClick={() => setShowTagLibrary(!showTagLibrary)}
                                                className="p-1.5 bg-white text-[#473B06] border border-[#473B06]/20 rounded-lg hover:bg-[#473B06] hover:text-white transition-all shadow-sm"
                                            >
                                                <Plus size={14} />
                                            </button>

                                            {showTagLibrary && (
                                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[60] animate-in fade-in slide-in-from-top-2">
                                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">ট্যাগ লাইব্রেরি (Shortcut Picker)</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {ALL_TAGS.map(tag => {
                                                            const isPinned = pinnedTagIds.cm.includes(tag.id);
                                                            return (
                                                                <button
                                                                    key={tag.id}
                                                                    type="button"
                                                                    onClick={() => toggleTagPin(tag.id)}
                                                                    className={`text-[11px] px-3 py-2 rounded-xl font-black border transition-all flex items-center gap-2 ${isPinned
                                                                        ? `${tag.color} border-current opacity-100 shadow-sm`
                                                                        : 'bg-white text-slate-500 border-slate-100 opacity-60'
                                                                        }`}
                                                                >
                                                                    {isPinned && <Check size={10} />}
                                                                    {tag.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {commentTasks.map((task, idx) => (
                                        <div key={task.id} className={`flex gap-2 group/line relative ${openStudentPickerTask?.id === task.id ? 'z-50' : 'z-0'}`}>
                                            {/* Student Selector Button */}
                                            <div className="relative flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenStudentPickerTask({ section: 'cm', id: task.id })}
                                                    className={`h-12 px-3 rounded-xl transition-all flex items-center gap-2 border shadow-sm ${task.targetStudents && task.targetStudents.length > 0
                                                        ? 'bg-[#473B06] text-white border-[#473B06]'
                                                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <Users size={16} />
                                                    <span className="text-xs font-black uppercase tracking-tight shrink-0">
                                                        {task.targetStudents && task.targetStudents.length > 0
                                                            ? task.targetStudents.length
                                                            : 'All'}
                                                    </span>
                                                </button>
                                            </div>

                                            <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 bg-white border border-[#473B06]/20 rounded-xl focus-within:ring-4 focus-within:ring-[#473B06]/10 focus-within:border-[#473B06]/40 transition-all shadow-sm min-h-[48px]">
                                                {task.segments.map((seg, sIdx) => (
                                                    <React.Fragment key={seg.id}>
                                                        {seg.type === 'tag' ? (
                                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1.5 rounded-lg border border-white/40 shadow-sm animate-in zoom-in-50 ${ALL_TAGS.find(t => t.id === seg.value)?.color}`}>
                                                                {ALL_TAGS.find(t => t.id === seg.value)?.label}
                                                                <button type="button" onClick={() => removeTagFromTask('cm', task.id, seg.id)} className="hover:scale-110 transition-transform p-0.5">
                                                                    <X size={10} />
                                                                </button>
                                                            </span>
                                                        ) : (
                                                            <div className="relative flex-1 min-w-[30px] inline-flex items-center">
                                                                <input
                                                                    value={seg.value}
                                                                    onChange={(e) => handleTaskChange('cm', task.id, seg.id, e.target.value)}
                                                                    onFocus={(e) => setFocusedTaskInfo({
                                                                        section: 'cm',
                                                                        id: task.id,
                                                                        segmentId: seg.id,
                                                                        cursorOffset: e.target.selectionStart || 0
                                                                    })}
                                                                    onKeyDown={(e) => handleKeyDown('cm', task, seg.id, e)}
                                                                    onKeyUp={(e: any) => setFocusedTaskInfo(prev => prev?.segmentId === seg.id ? { ...prev, cursorOffset: e.target.selectionStart || 0 } : prev)}
                                                                    onClick={(e: any) => setFocusedTaskInfo(prev => prev?.segmentId === seg.id ? { ...prev, cursorOffset: e.target.selectionStart || 0 } : prev)}
                                                                    className="w-full bg-transparent outline-none text-[15px] font-bold text-slate-900 placeholder:text-slate-400 py-1"
                                                                    placeholder={sIdx === 0 && task.segments.length === 1 ? "মন্তব্য লিখুন..." : ""}
                                                                />
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            {
                                                commentTasks.length > 1 && (
                                                    <button type="button" onClick={() => removeTaskLine('cm', task.id)} className="h-12 w-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0 border border-transparent hover:border-red-100"><Trash2 size={18} /></button>
                                                )
                                            }
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addTaskLine('cm')} className="h-12 px-6 border-2 border-dashed border-[#473B06]/30 text-[#473B06] text-xs font-black rounded-2xl hover:border-[#473B06]/60 hover:bg-[#473B06]/10 transition-all flex items-center gap-2 bg-white/50 w-full md:w-fit justify-center md:justify-start shadow-sm">
                                        <Plus size={18} /> নতুন মন্তব্য লাইন
                                    </button>
                                </div>

                                {/* Quick Comment Chips */}
                                <div className="flex flex-wrap gap-2.5">
                                    {COMMENT_CHIPS.map(chip => (
                                        <div key={chip.label} className="relative">
                                            <button
                                                type="button"
                                                onClick={() => handleChipClick(chip)}
                                                className={`px-5 py-3 bg-white border-2 rounded-2xl text-xs font-black transition-all shadow-sm active:scale-95 flex items-center gap-2.5 ${activeDynamicChip?.label === chip.label
                                                    ? 'border-[#473B06] text-[#473B06] bg-[#473B06]/10 ring-4 ring-[#473B06]/10'
                                                    : 'border-slate-100 text-slate-600 hover:bg-[#473B06]/5 hover:border-[#473B06]/30 hover:text-[#473B06]'
                                                    }`}
                                            >
                                                {chip.label}
                                                {chip.isDynamic && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
                                            </button>

                                            {/* Dynamic Item Picker */}
                                            {chip.isDynamic && activeDynamicChip?.label === chip.label && (
                                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 p-1.5 grid grid-cols-1 gap-1">
                                                    <p className="px-2 py-1.5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-50 mb-1">
                                                        সিলেক্ট করুন
                                                    </p>
                                                    {chip.items?.map(item => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() => insertComment(chip.template, item)}
                                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 hover:text-[#045c84] transition-all flex items-center justify-between group"
                                                        >
                                                            {item}
                                                            <Check size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#045c84]" />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div >
                        )
                    }
                </div>
            </div >
            {/* Student Selection Modal */}
            < Modal
                isOpen={!!openStudentPickerTask
                }
                onClose={() => setOpenStudentPickerTask(null)}
                title="সিলেক্ট স্টুডেন্ট (Select Students)"
                maxWidth="max-w-2xl"
                noScroll={true}
            >
                {(() => {
                    const sectionColor = openStudentPickerTask?.section === 'cw' ? '#018571' :
                        openStudentPickerTask?.section === 'pr' ? '#5B3A57' :
                            openStudentPickerTask?.section === 'hw' ? '#A6611A' :
                                '#473B06';

                    const currentTask = openStudentPickerTask ? getTasksBySection(openStudentPickerTask.section).find(t => t.id === openStudentPickerTask.id) : null;
                    const everyStudentSelected = classStudents.length > 0 && classStudents.every(s => currentTask?.targetStudents?.includes(s.id));

                    return (
                        <div
                            className="h-[85vh] flex flex-col transition-all duration-500 border-x-4 border-b-4 relative"
                            style={{
                                backgroundColor: `${sectionColor}05`,
                                borderColor: `${sectionColor}20`
                            }}
                        >
                            {/* Floating Modal Header with Light Background */}
                            <div
                                className="sticky top-0 z-20 p-5 md:p-6 border-b border-slate-100 flex items-center justify-between gap-4 backdrop-blur-md"
                                style={{ backgroundColor: `${sectionColor}08` }}
                            >
                                <div className="flex-1 relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#045c84] transition-colors">
                                        <Search size={18} />
                                    </div>
                                    <input
                                        type="search"
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:border-[#045c84] focus:ring-4 focus:ring-[#045c84]/10 transition-all placeholder:text-slate-400"
                                        onFocus={(e) => {
                                            e.target.style.borderColor = sectionColor;
                                            e.target.style.boxShadow = `0 0 0 4px ${sectionColor}20`;
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#e2e8f0';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        placeholder="নাম অথবা আইডি দিয়ে খুঁজুন..."
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openStudentPickerTask && toggleAllStudentsForTask(openStudentPickerTask.section as any, openStudentPickerTask.id, !everyStudentSelected)}
                                        className={`p-3.5 rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center border-2 ${everyStudentSelected
                                            ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                            : 'hover:opacity-80'
                                            }`}
                                        style={!everyStudentSelected ? { backgroundColor: `${sectionColor}15`, borderColor: `${sectionColor}40`, color: sectionColor } : {}}
                                        title={everyStudentSelected ? "Clear All" : "Select All"}
                                    >
                                        {everyStudentSelected ? <X size={20} /> : <Check size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content Body - Fix Clipping with horizontal padding */}
                            <div
                                className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 px-6 md:px-8"
                                data-lenis-prevent
                            >
                                <p className="text-[11px] font-black uppercase tracking-widest mb-3 px-1" style={{ color: sectionColor }}>গ্রুপ সিলেক্ট (Group Selection)</p>

                                {/* Group Selection */}
                                {classGroups.length > 0 && (
                                    <div className="mb-6">
                                        <div className="flex flex-wrap gap-2">
                                            {classGroups.map(group => {
                                                const studentsInGroup = classStudents.filter(s => s.metadata?.groupId === group.id).map(s => s.id);
                                                const isGroupSelected = studentsInGroup.length > 0 && studentsInGroup.every(id => currentTask?.targetStudents?.includes(id));

                                                return (
                                                    <button
                                                        key={group.id}
                                                        type="button"
                                                        onClick={() => openStudentPickerTask && toggleGroupStudentsForTask(openStudentPickerTask.section as any, openStudentPickerTask.id, group.id)}
                                                        className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 flex items-center gap-2 ${isGroupSelected
                                                            ? 'bg-white shadow-sm'
                                                            : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                                                            }`}
                                                        style={isGroupSelected ? { borderColor: sectionColor, color: sectionColor } : {}}
                                                    >
                                                        <div
                                                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${isGroupSelected ? '' : 'border-slate-300'}`}
                                                            style={isGroupSelected ? { backgroundColor: sectionColor, borderColor: sectionColor } : {}}
                                                        >
                                                            {isGroupSelected && <Check size={10} className="text-white" />}
                                                        </div>
                                                        {group.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Student List Grid */}
                                <div className="py-1">
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">শিক্ষার্থী তালিকা ({filteredStudents.length})</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {filteredStudents.length > 0 ? (
                                            filteredStudents.map(student => {
                                                const isSelected = currentTask?.targetStudents?.includes(student.id) || false;

                                                return (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => openStudentPickerTask && toggleStudentForTask(openStudentPickerTask.section as any, openStudentPickerTask.id, student.id)}
                                                        className={`w-full text-left px-4 py-3 rounded-2xl flex items-center gap-4 transition-all border-2 ${isSelected
                                                            ? 'scale-[1.02]'
                                                            : 'bg-white/60 border-transparent hover:border-slate-200'
                                                            }`}
                                                        style={isSelected ? { backgroundColor: `${sectionColor}15`, borderColor: `${sectionColor}40`, boxShadow: `0 8px 20px ${sectionColor}10` } : {}}
                                                    >
                                                        <div
                                                            className={`w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 transition-all ${isSelected ? '' : 'bg-slate-100 border-slate-200'}`}
                                                            style={isSelected ? { backgroundColor: sectionColor, borderColor: sectionColor } : {}}
                                                        >
                                                            {student.metadata?.studentPhoto ? (
                                                                <img src={student.metadata.studentPhoto} alt={student.name} className="w-full h-full object-cover" />
                                                            ) : isSelected ? (
                                                                <Check size={20} className="text-white" />
                                                            ) : (
                                                                <span className="text-xs font-black text-slate-500">{student.name.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-black truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{student.name}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md uppercase tracking-tight">ID: {student.studentId || 'N/A'}</span>
                                                                {student.metadata?.groupId && (
                                                                    <span
                                                                        className="text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tight"
                                                                        style={{ backgroundColor: `${sectionColor}15`, color: sectionColor }}
                                                                    >
                                                                        {classGroups.find(g => g.id === student.metadata.groupId)?.name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div
                                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'rotate-0 px-0' : 'border-slate-200 rotate-90 opacity-20'}`}
                                                            style={isSelected ? { backgroundColor: sectionColor, borderColor: sectionColor } : {}}
                                                        >
                                                            {isSelected && <Check size={14} className="text-white" />}
                                                        </div>
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400 bg-white/40 rounded-3xl border-2 border-dashed border-slate-200">
                                                <Users size={48} className="mb-4 opacity-20" />
                                                <p className="text-sm font-bold">কোন শিক্ষার্থী পাওয়া যায়নি</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="p-6 border-t border-slate-100 flex justify-end bg-white/50 backdrop-blur-sm relative z-20">
                                <button
                                    type="button"
                                    onClick={() => setOpenStudentPickerTask(null)}
                                    className="px-10 py-3.5 border-2 rounded-[22px] font-black text-base transition-all active:scale-95 flex items-center gap-2 shadow-lg hover:shadow-xl"
                                    style={{
                                        backgroundColor: `${sectionColor}15`,
                                        borderColor: `${sectionColor}40`,
                                        color: sectionColor,
                                        boxShadow: `0 8px 20px ${sectionColor}12`
                                    }}
                                >
                                    কমপ্লিট (Done) <Check size={20} />
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal >
        </div >
    );
}

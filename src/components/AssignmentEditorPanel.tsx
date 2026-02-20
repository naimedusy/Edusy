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
    { id: 'read', label: 'পড়া', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'write', label: 'লেখা', color: 'bg-blue-50 text-[#045c84] border-blue-100' },
    { id: 'memo', label: 'মুখস্থ', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { id: 'notes', label: 'নোট', color: 'bg-slate-50 text-slate-600 border-slate-200' },
    { id: 'exercise', label: 'অনুশীলনী', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
    { id: 'chapter', label: 'অধ্যায়', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { id: 'lesson', label: 'পাঠ', color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { id: 'meaning', label: 'শব্দার্থ', color: 'bg-lime-50 text-lime-600 border-lime-100' },
    { id: 'qa', label: 'প্রশ্ন-উত্তর', color: 'bg-violet-50 text-violet-600 border-violet-100' },
    { id: 'grammar', label: 'ব্যাকরণ', color: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100' },
    { id: 'test', label: 'পরীক্ষা', color: 'bg-red-50 text-red-600 border-red-100' },
    { id: 'correction', label: 'সংশোধন', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { id: 'drawing', label: 'ছবি/চিত্র', color: 'bg-pink-50 text-pink-600 border-pink-100' },
    { id: 'map', label: 'মানচিত্র', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { id: 'mcq', label: 'MCQ', color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { id: 'creative', label: 'সৃজনশীল', color: 'bg-teal-50 text-teal-600 border-teal-100' },
    { id: 'excellent', label: 'চমৎকার', color: 'bg-blue-50 text-[#045c84] border-blue-100' },
    { id: 'attentive', label: 'মনোযোগী', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'improving', label: 'উন্নতি করছে', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { id: 'incomplete', label: 'অসম্পূর্ণ', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { id: 'late', label: 'দেরি', color: 'bg-slate-50 text-slate-600 border-slate-200' },
    { id: 'parent-call', label: 'অভিভাবক সাক্ষাত', color: 'bg-rose-50 text-rose-600 border-rose-100' },
    { id: 'behavior', label: 'আচরণ ভালো', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' }
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
        template: 'আজকে আপনার সন্তানের {item} শেষ হয়ে গেছে।'
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
        releaseAt: ''
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
                releaseAt: initialAssignment.releaseAt ? new Date(initialAssignment.releaseAt).toISOString().slice(0, 16) : ''
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
        { id: 'CW', label: 'ক্লাসের পড়া (CW)', icon: <Check size={14} />, color: 'text-[#045c84]', bg: 'bg-[#045c84]/5' },
        { id: 'PR', label: 'আগামীকালের পড়া (PR)', icon: <List size={14} />, color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'HW', label: 'বাড়ির কাজ (HW)', icon: <FileText size={14} />, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'CM', label: 'মন্তব্য (CM)', icon: <MessageSquare size={14} />, color: 'text-slate-600', bg: 'bg-slate-50' }
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
                                <p className="text-[10px] text-[#045c84] font-black uppercase tracking-widest">
                                    {scheduledDate && scheduledDate !== new Date().toISOString().split('T')[0]
                                        ? <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">⚠️ {scheduledDate} (অতীত রেকর্ড)</span>
                                        : 'শিক্ষার্থীদের জন্য আজকের কাজ'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
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
                {/* General Settings Section */}
                <div className="mb-8 bg-slate-50/50 p-6 rounded-[32px] border border-slate-100 shadow-inner space-y-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">কাজের শিরোনাম (Title)</label>
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#045c84]/10 focus:border-[#045c84]/30 outline-none font-black text-xl text-slate-800 placeholder:text-slate-300 transition-all shadow-sm"
                            placeholder="অ্যাসাইনমেন্টের শিরোনাম লিখুন (ঐচ্ছিক)"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Calendar size={12} />
                                রিলিজ টাইম (Release Time)
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.releaseAt}
                                onChange={(e) => setFormData({ ...formData, releaseAt: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#045c84]/10 focus:border-[#045c84]/30 outline-none font-bold text-sm text-slate-700 transition-all shadow-sm"
                            />
                            <p className="text-[10px] text-slate-400 font-medium ml-1">ঐচ্ছিক: এই সময়ের আগে শিক্ষার্থীরা এটি দেখতে পাবে না।</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Calendar size={12} />
                                ডেডলাইন (Deadline)
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.deadline}
                                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#045c84]/10 focus:border-[#045c84]/30 outline-none font-bold text-sm text-slate-700 transition-all shadow-sm"
                            />
                            <p className="text-[10px] text-slate-400 font-medium ml-1">ঐচ্ছিক: এই সময়ের পর শিক্ষার্থীরা কাজ জমা দিতে পারবে না।</p>
                        </div>
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {/* Classwork */}
                    {activeTab === 'CW' && (
                        <div className="bg-slate-50/50 p-5 md:p-6 rounded-[32px] border border-slate-100 shadow-inner">
                            <div className="mb-6 flex items-center justify-between">
                                <label className="text-sm font-black text-[#045c84] uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[#045c84] shadow-sm"></span>
                                    ক্লাসের পড়া (Classwork)
                                </label>
                                <button
                                    type="button"
                                    onClick={syncCWToPR}
                                    className="text-[10px] font-black text-[#045c84] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all border border-blue-100 shadow-sm"
                                >
                                    <LinkIcon size={12} />
                                    আগামীকালের পড়ায় যোগ করুন
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5 mb-4 overflow-visible">
                                <div className="flex flex-wrap gap-1.5 justify-end">
                                    {ALL_TAGS.filter(t => pinnedTagIds.cw.includes(t.id)).map(tag => (
                                        <button key={tag.id} type="button" onClick={() => appendTagToTask('cw', tag.id)} className={`text-[10px] px-3 py-1.5 rounded-xl font-black ${tag.color} border border-white/50 hover:shadow-sm transition-all shadow-white/50 animate-in fade-in zoom-in-50`}>{tag.label}</button>
                                    ))}
                                </div>

                                {/* Tag Library Button */}
                                <div className="relative" ref={tagLibraryRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowTagLibrary(!showTagLibrary)}
                                        className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-[#045c84] hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={14} />
                                    </button>

                                    {showTagLibrary && (
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[60] animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">ট্যাগ লাইব্রেরি (Shortcut Picker)</p>
                                            <div className="flex flex-wrap gap-2">
                                                {ALL_TAGS.map(tag => {
                                                    const currentSection = activeTab === 'CW' ? 'cw' : activeTab === 'PR' ? 'pr' : 'hw';
                                                    const isPinned = pinnedTagIds[currentSection as keyof typeof pinnedTagIds].includes(tag.id);
                                                    return (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => toggleTagPin(tag.id)}
                                                            className={`text-[9px] px-2.5 py-1.5 rounded-lg font-black border transition-all flex items-center gap-1.5 ${isPinned
                                                                ? `${tag.color} border-current opacity-100`
                                                                : 'bg-white text-slate-400 border-slate-100 opacity-60'
                                                                }`}
                                                        >
                                                            {isPinned && <Check size={8} />}
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
                                                onClick={() => setOpenStudentPickerTask(
                                                    openStudentPickerTask?.id === task.id ? null : { section: 'cw', id: task.id }
                                                )}
                                                className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border shadow-sm ${task.targetStudents && task.targetStudents.length > 0
                                                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Users size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-tighter shrink-0">
                                                    {task.targetStudents && task.targetStudents.length > 0
                                                        ? task.targetStudents.length
                                                        : 'All'}
                                                </span>
                                            </button>

                                            {/* Student Picker Dropdown */}
                                            {openStudentPickerTask?.id === task.id && (
                                                <div className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                                    <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                <Users size={12} />
                                                                Select Students
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAllStudentsForTask('cw', task.id, true)}
                                                                    className="text-[10px] px-2.5 py-1 bg-blue-600 text-white rounded-lg font-black hover:bg-blue-700 transition-colors"
                                                                >
                                                                    All
                                                                </button>
                                                                {classGroups.map(group => {
                                                                    const studentsInGroup = classStudents.filter(s => s.metadata?.groupId === group.id).map(s => s.id);
                                                                    const allInGroupSelected = studentsInGroup.length > 0 && studentsInGroup.every(id => task.targetStudents?.includes(id));
                                                                    return (
                                                                        <button
                                                                            key={group.id}
                                                                            type="button"
                                                                            onClick={() => toggleGroupStudentsForTask('cw', task.id, group.id)}
                                                                            className={`text-[10px] px-2.5 py-1 rounded-lg font-black transition-all border ${allInGroupSelected
                                                                                ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm'
                                                                                : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50'
                                                                                }`}
                                                                        >
                                                                            {group.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAllStudentsForTask('cw', task.id, false)}
                                                                    className="text-[10px] px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg font-black hover:bg-slate-300 transition-colors"
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                            <input
                                                                type="text"
                                                                value={studentSearch}
                                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                                                                placeholder="Search by name or roll..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                                        {filteredStudents.length > 0 ? (
                                                            filteredStudents.map(student => {
                                                                const isSelected = task.targetStudents?.includes(student.id) || false;
                                                                return (
                                                                    <button
                                                                        key={student.id}
                                                                        type="button"
                                                                        onClick={() => toggleStudentForTask('cw', task.id, student.id)}
                                                                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${isSelected
                                                                            ? 'bg-blue-50 border border-blue-200'
                                                                            : 'hover:bg-slate-50 border border-transparent'
                                                                            }`}
                                                                    >
                                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-slate-100 border-slate-200'
                                                                            }`}>
                                                                            {student.metadata?.studentPhoto ? (
                                                                                <img src={student.metadata.studentPhoto} alt={student.name} className="w-full h-full object-cover" />
                                                                            ) : isSelected ? (
                                                                                <Check size={14} className="text-white" />
                                                                            ) : (
                                                                                <span className="text-[10px] font-bold text-slate-500">{student.name.charAt(0)}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-slate-700 truncate">{student.name}</p>
                                                                            <p className="text-[10px] text-slate-400 truncate">Roll: {student.studentId || 'N/A'}</p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-center py-6 text-xs text-slate-400 font-bold">No students found</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-xl focus-within:ring-4 focus-within:ring-[#045c84]/10 focus-within:border-[#045c84]/30 transition-all shadow-sm min-h-[48px]">
                                            {task.segments.map((seg, sIdx) => (
                                                <React.Fragment key={seg.id}>
                                                    {seg.type === 'tag' ? (
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg border border-white/40 shadow-sm animate-in zoom-in-50 ${ALL_TAGS.find(t => t.id === seg.value)?.color}`}>
                                                            {ALL_TAGS.find(t => t.id === seg.value)?.label}
                                                            <button type="button" onClick={() => removeTagFromTask('cw', task.id, seg.id)} className="hover:scale-110 transition-transform p-0.5">
                                                                <X size={10} />
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
                                                                className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400 py-1"
                                                                placeholder={sIdx === 0 && task.segments.length === 1 ? "আজ ক্লাসে কি পড়ানো হয়েছে..." : ""}
                                                            />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        {
                                            classworkTasks.length > 1 && (
                                                <button type="button" onClick={() => removeTaskLine('cw', task.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"><Trash2 size={18} /></button>
                                            )
                                        }
                                    </div>
                                ))}
                                <button type="button" onClick={() => addTaskLine('cw')} className="px-4 md:px-5 py-2.5 border-2 border-dashed border-slate-200 text-slate-400 text-[10px] font-black rounded-xl md:rounded-xl hover:border-[#045c84]/50 hover:text-[#045c84] hover:bg-white transition-all flex items-center gap-2 bg-white/50 w-full md:w-fit justify-center md:justify-start">
                                    <Plus size={16} /> নতুন লাইন যোগ করুন
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preparation (Tomorrow) */}
                    {activeTab === 'PR' && (
                        <div className="bg-purple-50/30 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-purple-100 shadow-inner">
                            <div className="mb-6 flex items-center justify-between">
                                <label className="text-xs md:text-sm font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-purple-600 shadow-sm"></span>
                                    আগামীকাল ক্লাসের পড়া
                                </label>
                                <button
                                    type="button"
                                    onClick={syncCWToPR}
                                    className="text-[10px] font-black text-purple-600 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-all border border-purple-200 shadow-sm"
                                >
                                    <LinkIcon size={12} />
                                    আজকের পড়া থেকে কপি করুন
                                </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                {ALL_TAGS.filter(t => pinnedTagIds.pr.includes(t.id)).map(tag => (
                                    <button key={tag.id} type="button" onClick={() => appendTagToTask('pr', tag.id)} className={`text-[9px] md:text-[10px] px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl font-black ${tag.color} border border-white/50 hover:shadow-sm transition-all shadow-white/50 animate-in fade-in zoom-in-50`}>{tag.label}</button>
                                ))}

                                {/* Tag Library Button */}
                                <div className="relative" ref={tagLibraryRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowTagLibrary(!showTagLibrary)}
                                        className="p-1 px-2 bg-purple-100 text-purple-400 rounded-lg hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={12} />
                                    </button>

                                    {showTagLibrary && (
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[60] animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">ট্যাগ লাইব্রেরি (Shortcut Picker)</p>
                                            <div className="flex flex-wrap gap-2">
                                                {ALL_TAGS.map(tag => {
                                                    const isPinned = pinnedTagIds.pr.includes(tag.id);
                                                    return (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => toggleTagPin(tag.id)}
                                                            className={`text-[9px] px-2.5 py-1.5 rounded-lg font-black border transition-all flex items-center gap-1.5 ${isPinned
                                                                ? `${tag.color} border-current opacity-100`
                                                                : 'bg-white text-slate-400 border-slate-100 opacity-60'
                                                                }`}
                                                        >
                                                            {isPinned && <Check size={8} />}
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
                                                onClick={() => setOpenStudentPickerTask(
                                                    openStudentPickerTask?.id === task.id ? null : { section: 'pr', id: task.id }
                                                )}
                                                className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border shadow-sm ${task.targetStudents && task.targetStudents.length > 0
                                                    ? 'bg-purple-50 text-purple-600 border-purple-200'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Users size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-tighter shrink-0">
                                                    {task.targetStudents && task.targetStudents.length > 0
                                                        ? task.targetStudents.length
                                                        : 'All'}
                                                </span>
                                            </button>

                                            {/* Student Picker Dropdown */}
                                            {openStudentPickerTask?.id === task.id && (
                                                <div className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                                    <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                <Users size={12} />
                                                                Select Students
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAllStudentsForTask('pr', task.id, true)}
                                                                    className="text-[10px] px-2.5 py-1 bg-purple-600 text-white rounded-lg font-black hover:bg-purple-700 transition-colors"
                                                                >
                                                                    All
                                                                </button>
                                                                {classGroups.map(group => {
                                                                    const studentsInGroup = classStudents.filter(s => s.metadata?.groupId === group.id).map(s => s.id);
                                                                    const allInGroupSelected = studentsInGroup.length > 0 && studentsInGroup.every(id => task.targetStudents?.includes(id));
                                                                    return (
                                                                        <button
                                                                            key={group.id}
                                                                            type="button"
                                                                            onClick={() => toggleGroupStudentsForTask('pr', task.id, group.id)}
                                                                            className={`text-[10px] px-2.5 py-1 rounded-lg font-black transition-all border ${allInGroupSelected
                                                                                ? 'bg-purple-100 text-purple-700 border-purple-200 shadow-sm'
                                                                                : 'bg-white text-purple-600 border-purple-100 hover:bg-purple-50'
                                                                                }`}
                                                                        >
                                                                            {group.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAllStudentsForTask('pr', task.id, false)}
                                                                    className="text-[10px] px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg font-black hover:bg-slate-300 transition-colors"
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                            <input
                                                                type="text"
                                                                value={studentSearch}
                                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-purple-500/10 focus:border-purple-400 transition-all"
                                                                placeholder="Search by name or roll..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                                        {filteredStudents.length > 0 ? (
                                                            filteredStudents.map(student => {
                                                                const isSelected = task.targetStudents?.includes(student.id) || false;
                                                                return (
                                                                    <button
                                                                        key={student.id}
                                                                        type="button"
                                                                        onClick={() => toggleStudentForTask('pr', task.id, student.id)}
                                                                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${isSelected
                                                                            ? 'bg-purple-50 border border-purple-200'
                                                                            : 'hover:bg-slate-50 border border-transparent'
                                                                            }`}
                                                                    >
                                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 ${isSelected ? 'bg-purple-600 border-purple-600' : 'bg-slate-100 border-slate-200'
                                                                            }`}>
                                                                            {student.metadata?.studentPhoto ? (
                                                                                <img src={student.metadata.studentPhoto} alt={student.name} className="w-full h-full object-cover" />
                                                                            ) : isSelected ? (
                                                                                <Check size={14} className="text-white" />
                                                                            ) : (
                                                                                <span className="text-[10px] font-bold text-slate-500">{student.name.charAt(0)}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-slate-700 truncate">{student.name}</p>
                                                                            <p className="text-[10px] text-slate-400 truncate">Roll: {student.studentId || 'N/A'}</p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-center py-6 text-xs text-slate-400 font-bold">No students found</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 bg-white border border-purple-100 rounded-xl focus-within:ring-4 focus-within:ring-purple-500/10 focus-within:border-purple-300 transition-all shadow-sm min-h-[48px]">
                                            {task.segments.map((seg, sIdx) => (
                                                <React.Fragment key={seg.id}>
                                                    {seg.type === 'tag' ? (
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg border border-white/40 shadow-sm animate-in zoom-in-50 ${ALL_TAGS.find(t => t.id === seg.value)?.color}`}>
                                                            {ALL_TAGS.find(t => t.id === seg.value)?.label}
                                                            <button type="button" onClick={() => removeTagFromTask('pr', task.id, seg.id)} className="hover:scale-110 transition-transform p-0.5">
                                                                <X size={10} />
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
                                                                className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400 py-1"
                                                                placeholder={sIdx === 0 && task.segments.length === 1 ? "আগামীকাল কি পড়ে আসতে হবে..." : ""}
                                                            />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        {
                                            prepTasks.length > 1 && (
                                                <button type="button" onClick={() => removeTaskLine('pr', task.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"><Trash2 size={18} /></button>
                                            )
                                        }
                                    </div>
                                ))}
                                <button type="button" onClick={() => addTaskLine('pr')} className="px-4 md:px-5 py-2.5 border-2 border-dashed border-purple-200 text-purple-400 text-[10px] font-black rounded-xl md:rounded-xl hover:border-purple-400 hover:text-purple-600 hover:bg-white transition-all flex items-center gap-2 bg-white/50 w-full md:w-fit justify-center md:justify-start">
                                    <Plus size={16} /> নতুন লাইন যোগ করুন
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Homework */}
                    {activeTab === 'HW' && (
                        <div className="bg-orange-50/30 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-orange-100 shadow-inner">
                            <div className="mb-6">
                                <label className="text-xs md:text-sm font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-orange-600 shadow-sm"></span>
                                    বাড়ির কাজ (Homework)
                                </label>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 mb-4">
                                {ALL_TAGS.filter(t => pinnedTagIds.hw.includes(t.id)).map(tag => (
                                    <button key={tag.id} type="button" onClick={() => appendTagToTask('hw', tag.id)} className={`text-[9px] md:text-[10px] px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl font-black ${tag.color} border border-white/50 hover:shadow-sm transition-all shadow-white/50 animate-in fade-in zoom-in-50`}>{tag.label}</button>
                                ))}

                                {/* Tag Library Button */}
                                <div className="relative" ref={tagLibraryRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowTagLibrary(!showTagLibrary)}
                                        className="p-1 px-2 bg-orange-100 text-orange-400 rounded-lg hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                                    >
                                        <Plus size={12} />
                                    </button>

                                    {showTagLibrary && (
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[60] animate-in fade-in slide-in-from-top-2">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">ট্যাগ লাইব্রেরি (Shortcut Picker)</p>
                                            <div className="flex flex-wrap gap-2">
                                                {ALL_TAGS.map(tag => {
                                                    const isPinned = pinnedTagIds.hw.includes(tag.id);
                                                    return (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => toggleTagPin(tag.id)}
                                                            className={`text-[9px] px-2.5 py-1.5 rounded-lg font-black border transition-all flex items-center gap-1.5 ${isPinned
                                                                ? `${tag.color} border-current opacity-100`
                                                                : 'bg-white text-slate-400 border-slate-100 opacity-60'
                                                                }`}
                                                        >
                                                            {isPinned && <Check size={8} />}
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
                                                onClick={() => setOpenStudentPickerTask(
                                                    openStudentPickerTask?.id === task.id ? null : { section: 'hw', id: task.id }
                                                )}
                                                className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border shadow-sm ${task.targetStudents && task.targetStudents.length > 0
                                                    ? 'bg-amber-50 text-amber-600 border-amber-200'
                                                    : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <Users size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-tighter shrink-0">
                                                    {task.targetStudents && task.targetStudents.length > 0
                                                        ? task.targetStudents.length
                                                        : 'All'}
                                                </span>
                                            </button>

                                            {/* Student Picker Dropdown */}
                                            {openStudentPickerTask?.id === task.id && (
                                                <div className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                                    <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                <Users size={12} />
                                                                Select Students
                                                            </p>
                                                            <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAllStudentsForTask('hw', task.id, true)}
                                                                    className="text-[10px] px-2.5 py-1 bg-amber-600 text-white rounded-lg font-black hover:bg-amber-700 transition-colors"
                                                                >
                                                                    All
                                                                </button>
                                                                {classGroups.map(group => {
                                                                    const studentsInGroup = classStudents.filter(s => s.metadata?.groupId === group.id).map(s => s.id);
                                                                    const allInGroupSelected = studentsInGroup.length > 0 && studentsInGroup.every(id => task.targetStudents?.includes(id));
                                                                    return (
                                                                        <button
                                                                            key={group.id}
                                                                            type="button"
                                                                            onClick={() => toggleGroupStudentsForTask('hw', task.id, group.id)}
                                                                            className={`text-[10px] px-2.5 py-1 rounded-lg font-black transition-all border ${allInGroupSelected
                                                                                ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm'
                                                                                : 'bg-white text-amber-600 border-amber-100 hover:bg-amber-50'
                                                                                }`}
                                                                        >
                                                                            {group.name}
                                                                        </button>
                                                                    );
                                                                })}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleAllStudentsForTask('hw', task.id, false)}
                                                                    className="text-[10px] px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg font-black hover:bg-slate-300 transition-colors"
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                            <input
                                                                type="text"
                                                                value={studentSearch}
                                                                onChange={(e) => setStudentSearch(e.target.value)}
                                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all"
                                                                placeholder="Search by name or roll..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                                        {filteredStudents.length > 0 ? (
                                                            filteredStudents.map(student => {
                                                                const isSelected = task.targetStudents?.includes(student.id) || false;
                                                                return (
                                                                    <button
                                                                        key={student.id}
                                                                        type="button"
                                                                        onClick={() => toggleStudentForTask('hw', task.id, student.id)}
                                                                        className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${isSelected
                                                                            ? 'bg-amber-50 border border-amber-200'
                                                                            : 'hover:bg-slate-50 border border-transparent'
                                                                            }`}
                                                                    >
                                                                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 ${isSelected ? 'bg-amber-600 border-amber-600' : 'bg-slate-100 border-slate-200'
                                                                            }`}>
                                                                            {student.metadata?.studentPhoto ? (
                                                                                <img src={student.metadata.studentPhoto} alt={student.name} className="w-full h-full object-cover" />
                                                                            ) : isSelected ? (
                                                                                <Check size={14} className="text-white" />
                                                                            ) : (
                                                                                <span className="text-[10px] font-bold text-slate-500">{student.name.charAt(0)}</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-slate-700 truncate">{student.name}</p>
                                                                            <p className="text-[10px] text-slate-400 truncate">Roll: {student.studentId || 'N/A'}</p>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-center py-6 text-xs text-slate-400 font-bold">No students found</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 bg-white border border-orange-100 rounded-xl focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-300 transition-all shadow-sm min-h-[48px]">
                                            {task.segments.map((seg, sIdx) => (
                                                <React.Fragment key={seg.id}>
                                                    {seg.type === 'tag' ? (
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg border border-white/40 shadow-sm animate-in zoom-in-50 ${ALL_TAGS.find(t => t.id === seg.value)?.color}`}>
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
                                                                className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400 py-1"
                                                                placeholder={sIdx === 0 && task.segments.length === 1 ? "বাড়িতে কি কাজ করতে হবে..." : ""}
                                                            />
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                        {
                                            homeworkTasks.length > 1 && (
                                                <button type="button" onClick={() => removeTaskLine('hw', task.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"><Trash2 size={18} /></button>
                                            )
                                        }
                                    </div>
                                ))}
                                <button type="button" onClick={() => addTaskLine('hw')} className="px-4 md:px-5 py-2.5 border-2 border-dashed border-orange-200 text-orange-400 text-[10px] font-black rounded-xl md:rounded-xl hover:border-orange-400 hover:text-orange-600 hover:bg-white transition-all flex items-center gap-2 bg-white/50 w-full md:w-fit justify-center md:justify-start">
                                    <Plus size={16} /> নতুন লাইন যোগ করুন
                                </button>
                            </div>
                        </div>
                    )
                    }

                    {/* Comments Section */}
                    {
                        activeTab === 'CM' && (
                            <div className="bg-slate-50 p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-200 shadow-inner">
                                <div className="flex items-center justify-between mb-6">
                                    <label className="text-xs md:text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={16} />
                                        মন্তব্য (Comments)
                                    </label>

                                    <div className="flex items-center gap-1.5 overflow-visible">
                                        <div className="flex flex-wrap gap-1.5 justify-end">
                                            {ALL_TAGS.filter(t => pinnedTagIds.cm.includes(t.id)).map(tag => (
                                                <button key={tag.id} type="button" onClick={() => appendTagToTask('cm', tag.id)} className={`text-[10px] px-3 py-1.5 rounded-xl font-black ${tag.color} border border-white/50 hover:shadow-sm transition-all shadow-white/50 animate-in fade-in zoom-in-50`}>{tag.label}</button>
                                            ))}
                                        </div>

                                        {/* Tag Library Button */}
                                        <div className="relative" ref={tagLibraryRef}>
                                            <button
                                                type="button"
                                                onClick={() => setShowTagLibrary(!showTagLibrary)}
                                                className="p-1.5 bg-slate-100 text-slate-400 rounded-lg hover:bg-[#045c84] hover:text-white transition-all shadow-sm"
                                            >
                                                <Plus size={14} />
                                            </button>

                                            {showTagLibrary && (
                                                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-[60] animate-in fade-in slide-in-from-top-2">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">ট্যাগ লাইব্রেরি (Shortcut Picker)</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {ALL_TAGS.map(tag => {
                                                            const isPinned = pinnedTagIds.cm.includes(tag.id);
                                                            return (
                                                                <button
                                                                    key={tag.id}
                                                                    type="button"
                                                                    onClick={() => toggleTagPin(tag.id)}
                                                                    className={`text-[9px] px-2.5 py-1.5 rounded-lg font-black border transition-all flex items-center gap-1.5 ${isPinned
                                                                        ? `${tag.color} border-current opacity-100`
                                                                        : 'bg-white text-slate-400 border-slate-100 opacity-60'
                                                                        }`}
                                                                >
                                                                    {isPinned && <Check size={8} />}
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
                                                    onClick={() => setOpenStudentPickerTask(
                                                        openStudentPickerTask?.id === task.id ? null : { section: 'cm', id: task.id }
                                                    )}
                                                    className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border shadow-sm ${task.targetStudents && task.targetStudents.length > 0
                                                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                                                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <Users size={14} />
                                                    <span className="text-[10px] font-black uppercase tracking-tighter shrink-0">
                                                        {task.targetStudents && task.targetStudents.length > 0
                                                            ? task.targetStudents.length
                                                            : 'All'}
                                                    </span>
                                                </button>

                                                {/* Student Picker Dropdown */}
                                                {openStudentPickerTask?.id === task.id && (
                                                    <div className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                                                        <div className="p-4 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                                    <Users size={12} />
                                                                    Select Students
                                                                </p>
                                                                <div className="flex flex-wrap gap-1.5 mt-2 md:mt-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleAllStudentsForTask('cm', task.id, true)}
                                                                        className="text-[10px] px-2.5 py-1 bg-slate-600 text-white rounded-lg font-black hover:bg-slate-700 transition-colors"
                                                                    >
                                                                        All
                                                                    </button>
                                                                    {classGroups.map(group => {
                                                                        const studentsInGroup = classStudents.filter(s => s.metadata?.groupId === group.id).map(s => s.id);
                                                                        const allInGroupSelected = studentsInGroup.length > 0 && studentsInGroup.every(id => task.targetStudents?.includes(id));
                                                                        return (
                                                                            <button
                                                                                key={group.id}
                                                                                type="button"
                                                                                onClick={() => toggleGroupStudentsForTask('cm', task.id, group.id)}
                                                                                className={`text-[10px] px-2.5 py-1 rounded-lg font-black transition-all border ${allInGroupSelected
                                                                                    ? 'bg-slate-200 text-slate-800 border-slate-300 shadow-sm'
                                                                                    : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                                                                                    }`}
                                                                            >
                                                                                {group.name}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => toggleAllStudentsForTask('cm', task.id, false)}
                                                                        className="text-[10px] px-2.5 py-1 bg-slate-200 text-slate-600 rounded-lg font-black hover:bg-slate-300 transition-colors"
                                                                    >
                                                                        Clear
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="relative">
                                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                                <input
                                                                    type="text"
                                                                    value={studentSearch}
                                                                    onChange={(e) => setStudentSearch(e.target.value)}
                                                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 transition-all"
                                                                    placeholder="Search by name or roll..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-80 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                                            {filteredStudents.length > 0 ? (
                                                                filteredStudents.map(student => {
                                                                    const isSelected = task.targetStudents?.includes(student.id) || false;
                                                                    return (
                                                                        <button
                                                                            key={student.id}
                                                                            type="button"
                                                                            onClick={() => toggleStudentForTask('cm', task.id, student.id)}
                                                                            className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-3 transition-all ${isSelected
                                                                                ? 'bg-slate-100 border border-slate-300'
                                                                                : 'hover:bg-slate-50 border border-transparent'
                                                                                }`}
                                                                        >
                                                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center overflow-hidden shrink-0 ${isSelected ? 'bg-slate-600 border-slate-600' : 'bg-slate-100 border-slate-200'
                                                                                }`}>
                                                                                {student.metadata?.studentPhoto ? (
                                                                                    <img src={student.metadata.studentPhoto} alt={student.name} className="w-full h-full object-cover" />
                                                                                ) : isSelected ? (
                                                                                    <Check size={14} className="text-white" />
                                                                                ) : (
                                                                                    <span className="text-[10px] font-bold text-slate-500">{student.name.charAt(0)}</span>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-xs font-bold text-slate-700 truncate">{student.name}</p>
                                                                                <p className="text-[10px] text-slate-400 truncate">Roll: {student.studentId || 'N/A'}</p>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })
                                                            ) : (
                                                                <p className="text-center py-6 text-xs text-slate-400 font-bold">No students found</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 flex flex-wrap items-center gap-1.5 p-2 bg-white border border-slate-200 rounded-xl focus-within:ring-4 focus-within:ring-slate-500/10 focus-within:border-slate-300 transition-all shadow-sm min-h-[48px]">
                                                {task.segments.map((seg, sIdx) => (
                                                    <React.Fragment key={seg.id}>
                                                        {seg.type === 'tag' ? (
                                                            <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg border border-white/40 shadow-sm animate-in zoom-in-50 ${ALL_TAGS.find(t => t.id === seg.value)?.color}`}>
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
                                                                    className="w-full bg-transparent outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400 py-1"
                                                                    placeholder={sIdx === 0 && task.segments.length === 1 ? "মন্তব্য লিখুন..." : ""}
                                                                />
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                            {
                                                commentTasks.length > 1 && (
                                                    <button type="button" onClick={() => removeTaskLine('cm', task.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"><Trash2 size={18} /></button>
                                                )
                                            }
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addTaskLine('cm')} className="px-4 md:px-5 py-2.5 border-2 border-dashed border-slate-300 text-slate-400 text-[10px] font-black rounded-xl md:rounded-xl hover:border-slate-500 hover:text-slate-600 hover:bg-white transition-all flex items-center gap-2 bg-white/50 w-full md:w-fit justify-center md:justify-start">
                                        <Plus size={16} /> নতুন মন্তব্য লাইন
                                    </button>
                                </div>

                                {/* Quick Comment Chips */}
                                <div className="flex flex-wrap gap-2.5">
                                    {COMMENT_CHIPS.map(chip => (
                                        <div key={chip.label} className="relative">
                                            <button
                                                type="button"
                                                onClick={() => handleChipClick(chip)}
                                                className={`px-4 py-2.5 bg-white border rounded-xl text-[10px] font-black transition-all shadow-sm active:scale-95 flex items-center gap-2 ${activeDynamicChip?.label === chip.label
                                                    ? 'border-[#045c84] text-[#045c84] bg-[#045c84]/5 ring-2 ring-[#045c84]/20'
                                                    : 'border-slate-200 text-slate-600 hover:bg-[#045c84]/5 hover:border-[#045c84]/30 hover:text-[#045c84]'
                                                    }`}
                                            >
                                                {chip.label}
                                                {chip.isDynamic && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                                            </button>

                                            {/* Dynamic Item Picker */}
                                            {chip.isDynamic && activeDynamicChip?.label === chip.label && (
                                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 animate-in fade-in slide-in-from-top-2 p-1.5 grid grid-cols-1 gap-1">
                                                    <p className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center border-b border-slate-50 mb-1">
                                                        সিলেক্ট করুন
                                                    </p>
                                                    {chip.items?.map(item => (
                                                        <button
                                                            key={item}
                                                            type="button"
                                                            onClick={() => insertComment(chip.template, item)}
                                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-xl text-[10px] font-bold text-slate-700 hover:text-[#045c84] transition-all flex items-center justify-between group"
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
                </div >
            </div >
        </div >
    );
}

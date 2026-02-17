'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from '@/components/SessionProvider';
import {
    Users,
    BookOpen,
    MessageSquare,
    GraduationCap,
    Camera,
    Loader2,
    Search,
    Phone,
    Mail
} from 'lucide-react';
import { ScrollableTabs } from '@/components/ui/ScrollableTabs';
import Toast from '@/components/Toast';
import Image from 'next/image';

interface Classmate {
    id: string;
    name: string;
    roll: string;
    photo: string | null;
    phone: string | null;
}

interface Book {
    id: string;
    name: string;
    author: string | null;
    coverImage: string | null;
    description: string | null;
}

interface Teacher {
    id: string;
    name: string;
    designation: string | null;
    department: string | null;
    phone: string | null;
    photo: string | null;
}

interface UserWithMetadata {
    id: string;
    role: string;
    metadata?: {
        classId?: string;
        classroomCoverImage?: string;
        rollNumber?: string;
        [key: string]: any;
    };
}

export default function ClassroomPage() {
    const { user: sessionUser, activeInstitute, setAllInstitutes } = useSession();
    const user = sessionUser as unknown as UserWithMetadata;
    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<{
        className: string;
        classmates: Classmate[];
        books: Book[];
        teachers: Teacher[];
    } | null>(null);
    const [activeTab, setActiveTab] = useState<'classmates' | 'books' | 'teachers' | 'chat'>('classmates');
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Search states for tabs
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (user?.metadata?.classroomCoverImage) {
            setCoverImage(user.metadata.classroomCoverImage);
        }
    }, [user]);

    const fetchClassroomData = async () => {
        if (!activeInstitute?.id || !user?.metadata?.classId) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`/api/student/classroom?instituteId=${activeInstitute.id}&classId=${user.metadata.classId}&studentId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setClassData(data);
            } else {
                console.error('Failed to fetch classroom data');
            }
        } catch (error) {
            console.error('Error fetching classroom data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClassroomData();
    }, [activeInstitute?.id, user?.metadata?.classId]);

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await uploadRes.json();

            if (data.url) {
                // Update user metadata
                const updatedMetadata = { ...user?.metadata, classroomCoverImage: data.url };

                const updateRes = await fetch('/api/admin/users', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: user?.id,
                        metadata: updatedMetadata
                    })
                });

                if (updateRes.ok) {
                    setCoverImage(data.url);
                    setToast({ message: 'Cover image updated successfully!', type: 'success' });
                    // Refresh session/user data if possible, or just local state is enough for visual
                    // Ideally we should update the session context, but explicit refresh might be needed
                }
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setToast({ message: 'Failed to upload cover image.', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-[#045c84]" size={40} />
            </div>
        );
    }

    if (!user?.metadata?.classId) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
                <BookOpen size={48} className="mb-4 text-slate-300" />
                <h3 className="text-xl font-bold mb-2">No Class Assigned</h3>
                <p>You are not currently assigned to any class.</p>
            </div>
        );
    }

    const filteredClassmates = classData?.classmates.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.roll.includes(search)
    ) || [];

    const filteredTeachers = classData?.teachers.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const filteredBooks = classData?.books.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    ) || [];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header / Cover Image */}
            <div className="relative h-64 md:h-80 w-full bg-slate-200 group overflow-hidden">
                {coverImage ? (
                    <Image
                        src={coverImage}
                        alt="Classroom Cover"
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#045c84] to-[#047cac] opacity-90"></div>
                )}

                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>

                <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 text-white">
                    <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">{classData?.className}</h1>
                    <p className="text-white/80 font-medium text-lg">Classroom • {user?.metadata?.rollNumber ? `Role: ${user.metadata.rollNumber}` : 'Student'}</p>
                </div>

                {/* Edit Cover Button */}
                <label className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full cursor-pointer transition-all opacity-0 group-hover:opacity-100">
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                        disabled={uploading}
                    />
                    {uploading ? <Loader2 className="animate-spin text-white" size={20} /> : <Camera className="text-white" size={20} />}
                </label>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-8 relative z-10">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden min-h-[600px]">

                    {/* Tabs */}
                    <div className="border-b border-slate-100 bg-white sticky top-0 z-20">
                        <ScrollableTabs
                            items={[
                                { id: 'classmates', label: 'Classmates', icon: <Users size={16} /> },
                                { id: 'books', label: 'Books', icon: <BookOpen size={16} /> },
                                { id: 'teachers', label: 'Teachers', icon: <GraduationCap size={16} /> },
                                { id: 'chat', label: 'Chat Room', icon: <MessageSquare size={16} /> },
                            ]}
                            selectedId={activeTab}
                            onSelect={(id) => setActiveTab(id as any)}
                        />
                    </div>

                    <div className="p-6">
                        {/* Search Bar for lists */}
                        {activeTab !== 'chat' && (
                            <div className="mb-6 relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder={`Search ${activeTab}...`}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#045c84]/20 focus:border-[#045c84]"
                                />
                            </div>
                        )}

                        {activeTab === 'classmates' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredClassmates.map(student => (
                                    <div key={student.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all bg-white group">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 relative shrink-0">
                                            {student.photo ? (
                                                <Image src={student.photo} alt={student.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold bg-slate-50">
                                                    {student.name[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-slate-800 truncate group-hover:text-[#045c84] transition-colors">{student.name}</h4>
                                            <p className="text-xs text-slate-500 font-medium">Roll: {student.roll}</p>
                                        </div>
                                    </div>
                                ))}
                                {filteredClassmates.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-slate-400">
                                        No classmates found.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'books' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredBooks.map(book => (
                                    <div key={book.id} className="group bg-white rounded-xl border border-slate-100 hover:border-[#045c84]/30 hover:shadow-lg transition-all overflow-hidden flex flex-col h-full">
                                        <div className="h-48 relative bg-slate-50 overflow-hidden">
                                            {book.coverImage ? (
                                                <Image src={book.coverImage} alt={book.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                                                    <BookOpen size={48} strokeWidth={1} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                            <div className="absolute bottom-3 left-3 right-3 text-white">
                                                <h3 className="font-bold text-lg leading-tight line-clamp-2">{book.name}</h3>
                                                {book.author && <p className="text-xs opacity-80 mt-1 line-clamp-1">{book.author}</p>}
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1">{book.description || 'No description available.'}</p>
                                            <button className="w-full py-2 rounded-lg bg-slate-50 text-[#045c84] font-bold text-sm hover:bg-[#045c84] hover:text-white transition-colors border border-slate-100">
                                                View Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {filteredBooks.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-slate-400">
                                        No books found.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'teachers' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredTeachers.map(teacher => (
                                    <div key={teacher.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all bg-white relative overflow-hidden group">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative shrink-0">
                                            {teacher.photo ? (
                                                <Image src={teacher.photo} alt={teacher.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                                                    <GraduationCap size={24} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="font-bold text-slate-800 group-hover:text-[#045c84] transition-colors">{teacher.name}</h4>
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                {teacher.designation && <span className="text-xs text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md w-fit">{teacher.designation}</span>}
                                                {teacher.department && <span className="text-xs text-slate-400">{teacher.department}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredTeachers.length === 0 && (
                                    <div className="col-span-full text-center py-12 text-slate-400">
                                        No teachers assigned to this class.
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'chat' && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <MessageSquare className="text-blue-400" size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Classroom Chat</h3>
                                <p className="text-slate-500 max-w-sm mb-8">Connect with your classmates and teachers in real-time. This feature is coming soon!</p>
                                <button disabled className="px-6 py-3 rounded-xl bg-slate-100 text-slate-400 font-bold cursor-not-allowed">
                                    Start Chatting (Disabled)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

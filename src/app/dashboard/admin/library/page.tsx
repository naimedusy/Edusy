'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/SessionProvider';
import {
    Search,
    BookOpen,
    Filter,
    Loader2,
    Plus,
    Globe,
    Building2,
    Trash2
} from 'lucide-react';
import Image from 'next/image';
import Toast from '@/components/Toast';
import { useRouter } from 'next/navigation';
import { useUI } from '@/components/UIProvider';

interface Book {
    id: string;
    name: string;
    author: string | null;
    coverImage: string | null;
    description: string | null;
    category: string | null;
    instituteId: string | null; // Null means Global/Super Admin
    institute?: { name: string };
    pdfUrl?: string;
    // ... other fields
}

export default function AdminLibraryPage() {
    const { user, activeInstitute, activeRole } = useSession();
    const { confirm } = useUI();
    const [loading, setLoading] = useState(true);
    const [books, setBooks] = useState<Book[]>([]);
    const [search, setSearch] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Placeholder for Add Modal

    // New Book Form State
    const [newBook, setNewBook] = useState({
        name: '',
        author: '',
        category: '',
        description: '',
        pdfUrl: '',
        coverImage: '',
        isGlobal: false
    });
    const [creating, setCreating] = useState(false);

    const fetchBooks = async () => {
        if (!activeRole) return;
        setLoading(true);
        try {
            // Build Query Params
            const params = new URLSearchParams();
            params.append('role', activeRole);
            if (activeInstitute?.id) {
                params.append('instituteId', activeInstitute.id);
            }

            const res = await fetch(`/api/admin/library?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setBooks(data);
            }
        } catch (error) {
            console.error('Failed to fetch library', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, [activeInstitute?.id, activeRole]);

    const handleCreateBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        try {
            const payload: any = {
                names: [newBook.name], // API expects array of names or books array
                // We'll use the 'books' array format for better control or just basic fields
                // The current API structure in admin/books POST is a bit complex (bulk create).
                // Let's use the 'books' array format to send specific details.
                books: [{
                    name: newBook.name,
                    author: newBook.author,
                    category: newBook.category,
                    description: newBook.description,
                    pdfUrl: newBook.pdfUrl,
                    coverImage: newBook.coverImage
                }]
            };

            if (newBook.isGlobal && activeRole === 'SUPER_ADMIN') {
                payload.instituteId = null; // or dont send it
                payload.isGlobal = true; // flag we added to API
            } else {
                if (!activeInstitute?.id) throw new Error("Institute ID missing");
                payload.instituteId = activeInstitute.id;
            }

            const res = await fetch('/api/admin/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setToast({ message: 'Book created successfully!', type: 'success' });
                setIsAddModalOpen(false);
                setNewBook({ name: '', author: '', category: '', description: '', pdfUrl: '', coverImage: '', isGlobal: false });
                fetchBooks();
            } else {
                setToast({ message: 'Failed to create book', type: 'error' });
            }

        } catch (error) {
            console.error(error);
            setToast({ message: 'Error creating book', type: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm('Are you sure you want to delete this book?')) return;
        try {
            // We need a DELETE endpoint. admin/books/route.ts has DELETE.
            const res = await fetch(`/api/admin/books?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: 'Book deleted', type: 'success' });
                setBooks(books.filter(b => b.id !== id));
            } else {
                setToast({ message: 'Failed to delete', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Error deleting', type: 'error' });
        }
    };

    const filteredBooks = books.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        (b.author?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-[#045c84]" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-8">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Library Management</h1>
                    <p className="text-slate-500 font-medium">
                        {activeRole === 'SUPER_ADMIN' ? 'Manage Global and Institute Books' : 'Manage Institute Library'}
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-[#045c84] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#034a6e] transition-all shadow-lg shadow-blue-900/20"
                >
                    <Plus size={20} /> Add New Book
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-6 flex items-center gap-3">
                <Search className="text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search books..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 outline-none text-slate-700 font-medium placeholder:text-slate-300"
                />
            </div>

            {/* Books List / Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-500 text-sm">Book</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-sm">Description</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-sm">Type</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredBooks.map(book => (
                                <tr key={book.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-14 bg-slate-100 rounded-md overflow-hidden relative shrink-0">
                                                {book.coverImage ? (
                                                    <Image src={book.coverImage} fill className="object-cover" alt="" />
                                                ) : (
                                                    <BookOpen className="m-auto text-slate-300" size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{book.name}</h4>
                                                <p className="text-xs text-slate-500">{book.author || 'Unknown Author'} • {book.category || 'General'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate text-slate-500 text-sm">
                                        {book.description || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {!book.instituteId ? (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100">
                                                <Globe size={12} /> Global
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                <Building2 size={12} /> Institute
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(book.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Book"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredBooks.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No books found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simple Add Book Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">Add New Book</h2>
                        <form onSubmit={handleCreateBook} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Book Name</label>
                                <input
                                    required
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#045c84]"
                                    value={newBook.name}
                                    onChange={e => setNewBook({ ...newBook, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Author</label>
                                    <input
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#045c84]"
                                        value={newBook.author}
                                        onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                                    <input
                                        className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#045c84]"
                                        value={newBook.category}
                                        onChange={e => setNewBook({ ...newBook, category: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#045c84] h-24 resize-none"
                                    value={newBook.description}
                                    onChange={e => setNewBook({ ...newBook, description: e.target.value })}
                                />
                            </div>

                            {/* Super Admin Option */}
                            {activeRole === 'SUPER_ADMIN' && (
                                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                                    <Globe className="text-purple-600" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-purple-900 text-sm">Global Book</h4>
                                        <p className="text-purple-700/70 text-xs">Visible to ALL institutes</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 accent-purple-600"
                                        checked={newBook.isGlobal}
                                        onChange={e => setNewBook({ ...newBook, isGlobal: e.target.checked })}
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors text-slate-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 bg-[#045c84] text-white py-3 rounded-xl font-bold hover:bg-[#034a6e] transition-colors disabled:opacity-50"
                                >
                                    {creating ? 'Saving...' : 'Add Book'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

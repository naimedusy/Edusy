'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/components/SessionProvider';
import {
    Search,
    BookOpen,
    Filter,
    Loader2,
    Star,
    BookMarked,
    ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import BookDetailsModal from '@/components/BookDetailsModal';
import PdfReaderModal from '@/components/PdfReaderModal';

interface Book {
    id: string;
    name: string;
    author: string | null;
    coverImage: string | null;
    description: string | null;
    category: string | null;
    rating?: number;
    pdfUrl?: string;
    readLink?: string;
}

export default function LibraryPage() {
    const { user, activeInstitute } = useSession();
    const [loading, setLoading] = useState(true);
    const [books, setBooks] = useState<{ academic: Book[], general: Book[] }>({ academic: [], general: [] });
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isReaderOpen, setIsReaderOpen] = useState(false);

    // Mock Categories for now, ideally fetched from DB unique values
    const categories = ['All', 'Academic', 'Fiction', 'Science', 'History', 'Biography', 'Technology'];

    const fetchBooks = async () => {
        if (!activeInstitute?.id) return;
        setLoading(true);
        try {
            const classId = user?.metadata?.classId || '';
            const res = await fetch(`/api/student/library?instituteId=${activeInstitute.id}&classId=${classId}`);
            if (res.ok) {
                const data = await res.json();
                setBooks(data);
            }
        } catch (error) {
            console.error('Failed to fetch library books', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, [activeInstitute?.id, user?.metadata?.classId]);

    const filterBooks = (bookList: Book[]) => {
        return bookList.filter(book => {
            const matchesSearch = book.name.toLowerCase().includes(search.toLowerCase()) ||
                (book.author?.toLowerCase().includes(search.toLowerCase()) ?? false);
            const matchesCategory = categoryFilter === 'All' ||
                (categoryFilter === 'Academic' ? false : book.category === categoryFilter);
            // Note: 'Academic' category filter logic might need adjustment if academic books are separate list

            return matchesSearch && matchesCategory;
        });
    };

    const filteredAcademic = categoryFilter === 'All' || categoryFilter === 'Academic' ? filterBooks(books.academic) : [];
    const filteredGeneral = categoryFilter === 'Academic' ? [] : filterBooks(books.general);

    const handleBookClick = (book: Book) => {
        setSelectedBook(book);
        setIsDetailsOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loader2 className="animate-spin text-[#045c84]" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header Section */}
            <div className="bg-[#045c84] text-white pt-8 pb-16 px-4 md:px-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">Central Library</h1>
                            <p className="text-blue-100 font-medium max-w-xl">Explore a world of knowledge. Access your academic textbooks and discover new interests from our general collection.</p>
                        </div>
                        <div className="hidden md:block">
                            <BookMarked size={64} className="text-white/20 rotate-12" />
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="bg-white rounded-2xl p-2 shadow-xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto md:mx-0">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by title, author, or keyword..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 font-medium h-full"
                            />
                        </div>
                        <div className="h-px md:h-auto w-full md:w-px bg-slate-100 mx-2"></div>
                        <div className="relative md:w-64">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border-none focus:ring-0 text-slate-800 font-medium bg-transparent cursor-pointer appearance-none"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">▼</div>
                        </div>
                        <button className="bg-[#045c84] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#034a6e] transition-colors shadow-lg shadow-blue-900/20">
                            Search
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-10 space-y-12">

                {/* Academic Books Section */}
                {filteredAcademic.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#045c84]">
                                    <BookOpen size={20} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">Academic Books</h2>
                            </div>
                            <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{filteredAcademic.length} Books</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredAcademic.map(book => (
                                <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} isAcademic />
                            ))}
                        </div>
                    </div>
                )}

                {/* General Collection Section */}
                {filteredGeneral.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                    <Star size={20} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-800">General Collection</h2>
                            </div>
                            <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{filteredGeneral.length} Books</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredGeneral.map(book => (
                                <BookCard key={book.id} book={book} onClick={() => handleBookClick(book)} />
                            ))}
                        </div>
                    </div>
                )}

                {filteredAcademic.length === 0 && filteredGeneral.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <Search size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No books found</h3>
                        <p className="text-slate-400">Try adjusting your search or filters to find what you're looking for.</p>
                        <button
                            onClick={() => { setSearch(''); setCategoryFilter('All'); }}
                            className="mt-6 text-[#045c84] font-bold hover:underline"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            {/* Modals */}
            <BookDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                book={selectedBook}
                onRead={() => {
                    setIsDetailsOpen(false);
                    setIsReaderOpen(true);
                }}
            />

            <PdfReaderModal
                isOpen={isReaderOpen}
                onClose={() => setIsReaderOpen(false)}
                pdfUrl={selectedBook?.pdfUrl || ''}
                title={selectedBook?.name || ''}
            />
        </div>
    );
}

// Sub-component for Book Card
function BookCard({ book, onClick, isAcademic = false }: { book: Book, onClick: () => void, isAcademic?: boolean }) {
    return (
        <div
            onClick={onClick}
            className="group cursor-pointer flex flex-col gap-3 transition-transform duration-300 hover:-translate-y-1"
        >
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50 group-hover:shadow-xl transition-all">
                {book.coverImage ? (
                    <Image src={book.coverImage} alt={book.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${isAcademic ? 'bg-blue-50 text-blue-300' : 'bg-slate-100 text-slate-300'}`}>
                        <BookOpen size={40} strokeWidth={1.5} />
                    </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-white text-xs font-bold border border-white/30 flex items-center gap-2">
                        View Details <ArrowRight size={12} />
                    </span>
                </div>

                {/* Rating Badge */}
                {book.rating && (
                    <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-white/90 text-[10px] font-bold flex items-center gap-1 border border-white/10">
                        <Star size={10} className="fill-yellow-400 text-yellow-400" /> {book.rating}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="font-bold text-slate-800 leading-tight line-clamp-2 group-hover:text-[#045c84] transition-colors text-sm md:text-base">{book.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{book.author || 'Unknown Author'}</p>
                {book.category && !isAcademic && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mt-1">
                        {book.category}
                    </span>
                )}
            </div>
        </div>
    );
}

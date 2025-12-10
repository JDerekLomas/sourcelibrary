import React from 'react';
import {
    PencilIcon,
    TrashIcon,
    DocumentIcon,
    DocumentTextIcon,
    UserIcon,
    CalendarIcon,
    GlobeAltIcon,
    BookOpenIcon
} from '@heroicons/react/24/outline';
import { Book } from '../../types';
import Card from '../ui/Card';
import { Helmet } from 'react-helmet';

interface BookInfoCardProps {
    book: Book;
    totalPages: number;
    onEdit: () => void;
    onUploadPdf: () => void;
    onDelete: () => void;
    description?: string; // Pass description as a prop if needed
}

const BookInfoCard: React.FC<BookInfoCardProps> = ({
    book,
    totalPages,
    onEdit,
    onUploadPdf,
    onDelete,
    description
}) => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.sourcelibrary.org';
    const bookUrl = `${siteUrl}/book/${book.id}`;
    const ogTitle = `${book.title} by ${book.author}`;
    const ogDescription = description || `Read ${book.title} by ${book.author}.`;
    const ogImage = book.thumbnail ? (book.thumbnail.startsWith('http') ? book.thumbnail : `${siteUrl}${book.thumbnail}`) : undefined;
    const ogReleaseDate = book.published;

    return (
        <>
            <Helmet>
                <meta property="og:title" content={ogTitle} />
                <meta property="og:description" content={ogDescription} />
                {ogImage && <meta property="og:image" content={ogImage} />}
                <meta property="og:url" content={bookUrl} />
                <meta property="og:type" content="book" />
                {ogReleaseDate && <meta property="book:release_date" content={ogReleaseDate} />}
                <meta property="book:author" content={book.author} />
            </Helmet>
            <Card className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                        {book.thumbnail ? (
                            <img
                                src={book.thumbnail}
                                alt={book.title}
                                className="w-full max-w-48 h-64 object-cover border border-gray-200 mx-auto"
                            />
                        ) : (
                            <div className="w-full max-w-48 h-64 bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto">
                                <BookOpenIcon className="h-16 w-16 text-gray-400" />
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2 space-y-4">
                        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-gray-900 leading-tight">
                            {book.title}
                        </h1>

                        <div className="space-y-3 text-gray-600">
                            <p className="flex items-center text-lg font-medium">
                                <UserIcon className="h-5 w-5 mr-2 text-gray-500" />
                                {book.author}
                            </p>

                            <div className="grid grid-cols-2 gap-4 text-base">
                                <div className="flex items-center">
                                    <GlobeAltIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    <span className="font-medium">Language:</span>
                                    <span className="ml-1">{book.language}</span>
                                </div>
                                <div className="flex items-center">
                                    <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    <span className="font-medium">Pages:</span>
                                    <span className="ml-1">{totalPages}</span>
                                </div>
                                <div className="flex items-center">
                                    <CalendarIcon className="h-5 w-5 mr-2 text-gray-400" />
                                    <span className="font-medium">Published:</span>
                                    <span className="ml-1">{book.published}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1 flex flex-col space-y-3">
                        <button
                            onClick={onEdit}
                            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 font-serif transition-colors text-base"
                        >
                            <PencilIcon className="h-4 w-4" />
                            <span>Edit Book</span>
                        </button>
                        <button
                            onClick={onUploadPdf}
                            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 font-serif transition-colors text-base"
                        >
                            <DocumentIcon className="h-4 w-4" />
                            <span>Upload PDF</span>
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 bg-white text-red-700 hover:bg-red-50 font-serif transition-colors text-base"
                        >
                            <TrashIcon className="h-4 w-4" />
                            <span>Delete Book</span>
                        </button>
                    </div>
                </div>
            </Card>
        </>
    );
};

export default BookInfoCard;

import React from 'react';
import { Link } from 'react-router-dom';

import { usePaths } from '../../hooks/usePaths';
import { Book } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Buttons/Button';
import BookThumbnail from '../BookDetails/BookThumbnail';
import { UserIcon } from '@heroicons/react/24/outline';
import BookMetadata from '../BookDetails/BookMetadata';

interface BookListItemProps {
    book: Book;
    categoryNames?: string[];
}

const BookListItem: React.FC<BookListItemProps> = ({ book, categoryNames }) => {
    const paths = usePaths();

    return (
        <Link to={paths.bookDetails(book.id)} className="no-underline">
            <Card className="group" hover>
                <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                        <div className="w-24 h-40 bg-gray-50 overflow-hidden border border-gray-200">
                            <BookThumbnail
                                src={book.thumbnail}
                                alt={`Cover of ${book.title}`}
                                hoverEffect="scale"
                                className="cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between min-h-[128px]">
                            <div className="flex-grow pr-6">
                                <h3 className="text-xl font-serif font-bold mb-2 leading-tight">
                                    {book.title}
                                </h3>

                                <p className="text-base text-gray-700 mb-3 flex items-center font-medium">
                                    <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                                    {book.author}
                                </p>

                                <BookMetadata
                                    language={book.language}
                                    pages={book.pages_count}
                                    publishDate={book.published}
                                    variant="detailed"
                                    showIcons={true}
                                    showLabels={true}
                                    containerClassName="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600"
                                />

                                {categoryNames && categoryNames.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {categoryNames.map((name, idx) => (
                                            <span key={idx} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-serif">
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <div className="text-xs text-gray-500 mt-2">
                                    <span className="font-medium">Added:</span>
                                    <span className="ml-1">{new Date(book.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="flex items-center self-center">
                                <Button variant='primary'> Open Book </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </Link>
    );
};

export default BookListItem;

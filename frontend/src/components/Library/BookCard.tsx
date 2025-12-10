import React from 'react';
import { Link } from 'react-router-dom';
import { UserIcon } from '@heroicons/react/24/outline';

import { Book } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Buttons/Button';
import BookThumbnail from '../BookDetails/BookThumbnail';
import BookMetadata from '../BookDetails/BookMetadata';
import { usePaths } from '../../hooks/usePaths';

interface BookCardProps {
    book: Book;
    categoryNames?: string[];
}

const BookCard: React.FC<BookCardProps> = ({ book, categoryNames }) => {
    const paths = usePaths();

    return (
        <Link to={paths.bookDetails(book.id)} className="no-underline">
            <Card className="group overflow-hidden flex flex-col h-full" hover>
                <div className="relative h-80 bg-gray-100 overflow-hidden">
                    <BookThumbnail
                        src={book.thumbnail}
                        alt={`Cover of ${book.title}`}
                        hoverEffect="scaleAndRotate"
                        className="cursor-pointer"
                    />
                </div>

                <div className="p-2 flex flex-col flex-grow">
                    <h3 className="text-lg font-serif font-bold mb-3 line-clamp-2 leading-tight">
                        {book.display_title || book.title}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 flex items-center font-medium">
                        <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                        {book.author}
                    </p>

                    <div className="space-y-2 mb-6 text-xs text-gray-500 flex-grow">
                        <BookMetadata
                            language={book.language}
                            pages={book.pages_count}
                            publishDate={book.published}
                            variant="compact"
                            showIcons={true}
                            showLabels={false}
                            className=""
                        />

                        {categoryNames && categoryNames.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {categoryNames.map((name, idx) => (
                                    <span key={idx} className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-serif">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button variant='primary' className='uppercase'> Open Book </Button>
                </div>
            </Card>
        </Link>
    );
};

export default BookCard;

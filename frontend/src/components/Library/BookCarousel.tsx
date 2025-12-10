import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { usePaths } from '../../hooks/usePaths';
import { useBookDetails } from '../../hooks/useBookDetails';
import BookThumbnail from '../BookDetails/BookThumbnail';
import BookMetadata from '../BookDetails/BookMetadata';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorLoading from '../ui/ErrorLoading';
import Button from '../ui/Buttons/Button';

const BOOKS_PER_PAGE = 8;

const BookCarousel: React.FC = () => {
    const { books, loading, error } = useBookDetails();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [visibleCount, setVisibleCount] = useState(BOOKS_PER_PAGE);

    const paths = usePaths();

    // Sorting books by newest added first
    const visibleBooks = books.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, visibleCount);

    const hasMore = visibleCount < books.length;

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 400;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const loadMore = () => {
        const newCount = Math.min(visibleCount + BOOKS_PER_PAGE, books.length);
        setVisibleCount(newCount);

        // Scroll to show newly loaded items
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollBy({
                    left: 400,
                    behavior: 'smooth'
                });
            }
        }, 100);
    };

    if (loading) {
        return (
            <section className="min-h-screen bg-gradient-to-b from-[#f6f3ee] to-[#f3ede6] flex items-center justify-center px-6 md:px-12 py-20">
                <div className="text-center">
                    <LoadingSpinner
                        message='Retrieving texts through time.'
                        theme='gray'
                    />
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-gradient-to-b from-[#f6f3ee] to-[#f3ede6] px-6 md:px-12 py-20">
            <div className="mb-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
                        Freshly Digitised & Translated<br />
                        <span className="text-gray-600">at the Source Library</span>
                    </h2>
                    <div className="flex gap-6">
                        <button
                            onClick={() => scroll('left')}
                            className="w-12 h-12 flex items-center justify-center"
                            aria-label="Scroll Left"
                        >
                            <ArrowLeftIcon className="h-10 w-10 stroke-[1px]" />
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="w-12 h-12 flex items-center justify-center"
                            aria-label="Scroll Right"
                        >
                            <ArrowRightIcon className="h-10 w-10 stroke-[1px]" />
                        </button>
                    </div>
                </div>

                <div
                    ref={scrollContainerRef}
                    className="flex gap-6 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {error ? (
                        <div className="w-full flex items-center justify-center min-h-[400px]">
                            <ErrorLoading
                                title="Temporal Turbulence"
                                message="An error occurred while fetching the books."
                            />
                        </div>
                    ) : (
                        <>
                            {visibleBooks.map((book) => (
                                <div
                                    key={book.id}
                                    className="flex-none w-[320px] bg-transparent group h-[600px]"
                                >
                                    <Link to={paths.bookDetails(book.id)} className="block h-full">
                                        <div className="flex flex-col h-full justify-between">
                                            <div>
                                                <div className="mb-4 overflow-hidden bg-white aspect-[3/4]">
                                                    <BookThumbnail
                                                        src={book.thumbnail}
                                                        alt={book.title}
                                                        hoverEffect="scaleAndRotate"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-serif text-gray-900 line-clamp-2">
                                                        {book.display_title || book.title}
                                                    </h3>
                                                    <BookMetadata
                                                        author={book.author}
                                                        language={book.language}
                                                        publishDate={book.published}
                                                        className="mt-2 mb-4"
                                                        variant='csv'
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-4">
                                                <button className="px-6 py-2 bg-gray-900 text-white font-sans text-sm uppercase tracking-wider rounded-full hover:bg-gray-800 transition-colors duration-200">
                                                    Open Book
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}

                            {hasMore && (
                                <div className="flex-none w-[320px] h-[600px] flex items-center justify-center">
                                    <div className="text-center px-8">
                                        <Button
                                            variant='primary'
                                            onClick={loadMore}
                                            size='sm'
                                        >Load More...
                                        </Button>
                                        <p className="mt-2 text-sm text-gray-500 font-sans">
                                            Showing {visibleCount} of {books.length}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BookCarousel;

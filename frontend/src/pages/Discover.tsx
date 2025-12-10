import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Buttons/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import HomeButton from '../components/ui/Buttons/HomeButton';
import apiService from '../services/api';
import { usePaths } from '../hooks/usePaths';

interface DiscoverPage {
    id: string;
    book_id: string;
    page_number: number;
    photo: string;
    thumbnail: string;
    translation: {
        data: string;
        language: string;
    };
    book_title: string;
    book_author: string;
    book_language: string;
}

const Discover: React.FC = () => {
    const [pages, setPages] = useState<DiscoverPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const paths = usePaths();

    useEffect(() => {
        fetchRandomPages();
    }, []);

    const fetchRandomPages = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiService.getRandomPages(4);
            setPages(data.pages || []);
        } catch (error) {
            console.error('Error fetching random pages:', error);
            setError('Failed to load pages');
        } finally {
            setLoading(false);
        }
    };

    const handlePageClick = (bookId: string, pageId: string) => {
        navigate(paths.translation(bookId, pageId));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white flex items-center justify-center">
                <LoadingSpinner
                    message="Discovering wisdom..."
                    theme="amber"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white">
            {/* Header */}
            <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-amber-100 border border-amber-200">
                                <SparklesIcon className="h-6 w-6 text-amber-700" />
                            </div>
                            <div>
                                <h1 className="text-xl font-serif font-bold text-gray-900">Discover Wisdom</h1>
                                <p className="text-sm text-gray-600 font-serif">Explore passages from classical texts</p>
                            </div>
                        </div>
                        <HomeButton />
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {error ? (
                    <div className="text-center py-24">
                        <div className="bg-red-50 border border-red-200 p-8 max-w-md mx-auto">
                            <p className="text-red-700 font-serif text-lg mb-4">{error}</p>
                            <Button
                                onClick={fetchRandomPages}
                                className="bg-red-700 hover:bg-red-800"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                ) : pages.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="bg-amber-50 border border-amber-200 p-12 max-w-2xl mx-auto">
                            <div className="p-4 bg-white border border-amber-200 w-20 h-20 mx-auto mb-6">
                                <BookOpenIcon className="h-12 w-12 text-amber-600" />
                            </div>
                            <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                                No Content Available
                            </h3>
                            <p className="text-gray-600 leading-relaxed font-serif max-w-md mx-auto text-base mb-6">
                                There are no pages with sufficient translated content to display.
                                Add more books and process their pages to discover wisdom.
                            </p>
                            <Button
                                onClick={() => navigate(paths.home)}
                                className="bg-amber-700 hover:bg-amber-800"
                            >
                                Go to Library
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* Introduction */}
                        <div className="text-center">
                            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 mb-4">
                                Discover Classical Wisdom
                            </h2>
                            <p className="text-lg text-gray-600 font-serif font-light max-w-2xl mx-auto leading-relaxed">
                                Explore remarkable passages from history's greatest thinkers,
                                made accessible through AI translation.
                            </p>
                        </div>

                        {/* Pages */}
                        <div className="space-y-12">
                            {pages.map((page, index) => (
                                <div key={page.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                                        {/* Image */}
                                        <div className="aspect-[3/4] lg:aspect-auto">
                                            <img
                                                src={page.thumbnail}
                                                alt={`Page ${page.page_number} from ${page.book_title}`}
                                                className="w-full h-full object-cover"
                                                loading={index === 0 ? "eager" : "lazy"}
                                            />
                                        </div>

                                        {/* Translation */}
                                        <div className="p-8 lg:p-12 flex flex-col justify-center">
                                            <div className="mb-6">
                                                <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">
                                                    {page.book_title}
                                                </h3>
                                                <p className="text-gray-600 font-serif">
                                                    by {page.book_author} • Page {page.page_number}
                                                </p>
                                                <p className="text-sm text-gray-500 font-serif mt-1">
                                                    Translated from {page.book_language} to {page.translation.language}
                                                </p>
                                            </div>

                                            <div className="flex-1">
                                                <blockquote className="text-gray-800 font-serif leading-relaxed text-base lg:text-lg italic border-l-4 border-amber-200 pl-6 mb-6">
                                                    {page.translation.data.length > 400
                                                        ? `${page.translation.data.substring(0, 400)}...`
                                                        : page.translation.data
                                                    }
                                                </blockquote>

                                                <Button
                                                    onClick={() => handlePageClick(page.book_id, page.id)}
                                                    className="bg-amber-700 hover:bg-amber-800 w-full sm:w-auto"
                                                >
                                                    Read Full Translation
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Refresh Button */}
                        <div className="text-center pt-8">
                            <Button
                                onClick={fetchRandomPages}
                                variant="secondary"
                                className="bg-gray-50 hover:bg-gray-100 border-2 border-gray-200"
                            >
                                <SparklesIcon className="h-4 w-4 mr-2" />
                                Discover More Wisdom
                            </Button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Discover;
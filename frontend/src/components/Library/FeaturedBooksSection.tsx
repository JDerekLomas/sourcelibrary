import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import { usePaths } from '../../hooks/usePaths';
import LoadingSpinner from '../ui/LoadingSpinner';
import apiService from '../../services/api';
import Button from '../ui/Buttons/Button';
import BookThumbnail from '../BookDetails/BookThumbnail';
import ErrorLoading from '../ui/ErrorLoading';
import { FeaturedPage } from '../../types';


const FeaturedBooksSection: React.FC = () => {
    const [featuredPages, setFeaturedPages] = useState<FeaturedPage[]>([]);
    const [featuredLoading, setFeaturedLoading] = useState(true);
    const [error, setError] = useState(false);

    const paths = usePaths();

    useEffect(() => {
        fetchFeaturedPages();
    }, []);

    const fetchFeaturedPages = async () => {
        setFeaturedLoading(true);
        setError(false);
        try {
            const data = await apiService.getRandomPages(4);
            setFeaturedPages((data.pages || []).slice(0, 4));
        } catch (error) {
            console.error('Error fetching featured pages:', error);
            setError(true);
        } finally {
            setFeaturedLoading(false);
        }
    };

    return (
        <section className="min-h-screen min-h-screen bg-gradient-to-b from-[#f6f3ee] to-[#f3ede6] py-24">
            <div className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
                    {/* Left Sticky Text */}
                    <div className="lg:col-span-4">
                        <div className="lg:sticky lg:top-24">
                            <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                                Featured Books
                            </h2>
                            <p className="text-lg text-gray-600 font-sans font-light leading-relaxed mb-8">
                                These featured works reveal hidden currents of wisdom, from Renaissance Hermeticism to global esoteric traditions.
                            </p>
                        </div>
                    </div>

                    {/* Right Grid of Pages */}
                    <div className="lg:col-span-8">
                        {featuredLoading ? (
                            <div className="flex items-center justify-center py-24">
                                <LoadingSpinner submessage="Loading featured pages..." theme="gray" />
                            </div>
                        ) : error ? (
                            <ErrorLoading
                                title="Temporal Turbulence"
                                message="Unable to Load Curated Pages"
                            />
                        ) : featuredPages.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {featuredPages.map((page, index) => (
                                    <Link to={paths.translation(page.book_id, page.id)} key={page.id} className="block group">
                                        <div className="h-full flex flex-col justify-between bg-white border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg transition-shadow duration-200">
                                            {/* Square Thumbnail */}
                                            <div className="aspect-square overflow-hidden">
                                                <BookThumbnail
                                                    src={page.compressed_photo || page.photo || ''}
                                                    alt={`Page ${page.page_number} from ${page.book_title}`}
                                                    loading={index === 0 ? "eager" : "lazy"}
                                                    hoverEffect='scale'
                                                />
                                            </div>

                                            {/* Translation */}
                                            <div className="p-6">
                                                <div className="mb-4">
                                                    <h3 className="text-lg font-serif font-bold text-gray-900 mb-2 line-clamp-2">
                                                        {page.book_title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 font-serif">
                                                        by {page.book_author} • Page {page.page_number}
                                                    </p>
                                                    <p className="text-xs text-gray-500 font-serif mt-1">
                                                        Translated from {page.book_language} to {page.translation.language}
                                                    </p>
                                                </div>

                                                <blockquote className="text-sm text-gray-800 font-serif leading-relaxed italic border-l-4 border-amber-200 pl-4 mb-4 line-clamp-4">
                                                    {page.translation.data}
                                                </blockquote>

                                                <Button className="bg-amber-700 hover:bg-amber-800 text-sm">
                                                    Read Full Translation
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-100 border border-black p-8 text-center">
                                <p className="text-gray-600 font-serif">No featured pages available.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FeaturedBooksSection;

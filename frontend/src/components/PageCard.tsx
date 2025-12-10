import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

import { useAuth } from '../contexts/AuthContext';
import { usePaths } from '../hooks/usePaths';
import { ResourceType, ActionType } from '../auth/RoleGuard';

interface Page {
    book_id: string;
    page_number: number;
    ocr: { data: string };
    translation: { data: string };
    id: string;
    photo: string;
    thumbnail?: string;
}

interface PageCardProps {
    page: Page;
    isSelected: boolean;
    onSelect: (pageId: string, checked: boolean) => void;
    onDelete: (pageId: string) => void;
}

const PageCard: React.FC<PageCardProps> = ({ page, isSelected, onSelect, onDelete }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const [imageError, setImageError] = useState(false);
    const [currentImageSrc, setCurrentImageSrc] = useState(
        page.thumbnail && page.thumbnail.trim() !== "" ? page.thumbnail : page.photo
    );

    const navigate = useNavigate();
    const paths = usePaths();

    const canDeletePage = useAuth()?.can(ResourceType.PAGE, ActionType.DELETE) ?? false;

    const handleImageError = () => {
        if (page.thumbnail && page.thumbnail.trim() !== "" && currentImageSrc === page.thumbnail) {
            console.log(`Thumbnail failed for page ${page.page_number}, falling back to full photo`);
            setCurrentImageSrc(page.photo);
            setImageError(false);
        } else {
            console.log(`Both thumbnail and photo failed for page ${page.page_number}`);
            setImageError(true);
            setImageLoading(false);
        }
    };

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
    };

    const handleCardClick = () => {
        navigate(paths.translation(page.book_id, page.id));
    };

    return (
        <article className="group bg-white border border-gray-200 hover:border-gray-300 transition-all duration-200 overflow-hidden cursor-pointer relative">
            {/* Header with checkbox, title, and delete */}
            <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 p-3">
                {canDeletePage ? (
                    <>
                        {/* Checkbox, Page No in centre, Delete Icon */}
                        <div className="flex items-center justify-between relative">
                            <label className="flex items-center space-x-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => onSelect(page.id, e.target.checked)}
                                    className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300 rounded-none"
                                />
                            </label>
                            {/* Centered page number */}
                            <div className="absolute left-1/2 transform -translate-x-1/2">
                                <h3 className="text-sm font-serif font-semibold text-gray-900">Page {page.page_number}</h3>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(page.id); }}
                                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors bg-transparent hover:bg-red-50 focus:outline-none border-0"
                                title="Delete page"
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Only Page No in centre*/}
                        <div className="flex items-center justify-center">
                            <h3 className="text-sm font-serif font-semibold text-gray-900">Page {page.page_number}</h3>
                        </div>
                    </>
                )}

            </div>

            {/* Image Container */}
            <div className="relative h-64 bg-gray-100 overflow-hidden mt-16" onClick={handleCardClick}>
                {imageLoading && !imageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-900 border-t-transparent mb-2"></div>
                            <span className="text-xs text-gray-600 font-serif">Loading page...</span>
                        </div>
                    </div>
                )}

                {imageError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                        <DocumentTextIcon className="h-12 w-12 mb-2" />
                        <span className="text-sm font-serif">Page unavailable</span>
                        <span className="text-xs font-serif text-gray-400 mt-1">Classical text image</span>
                    </div>
                ) : (
                    <img
                        src={currentImageSrc}
                        alt={`Page ${page.page_number}`}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        className={`w-full h-full object-cover group-hover:scale-102 transition-transform duration-200 ${imageLoading ? 'hidden' : 'block'}`}
                    />
                )}
            </div>

            {/* Footer with stats */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium font-serif text-gray-700">OCR:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono bg-gray-100 text-gray-700">
                            {page.ocr.data.length}
                        </span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium font-serif text-gray-700">Translation:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono bg-gray-100 text-gray-700">
                            {page.translation.data.length}
                        </span>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default PageCard;
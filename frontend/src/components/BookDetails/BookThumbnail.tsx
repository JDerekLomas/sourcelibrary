import React from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';

interface BookThumbnailProps {
    src?: string;
    alt: string;
    loading?: 'eager' | 'lazy';
    hoverEffect?: 'scale' | 'scaleAndRotate' | 'none';
    className?: string;
}

const BookThumbnail: React.FC<BookThumbnailProps> = ({
    src,
    alt,
    className = '',
    hoverEffect = 'scaleAndRotate',
    loading = 'lazy'
}) => {
    const hoverClasses = {
        scale: 'group-hover:scale-105',
        scaleAndRotate: 'group-hover:scale-110 group-hover:rotate-[2deg]',
        none: ''
    };

    if (!src) {
        return (
            <div className={`w-full h-full flex items-center justify-center bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors duration-200 ${className}`}>
                <BookOpenIcon className="h-16 w-16 text-gray-400" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-transform duration-300 ${hoverClasses[hoverEffect]} ${className}`}
            loading={loading}
        />
    );
};

export default BookThumbnail;

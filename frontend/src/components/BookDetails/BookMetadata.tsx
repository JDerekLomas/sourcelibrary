import React from 'react';
import { GlobeAltIcon, DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface BookMetadataProps {
    author?: string;
    language?: string;
    publishDate?: string | number;
    pages?: number;
    className?: string;
    variant?: 'detailed' | 'csv' | 'compact';
    showIcons?: boolean;
    showLabels?: boolean;
    containerClassName?: string;
}

const IconLabel: React.FC<{ Icon: any; label?: string; value?: React.ReactNode; showIcon?: boolean; showLabel?: boolean; className?: string }> = ({
    Icon,
    label,
    value,
    showIcon = true,
    showLabel = false,
    className = ''
}) => (
    <div className={`flex items-center ${className}`}>
        {showIcon && Icon && <Icon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />}
        {showLabel ? <span className="text-xs text-gray-600 mr-1 font-medium">{label}</span> : null}
        <span className="text-xs text-gray-600">{value}</span>
    </div>
);

const BookMetadata: React.FC<BookMetadataProps> = ({
    author,
    language,
    publishDate,
    pages,
    variant,
    showIcons,
    showLabels,
    className = '',
    containerClassName = ''
}) => {
    // compact / card: inline small items, no labels by default (CSV-like or separated)
    if (variant === 'compact' || variant === 'csv') {
        const parts: string[] = [];
        if (author) parts.push(author);
        if (language) parts.push(String(language));
        if (publishDate) parts.push(String(publishDate));
        if (pages !== undefined && pages !== null) parts.push(`${pages} pages`);

        if (variant === 'csv') {
            return <p className={`text-sm text-gray-600 font-sans ${className}`}>{parts.join(' • ')}</p>;
        }

        // compact: show small inline items with optional icons
        return (
            <div className={`grid grid-cols-2 gap-2 ${containerClassName}`}>
                {language ? (
                    <IconLabel Icon={GlobeAltIcon} label={showLabels ? 'Language:' : undefined} value={language} showIcon={showIcons} showLabel={showLabels} />
                ) : null}
                {pages !== undefined && pages !== null ? (
                    <IconLabel Icon={DocumentTextIcon} label={showLabels ? 'Pages:' : undefined} value={`${pages} Pages`} showIcon={showIcons} showLabel={showLabels} />
                ) : null}
                {publishDate ? (
                    <IconLabel Icon={CalendarIcon} label={showLabels ? 'Published:' : undefined} value={publishDate} showIcon={showIcons} showLabel={showLabels} />
                ) : null}
            </div>
        );
    }

    if (variant === 'detailed') {
        return (
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 ${containerClassName}`}>
                {language ? (
                    <div>
                        <IconLabel Icon={GlobeAltIcon} label={showLabels ? 'Language:' : undefined} value={language} showIcon={showIcons} showLabel={showLabels} />
                    </div>
                ) : null}
                {pages !== undefined && pages !== null ? (
                    <div>
                        <IconLabel Icon={DocumentTextIcon} label={showLabels ? 'Pages:' : undefined} value={`${pages} pages`} showIcon={showIcons} showLabel={showLabels} />
                    </div>
                ) : null}
                {publishDate ? (
                    <div>
                        <IconLabel Icon={CalendarIcon} label={showLabels ? 'Published:' : undefined} value={publishDate} showIcon={showIcons} showLabel={showLabels} />
                    </div>
                ) : null}
            </div>
        );
    }

    return null;
};

export default BookMetadata;

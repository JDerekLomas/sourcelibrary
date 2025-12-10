import React from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

import { usePaths } from '../../hooks/usePaths';

interface HeaderProps {
    bookDetails: any;
    pageDetails: any;
    allPages: any[];
    currentPageIndex: number;
    viewMode: 'both' | 'translation' | 'photo-translation';
    fontSize: number;
    onViewModeChange: (mode: 'both' | 'translation' | 'photo-translation') => void;
    onFontSizeChange: (size: number) => void;
    onBack: () => void;
}

const Header: React.FC<HeaderProps> = ({
    bookDetails,
    pageDetails,
    viewMode,
    fontSize,
    onViewModeChange,
    onFontSizeChange,
    onBack
}) => {
    const paths = usePaths();

    return (
        <header className="border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
            <div className="max-w-full px-3 sm:px-4 lg:px-6">
                <div className="flex justify-between items-center py-2 sm:py-3">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <nav className="text-sm sm:text-sm text-gray-500 font-serif flex items-center overflow-hidden">
                            <Link to={paths.home} className="hover:text-gray-700 transition-colors">Books</Link>
                            <span className="mx-1 flex-shrink-0">/</span>
                            <Link to={paths.bookDetails(bookDetails?.book_id)} className="hover:text-gray-700 truncate transition-colors text-sm sm:text-base max-w-[100px] sm:max-w-none">
                                {bookDetails ? bookDetails.title : "Loading..."}
                            </Link>
                            <span className="mx-1 flex-shrink-0">/</span>
                            <span className="text-gray-900 font-semibold flex-shrink-0 text-sm sm:text-base">
                                Page {pageDetails ? pageDetails.page_number : ""}
                            </span>
                        </nav>
                    </div>

                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        {/* View Mode Selector */}
                        <div className="hidden md:flex items-center space-x-1">
                            <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                            <select
                                value={viewMode}
                                onChange={(e) => onViewModeChange(e.target.value as any)}
                                className="text-xs sm:text-sm border border-gray-300 rounded bg-white px-2 sm:px-3 py-1 sm:py-2 font-serif focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                <option value="both">All Views</option>
                                <option value="photo-translation">Photo + Translation</option>
                                <option value="translation">Translation Only</option>
                            </select>
                        </div>

                        {/* Mobile View Mode Selector */}
                        <div className="md:hidden flex items-center space-x-1">
                            <EyeIcon className="h-4 w-4 text-gray-500" />
                            <select
                                value={viewMode}
                                onChange={(e) => onViewModeChange(e.target.value as any)}
                                className="text-xs border border-gray-300 rounded bg-white px-2 py-1 font-serif focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                <option value="both">All</option>
                                <option value="photo-translation">Photo+</option>
                                <option value="translation">Text</option>
                            </select>
                        </div>

                        {/* Font Size Controls */}
                        <div className="hidden sm:flex items-center space-x-1">
                            <button
                                onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))}
                                className="p-1 sm:p-2 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors touch-manipulation"
                                title="Decrease font size"
                            >
                                <MinusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                            <span className="text-xs sm:text-sm px-2 sm:px-3 min-w-[40px] sm:min-w-[50px] text-center font-mono bg-gray-50 rounded py-1">{fontSize}px</span>
                            <button
                                onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                                className="p-1 sm:p-2 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors touch-manipulation"
                                title="Increase font size"
                            >
                                <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                        </div>

                        <button
                            onClick={onBack}
                            className="px-2 sm:px-4 py-1 sm:py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 font-serif transition-colors text-xs sm:text-sm touch-manipulation min-h-[32px]"
                        >
                            <span className="hidden sm:inline">Back</span>
                            <span className="sm:hidden">←</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

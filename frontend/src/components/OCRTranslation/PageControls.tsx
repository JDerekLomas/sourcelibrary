import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

interface PageControlsProps {
    pageDetails: any;
    allPages: any[];
    currentPageIndex: number;
    fontSize: number;
    isSaving: boolean;
    onPreviousPage: () => void;
    onNextPage: () => void;
    onFontSizeChange: (size: number) => void;
    onSave: () => void;
}

const PageControls: React.FC<PageControlsProps> = ({
    pageDetails,
    allPages,
    currentPageIndex,
    fontSize,
    isSaving,
    onPreviousPage,
    onNextPage,
    onFontSizeChange,
    onSave
}) => {
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 gap-2 flex-shrink-0">
            <div className="flex items-center space-x-4">
                <h1 className="text-lg sm:text-xl font-serif font-bold text-gray-900">
                    Page {pageDetails ? pageDetails.page_number : ""} 
                    {allPages.length > 0 && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                            of {allPages.length}
                        </span>
                    )}
                </h1>
            </div>
            
            <div className="flex items-center justify-between sm:justify-end space-x-2">
                {/* Mobile Font Size Controls */}
                <div className="sm:hidden flex items-center space-x-1">
                    <button 
                        onClick={() => onFontSizeChange(Math.max(10, fontSize - 2))}
                        className="p-2 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors touch-manipulation"
                        title="Decrease font size"
                    >
                        <MinusIcon className="h-4 w-4" />
                    </button>
                    <span className="text-xs px-2 min-w-[40px] text-center font-mono bg-gray-50 rounded py-1">{fontSize}</span>
                    <button 
                        onClick={() => onFontSizeChange(Math.min(24, fontSize + 2))}
                        className="p-2 border border-gray-300 rounded bg-white hover:bg-gray-50 transition-colors touch-manipulation"
                        title="Increase font size"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </button>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={onPreviousPage}
                        disabled={currentPageIndex <= 0}
                        className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-serif transition-colors text-xs sm:text-sm touch-manipulation min-h-[32px]"
                        title="Previous Page"
                    >
                        <ArrowLeftIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Prev</span>
                    </button>
                    
                    <button 
                        onClick={onNextPage}
                        disabled={currentPageIndex >= allPages.length - 1}
                        className="flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-serif transition-colors text-xs sm:text-sm touch-manipulation min-h-[32px]"
                        title="Next Page"
                    >
                        <span className="hidden sm:inline">Next</span>
                        <ArrowRightIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                </div>
                
                <button
                    onClick={onSave}
                    disabled={!pageDetails || isSaving}
                    className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white px-3 sm:px-4 py-2 rounded font-serif transition-colors text-sm touch-manipulation min-h-[40px]"
                >
                    {isSaving ? (
                        <>
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span className="hidden sm:inline">Saving...</span>
                        </>
                    ) : (
                        <span>Save</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default PageControls;

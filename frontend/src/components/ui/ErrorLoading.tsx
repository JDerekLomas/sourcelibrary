import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorLoadingProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    retryText?: string;
    className?: string;
}

const ErrorLoading: React.FC<ErrorLoadingProps> = ({
    title = "Failed to Load",
    message = "An error occurred while fetching the data. Please try again later.",
    onRetry,
    retryText = "Retry",
    className = ""
}) => {
    return (
        <div className={`text-center py-24 ${className}`}>
            <div className="bg-red-50 border-2 border-dashed border-red-300 p-12 max-w-2xl mx-auto">
                <div className="p-4 bg-white border border-red-200 w-20 h-20 mx-auto mb-6">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                    {title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed font-sans font-light max-w-md mx-auto text-base">
                    {message}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white font-serif font-medium py-3 px-6 transition-colors duration-200 text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded-full"
                    >
                        <span>{retryText}</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorLoading;

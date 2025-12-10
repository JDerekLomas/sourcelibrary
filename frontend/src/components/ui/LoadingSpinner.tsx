import React from 'react';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    message?: string;
    submessage?: string;
    className?: string;
    theme?: 'amber' | 'gray';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    message,
    submessage,
    className = '',
    theme = 'amber'
}) => {
    const containerClasses = {
        sm: 'p-6',
        md: 'p-12',
        lg: 'p-16'
    };

    const dotClasses = {
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-3 h-3'
    };

    const themeClasses = {
        amber: 'bg-amber-700',
        gray: 'bg-gray-900'
    };

    const textSizes = {
        sm: 'text-base',
        md: 'text-lg',
        lg: 'text-xl'
    };

    const subtextSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base'
    };

    return (
        <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 ${containerClasses[size]} text-center max-w-md ${className}`}>
            <span className="flex items-center justify-center space-x-2 mb-4">
                <div className="flex space-x-1">
                    <div className={`${dotClasses[size]} ${themeClasses[theme]} rounded-full animate-bounce`}></div>
                    <div className={`${dotClasses[size]} ${themeClasses[theme]} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                    <div className={`${dotClasses[size]} ${themeClasses[theme]} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                </div>
            </span>
            <p className={`text-gray-600 font-sans font-regular ${textSizes[size]}`}>{message}</p>
            {submessage && (
                <p className={`text-gray-500 font-sans ${subtextSizes[size]} mt-2`}>{submessage}</p>
            )}
        </div>
    );
};

export default LoadingSpinner;

import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
    title, 
    subtitle, 
    actions,
}) => {
    return (
        <header className="border-b border-gray-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="max-w-xl">
                        <h1 className="text-5xl mb-0 font-serif font-bold text-gray-900 leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-1 text-gray-600 font-serif leading-snug">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
                </div>
            </div>
        </header>
    );
};

export default PageHeader;                                                    

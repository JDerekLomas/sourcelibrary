import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

const Card: React.FC<CardProps> = ({
    children,
    className = '',
    padding = 'md',
    hover = false
}) => {
    const paddingClasses = {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8'
    };

    const baseClasses = `bg-white border border-gray-200 ${hover ? 'hover:border-gray-300 hover:border-[2px] transition-all duration-200' : ''}`;
    const classes = `${baseClasses} ${paddingClasses[padding]} ${className}`;

    return (
        <div className={classes}>
            {children}
        </div>
    );
};

export default Card;

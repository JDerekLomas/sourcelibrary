import React from 'react';

interface GridProps {
    children: React.ReactNode;
    cols?: 1 | 2 | 3 | 4 | 5;
    gap?: 'sm' | 'md' | 'lg';
    className?: string;
}

const Grid: React.FC<GridProps> = ({ 
    children, 
    cols = 1, 
    gap = 'md',
    className = '' 
}) => {
    const colClasses = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
    };

    const gapClasses = {
        sm: 'gap-4',
        md: 'gap-6',
        lg: 'gap-8'
    };

    return (
        <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className}`}>
            {children}
        </div>
    );
};

export default Grid;

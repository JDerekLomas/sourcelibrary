import React from 'react';

interface DropdownProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    className?: string;
    size?: 'sm' | 'md';
}

const Dropdown: React.FC<DropdownProps> = ({
    value,
    onChange,
    options,
    className = '',
    size = 'md'
}) => {
    const sizeClasses = size === 'sm'
        ? 'pl-2 pr-8 py-1 text-xs'
        : 'pl-4 pr-10 py-2.5 text-sm';

    return (
        <div className={`relative ${className}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`${sizeClasses} appearance-none border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-sans font-light bg-white w-full`}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>

            {/* Custom arrow SVG */}
            <div className={`pointer-events-none absolute inset-y-0 ${size === 'sm' ? 'right-2' : 'right-3'} flex items-center text-gray-700`}>
                <svg
                    className="h-4 w-4 transform transition-transform"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    aria-hidden="true"
                >
                    <path
                        fillRule="evenodd"
                        d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
                    />
                </svg>
            </div>
        </div>
    );
};

export default Dropdown;

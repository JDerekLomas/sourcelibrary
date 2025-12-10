import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ 
    message, 
    type, 
    isVisible, 
    onClose, 
    duration = 3000 
}) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border max-w-md ${
                type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
            }`}>
                {type === 'success' ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
                )}
                <span className="text-sm font-medium flex-1">{message}</span>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;

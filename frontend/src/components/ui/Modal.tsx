import React from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: React.ReactNode;
    type?: 'success' | 'error' | 'warning' | 'info';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
    loading?: boolean;
    extraButtons?: Array<{
        text: string;
        variant?: 'success' | 'danger' | 'default';
        onClick: () => void | Promise<void>;
        loading?: boolean;
    }>;
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    showCancel = false,
    loading = false,
    extraButtons = []
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
            case 'error':
                return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
            case 'warning':
                return <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />;
            default:
                return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
        }
    };

    const getIconBgColor = () => {
        switch (type) {
            case 'success':
                return 'bg-green-100';
            case 'error':
                return 'bg-red-100';
            case 'warning':
                return 'bg-amber-100';
            default:
                return 'bg-blue-100';
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        } else {
            onClose();
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full">
                <div className="p-6">
                    <div className="flex items-start space-x-4">
                        <div className={`flex-shrink-0 p-2 rounded-full ${getIconBgColor()}`}>
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-serif font-semibold text-gray-900 mb-2">
                                {title}
                            </h3>
                            <div className="text-gray-600 font-serif text-sm leading-relaxed">
                                {message}
                            </div>
                        </div>
                        {!showCancel && !onConfirm && (
                            <button
                                onClick={onClose}
                                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="border-t border-gray-200 px-6 py-4">
                    <div className={`flex ${showCancel ? 'justify-end space-x-3' : 'justify-end'}`}>
                        {extraButtons && extraButtons.map((btn, idx) => (
                            <button
                                key={btn.text + idx}
                                onClick={btn.onClick}
                                disabled={btn.loading}
                                className={`px-4 py-2 rounded font-serif font-medium transition-colors disabled:opacity-50 text-sm flex items-center space-x-2
                                    ${btn.variant === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                      btn.variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white' :
                                      'bg-gray-200 hover:bg-gray-300 text-gray-900'}
                                `}
                            >
                                {btn.loading && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                )}
                                <span>{btn.text}</span>
                            </button>
                        ))}
                        {showCancel && (
                            <button
                                onClick={handleCancel}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 font-serif transition-colors disabled:opacity-50 text-sm"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className={`px-4 py-2 rounded font-serif font-medium transition-colors disabled:opacity-50 text-sm flex items-center space-x-2 ${
                                type === 'error' 
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-gray-900 hover:bg-gray-800 text-white'
                            }`}
                        >
                            {loading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                            )}
                            <span>{confirmText}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;

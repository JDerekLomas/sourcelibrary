import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface PromptModalProps {
    visible: boolean;
    title: string;
    placeholder: string;
    helpText: string;
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
}

const PromptModal: React.FC<PromptModalProps> = ({
    visible,
    title,
    placeholder,
    helpText,
    value,
    onChange,
    onSave,
    onCancel
}) => {
    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-gray-300 p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-auto rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base sm:text-lg font-serif font-bold">{title}</h3>
                    <button 
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded touch-manipulation"
                    >
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-4 font-serif">{helpText}</p>
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-32 p-3 border border-gray-300 bg-white resize-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-serif overflow-auto touch-manipulation text-sm"
                />
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-4">
                    <button 
                        onClick={onCancel}
                        className="w-full sm:w-auto px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 font-serif transition-colors touch-manipulation min-h-[44px]"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onSave}
                        className="w-full sm:w-auto px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-serif transition-colors touch-manipulation min-h-[44px]"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptModal;

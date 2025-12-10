import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

import { usePaths } from '../hooks/usePaths';
import { MAJOR_LANGUAGES } from '../utils/languages';
import Button from '../components/ui/Buttons/Button';
import Input from '../components/ui/Input';
import { BookFormData } from '../types';
import { apiService } from '../services/api';
import Modal from '../components/ui/Modal';
import { useModal } from '../hooks/useModal';
import HomeButton from '../components/ui/Buttons/HomeButton';

const AddBook: React.FC = () => {
    const navigate = useNavigate();
    const paths = usePaths();

    const { modalState, hideModal, showError, showSuccess } = useModal();
    const [formData, setFormData] = useState<BookFormData>({
        title: '',
        author: '',
        language: '',
        published: ''
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onload = () => setThumbnailPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            submitData.append(key, value);
        });

        // Always append thumbnail field - either the file or an empty blob
        if (thumbnailFile) {
            submitData.append('thumbnail', thumbnailFile);
        } else {
            // Send an empty file when no thumbnail is selected
            submitData.append('thumbnail', new File([], '', { type: 'application/octet-stream' }));
        }

        try {
            const data = await apiService.createBook(submitData);
            showSuccess('Book Added', 'Book has been added successfully!', () => {
                navigate(paths.bookDetails(data.id));
            });
        } catch (error) {
            console.error('Error:', error);
            showError('Add Failed', `Failed to add book: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <main className="max-w-2xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <HomeButton />

                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Add Classical Text</h1>
                    <p className="text-lg text-gray-600 font-serif font-light mb-4">
                        Preserve classical knowledge by adding a new philosophical or scientific text to the collection
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <p className="text-amber-800 font-serif text-sm">
                            <strong>Next step:</strong> After creating your text entry, you'll be able to upload PDF files, individual page scans, and use AI-powered batch processing for OCR and translation.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            label="Title"
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            required
                            placeholder="Enter the book title"
                        />

                        <Input
                            label="Author"
                            type="text"
                            value={formData.author}
                            onChange={(e) => handleInputChange('author', e.target.value)}
                            required
                            placeholder="Enter the author's name"
                        />

                        <div className="space-y-2">
                            <label className="block text-base font-medium text-gray-700 font-serif">
                                Language
                            </label>
                            <input
                                list="languages"
                                value={formData.language}
                                onChange={(e) => handleInputChange('language', e.target.value)}
                                required
                                placeholder="Type or select a language"
                                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-serif transition-colors"
                                style={{ wordWrap: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            />
                            <datalist id="languages">
                                {MAJOR_LANGUAGES.map(lang => (
                                    <option key={lang.value} value={lang.value} />
                                ))}
                            </datalist>
                        </div>

                        <Input
                            label="Published"
                            type="text"
                            value={formData.published}
                            onChange={(e) => handleInputChange('published', e.target.value)}
                            required
                            placeholder="e.g., 1687, Ancient Period, etc."
                        />

                        {/* Thumbnail Upload */}
                        <div className="space-y-2">
                            <label className="block text-base font-medium text-gray-700 font-serif">
                                Text Cover (Optional)
                            </label>
                            <p className="text-sm text-gray-500 font-serif mb-3">
                                Add a cover image for your classical text. If no cover is provided, a default book icon will be displayed. You can upload PDF files and individual pages after creating the entry.
                            </p>
                            <div className="w-full">
                                <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-400 transition-colors cursor-pointer">
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleThumbnailChange}
                                    />
                                    <div className="p-6 text-center">
                                        {thumbnailPreview ? (
                                            <div className="space-y-4">
                                                <img src={thumbnailPreview} alt="Preview" className="mx-auto h-32 w-24 object-cover rounded-lg shadow-sm" />
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-700 font-serif">Click to change cover</p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setThumbnailFile(null);
                                                            setThumbnailPreview('');
                                                        }}
                                                        className="text-red-600 hover:text-red-700 text-sm font-serif transition-colors duration-200 bg-transparent border-0 focus:outline-none"
                                                    >
                                                        Remove Cover
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <div>
                                                    <span className="text-amber-700 hover:text-amber-800 font-medium font-serif">Upload text cover</span>
                                                    <p className="text-sm text-gray-500 mt-1 font-serif">PNG, JPG, WEBP up to 10MB (optional)</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        <Button type="submit" loading={loading} className="w-full" size="lg">
                            {loading ? (
                                <span className="flex items-center space-x-2">
                                    <span>Adding to Collection...</span>
                                </span>
                            ) : (
                                'Add to Collection'
                            )}
                        </Button>
                    </form>
                </div>
            </main>

            {/* Modal */}
            <Modal
                isOpen={modalState.isOpen}
                onClose={hideModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                onConfirm={modalState.onConfirm}
                onCancel={modalState.onCancel}
                showCancel={modalState.showCancel}
                loading={modalState.loading}
            />
        </div>
    );
};

export default AddBook;
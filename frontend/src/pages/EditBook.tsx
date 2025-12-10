import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { MAJOR_LANGUAGES } from '../utils/languages';
import Button from '../components/ui/Buttons/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useModal } from '../hooks/useModal';
import { usePaths } from '../hooks/usePaths';
import apiService from '../services/api';

const EditBook: React.FC = () => {
    const { book_id } = useParams<{ book_id: string }>();
    const { modalState, hideModal, showError, showSuccess } = useModal();
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        language: '',
        published: ''
    });
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [currentThumbnail, setCurrentThumbnail] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const navigate = useNavigate();
    const paths = usePaths();

    useEffect(() => {
        if (!book_id) {
            setPageLoading(false);
            return;
        }

        (async () => {
            try {
                const data = await apiService.getBookDetails(book_id);
                setFormData({
                    title: data.book.title || '',
                    author: data.book.author || '',
                    language: data.book.language || '',
                    published: data.book.published || ''
                });

                if (data.book.thumbnail) {
                    setCurrentThumbnail(data.book.thumbnail);
                }
            }
            catch (error) {
                showError('Load Failed', 'Failed to load book details');
                throw new Error('Failed to fetch book details');
            }
            finally {
                setPageLoading(false);
            }
        })();

    }, [book_id]);

    const handleGoToBookDetails = (book_id: string | undefined) => {
        if (!book_id) return;
        navigate(paths.bookDetails(book_id));
    };

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
        if (!book_id) return;

        e.preventDefault();
        setLoading(true);

        const submitData = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            submitData.append(key, value);
        });

        // Always append thumbnail field - either the new file or an empty blob if no new file
        if (thumbnailFile) {
            submitData.append('thumbnail', thumbnailFile);
        } else {
            // Send an empty file when no new thumbnail is selected
            submitData.append('thumbnail', new File([], '', { type: 'application/octet-stream' }));
        }

        try {
            const response = await apiService.updateBook(book_id, submitData);

            if (response) {
                showSuccess('Book Updated', 'Book has been updated successfully!', () => {
                    handleGoToBookDetails(book_id);
                });
            }
        } catch (error) {
            console.error('Error updating book:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            showError('Update Failed', `Failed to update book: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-serif text-lg">Loading text details...</p>
                    <p className="text-gray-500 font-serif text-sm mt-2">Retrieving classical work information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
            <main className="max-w-2xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="secondary"
                        onClick={() => handleGoToBookDetails(book_id)}
                        className="mb-6"
                    >
                        ← Back to Book
                    </Button>
                    <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">Edit Classical Text</h1>
                    <p className="text-lg text-gray-600 font-serif font-light">
                        Update the details of this philosophical or scientific work
                    </p>
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
                                Update the cover image for this classical text. Leave unchanged if you don't want to modify the current cover.
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
                                                <img src={thumbnailPreview} alt="New Preview" className="mx-auto h-32 w-24 object-cover rounded-lg shadow-sm" />
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-700 font-serif">New cover selected - click to change</p>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setThumbnailFile(null);
                                                            setThumbnailPreview('');
                                                        }}
                                                        className="text-red-600 hover:text-red-700 text-sm font-serif transition-colors duration-200 bg-transparent border-0 focus:outline-none"
                                                    >
                                                        Remove New Cover
                                                    </button>
                                                </div>
                                            </div>
                                        ) : currentThumbnail ? (
                                            <div className="space-y-4">
                                                <img src={currentThumbnail} alt="Current" className="mx-auto h-32 w-24 object-cover rounded-lg shadow-sm" />
                                                <p className="text-sm font-medium text-gray-700 font-serif">Current cover - click to change</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                <div>
                                                    <span className="text-amber-700 hover:text-amber-800 font-medium font-serif">Upload book cover</span>
                                                    <p className="text-sm text-gray-500 mt-1 font-serif">PNG, JPG, WEBP up to 10MB (optional)</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        <Button type="submit" loading={loading} className="w-full uppercase" size="lg">
                            {loading ? (
                                <span className="flex items-center space-x-2">
                                    <span>Updating...</span>
                                </span>
                            ) : (
                                'Update'
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

export default EditBook;

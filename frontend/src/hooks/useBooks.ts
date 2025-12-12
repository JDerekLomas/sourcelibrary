import { useState, useEffect } from 'react';
import { Book, Category } from '../types';
import { apiService } from '../services/api';
import { sampleBooks } from '../data/sampleBooks';

// Set to true to use sample data instead of API
const USE_SAMPLE_DATA = import.meta.env.VITE_USE_SAMPLE_DATA === 'true';

interface UseBooksResponse {
    books: Book[];
    categories: Category[];
    loading: boolean;
    error: Error | null;
    getCategoryNames: (categoryIds: string[]) => string[];
}

export const useBooks = (): UseBooksResponse => {
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (USE_SAMPLE_DATA) {
            // Use sample data
            setBooks(sampleBooks);
            setCategories([
                { id: "1", name: "Astrology", description: "Astrological texts" },
                { id: "2", name: "History", description: "Historical texts" },
                { id: "3", name: "Alchemy", description: "Alchemical texts" },
                { id: "4", name: "Kabbalah", description: "Kabbalistic texts" },
                { id: "5", name: "Theosophy", description: "Theosophical texts" },
            ]);
            setLoading(false);
            return;
        }

        // Use API
        Promise.all([
            apiService.getAllBooks(),
            apiService.getAllCategories()
        ])
            .then(([booksData, categoriesData]) => {
                setBooks(booksData);
                setCategories(categoriesData);
            })
            .catch((err) => {
                console.error('Error fetching data:', err);
                setError(err);
                // Fallback to sample data on error
                setBooks(sampleBooks);
            })
            .finally(() => setLoading(false));
    }, []);

    const getCategoryNames = (categoryIds: string[]): string[] => {
        return categoryIds
            .map((catId) => categories.find((cat) => cat.id === catId)?.name)
            .filter(Boolean) as string[];
    };

    return { books, categories, loading, error, getCategoryNames };
};

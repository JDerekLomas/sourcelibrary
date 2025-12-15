import { useState, useEffect } from 'react';
import { Book, Category } from '../types';
import { apiService } from '../services/api';

interface UseBooksResponse {
    books: Book[];
    categories: Category[];
    loading: boolean;
    error: Error | null;
    getCategoryNames: (categoryIds: string[]) => string[];
}

// Transform API book data to match our Book type
const transformBook = (apiBook: any): Book => ({
    ...apiBook,
    pages_count: apiBook.pages_count ?? apiBook.pages ?? 0,
});

export const useBooks = (): UseBooksResponse => {
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Always use API - no sample data fallback
        Promise.all([
            apiService.getAllBooks(),
            apiService.getAllCategories()
        ])
            .then(([booksData, categoriesData]) => {
                // Transform books to ensure pages_count exists
                const transformedBooks = booksData.map(transformBook);
                setBooks(transformedBooks);
                setCategories(categoriesData);
            })
            .catch((err) => {
                console.error('Error fetching data:', err);
                setError(err);
                // Don't fall back to sample data - show empty state
                setBooks([]);
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

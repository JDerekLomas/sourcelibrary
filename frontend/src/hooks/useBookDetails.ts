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

export const useBookDetails = (): UseBooksResponse => {
    const [books, setBooks] = useState<Book[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
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

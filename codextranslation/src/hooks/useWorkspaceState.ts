import { useState, useEffect } from 'react';
import { Book, Page, Version } from '../types';
import { getBooks, getPagesForBook, updatePageContent } from '../services/api';

const useWorkspaceState = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [versions, setVersions] = useState<Version[]>([]); // Assuming versions are still mock or will be fetched differently
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch books on component mount
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setIsLoading(true);
        const fetchedBooks = await getBooks();
        setBooks(fetchedBooks);
        if (fetchedBooks.length > 0) {
          setSelectedBookId(fetchedBooks[0].id); // Automatically select the first book
        }
      } catch (err) {
        setError('Failed to fetch books.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // Fetch pages when selectedBookId changes
  useEffect(() => {
    if (selectedBookId) {
      const fetchPages = async () => {
        try {
          setIsLoading(true);
          const fetchedPages = await getPagesForBook(selectedBookId);
          setPages(fetchedPages);
          setCurrentPage(0); // Reset to first page of the new book
          // For now, versions are still mocked or fetched differently, so we'll keep the mock.
          // In a real scenario, versions might also be fetched based on selectedBookId or page.
        } catch (err) {
          setError(`Failed to fetch pages for book ${selectedBookId}.`);
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPages();
    } else {
      setPages([]); // Clear pages if no book is selected
    }
  }, [selectedBookId]);

  const addPage = (page: Page) => {
    setPages(prevPages => [...prevPages, page]);
  };

  const updatePage = async (pageId: string, updatedPage: Partial<Page>) => {
    setPages(prevPages =>
      prevPages.map(p => (p.id === pageId ? { ...p, ...updatedPage } : p))
    );

    if (selectedBookId) {
      try {
        // Persist the change to the backend
        await updatePageContent(selectedBookId, pageId, updatedPage);
        // Optionally, re-fetch the page or show a success message
      } catch (err) {
        console.error(`Failed to persist update for page ${pageId}:`, err);
        // You might want to revert local state or show a user-facing error here
      }
    }
  };

  return {
    books,
    selectedBookId,
    setSelectedBookId,
    pages,
    currentPage,
    versions,
    isLoading,
    error,
    setPages, // Might be removed if all updates go through API
    setCurrentPage,
    setVersions, // Might be removed if all updates go through API
    addPage, // Might be removed if all updates go through API
    updatePage,
  };
};

export default useWorkspaceState;
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  Squares2X2Icon,
  Bars3Icon,
  UserIcon,
  LanguageIcon,
  DocumentTextIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

import { useBooks } from "../hooks/useBooks";
import { useDebounce } from "../hooks/useDebounce";
import { Book } from "../types";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Dropdown from "../components/ui/Dropdown";

type ViewMode = "card" | "list";
type SortOption = "title-asc" | "title-desc" | "author-asc" | "author-desc" | "year-asc" | "year-desc" | "pages-desc";

const BOOKS_PER_PAGE = 12;

const sortOptions = [
  { value: "title-asc", label: "Title A-Z" },
  { value: "title-desc", label: "Title Z-A" },
  { value: "author-asc", label: "Author A-Z" },
  { value: "author-desc", label: "Author Z-A" },
  { value: "year-desc", label: "Newest First" },
  { value: "year-asc", label: "Oldest First" },
  { value: "pages-desc", label: "Most Pages" },
];

const BookLibrary: React.FC = () => {
  const { books, loading } = useBooks();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [visibleCount, setVisibleCount] = useState(BOOKS_PER_PAGE);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get unique languages for filter
  const languageOptions = useMemo(() => {
    const langs = new Set(books.map((b) => b.language).filter(Boolean));
    const options = [{ value: "all", label: "All Languages" }];
    Array.from(langs)
      .sort()
      .forEach((lang) => {
        options.push({ value: lang, label: lang });
      });
    return options;
  }, [books]);

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    let result = [...books];

    // Search filter
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.display_title?.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query)
      );
    }

    // Language filter
    if (selectedLanguage !== "all") {
      result = result.filter((book) => book.language === selectedLanguage);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return (a.display_title || a.title).localeCompare(b.display_title || b.title);
        case "title-desc":
          return (b.display_title || b.title).localeCompare(a.display_title || a.title);
        case "author-asc":
          return a.author.localeCompare(b.author);
        case "author-desc":
          return b.author.localeCompare(a.author);
        case "year-asc":
          return (a.published || "").localeCompare(b.published || "");
        case "year-desc":
          return (b.published || "").localeCompare(a.published || "");
        case "pages-desc":
          return b.pages_count - a.pages_count;
        default:
          return 0;
      }
    });

    return result;
  }, [books, debouncedSearchQuery, selectedLanguage, sortBy]);

  const visibleBooks = filteredAndSortedBooks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSortedBooks.length;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + BOOKS_PER_PAGE, filteredAndSortedBooks.length));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-amber-900 via-amber-800 to-orange-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">
              Source Library
            </h1>
            <p className="text-lg md:text-xl text-amber-100 max-w-3xl mx-auto mb-2">
              Rare esoteric texts from the Bibliotheca Philosophica Hermetica
            </p>
            <p className="text-amber-200 text-sm">
              Digitized, OCR processed, and translated for modern readers
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-900">{books.length}</div>
                <div className="text-sm text-gray-500">Books in Collection</div>
              </div>
              <div className="h-12 w-px bg-gray-200 hidden sm:block" />
              <div className="text-center hidden sm:block">
                <div className="text-3xl font-bold text-amber-900">
                  {books.reduce((sum, b) => sum + b.pages_count, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Pages</div>
              </div>
              <div className="h-12 w-px bg-gray-200 hidden md:block" />
              <div className="text-center hidden md:block">
                <div className="text-3xl font-bold text-amber-900">
                  {new Set(books.map((b) => b.language)).size}
                </div>
                <div className="text-sm text-gray-500">Languages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search, Filter, and Sort Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-amber-200 p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(BOOKS_PER_PAGE);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Language Filter */}
            <Dropdown
              value={selectedLanguage}
              onChange={(value) => {
                setSelectedLanguage(value);
                setVisibleCount(BOOKS_PER_PAGE);
              }}
              options={languageOptions}
            />

            {/* Sort Dropdown */}
            <Dropdown
              value={sortBy}
              onChange={(value) => {
                setSortBy(value as SortOption);
                setVisibleCount(BOOKS_PER_PAGE);
              }}
              options={sortOptions}
            />

            {/* View Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setViewMode("card")}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === "card"
                    ? "bg-white text-amber-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-white text-amber-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Bars3Icon className="h-4 w-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-amber-900">
                {filteredAndSortedBooks.length}
              </span>{" "}
              {filteredAndSortedBooks.length === 1 ? "book" : "books"}
              {searchQuery || selectedLanguage !== "all" ? " found" : " in collection"}
            </p>
          </div>
        </div>

        {/* Book Grid/List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <LoadingSpinner
              message="Loading the collection..."
              submessage="Retrieving texts through time"
              theme="gray"
            />
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="text-center py-24">
            <div className="bg-white border border-amber-200 rounded-lg p-12 max-w-2xl mx-auto">
              <BookOpenIcon className="h-16 w-16 text-amber-400 mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                No Books Found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filters to find what you're looking for.
              </p>
            </div>
          </div>
        ) : viewMode === "card" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {visibleBooks.map((book) => (
              <BookListItem key={book.id} book={book} />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={loadMore}
              className="bg-amber-900 hover:bg-amber-800 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Load More Books
            </button>
            <p className="mt-2 text-sm text-gray-500">
              Showing {visibleCount} of {filteredAndSortedBooks.length}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-amber-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-amber-200 text-sm">
            Source Library - Preserving rare esoteric texts for future generations
          </p>
        </div>
      </footer>
    </div>
  );
};

// Book Card Component
const BookCard: React.FC<{ book: Book }> = ({ book }) => {
  // Generate a placeholder color based on book id
  const colorIndex = parseInt(book.id) % 8;
  const colors = [
    "from-amber-100 to-orange-100",
    "from-blue-100 to-indigo-100",
    "from-green-100 to-teal-100",
    "from-purple-100 to-pink-100",
    "from-red-100 to-orange-100",
    "from-cyan-100 to-blue-100",
    "from-yellow-100 to-amber-100",
    "from-rose-100 to-pink-100",
  ];

  return (
    <Link to={`/book/${book.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-amber-300 transition-all duration-200">
        {/* Book Cover Placeholder */}
        <div
          className={`h-48 bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center p-4`}
        >
          <div className="text-center">
            <BookOpenIcon className="h-12 w-12 text-amber-700/50 mx-auto mb-2" />
            <p className="text-xs text-amber-800/60 font-medium uppercase tracking-wide">
              {book.language}
            </p>
          </div>
        </div>

        {/* Book Info */}
        <div className="p-4">
          <h3 className="font-serif font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-amber-800 transition-colors">
            {book.display_title || book.title}
          </h3>

          <p className="text-sm text-gray-600 flex items-center mb-3">
            <UserIcon className="h-4 w-4 mr-1.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{book.author}</span>
          </p>

          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <LanguageIcon className="h-3.5 w-3.5" />
              {book.language}
            </span>
            <span className="flex items-center gap-1">
              <DocumentTextIcon className="h-3.5 w-3.5" />
              {book.pages_count} pages
            </span>
            {book.published && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                {book.published}
              </span>
            )}
          </div>

          <button className="w-full mt-4 bg-amber-900 hover:bg-amber-800 text-white py-2 rounded-md text-sm font-medium transition-colors">
            Open Book
          </button>
        </div>
      </div>
    </Link>
  );
};

// Book List Item Component
const BookListItem: React.FC<{ book: Book }> = ({ book }) => {
  return (
    <Link to={`/book/${book.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md hover:border-amber-300 transition-all duration-200">
        <div className="flex items-center gap-4">
          {/* Mini Cover */}
          <div className="w-16 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded flex items-center justify-center flex-shrink-0">
            <BookOpenIcon className="h-8 w-8 text-amber-700/50" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-bold text-gray-900 group-hover:text-amber-800 transition-colors truncate">
              {book.display_title || book.title}
            </h3>
            <p className="text-sm text-gray-600 truncate">{book.author}</p>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
              <span>{book.language}</span>
              <span>{book.pages_count} pages</span>
              {book.published && <span>{book.published}</span>}
            </div>
          </div>

          {/* Action */}
          <button className="bg-amber-900 hover:bg-amber-800 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex-shrink-0">
            Open
          </button>
        </div>
      </div>
    </Link>
  );
};

export default BookLibrary;

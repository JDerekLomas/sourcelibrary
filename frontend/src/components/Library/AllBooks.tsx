import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { usePaths } from "../../hooks/usePaths";
import { useBookDetails } from "../../hooks/useBookDetails";
import Grid from "../ui/Grid";
import BookCard from "./BookCard";
import BookListItem from "./BookListItem";
import LoadingSpinner from "../ui/LoadingSpinner";
import { RoleGuard, ResourceType, ActionType } from "../../auth/RoleGuard";
import Button from "../ui/Buttons/Button";
import Dropdown from "../ui/Dropdown";
import { useDebounce } from "../../hooks/useDebounce";
import {
  SortOption,
  sortOptions,
  getLanguageOptions,
  filterAndSortBooks
} from "./BooksFilter";
import {
  BookOpenIcon,
  PlusIcon,
  Squares2X2Icon,
  Bars3Icon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

type ViewMode = "card" | "list";

const BOOKS_PER_PAGE = 8;

const AllBooks: React.FC = () => {
  const { books, loading, getCategoryNames } = useBookDetails();
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [visibleCount, setVisibleCount] = useState(BOOKS_PER_PAGE);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("title-asc");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Language options for dropdown
  const languageOptions = useMemo(() => getLanguageOptions(books), [books]);

  // Filter and sort books
  const filteredAndSortedBooks = useMemo(() => {
    return filterAndSortBooks(books, debouncedSearchQuery, selectedLanguage, sortBy, getCategoryNames);
  }, [books, debouncedSearchQuery, selectedLanguage, sortBy, getCategoryNames]);

  const visibleBooks = filteredAndSortedBooks.slice(0, visibleCount);
  const hasMore = visibleCount < filteredAndSortedBooks.length;

  const navigate = useNavigate();
  const paths = usePaths();

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + BOOKS_PER_PAGE, filteredAndSortedBooks.length));
  };

  const viewModeToggle =
    <div className="flex items-center space-x-4 lg:flex-shrink-0">
      <div className="flex rounded-full bg-white border border-gray-300 p-[2px]">
        <button
          onClick={() => setViewMode("card")}
          className={`flex items-center space-x-1 px-3 py-1.5 text-sm sm:text-base font-sans transition-all duration-200 rounded-full ${viewMode === "card"
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100"
            }`}
        >
          <Squares2X2Icon className="h-4 w-4" />
          <span>Cards</span>
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`flex items-center space-x-1 px-3 py-1.5 text-sm sm:text-base font-sans transition-all duration-200 rounded-full ${viewMode === "list"
            ? "bg-gray-900 text-white"
            : "text-gray-700 hover:bg-gray-100"
            }`}
        >
          <Bars3Icon className="h-4 w-4" />
          <span>List</span>
        </button>
      </div>
    </div>

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#f6f3ee] to-[#f3ede6] py-16">
      <main className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-12">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl md:text-4xl font-serif text-gray-900">
              Freshly Digitised & Translated Texts
            </h2>
            <RoleGuard resource={ResourceType.BOOK} action={ActionType.CREATE}>
              <Link to={paths.addBook}>
                <Button variant="primary">
                  + New Book
                </Button>
              </Link>
            </RoleGuard>
          </div>

          {/* Search, Filter, and Sort Bar */}
          <div className="mb-6 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, author, or category..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(BOOKS_PER_PAGE);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent font-sans text-sm"
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
            {viewModeToggle}
          </div>

          {/* Book Count */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-base text-gray-500 font-sans">
              {!loading && (
                <p>
                  <span className="font-semibold text-gray-900">
                    {filteredAndSortedBooks.length}
                  </span>{" "}
                  {filteredAndSortedBooks.length === 1 ? 'book' : 'books'}
                  {searchQuery || selectedLanguage !== "all" ? ' found' : ' in collection'}
                </p>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <LoadingSpinner
              message="Retrieving texts through time!"
              submessage="Loading the collection..."
              theme="gray"
            />
          </div>
        ) : filteredAndSortedBooks.length === 0 ? (
          <div className="text-center py-24">
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 p-12 max-w-2xl mx-auto">
              <div className="p-4 bg-white border border-gray-200 w-20 h-20 mx-auto mb-6">
                <BookOpenIcon className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                {books.length === 0 ? "No Books Found" : "No Matching Books"}
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed font-sans font-light max-w-md mx-auto text-base">
                {books.length === 0
                  ? "Begin building the Source Library by adding the first book."
                  : "Try adjusting your search or filters to find what you're looking for."}
              </p>
              <RoleGuard resource={ResourceType.BOOK} action={ActionType.CREATE}>
                {books.length === 0 && (
                  <button
                    onClick={() => navigate(paths.addBook)}
                    className="inline-flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white font-serif font-medium py-3 px-6 transition-colors duration-200 text-base focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Add First Book</span>
                  </button>
                )}
              </RoleGuard>
            </div>
          </div>
        ) : (
          <>
            {viewMode === "card" ? (
              <Grid cols={4}>
                {visibleBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    categoryNames={getCategoryNames(book.categories || [])}
                  />
                ))}
              </Grid>
            ) : (
              <div className="space-y-4">
                {visibleBooks.map((book) => (
                  <BookListItem
                    key={book.id}
                    book={book}
                    categoryNames={getCategoryNames(book.categories || [])}
                  />
                ))}
              </div>
            )}

            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  variant='primary'
                  onClick={loadMore}
                  size='sm'
                >Load More...
                </Button>
                <p className="mt-2 text-sm text-gray-500 font-sans">
                  Showing {visibleCount} of {filteredAndSortedBooks.length}
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </section>
  );
};

export default AllBooks;

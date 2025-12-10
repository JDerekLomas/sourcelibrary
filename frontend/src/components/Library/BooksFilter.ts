import { Book } from "../../types";

export type SortOption = "title-asc" | "title-desc" | "newest-published" | "oldest-published" | "newest-added" | "oldest-added" | "author";

export const sortOptions = [
  { value: "title-asc" as const, label: "Title (A-Z)" },
  { value: "title-desc" as const, label: "Title (Z-A)" },
  { value: "newest-published" as const, label: "Published (Newest)" },
  { value: "oldest-published" as const, label: "Published (Oldest)" },
  { value: "newest-added" as const, label: "Added (Newest)" },
  { value: "oldest-added" as const, label: "Added (Oldest)" },
  { value: "author" as const, label: "Author (A-Z)" },
];

export const getUniqueLanguages = (books: Book[]): string[] => {
  const languages = new Set(books.map(book => book.language));
  return Array.from(languages).sort();
};

export const getLanguageOptions = (books: Book[]) => {
  const languages = getUniqueLanguages(books);
  return [
    { value: "all", label: "All Languages" },
    ...languages.map(lang => ({ value: lang, label: lang }))
  ];
};

// TODO: Move this to backend when API supports filtering and sorting
// TODO: else user computer fans would be louding up with humoungous collection.
export const filterAndSortBooks = (
  books: Book[],
  searchQuery: string,
  selectedLanguage: string,
  sortBy: SortOption,
  getCategoryNames: (categoryIds: string[]) => string[]
): Book[] => {
  let result = [...books];

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(book => {
      const titleMatch = book.title.toLowerCase().includes(query);
      const authorMatch = book.author.toLowerCase().includes(query);
      const categoryMatch = book.categories?.some(categoryId => {
        const categoryName = getCategoryNames([categoryId])[0];
        return categoryName?.toLowerCase().includes(query);
      });
      return titleMatch || authorMatch || categoryMatch;
    });
  }

  // Apply language filter
  if (selectedLanguage !== "all") {
    result = result.filter(book => book.language === selectedLanguage);
  }

  // Apply sorting
  switch (sortBy) {
    case "newest-published":
      result.sort((a, b) => new Date(b.published || 0).getTime() - new Date(a.published || 0).getTime());
      break;
    case "oldest-published":
      result.sort((a, b) => new Date(a.published || 0).getTime() - new Date(b.published || 0).getTime());
      break;
    case "newest-added":
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      break;
    case "oldest-added":
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
      break;
    case "title-asc":
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "title-desc":
      result.sort((a, b) => b.title.localeCompare(a.title));
      break;
    case "author":
      result.sort((a, b) => a.author.localeCompare(b.author));
      break;
  }

  return result;
};

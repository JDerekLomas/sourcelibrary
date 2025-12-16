import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  DocumentIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Book, Page } from "../types";
import { apiService } from "../services/api";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";
import { MAJOR_LANGUAGES } from "../utils/languages";

type UploadPhase = "select" | "uploading" | "processing" | "complete" | "error";

interface ProcessingResult {
  totalPdfPages: number;
  processedPdfPages: number;
  createdPages: number;
  remainingPdfPages: number;
  errors: string[];
  pageIds: string[];
}

interface BookFormData {
  title: string;
  author: string;
  language: string;
  published: string;
}

const PdfUpload: React.FC = () => {
  const { book_id } = useParams<{ book_id: string }>();
  const navigate = useNavigate();
  const { toast, hideToast, showSuccess, showError } = useToast();

  // Book data (for existing book)
  const [book, setBook] = useState<Book | null>(null);
  const [existingPages, setExistingPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(!!book_id); // Only loading if we have a book_id
  const [createdBookId, setCreatedBookId] = useState<string | null>(null);

  // New book form (when no book_id)
  const [formData, setFormData] = useState<BookFormData>({
    title: "",
    author: "",
    language: "",
    published: "",
  });
  const [iaInput, setIaInput] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaSearchResults, setIaSearchResults] = useState<Array<{
    identifier: string;
    title: string;
    creator?: string;
    date?: string;
  }>>([]);
  const [iaSearching, setIaSearching] = useState(false);
  const [showIaResults, setShowIaResults] = useState(false);

  // PDF file
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Settings
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const [enableSpreadDetection, setEnableSpreadDetection] = useState(true);
  const [splitConfidence, setSplitConfidence] = useState(0.7);
  const [ocrLanguage, setOcrLanguage] = useState("");
  const [translationLanguage, setTranslationLanguage] = useState("English");

  // Processing state
  const [phase, setPhase] = useState<UploadPhase>("select");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowIaResults(false);
    if (showIaResults) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showIaResults]);

  // Load book data (only if book_id provided)
  useEffect(() => {
    if (!book_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      apiService.getBook(book_id),
      apiService.getBookDetails(book_id),
    ])
      .then(([bookData, detailsData]) => {
        setBook(bookData);
        setExistingPages(detailsData.pages || []);
        setOcrLanguage(bookData.language || "");
      })
      .catch((error) => {
        console.error("Error loading book:", error);
        showError("Failed to load book data");
      })
      .finally(() => setLoading(false));
  }, [book_id]);

  // Internet Archive search with debounce
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const searchInternetArchive = async (query: string) => {
    if (query.length < 3) {
      setIaSearchResults([]);
      setShowIaResults(false);
      return;
    }

    setIaSearching(true);
    try {
      // Search for texts/books on Internet Archive
      const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}+AND+mediatype:(texts)&fl[]=identifier&fl[]=title&fl[]=creator&fl[]=date&rows=8&output=json`;
      const response = await fetch(searchUrl);
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const results = data.response?.docs || [];
      setIaSearchResults(results);
      setShowIaResults(results.length > 0);
    } catch (error) {
      console.error("IA search error:", error);
      setIaSearchResults([]);
    } finally {
      setIaSearching(false);
    }
  };

  const handleIaInputChange = (value: string) => {
    setIaInput(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchInternetArchive(value);
    }, 300);
  };

  const selectIaResult = async (identifier: string) => {
    setShowIaResults(false);
    setIaInput(identifier);
    await fetchIaMetadataById(identifier);
  };

  // Internet Archive import by identifier
  const extractIaIdentifier = (input: string): string => {
    const trimmed = input.trim();
    const match = trimmed.match(/archive\.org\/details\/([^\/\?]+)/);
    if (match) return match[1];
    return trimmed;
  };

  const fetchIaMetadataById = async (identifier: string) => {
    setIaLoading(true);
    try {
      const response = await fetch(`https://archive.org/metadata/${identifier}`);
      if (!response.ok) throw new Error("Book not found on Internet Archive");

      const data = await response.json();
      const metadata = data.metadata;

      if (!metadata) throw new Error("No metadata found");

      setFormData({
        title: metadata.title || "",
        author: metadata.creator || metadata.author || "",
        language: metadata.language?.[0] || metadata.language || "Latin",
        published: metadata.date || metadata.year || "",
      });

      showSuccess("Metadata imported from Internet Archive");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to fetch metadata");
    } finally {
      setIaLoading(false);
    }
  };

  const fetchIaMetadata = async () => {
    const identifier = extractIaIdentifier(iaInput);
    if (!identifier) {
      showError("Please enter an Internet Archive URL or identifier");
      return;
    }
    await fetchIaMetadataById(identifier);
  };

  const handleFormChange = (field: keyof BookFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      showError("PDF file size must be less than 100MB");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showError("Please select a PDF file");
      return;
    }
    setPdfFile(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Process PDF
  const processPdf = async () => {
    if (!pdfFile) return;

    // For new books, validate form
    if (!book_id && (!formData.title || !formData.author || !formData.language)) {
      showError("Please fill in Title, Author, and Language");
      return;
    }

    setPhase("uploading");
    setProgress(5);

    try {
      let targetBookId = book_id;

      // Create book first if no book_id
      if (!book_id) {
        setProgress(10);
        const submitData = new FormData();
        submitData.append("title", formData.title);
        submitData.append("author", formData.author);
        submitData.append("language", formData.language);
        submitData.append("published", formData.published || "");
        submitData.append("thumbnail", new File([], "", { type: "application/octet-stream" }));

        const newBook = await apiService.createBook(submitData);
        targetBookId = newBook.id;
        setCreatedBookId(newBook.id);
        setBook(newBook);
        setProgress(20);
      }

      if (!targetBookId) {
        throw new Error("Failed to get book ID");
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 5, 40));
      }, 500);

      setPhase("processing");

      const apiResult = await apiService.processPdfWithSplitting({
        bookId: targetBookId,
        pdfFile,
        enableSpreadDetection,
        splitConfidenceThreshold: splitConfidence,
        previewCount: 1000, // Process all pages
        processAll: true,
        ocrLanguage: ocrLanguage || formData.language,
        translationLanguage,
      });

      clearInterval(progressInterval);
      setProgress(100);

      setResult({
        totalPdfPages: apiResult.total_pdf_pages,
        processedPdfPages: apiResult.processed_pdf_pages,
        createdPages: apiResult.created_pages,
        remainingPdfPages: apiResult.remaining_pdf_pages,
        errors: apiResult.errors,
        pageIds: apiResult.page_ids,
      });

      setPhase("complete");
      showSuccess(`Created ${apiResult.created_pages} pages from PDF`);
    } catch (error) {
      console.error("PDF processing error:", error);
      setPhase("error");
      showError(error instanceof Error ? error.message : "Failed to process PDF");
    }
  };

  // Navigate to batch processing
  const goToBatchProcessing = () => {
    const targetId = book_id || createdBookId;
    if (targetId) {
      navigate(`/batch/${targetId}`);
    }
  };

  // Get the effective book ID for navigation
  const effectiveBookId = book_id || createdBookId;

  // Check if this is a new book creation flow
  const isNewBook = !book_id;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              {isNewBook ? (
                <>
                  <h1 className="text-lg font-semibold text-gray-900 font-serif">
                    Upload New Book
                  </h1>
                  <p className="text-sm text-gray-500">Create a book from PDF</p>
                </>
              ) : (
                <>
                  <Link
                    to={`/book/${book_id}`}
                    className="hover:text-purple-700 transition-colors"
                  >
                    <h1 className="text-lg font-semibold text-gray-900 hover:text-purple-700 font-serif">
                      {book?.display_title || book?.title || "Loading..."}
                    </h1>
                  </Link>
                  <p className="text-sm text-gray-500">PDF Upload</p>
                </>
              )}
            </div>
          </div>
          {!isNewBook && (
            <div className="text-sm text-gray-500">
              {existingPages.length} existing pages
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Upload Section */}
          {phase === "select" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-6">
                {/* New Book: Internet Archive Import */}
                {isNewBook && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MagnifyingGlassIcon className="h-5 w-5 text-amber-600" />
                      <h3 className="font-medium text-amber-800">Search Internet Archive</h3>
                    </div>
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={iaInput}
                            onChange={(e) => handleIaInputChange(e.target.value)}
                            onFocus={() => iaSearchResults.length > 0 && setShowIaResults(true)}
                            placeholder="Search by title, author, or paste archive.org URL..."
                            className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                          {iaSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="animate-spin h-4 w-4 border-2 border-amber-300 border-t-amber-600 rounded-full" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={fetchIaMetadata}
                          disabled={iaLoading || !iaInput}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {iaLoading ? "..." : "Import"}
                        </button>
                      </div>

                      {/* Search Results Dropdown */}
                      {showIaResults && iaSearchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {iaSearchResults.map((result) => (
                            <button
                              key={result.identifier}
                              onClick={() => selectIaResult(result.identifier)}
                              className="w-full px-4 py-3 text-left hover:bg-amber-50 border-b border-gray-100 last:border-b-0 transition-colors"
                            >
                              <p className="font-medium text-gray-900 text-sm line-clamp-1">
                                {result.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {result.creator && <span>{result.creator}</span>}
                                {result.creator && result.date && <span> · </span>}
                                {result.date && <span>{result.date}</span>}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                      Type at least 3 characters to search, or paste a full archive.org URL
                    </p>
                  </div>
                )}

                {/* New Book: Metadata Form */}
                {isNewBook && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Book Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleFormChange("title", e.target.value)}
                          placeholder="Book title"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Author <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) => handleFormChange("author", e.target.value)}
                          placeholder="Author name"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Language <span className="text-red-500">*</span>
                        </label>
                        <input
                          list="languages"
                          value={formData.language}
                          onChange={(e) => handleFormChange("language", e.target.value)}
                          placeholder="e.g., German, Latin"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <datalist id="languages">
                          {MAJOR_LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value} />
                          ))}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Published
                        </label>
                        <input
                          type="text"
                          value={formData.published}
                          onChange={(e) => handleFormChange("published", e.target.value)}
                          placeholder="e.g., 1687"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {isNewBook ? "Upload PDF" : "Upload PDF"}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Upload a PDF to create pages. Two-page spreads will be automatically detected and split using Gemini AI.
                  </p>
                </div>

                {/* Drop Zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragActive
                      ? "border-purple-500 bg-purple-50"
                      : pdfFile
                      ? "border-green-400 bg-green-50"
                      : "border-gray-300 hover:border-purple-400"
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {pdfFile ? (
                    <div className="space-y-3">
                      <DocumentIcon className="mx-auto h-12 w-12 text-green-600" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          {pdfFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                      <p className="text-sm text-purple-600">
                        Click or drag to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <p className="text-lg font-medium text-gray-700">
                          Drop PDF here or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                          Maximum file size: 100MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Settings */}
                <div className="border-t border-gray-200 pt-4">
                  <button
                    onClick={() => setSettingsExpanded(!settingsExpanded)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors w-full"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    <span>Processing Settings</span>
                    {settingsExpanded ? (
                      <ChevronUpIcon className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 ml-auto" />
                    )}
                  </button>

                  {settingsExpanded && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Spread Detection */}
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enableSpreadDetection}
                            onChange={(e) => setEnableSpreadDetection(e.target.checked)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Detect two-page spreads
                          </span>
                        </label>
                        {enableSpreadDetection && (
                          <div className="ml-6">
                            <label className="block text-xs text-gray-500 mb-1">
                              Split Confidence: {Math.round(splitConfidence * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="1"
                              step="0.05"
                              value={splitConfidence}
                              onChange={(e) => setSplitConfidence(parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                        )}
                      </div>

                      {/* OCR Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          OCR Language
                        </label>
                        <input
                          type="text"
                          value={ocrLanguage}
                          onChange={(e) => setOcrLanguage(e.target.value)}
                          placeholder="German, Latin, etc."
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>

                      {/* Translation Language */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Translation Language
                        </label>
                        <input
                          type="text"
                          value={translationLanguage}
                          onChange={(e) => setTranslationLanguage(e.target.value)}
                          placeholder="English"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                <button
                  onClick={processPdf}
                  disabled={!pdfFile || (isNewBook && (!formData.title || !formData.author || !formData.language))}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  <DocumentIcon className="h-5 w-5" />
                  {isNewBook ? "Create Book & Process PDF" : "Process PDF"}
                </button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {(phase === "uploading" || phase === "processing") && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 text-center space-y-6">
                <div className="animate-spin mx-auto h-12 w-12 border-4 border-purple-200 border-t-purple-600 rounded-full" />

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    {phase === "uploading" ? "Uploading PDF..." : "Processing PDF..."}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {phase === "uploading"
                      ? "Uploading your PDF to the server"
                      : "Detecting spreads and creating pages. This may take a few minutes..."}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="max-w-md mx-auto">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{progress}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Complete State */}
          {phase === "complete" && result && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 space-y-6">
                <div className="text-center">
                  <CheckCircleIcon className="mx-auto h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    PDF Processed Successfully
                  </h2>
                  <p className="text-gray-600">
                    Created {result.createdPages} pages from {result.totalPdfPages} PDF pages
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-gray-900">{result.totalPdfPages}</p>
                    <p className="text-sm text-gray-500">PDF Pages</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-green-600">{result.createdPages}</p>
                    <p className="text-sm text-gray-500">Pages Created</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-2xl font-bold text-purple-600">
                      {result.createdPages - result.totalPdfPages > 0
                        ? `+${result.createdPages - result.totalPdfPages}`
                        : result.createdPages - result.totalPdfPages}
                    </p>
                    <p className="text-sm text-gray-500">Splits Detected</p>
                  </div>
                </div>

                {/* Errors */}
                {result.errors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="font-medium text-yellow-800 mb-2">
                      {result.errors.length} warnings occurred:
                    </p>
                    <ul className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                      {result.errors.slice(0, 5).map((error, idx) => (
                        <li key={idx}>• {error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li>... and {result.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Next Steps */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="font-medium text-indigo-800 mb-2">Next Steps:</p>
                  <p className="text-sm text-indigo-700">
                    Your pages have been created. Now run batch processing to OCR and translate them.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Link
                    to={`/book/${effectiveBookId}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-base font-medium transition-colors"
                  >
                    View Book
                  </Link>
                  <button
                    onClick={goToBatchProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Batch Process
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {phase === "error" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 text-center space-y-6">
                <ExclamationCircleIcon className="mx-auto h-16 w-16 text-red-500" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Processing Failed
                  </h2>
                  <p className="text-gray-600">
                    There was an error processing your PDF. Please try again.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPhase("select");
                    setProgress(0);
                    setResult(null);
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-base font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Info Card */}
          {phase === "select" && (
            <div className="bg-indigo-50 rounded-xl p-4 text-sm text-indigo-700">
              <strong>Tip:</strong> After uploading, use Batch Processing to run OCR, Translation, and Summary on all pages at once.
            </div>
          )}
        </div>
      </main>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default PdfUpload;

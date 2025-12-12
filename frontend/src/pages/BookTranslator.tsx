import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  PlayCircleIcon,
  Cog6ToothIcon,
  ClipboardIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  PencilSquareIcon,
  BookOpenIcon,
  XMarkIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { ClipboardIcon as ClipboardIconSolid } from "@heroicons/react/24/solid";
import { PageDetails, Book } from "../types";
import { apiService } from "../services/api";
import { samplePages, sampleBook } from "../data/samplePages";
import { MAJOR_LANGUAGES, TRANSLATION_LANGUAGES } from "../utils/languages";
import { OCR_MODELS, TRANSLATION_MODELS } from "../components/AiModels/aiModels";
import Modal from "../components/ui/Modal";
import Toast from "../components/ui/Toast";
import { useModal } from "../hooks/useModal";
import { useToast } from "../hooks/useToast";

// Default prompts
const DEFAULT_OCR_PROMPTS = [
  { id: "1", name: "Standard OCR", prompt: "OCR the page in {language}. Return only the transcribed text." },
  { id: "2", name: "Preserve Layout", prompt: "OCR the page in {language}. Preserve the original layout and formatting as much as possible." },
  { id: "3", name: "With Annotations", prompt: "OCR the page in {language}. Include notes about illegible sections or uncertain readings in [brackets]." },
];

const DEFAULT_TRANSLATION_PROMPTS = [
  { id: "1", name: "Literal Translation", prompt: "Translate from {source_lang} to {target_lang}. Provide a literal, accurate translation." },
  { id: "2", name: "Scholarly Translation", prompt: "Translate from {source_lang} to {target_lang}. Use scholarly language appropriate for academic texts." },
  { id: "3", name: "Modern Readable", prompt: "Translate from {source_lang} to {target_lang}. Make it readable for modern audiences while preserving meaning." },
];

interface PromptItem {
  id: string;
  name: string;
  prompt: string;
}

type ViewMode = "read" | "edit";

const BookTranslator: React.FC = () => {
  const { book_id, page_id } = useParams<{
    book_id: string;
    page_id: string;
  }>();

  const navigate = useNavigate();

  const { modalState, hideModal, showError: showModalError } = useModal();
  const { toast, hideToast, showSuccess } = useToast();

  // Core state
  const [book, setBook] = useState<Book | null>(null);
  const [pageDetails, setPageDetails] = useState<PageDetails | null>(null);
  const [allPages, setAllPages] = useState<PageDetails[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>("read");

  // UI state
  const [imageLoading, setImageLoading] = useState(true);
  const [ocrApiRunning, setOcrApiRunning] = useState(false);
  const [translationApiRunning, setTranslationApiRunning] = useState(false);
  const [ocrCopied, setOcrCopied] = useState(false);
  const [translationCopied, setTranslationCopied] = useState(false);

  // Settings modals
  const [ocrSettingsOpen, setOcrSettingsOpen] = useState(false);
  const [translationSettingsOpen, setTranslationSettingsOpen] = useState(false);

  // Prompt library
  const [ocrPrompts, setOcrPrompts] = useState<PromptItem[]>(() => {
    const saved = localStorage.getItem("ocrPrompts");
    return saved ? JSON.parse(saved) : DEFAULT_OCR_PROMPTS;
  });
  const [translationPrompts, setTranslationPrompts] = useState<PromptItem[]>(() => {
    const saved = localStorage.getItem("translationPrompts");
    return saved ? JSON.parse(saved) : DEFAULT_TRANSLATION_PROMPTS;
  });
  const [selectedOcrPromptId, setSelectedOcrPromptId] = useState("1");
  const [selectedTranslationPromptId, setSelectedTranslationPromptId] = useState("1");
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptText, setNewPromptText] = useState("");

  // Check if this is demo mode
  const isDemo = book_id === "demo" || book_id?.startsWith("demo-");

  // Save prompts to localStorage
  useEffect(() => {
    localStorage.setItem("ocrPrompts", JSON.stringify(ocrPrompts));
  }, [ocrPrompts]);

  useEffect(() => {
    localStorage.setItem("translationPrompts", JSON.stringify(translationPrompts));
  }, [translationPrompts]);

  // Load book and pages
  useEffect(() => {
    if (!book_id) return;

    if (isDemo) {
      setBook(sampleBook as Book);
      setAllPages(samplePages);
      const index = samplePages.findIndex((page) => page.id === page_id);
      setCurrentPageIndex(index >= 0 ? index : 0);
      return;
    }

    apiService
      .getBook(book_id)
      .then((data) => setBook(data))
      .catch((error) => console.error("Error fetching book:", error));

    apiService
      .getBookDetails(book_id)
      .then((data) => {
        const pages = data.pages || [];
        setAllPages(pages);
        const index = pages.findIndex(
          (page: PageDetails) => page.id === page_id
        );
        setCurrentPageIndex(index >= 0 ? index : 0);
      })
      .catch((error) => console.error("Error fetching book details:", error));
  }, [book_id, page_id, isDemo]);

  // Load page details
  useEffect(() => {
    if (!page_id) return;

    if (isDemo) {
      const demoPage = samplePages.find((p) => p.id === page_id) || samplePages[0];
      setPageDetails(demoPage);
      setImageLoading(false);
      return;
    }

    setPageDetails(null);
    setImageLoading(true);

    apiService
      .getPage(page_id)
      .then((data) => setPageDetails(data))
      .catch((error) => console.error("Error fetching page details:", error));
  }, [page_id, isDemo]);

  // Initialize language defaults from book
  useEffect(() => {
    if (book && pageDetails) {
      let needsUpdate = false;
      const updates: Partial<PageDetails> = {};

      if (!pageDetails.ocr.language || pageDetails.ocr.language === "") {
        updates.ocr = { ...pageDetails.ocr, language: book.language };
        needsUpdate = true;
      }

      if (
        !pageDetails.translation.language ||
        pageDetails.translation.language === ""
      ) {
        updates.translation = {
          ...pageDetails.translation,
          language: "English",
        };
        needsUpdate = true;
      }

      if (needsUpdate) {
        setPageDetails((prev) => (prev ? { ...prev, ...updates } : null));
      }
    }
  }, [book, pageDetails?.id]);

  // Navigation handlers
  const goToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0 && book_id) {
      const previousPage = allPages[currentPageIndex - 1];
      if (previousPage?.id) {
        navigate(`/translator/${book_id}/${previousPage.id}`);
      }
    }
  }, [currentPageIndex, allPages, book_id, navigate]);

  const goToNextPage = useCallback(() => {
    if (currentPageIndex < allPages.length - 1 && book_id) {
      const nextPage = allPages[currentPageIndex + 1];
      if (nextPage?.id) {
        navigate(`/translator/${book_id}/${nextPage.id}`);
      }
    }
  }, [currentPageIndex, allPages, book_id, navigate]);

  // Get selected prompts
  const getSelectedOcrPrompt = () => {
    const prompt = ocrPrompts.find((p) => p.id === selectedOcrPromptId);
    return prompt?.prompt || ocrPrompts[0]?.prompt || "";
  };

  const getSelectedTranslationPrompt = () => {
    const prompt = translationPrompts.find((p) => p.id === selectedTranslationPromptId);
    return prompt?.prompt || translationPrompts[0]?.prompt || "";
  };

  // OCR handler
  const runOCR = async () => {
    if (!pageDetails) return;

    setOcrApiRunning(true);

    if (isDemo) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccess("Demo: OCR simulation complete");
      setOcrApiRunning(false);
      return;
    }

    try {
      const promptTemplate = getSelectedOcrPrompt();
      const promptWithLanguage = promptTemplate.replace("{language}", pageDetails.ocr.language);

      const response = await apiService.performOCR({
        pageId: pageDetails.id,
        photoUrl: pageDetails.photo,
        language: pageDetails.ocr.language,
        aiModel: pageDetails.ocr.model || "mistral",
        customPrompt: promptWithLanguage,
        autoSave: true,
      });

      setPageDetails((prev) =>
        prev ? { ...prev, ocr: { ...prev.ocr, data: response.ocr } } : null
      );
      showSuccess("OCR completed successfully");
    } catch (error) {
      console.error("Error performing OCR:", error);
      showModalError("OCR Failed", "Failed to perform OCR. Please try again.");
    } finally {
      setOcrApiRunning(false);
    }
  };

  // Translation handler
  const runTranslation = async () => {
    if (!pageDetails?.ocr.data) return;

    setTranslationApiRunning(true);

    if (isDemo) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      showSuccess("Demo: Translation simulation complete");
      setTranslationApiRunning(false);
      return;
    }

    try {
      const promptTemplate = getSelectedTranslationPrompt();
      const prompt = promptTemplate
        .replace("{source_lang}", pageDetails.ocr.language)
        .replace("{target_lang}", pageDetails.translation.language || "English");

      const response = await apiService.performTranslation({
        pageId: pageDetails.id,
        text: pageDetails.ocr.data,
        sourceLang: pageDetails.ocr.language,
        targetLang: pageDetails.translation.language || "English",
        aiModel: pageDetails.translation.model || "gemini",
        customPrompt: prompt,
        autoSave: true,
      });

      setPageDetails((prev) =>
        prev
          ? { ...prev, translation: { ...prev.translation, data: response.translation } }
          : null
      );
      showSuccess("Translation completed successfully");
    } catch (error) {
      console.error("Error performing translation:", error);
      showModalError("Translation Failed", "Failed to perform translation. Please try again.");
    } finally {
      setTranslationApiRunning(false);
    }
  };

  // Copy handlers
  const copyOcrText = async () => {
    if (pageDetails?.ocr.data) {
      await navigator.clipboard.writeText(pageDetails.ocr.data);
      setOcrCopied(true);
      setTimeout(() => setOcrCopied(false), 2000);
    }
  };

  const copyTranslationText = async () => {
    if (pageDetails?.translation.data) {
      await navigator.clipboard.writeText(pageDetails.translation.data);
      setTranslationCopied(true);
      setTimeout(() => setTranslationCopied(false), 2000);
    }
  };

  // Update handlers
  const handleOcrTextChange = (value: string) => {
    setPageDetails((prev) =>
      prev ? { ...prev, ocr: { ...prev.ocr, data: value } } : null
    );
  };

  const handleTranslationTextChange = (value: string) => {
    setPageDetails((prev) =>
      prev ? { ...prev, translation: { ...prev.translation, data: value } } : null
    );
  };

  const handlePageDetailsChange = (updates: Partial<PageDetails>) => {
    setPageDetails((prev) => (prev ? { ...prev, ...updates } : null));
  };

  // Prompt management
  const addOcrPrompt = () => {
    if (!newPromptName.trim() || !newPromptText.trim()) return;
    const newPrompt: PromptItem = {
      id: Date.now().toString(),
      name: newPromptName,
      prompt: newPromptText,
    };
    setOcrPrompts([...ocrPrompts, newPrompt]);
    setNewPromptName("");
    setNewPromptText("");
  };

  const addTranslationPrompt = () => {
    if (!newPromptName.trim() || !newPromptText.trim()) return;
    const newPrompt: PromptItem = {
      id: Date.now().toString(),
      name: newPromptName,
      prompt: newPromptText,
    };
    setTranslationPrompts([...translationPrompts, newPrompt]);
    setNewPromptName("");
    setNewPromptText("");
  };

  const deleteOcrPrompt = (id: string) => {
    if (ocrPrompts.length <= 1) return;
    setOcrPrompts(ocrPrompts.filter((p) => p.id !== id));
    if (selectedOcrPromptId === id) {
      setSelectedOcrPromptId(ocrPrompts[0].id);
    }
  };

  const deleteTranslationPrompt = (id: string) => {
    if (translationPrompts.length <= 1) return;
    setTranslationPrompts(translationPrompts.filter((p) => p.id !== id));
    if (selectedTranslationPromptId === id) {
      setSelectedTranslationPromptId(translationPrompts[0].id);
    }
  };

  // Loading dots component
  const LoadingDots = ({ color = "white" }: { color?: string }) => (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full animate-pulse`}
          style={{ backgroundColor: color, animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );

  // Text display component with markdown
  const TextDisplay = ({
    content,
    placeholder
  }: {
    content: string;
    placeholder: string;
  }) => (
    <div className="h-full overflow-y-auto">
      {content ? (
        <div className="prose prose-sm max-w-none font-serif leading-relaxed">
          <ReactMarkdown
            components={{
              img: ({ ...props }) => (
                <img
                  {...props}
                  className="max-w-full h-auto mx-auto my-4 rounded shadow-sm"
                />
              ),
              p: ({ children }) => (
                <p className="mb-4 text-gray-800">{children}</p>
              ),
              h1: ({ children }) => (
                <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-bold mb-2 text-gray-900">{children}</h2>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <BookOpenIcon className="h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm italic">{placeholder}</p>
        </div>
      )}
    </div>
  );

  // Settings Modal Component
  const SettingsModal = ({
    isOpen,
    onClose,
    title,
    prompts,
    selectedPromptId,
    onSelectPrompt,
    onAddPrompt,
    onDeletePrompt,
    language,
    onLanguageChange,
    languages,
    model,
    onModelChange,
    models,
    type,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    prompts: PromptItem[];
    selectedPromptId: string;
    onSelectPrompt: (id: string) => void;
    onAddPrompt: () => void;
    onDeletePrompt: (id: string) => void;
    language: string;
    onLanguageChange: (lang: string) => void;
    languages: { value: string; label: string }[];
    model: string;
    onModelChange: (model: string) => void;
    models: { value: string; label: string }[];
    type: "ocr" | "translation";
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Language & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {type === "ocr" ? "Source Language" : "Target Language"}
                </label>
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label || lang.value}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Model
                </label>
                <select
                  value={model}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {models.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prompt Library */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt Library
              </label>
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPromptId === prompt.id
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => onSelectPrompt(prompt.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">{prompt.name}</div>
                      <div className="text-xs text-gray-500 truncate">{prompt.prompt}</div>
                    </div>
                    {prompts.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePrompt(prompt.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Prompt */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add New Prompt
              </label>
              <input
                type="text"
                placeholder="Prompt name"
                value={newPromptName}
                onChange={(e) => setNewPromptName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <textarea
                placeholder={`Prompt text (use {language}${type === "translation" ? ", {source_lang}, {target_lang}" : ""} as placeholders)`}
                value={newPromptText}
                onChange={(e) => setNewPromptText(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={onAddPrompt}
                disabled={!newPromptName.trim() || !newPromptText.trim()}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
              >
                <PlusIcon className="h-4 w-4" />
                Add Prompt
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Back to library"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 font-serif line-clamp-1">
                {book?.display_title || book?.title || "Loading..."}
              </h1>
              <p className="text-sm text-gray-500">
                Page {pageDetails?.page_number || "..."} of {allPages.length || "..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setViewMode("read")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === "read"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <EyeIcon className="h-4 w-4" />
                Read
              </button>
              <button
                onClick={() => setViewMode("edit")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  viewMode === "edit"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit
              </button>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={goToPreviousPage}
                disabled={currentPageIndex === 0}
                className="p-1.5 hover:bg-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 min-w-[50px] text-center font-medium">
                {currentPageIndex + 1} / {allPages.length || 1}
              </span>
              <button
                onClick={goToNextPage}
                disabled={currentPageIndex >= allPages.length - 1}
                className="p-1.5 hover:bg-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <ChevronRightIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className={`h-full max-w-7xl mx-auto grid gap-4 ${
          viewMode === "read" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"
        }`}>

          {/* Column 1: Source Image */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Source</h2>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                {pageDetails?.ocr.language || book?.language || "—"}
              </span>
            </div>
            <div className="flex-1 relative bg-gray-50 flex items-center justify-center overflow-hidden min-h-[400px]">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingDots color="#9333ea" />
                </div>
              )}
              <img
                src={pageDetails?.photo || pageDetails?.compressed_photo || ""}
                className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setImageLoading(false)}
                alt="Book page"
              />
            </div>
          </div>

          {/* Column 2: OCR Text (Edit mode only) */}
          {viewMode === "edit" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              {/* OCR Config Header */}
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOcrSettingsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={runOCR}
                    disabled={ocrApiRunning}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {ocrApiRunning ? (
                      <LoadingDots />
                    ) : (
                      <>
                        <PlayCircleIcon className="h-5 w-5" />
                        Run OCR
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* OCR Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">OCR Text</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    {pageDetails?.ocr?.data?.length || 0} chars
                  </span>
                  <button
                    onClick={copyOcrText}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                    title="Copy text"
                  >
                    {ocrCopied ? (
                      <ClipboardIconSolid className="h-4 w-4 text-green-600" />
                    ) : (
                      <ClipboardIcon className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* OCR Content */}
              <div className="flex-1 overflow-hidden p-4">
                <textarea
                  value={pageDetails?.ocr?.data || ""}
                  onChange={(e) => handleOcrTextChange(e.target.value)}
                  placeholder="OCR text will appear here after running OCR..."
                  className="w-full h-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 font-serif text-sm leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Column 3 (or 2 in Read mode): Translation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            {/* Translation Config Header (Edit mode only) */}
            {viewMode === "edit" && (
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTranslationSettingsOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    Settings
                  </button>
                  <button
                    onClick={runTranslation}
                    disabled={translationApiRunning || !pageDetails?.ocr.data}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {translationApiRunning ? (
                      <LoadingDots />
                    ) : (
                      <>
                        <PlayCircleIcon className="h-5 w-5" />
                        Translate
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Translation Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Translation</h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  {pageDetails?.translation.language || "English"}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                  {pageDetails?.translation?.data?.length || 0} chars
                </span>
                <button
                  onClick={copyTranslationText}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Copy text"
                >
                  {translationCopied ? (
                    <ClipboardIconSolid className="h-4 w-4 text-green-600" />
                  ) : (
                    <ClipboardIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Translation Content */}
            <div className="flex-1 overflow-hidden p-4">
              {viewMode === "read" ? (
                <TextDisplay
                  content={pageDetails?.translation?.data || ""}
                  placeholder="Translation will appear here..."
                />
              ) : (
                <textarea
                  value={pageDetails?.translation?.data || ""}
                  onChange={(e) => handleTranslationTextChange(e.target.value)}
                  placeholder="Translation will appear here after translating..."
                  className="w-full h-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 font-serif text-sm leading-relaxed"
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modals */}
      <SettingsModal
        isOpen={ocrSettingsOpen}
        onClose={() => setOcrSettingsOpen(false)}
        title="OCR Settings"
        prompts={ocrPrompts}
        selectedPromptId={selectedOcrPromptId}
        onSelectPrompt={setSelectedOcrPromptId}
        onAddPrompt={addOcrPrompt}
        onDeletePrompt={deleteOcrPrompt}
        language={pageDetails?.ocr.language || book?.language || "German"}
        onLanguageChange={(lang) =>
          handlePageDetailsChange({ ocr: { ...pageDetails!.ocr, language: lang } })
        }
        languages={MAJOR_LANGUAGES}
        model={pageDetails?.ocr.model || "mistral"}
        onModelChange={(model) =>
          handlePageDetailsChange({ ocr: { ...pageDetails!.ocr, model } })
        }
        models={OCR_MODELS}
        type="ocr"
      />

      <SettingsModal
        isOpen={translationSettingsOpen}
        onClose={() => setTranslationSettingsOpen(false)}
        title="Translation Settings"
        prompts={translationPrompts}
        selectedPromptId={selectedTranslationPromptId}
        onSelectPrompt={setSelectedTranslationPromptId}
        onAddPrompt={addTranslationPrompt}
        onDeletePrompt={deleteTranslationPrompt}
        language={pageDetails?.translation.language || "English"}
        onLanguageChange={(lang) =>
          handlePageDetailsChange({ translation: { ...pageDetails!.translation, language: lang } })
        }
        languages={TRANSLATION_LANGUAGES}
        model={pageDetails?.translation.model || "gemini"}
        onModelChange={(model) =>
          handlePageDetailsChange({ translation: { ...pageDetails!.translation, model } })
        }
        models={TRANSLATION_MODELS}
        type="translation"
      />

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

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
    </div>
  );
};

export default BookTranslator;

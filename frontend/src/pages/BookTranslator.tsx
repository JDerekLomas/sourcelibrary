import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  PlayCircleIcon,
  CogIcon,
  ClipboardIcon,
  PencilIcon,
  PhotoIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { ClipboardIcon as ClipboardIconSolid } from "@heroicons/react/24/solid";
import { PageDetails, Book } from "../types";
import { apiService } from "../services/api";
import { MAJOR_LANGUAGES } from "../utils/languages";
import AIModelSelect from "../components/AiModels/AIModelSelect";
import { OCR_MODELS } from "../components/AiModels/aiModels";
import ToggleSwitch from "../components/OCRTranslation/ToggleSwitch";
import PromptModal from "../components/OCRTranslation/PromptModal";
import Modal from "../components/ui/Modal";
import Toast from "../components/ui/Toast";
import { useModal } from "../hooks/useModal";
import { useToast } from "../hooks/useToast";
import { usePaths } from "../hooks/usePaths";

const BookTranslator: React.FC = () => {
  const { book_id, page_id } = useParams<{
    book_id: string;
    page_id: string;
  }>();

  const navigate = useNavigate();
  const paths = usePaths();

  const { modalState, hideModal, showError: showModalError } = useModal();
  const { toast, hideToast, showSuccess } = useToast();

  // Core state
  const [book, setBook] = useState<Book | null>(null);
  const [pageDetails, setPageDetails] = useState<PageDetails | null>(null);
  const [allPages, setAllPages] = useState<PageDetails[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // UI state
  const [imageLoading, setImageLoading] = useState(true);
  const [useLowQuality, setUseLowQuality] = useState(true);
  const [ocrApiRunning, setOcrApiRunning] = useState(false);
  const [translationApiRunning, setTranslationApiRunning] = useState(false);
  const [ocrEditMode, setOcrEditMode] = useState(false);
  const [translationEditMode, setTranslationEditMode] = useState(false);
  const [ocrCopied, setOcrCopied] = useState(false);
  const [translationCopied, setTranslationCopied] = useState(false);

  // Prompt state
  const [ocrPromptModalVisible, setOcrPromptModalVisible] = useState(false);
  const [customOcrPrompt, setCustomOcrPrompt] = useState(
    "OCR the page in {language} only return ocr"
  );
  const [tempOcrPrompt, setTempOcrPrompt] = useState("");

  // Load book and pages
  useEffect(() => {
    if (!book_id) return;

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
  }, [book_id, page_id]);

  // Load page details
  useEffect(() => {
    if (!page_id) return;

    setPageDetails(null);
    setImageLoading(true);

    apiService
      .getPage(page_id)
      .then((data) => setPageDetails(data))
      .catch((error) => console.error("Error fetching page details:", error));
  }, [page_id]);

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
        navigate(paths.translator(book_id, previousPage.id));
      }
    }
  }, [currentPageIndex, allPages, book_id, navigate, paths]);

  const goToNextPage = useCallback(() => {
    if (currentPageIndex < allPages.length - 1 && book_id) {
      const nextPage = allPages[currentPageIndex + 1];
      if (nextPage?.id) {
        navigate(paths.translator(book_id, nextPage.id));
      }
    }
  }, [currentPageIndex, allPages, book_id, navigate, paths]);

  // OCR handler
  const runOCR = async () => {
    if (!pageDetails) return;

    setOcrApiRunning(true);

    try {
      const promptWithLanguage = customOcrPrompt.replace(
        "{language}",
        pageDetails.ocr.language
      );
      const response = await apiService.performOCR({
        pageId: pageDetails.id,
        photoUrl: useLowQuality
          ? pageDetails.compressed_photo || pageDetails.photo
          : pageDetails.photo,
        language: pageDetails.ocr.language,
        aiModel: pageDetails.ocr.model || "mistral",
        customPrompt: promptWithLanguage,
        autoSave: true,
      });

      setPageDetails((prev) =>
        prev
          ? {
              ...prev,
              ocr: { ...prev.ocr, data: response.ocr },
            }
          : null
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

    try {
      const response = await apiService.performTranslation({
        pageId: pageDetails.id,
        text: pageDetails.ocr.data,
        sourceLang: pageDetails.ocr.language,
        targetLang: pageDetails.translation.language || "English",
        aiModel: pageDetails.translation.model || "gemini",
        autoSave: true,
      });

      setPageDetails((prev) =>
        prev
          ? {
              ...prev,
              translation: {
                ...prev.translation,
                data: response.translation,
              },
            }
          : null
      );
      showSuccess("Translation completed successfully");
    } catch (error) {
      console.error("Error performing translation:", error);
      showModalError(
        "Translation Failed",
        "Failed to perform translation. Please try again."
      );
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
      prev
        ? { ...prev, translation: { ...prev.translation, data: value } }
        : null
    );
  };

  const handlePageDetailsChange = (updates: Partial<PageDetails>) => {
    setPageDetails((prev) => (prev ? { ...prev, ...updates } : null));
  };

  // Image URLs
  const highQualityUrl =
    pageDetails?.photo || pageDetails?.compressed_photo || "";
  const lowQualityUrl =
    pageDetails?.compressed_photo || pageDetails?.photo || "";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => book_id && navigate(paths.bookDetails(book_id))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to book"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 font-serif">
              {book?.title || "Loading..."}
            </h1>
            <p className="text-sm text-gray-500">
              Page {pageDetails?.page_number || "..."} of {allPages.length}
            </p>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousPage}
            disabled={currentPageIndex === 0}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous page"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {currentPageIndex + 1} / {allPages.length}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPageIndex >= allPages.length - 1}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next page"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Content - Three Columns */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1: Page Image */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Page Image
              </h2>
              <ToggleSwitch
                value={useLowQuality}
                onToggle={setUseLowQuality}
                leftContent={<span className="text-xs font-medium px-1">SD</span>}
                rightContent={<span className="text-xs font-medium px-1">HD</span>}
                className="h-7"
                buttonClassName="px-2 py-1 text-xs"
              />
            </div>

            {/* Image Container */}
            <div className="flex-1 relative bg-gray-50 flex items-center justify-center overflow-hidden min-h-[300px]">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              )}
              <img
                src={useLowQuality ? lowQualityUrl : highQualityUrl}
                className={`max-w-full max-h-full object-contain transition-opacity duration-200 ${
                  imageLoading ? "opacity-0" : "opacity-100"
                }`}
                onLoad={() => setImageLoading(false)}
                alt="Book page"
              />
            </div>

            {/* OCR Configuration */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                OCR Configuration
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Source Language
                    </label>
                    <input
                      list="ocr-languages"
                      value={pageDetails?.ocr.language || book?.language || ""}
                      onChange={(e) =>
                        handlePageDetailsChange({
                          ocr: { ...pageDetails!.ocr, language: e.target.value },
                        })
                      }
                      placeholder="Language"
                      className="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <datalist id="ocr-languages">
                      {MAJOR_LANGUAGES.map((lang) => (
                        <option key={lang.value} value={lang.value} />
                      ))}
                    </datalist>
                  </div>
                  <div className="flex-1">
                    <AIModelSelect
                      value={pageDetails?.ocr.model || "mistral"}
                      onChange={(model) =>
                        handlePageDetailsChange({
                          ocr: { ...pageDetails!.ocr, model },
                        })
                      }
                      models={OCR_MODELS}
                      label="AI Model"
                      inputClassName="w-full border border-gray-300 rounded-md bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTempOcrPrompt(customOcrPrompt);
                      setOcrPromptModalVisible(true);
                    }}
                    className="p-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors"
                    title="Edit OCR Prompt"
                  >
                    <CogIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={runOCR}
                    disabled={ocrApiRunning}
                    className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {ocrApiRunning ? (
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        <div
                          className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    ) : (
                      <>
                        <PlayCircleIcon className="h-5 w-5" />
                        <span>Run</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: OCR Text */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">OCR Text</h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                  {pageDetails?.ocr.language || "—"}
                </span>
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
                <ToggleSwitch
                  value={!ocrEditMode}
                  onToggle={(v) => setOcrEditMode(!v)}
                  leftContent={<PhotoIcon className="h-4 w-4" />}
                  rightContent={<PencilIcon className="h-4 w-4" />}
                  buttonClassName="px-2 py-1"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {ocrApiRunning && (
                <div className="flex items-center gap-2 text-gray-600 text-sm p-3 bg-purple-50 border-b border-purple-100">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"></div>
                    <div
                      className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span>Running OCR...</span>
                </div>
              )}
              {ocrEditMode ? (
                <textarea
                  value={pageDetails?.ocr?.data || ""}
                  onChange={(e) => handleOcrTextChange(e.target.value)}
                  placeholder="OCR text will appear here..."
                  className="w-full h-full p-4 resize-none focus:outline-none font-serif text-sm leading-relaxed"
                />
              ) : (
                <div className="h-full overflow-y-auto p-4 prose prose-sm max-w-none font-serif">
                  {pageDetails?.ocr?.data ? (
                    <ReactMarkdown
                      components={{
                        img: ({ ...props }) => (
                          <img
                            {...props}
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              display: "block",
                              margin: "1rem auto",
                            }}
                          />
                        ),
                      }}
                    >
                      {pageDetails.ocr.data}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-400 italic">
                      OCR text will appear here...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Translation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">
                Translation
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
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
                <ToggleSwitch
                  value={!translationEditMode}
                  onToggle={(v) => setTranslationEditMode(!v)}
                  leftContent={<PhotoIcon className="h-4 w-4" />}
                  rightContent={<PencilIcon className="h-4 w-4" />}
                  buttonClassName="px-2 py-1"
                />
              </div>
            </div>

            {/* Translate Button */}
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <button
                onClick={runTranslation}
                disabled={translationApiRunning || !pageDetails?.ocr.data}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {translationApiRunning ? (
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    <div
                      className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                ) : (
                  <>
                    <PlayCircleIcon className="h-5 w-5" />
                    <span>Translate to {pageDetails?.translation.language || "English"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {translationApiRunning && (
                <div className="flex items-center gap-2 text-gray-600 text-sm p-3 bg-purple-50 border-b border-purple-100">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"></div>
                    <div
                      className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span>Running translation...</span>
                </div>
              )}
              {translationEditMode ? (
                <textarea
                  value={pageDetails?.translation?.data || ""}
                  onChange={(e) => handleTranslationTextChange(e.target.value)}
                  placeholder="Translation will appear here..."
                  className="w-full h-full p-4 resize-none focus:outline-none font-serif text-sm leading-relaxed"
                />
              ) : (
                <div className="h-full overflow-y-auto p-4 prose prose-sm max-w-none font-serif">
                  {pageDetails?.translation?.data ? (
                    <ReactMarkdown
                      components={{
                        img: ({ ...props }) => (
                          <img
                            {...props}
                            style={{
                              maxWidth: "100%",
                              height: "auto",
                              display: "block",
                              margin: "1rem auto",
                            }}
                          />
                        ),
                      }}
                    >
                      {pageDetails.translation.data}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-gray-400 italic">
                      Translation will appear here...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <PromptModal
        visible={ocrPromptModalVisible}
        title="Edit OCR Prompt"
        placeholder="Enter your custom OCR prompt..."
        helpText="Use {language} as a placeholder for the selected language."
        value={tempOcrPrompt}
        onChange={setTempOcrPrompt}
        onSave={() => {
          setCustomOcrPrompt(tempOcrPrompt);
          setOcrPromptModalVisible(false);
        }}
        onCancel={() => {
          setOcrPromptModalVisible(false);
          setTempOcrPrompt("");
        }}
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

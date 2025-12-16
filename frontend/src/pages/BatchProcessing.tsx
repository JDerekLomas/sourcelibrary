import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  PlayCircleIcon,
  PauseIcon,
  StopIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { Book, PageDetails } from "../types";
import { apiService } from "../services/api";
import { OCR_MODELS, TRANSLATION_MODELS } from "../components/AiModels/aiModels";
import Toast from "../components/ui/Toast";
import { useToast } from "../hooks/useToast";

// Default prompts based on translation-workflows documentation
const DEFAULT_OCR_PROMPT = `You are transcribing a Renaissance Latin facsimile.

**Instructions**:
- Start with [[notes: describe page condition, layout, typeface, damage]]
- Include [[page: N]] if a page number is visible
- Preserve original capitalization, spelling, and line breaks
- Use Markdown to mirror the source layout:
  - # headings for chapter titles
  - > for centered mottos or dedications
  - *italics* for italic text
- Mark uncertain characters: [[?reading]] or [[alt: optionA / optionB]]
- Flag continuations: [[continues from previous page]] or [[continues to next page]]

**Output**: Only the transcription with markup. No commentary.`;

const DEFAULT_TRANSLATION_PROMPT = `You are translating Renaissance {source_lang} into accessible {target_lang}.

**Instructions**:
- Start with [[notes: context from prior page, tricky phrases, terminology choices]]
- Mirror the source layout exactly:
  - Preserve headings, centered text, paragraph breaks
  - Keep Markdown tables in the same structure
  - Maintain line breaks where meaningful
- Use inline [[notes]] for:
  - Alternate translation possibilities
  - Historical context a general reader needs
  - Technical terms that require explanation
- Style: warm and accessible, like a museum label—explain references rather than leaving jargon
- Preserve proper names; add context in notes on first occurrence

**Output**: Only the {target_lang} translation with notes. No meta-commentary.`;

const DEFAULT_SUMMARY_PROMPT = `Extract key information from this page for indexing and discovery.

**Page Translation**:
{translation_text}

**Instructions**:
Analyze the translation and output a JSON object with these fields:

{
  "summary": "2-3 sentence description of page content",
  "key_terms": ["important terms, concepts, or technical vocabulary"],
  "people": ["names of people mentioned with brief context"],
  "places": ["locations or places mentioned"],
  "concepts": ["philosophical, scientific, or religious concepts discussed"],
  "themes": ["broader themes: medicine, alchemy, theology, etc."],
  "connections": ["references to other works, authors, or traditions"],
  "page_type": "title_page | dedication | preface | chapter_start | body | index | illustration",
  "confidence": 0.0-1.0
}

**Output**: Only valid JSON. No markdown, no commentary.`;

interface PageStatus {
  pageNumber: number;
  pageId: string;
  ocrStatus: "pending" | "processing" | "completed" | "error" | "skipped";
  translationStatus: "pending" | "processing" | "completed" | "error" | "skipped";
  summaryStatus: "pending" | "processing" | "completed" | "error" | "skipped";
  error?: string;
}

type ProcessingPhase = "idle" | "ocr" | "translation" | "summary" | "complete";
type StatusType = "pending" | "processing" | "completed" | "error" | "skipped";

// Status badge component for the progress table
const StatusBadge: React.FC<{ status: StatusType }> = ({ status }) => {
  const styles: Record<StatusType, string> = {
    pending: "text-gray-400",
    processing: "text-purple-600 animate-pulse",
    completed: "text-green-600",
    error: "text-red-600",
    skipped: "text-gray-300",
  };

  const icons: Record<StatusType, string> = {
    pending: "○",
    processing: "◐",
    completed: "✓",
    error: "✗",
    skipped: "—",
  };

  return (
    <span className={`font-bold ${styles[status]}`} title={status}>
      {icons[status]}
    </span>
  );
};

const BatchProcessing: React.FC = () => {
  const { book_id } = useParams<{ book_id: string }>();
  const navigate = useNavigate();
  const { toast, hideToast, showSuccess, showError } = useToast();

  // Book and pages data
  const [book, setBook] = useState<Book | null>(null);
  const [allPages, setAllPages] = useState<PageDetails[]>([]);
  const [loading, setLoading] = useState(true);

  // Page range settings
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);

  // Operation settings
  const [includeOcr, setIncludeOcr] = useState(true);
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(false);
  const [ocrModel, setOcrModel] = useState("mistral"); // Gemini has MIME type bug for OCR
  const [translationModel, setTranslationModel] = useState("gemini");
  const [summaryModel, setSummaryModel] = useState("gemini");

  // Prompts (collapsible section)
  const [promptsExpanded, setPromptsExpanded] = useState(false);
  const [ocrPrompt, setOcrPrompt] = useState(() => {
    const saved = localStorage.getItem("batchOcrPrompt");
    return saved || DEFAULT_OCR_PROMPT;
  });
  const [translationPrompt, setTranslationPrompt] = useState(() => {
    const saved = localStorage.getItem("batchTranslationPrompt");
    return saved || DEFAULT_TRANSLATION_PROMPT;
  });
  const [summaryPrompt, setSummaryPrompt] = useState(() => {
    const saved = localStorage.getItem("batchSummaryPrompt");
    return saved || DEFAULT_SUMMARY_PROMPT;
  });

  // Results storage (page_id -> text) - values stored for potential future use
  const [_ocrResults, setOcrResults] = useState<Record<string, string>>({});
  const [_translationResults, setTranslationResults] = useState<Record<string, string>>({});
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<ProcessingPhase>("idle");
  const [pageStatuses, setPageStatuses] = useState<PageStatus[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const pausedRef = useRef(false);
  const cancelledRef = useRef(false);

  // Save prompts to localStorage when they change
  useEffect(() => {
    localStorage.setItem("batchOcrPrompt", ocrPrompt);
  }, [ocrPrompt]);

  useEffect(() => {
    localStorage.setItem("batchTranslationPrompt", translationPrompt);
  }, [translationPrompt]);

  useEffect(() => {
    localStorage.setItem("batchSummaryPrompt", summaryPrompt);
  }, [summaryPrompt]);

  // Load book and pages
  useEffect(() => {
    if (!book_id) return;

    setLoading(true);

    Promise.all([
      apiService.getBook(book_id),
      apiService.getBookDetails(book_id),
    ])
      .then(([bookData, detailsData]) => {
        setBook(bookData);
        const pages = detailsData.pages || [];
        setAllPages(pages);
        setEndPage(pages.length);
      })
      .catch((error) => {
        console.error("Error loading book:", error);
        showError("Failed to load book data");
      })
      .finally(() => setLoading(false));
  }, [book_id]);

  // Process pages in phases: OCR → Translation → Summary
  const runBatchProcessing = useCallback(async () => {
    if (!book || allPages.length === 0) return;

    const startIdx = startPage - 1;
    const endIdx = Math.min(endPage - 1, allPages.length - 1);

    if (startIdx < 0 || startIdx > endIdx) {
      showError("Invalid page range");
      return;
    }

    const pagesToProcess = allPages.slice(startIdx, endIdx + 1);

    // Initialize page statuses
    const initialStatuses: PageStatus[] = pagesToProcess.map((page) => ({
      pageNumber: page.page_number,
      pageId: page.id,
      ocrStatus: includeOcr ? "pending" : "skipped",
      translationStatus: includeTranslation ? "pending" : "skipped",
      summaryStatus: includeSummary ? "pending" : "skipped",
    }));
    setPageStatuses(initialStatuses);

    // Clear previous results
    setOcrResults({});
    setTranslationResults({});
    setSummaries({});

    setProcessing(true);
    setPaused(false);
    pausedRef.current = false;
    cancelledRef.current = false;
    setCurrentPageIndex(0);
    setCurrentPhase("idle");

    // Get initial context from page before start (if exists)
    let previousOcrText = "";
    let previousTranslationText = "";
    if (startIdx > 0) {
      const prevPage = allPages[startIdx - 1];
      previousOcrText = prevPage.ocr?.data || "";
      previousTranslationText = prevPage.translation?.data || "";
    }

    // Local storage for results during processing
    const localOcrResults: Record<string, string> = {};
    const localTranslationResults: Record<string, string> = {};

    // ========== PHASE 1: OCR ==========
    if (includeOcr) {
      setCurrentPhase("ocr");
      previousOcrText = startIdx > 0 ? (allPages[startIdx - 1].ocr?.data || "") : "";

      for (let i = 0; i < pagesToProcess.length; i++) {
        if (cancelledRef.current) break;
        while (pausedRef.current && !cancelledRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const page = pagesToProcess[i];
        setCurrentPageIndex(i);

        setPageStatuses((prev) =>
          prev.map((s, idx) => idx === i ? { ...s, ocrStatus: "processing" } : s)
        );

        try {
          const ocrPromptWithContext = previousOcrText
            ? `${ocrPrompt.replace("{language}", page.ocr?.language || book.language || "German")}\n\n**Previous page OCR (for context/continuity)**:\n${previousOcrText.slice(-500)}`
            : ocrPrompt.replace("{language}", page.ocr?.language || book.language || "German");

          const ocrResponse = await apiService.performOCR({
            pageId: page.id,
            photoUrl: page.photo,
            language: page.ocr?.language || book.language || "German",
            aiModel: ocrModel,
            customPrompt: ocrPromptWithContext,
            autoSave: true,
          });

          localOcrResults[page.id] = ocrResponse.ocr;
          previousOcrText = ocrResponse.ocr;

          setPageStatuses((prev) =>
            prev.map((s, idx) => idx === i ? { ...s, ocrStatus: "completed" } : s)
          );
        } catch (error) {
          console.error(`OCR error on page ${page.page_number}:`, error);
          // Use existing OCR if available
          localOcrResults[page.id] = page.ocr?.data || "";
          setPageStatuses((prev) =>
            prev.map((s, idx) => idx === i ? { ...s, ocrStatus: "error", error: String(error) } : s)
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      setOcrResults(localOcrResults);
    } else {
      // Use existing OCR data
      pagesToProcess.forEach((page) => {
        localOcrResults[page.id] = page.ocr?.data || "";
      });
    }

    if (cancelledRef.current) {
      setProcessing(false);
      setCurrentPhase("idle");
      showSuccess("Batch cancelled");
      return;
    }

    // ========== PHASE 2: TRANSLATION ==========
    if (includeTranslation) {
      setCurrentPhase("translation");
      previousTranslationText = startIdx > 0 ? (allPages[startIdx - 1].translation?.data || "") : "";

      for (let i = 0; i < pagesToProcess.length; i++) {
        if (cancelledRef.current) break;
        while (pausedRef.current && !cancelledRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const page = pagesToProcess[i];
        const ocrText = localOcrResults[page.id] || page.ocr?.data || "";

        if (!ocrText) {
          setPageStatuses((prev) =>
            prev.map((s, idx) => idx === i ? { ...s, translationStatus: "skipped" } : s)
          );
          continue;
        }

        setCurrentPageIndex(i);
        setPageStatuses((prev) =>
          prev.map((s, idx) => idx === i ? { ...s, translationStatus: "processing" } : s)
        );

        try {
          const translationPromptWithContext = previousTranslationText
            ? `${translationPrompt
                .replace("{source_lang}", page.ocr?.language || book.language || "German")
                .replace("{target_lang}", page.translation?.language || "English")}\n\n**Previous page translation (for context/continuity)**:\n${previousTranslationText.slice(-500)}`
            : translationPrompt
                .replace("{source_lang}", page.ocr?.language || book.language || "German")
                .replace("{target_lang}", page.translation?.language || "English");

          const translationResponse = await apiService.performTranslation({
            pageId: page.id,
            text: ocrText,
            sourceLang: page.ocr?.language || book.language || "German",
            targetLang: page.translation?.language || "English",
            aiModel: translationModel,
            customPrompt: translationPromptWithContext,
            autoSave: true,
          });

          localTranslationResults[page.id] = translationResponse.translation;
          previousTranslationText = translationResponse.translation;

          setPageStatuses((prev) =>
            prev.map((s, idx) => idx === i ? { ...s, translationStatus: "completed" } : s)
          );
        } catch (error) {
          console.error(`Translation error on page ${page.page_number}:`, error);
          localTranslationResults[page.id] = page.translation?.data || "";
          setPageStatuses((prev) =>
            prev.map((s, idx) => idx === i ? { ...s, translationStatus: "error", error: String(error) } : s)
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      setTranslationResults(localTranslationResults);
    } else {
      // Use existing translation data
      pagesToProcess.forEach((page) => {
        localTranslationResults[page.id] = page.translation?.data || "";
      });
    }

    if (cancelledRef.current) {
      setProcessing(false);
      setCurrentPhase("idle");
      showSuccess("Batch cancelled");
      return;
    }

    // ========== PHASE 3: SUMMARY ==========
    if (includeSummary) {
      setCurrentPhase("summary");
      const localSummaries: Record<string, string> = {};

      for (let i = 0; i < pagesToProcess.length; i++) {
        if (cancelledRef.current) break;
        while (pausedRef.current && !cancelledRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const page = pagesToProcess[i];
        const translationText = localTranslationResults[page.id] || page.translation?.data || "";

        if (!translationText) {
          setPageStatuses((prev) =>
            prev.map((s, idx) => idx === i ? { ...s, summaryStatus: "skipped" } : s)
          );
          continue;
        }

        setCurrentPageIndex(i);
        setPageStatuses((prev) =>
          prev.map((s, idx) => idx === i ? { ...s, summaryStatus: "processing" } : s)
        );

        try {
          const summaryPromptWithText = summaryPrompt.replace(
            "{translation_text}",
            translationText.slice(0, 3000)
          );

          const summaryResponse = await apiService.performTranslation({
            pageId: page.id,
            text: translationText,
            sourceLang: "English",
            targetLang: "English",
            aiModel: summaryModel,
            customPrompt: summaryPromptWithText,
            autoSave: false,
          });

          localSummaries[page.id] = summaryResponse.translation;

          setPageStatuses((prev) =>
            prev.map((s, idx) => idx === i ? { ...s, summaryStatus: "completed" } : s)
          );
        } catch (error) {
          console.error(`Summary error on page ${page.page_number}:`, error);
          setPageStatuses((prev) =>
            prev.map((s, idx) => idx === i ? { ...s, summaryStatus: "error", error: String(error) } : s)
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      setSummaries(localSummaries);
    }

    setProcessing(false);
    setCurrentPhase("complete");

    if (!cancelledRef.current) {
      const ocrCompleted = pageStatuses.filter((s) => s.ocrStatus === "completed").length;
      const transCompleted = pageStatuses.filter((s) => s.translationStatus === "completed").length;
      const sumCompleted = pageStatuses.filter((s) => s.summaryStatus === "completed").length;
      showSuccess(`Complete! OCR: ${ocrCompleted}, Translation: ${transCompleted}, Summary: ${sumCompleted}`);
    }
  }, [book, allPages, startPage, endPage, includeOcr, includeTranslation, includeSummary, ocrModel, translationModel, summaryModel, ocrPrompt, translationPrompt, summaryPrompt]);

  const togglePause = () => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
  };

  const cancelProcessing = () => {
    cancelledRef.current = true;
    pausedRef.current = false;
    setPaused(false);
  };

  const resetPrompts = () => {
    setOcrPrompt(DEFAULT_OCR_PROMPT);
    setTranslationPrompt(DEFAULT_TRANSLATION_PROMPT);
    setSummaryPrompt(DEFAULT_SUMMARY_PROMPT);
  };

  // Download summaries as JSON
  const downloadSummaries = () => {
    if (Object.keys(summaries).length === 0) return;

    const blob = new Blob([JSON.stringify(summaries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${book?.title || "book"}_summaries.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = endPage - startPage + 1;

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
              <Link
                to={`/book/${book_id}`}
                className="hover:text-purple-700 transition-colors"
              >
                <h1 className="text-lg font-semibold text-gray-900 hover:text-purple-700 font-serif">
                  {book?.display_title || book?.title || "Loading..."}
                </h1>
              </Link>
              <p className="text-sm text-gray-500">Batch Processing</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Settings Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Page Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Page Range
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={allPages.length}
                    value={startPage}
                    onChange={(e) =>
                      setStartPage(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    disabled={processing}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="number"
                    min={startPage}
                    max={allPages.length}
                    value={endPage}
                    onChange={(e) =>
                      setEndPage(
                        Math.max(startPage, parseInt(e.target.value) || startPage)
                      )
                    }
                    disabled={processing}
                    className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                  />
                  <span className="text-sm text-gray-500">
                    of {allPages.length} pages
                  </span>
                </div>
              </div>

              {/* Operations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* OCR Settings */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeOcr}
                      onChange={(e) => setIncludeOcr(e.target.checked)}
                      disabled={processing}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Run OCR
                    </span>
                  </label>
                  {includeOcr && (
                    <div className="ml-6">
                      <label className="block text-xs text-gray-500 mb-1">
                        OCR Model
                      </label>
                      <select
                        value={ocrModel}
                        onChange={(e) => setOcrModel(e.target.value)}
                        disabled={processing}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                      >
                        {OCR_MODELS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Translation Settings */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeTranslation}
                      onChange={(e) => setIncludeTranslation(e.target.checked)}
                      disabled={processing}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Translate
                    </span>
                  </label>
                  {includeTranslation && (
                    <div className="ml-6">
                      <label className="block text-xs text-gray-500 mb-1">
                        Translation Model
                      </label>
                      <select
                        value={translationModel}
                        onChange={(e) => setTranslationModel(e.target.value)}
                        disabled={processing}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                      >
                        {TRANSLATION_MODELS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Summary Settings */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSummary}
                      onChange={(e) => setIncludeSummary(e.target.checked)}
                      disabled={processing}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Summarize
                    </span>
                  </label>
                  {includeSummary && (
                    <div className="ml-6">
                      <label className="block text-xs text-gray-500 mb-1">
                        Summary Model
                      </label>
                      <select
                        value={summaryModel}
                        onChange={(e) => setSummaryModel(e.target.value)}
                        disabled={processing}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100"
                      >
                        {TRANSLATION_MODELS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Collapsible Prompts Section */}
              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={() => setPromptsExpanded(!promptsExpanded)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-700 transition-colors w-full"
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                  <span>Edit Prompts</span>
                  {promptsExpanded ? (
                    <ChevronUpIcon className="h-4 w-4 ml-auto" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 ml-auto" />
                  )}
                </button>

                {promptsExpanded && (
                  <div className="mt-4 space-y-4">
                    <div className="flex justify-end">
                      <button
                        onClick={resetPrompts}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        Reset to defaults
                      </button>
                    </div>

                    {/* OCR Prompt */}
                    {includeOcr && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          OCR Prompt
                          <span className="text-xs text-gray-500 ml-2">
                            (use {"{language}"} as placeholder)
                          </span>
                        </label>
                        <textarea
                          value={ocrPrompt}
                          onChange={(e) => setOcrPrompt(e.target.value)}
                          disabled={processing}
                          rows={8}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono disabled:bg-gray-100"
                        />
                      </div>
                    )}

                    {/* Translation Prompt */}
                    {includeTranslation && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Translation Prompt
                          <span className="text-xs text-gray-500 ml-2">
                            (use {"{source_lang}"}, {"{target_lang}"} as placeholders)
                          </span>
                        </label>
                        <textarea
                          value={translationPrompt}
                          onChange={(e) => setTranslationPrompt(e.target.value)}
                          disabled={processing}
                          rows={8}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono disabled:bg-gray-100"
                        />
                      </div>
                    )}

                    {/* Summary Prompt */}
                    {includeSummary && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Summary Prompt
                          <span className="text-xs text-gray-500 ml-2">
                            (use {"{translation_text}"} as placeholder)
                          </span>
                        </label>
                        <textarea
                          value={summaryPrompt}
                          onChange={(e) => setSummaryPrompt(e.target.value)}
                          disabled={processing}
                          rows={10}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono disabled:bg-gray-100"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          {processing && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 space-y-4">
                {/* Current Phase Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-gray-900">
                      {currentPhase === "ocr" && "Phase 1: OCR"}
                      {currentPhase === "translation" && "Phase 2: Translation"}
                      {currentPhase === "summary" && "Phase 3: Summary"}
                      {currentPhase === "idle" && "Starting..."}
                    </h2>
                    <span className="text-sm text-gray-500">
                      Page {currentPageIndex + 1} of {pageStatuses.length}
                    </span>
                  </div>
                </div>

                {/* Phase Progress Indicators */}
                <div className="flex gap-2">
                  {includeOcr && (
                    <div className={`flex-1 h-2 rounded-full ${
                      currentPhase === "ocr" ? "bg-purple-500" :
                      currentPhase === "translation" || currentPhase === "summary" || currentPhase === "complete" ? "bg-green-500" :
                      "bg-gray-200"
                    }`} title="OCR" />
                  )}
                  {includeTranslation && (
                    <div className={`flex-1 h-2 rounded-full ${
                      currentPhase === "translation" ? "bg-purple-500" :
                      currentPhase === "summary" || currentPhase === "complete" ? "bg-green-500" :
                      "bg-gray-200"
                    }`} title="Translation" />
                  )}
                  {includeSummary && (
                    <div className={`flex-1 h-2 rounded-full ${
                      currentPhase === "summary" ? "bg-purple-500" :
                      currentPhase === "complete" ? "bg-green-500" :
                      "bg-gray-200"
                    }`} title="Summary" />
                  )}
                </div>

                {/* Page Progress Bar (within current phase) */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentPageIndex + 1) / pageStatuses.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Page Status Table */}
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1 text-left">Page</th>
                        {includeOcr && <th className="px-2 py-1 text-center">OCR</th>}
                        {includeTranslation && <th className="px-2 py-1 text-center">Trans</th>}
                        {includeSummary && <th className="px-2 py-1 text-center">Sum</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {pageStatuses.map((status) => (
                        <tr key={status.pageId} className="border-t border-gray-100">
                          <td className="px-2 py-1 font-medium">{status.pageNumber}</td>
                          {includeOcr && (
                            <td className="px-2 py-1 text-center">
                              <StatusBadge status={status.ocrStatus} />
                            </td>
                          )}
                          {includeTranslation && (
                            <td className="px-2 py-1 text-center">
                              <StatusBadge status={status.translationStatus} />
                            </td>
                          )}
                          {includeSummary && (
                            <td className="px-2 py-1 text-center">
                              <StatusBadge status={status.summaryStatus} />
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                  <button
                    onClick={togglePause}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      paused
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    }`}
                  >
                    {paused ? (
                      <>
                        <PlayCircleIcon className="h-5 w-5" />
                        Resume
                      </>
                    ) : (
                      <>
                        <PauseIcon className="h-5 w-5" />
                        Pause
                      </>
                    )}
                  </button>
                  <button
                    onClick={cancelProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                  >
                    <StopIcon className="h-5 w-5" />
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline Summary */}
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
            <strong>{totalPages}</strong> pages will be processed
            {includeOcr && " → OCR"}
            {includeTranslation && " → Translation"}
            {includeSummary && " → Summary"}
            {!includeOcr && !includeTranslation && !includeSummary && ". Select at least one operation."}
          </div>

          {/* Download Summaries Button (after processing) */}
          {Object.keys(summaries).length > 0 && !processing && (
            <button
              onClick={downloadSummaries}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download Summaries ({Object.keys(summaries).length} pages)
            </button>
          )}

          {/* Start Button */}
          {!processing && (
            <button
              onClick={runBatchProcessing}
              disabled={!includeOcr && !includeTranslation && !includeSummary}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <PlayCircleIcon className="h-6 w-6" />
              Start Batch Processing
            </button>
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

export default BatchProcessing;

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { jsPDF } from "jspdf";
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
  ArrowDownTrayIcon,
  QueueListIcon,
  PauseIcon,
  StopIcon,
  ScissorsIcon,
} from "@heroicons/react/24/outline";
import { ClipboardIcon as ClipboardIconSolid } from "@heroicons/react/24/solid";
import { PageDetails, Book } from "../types";
import { apiService } from "../services/api";
import { samplePages, sampleBook } from "../data/samplePages";
// Languages no longer needed in settings - using currentPromptText directly
import { OCR_MODELS, TRANSLATION_MODELS } from "../components/AiModels/aiModels";
import Modal from "../components/ui/Modal";
import Toast from "../components/ui/Toast";
import { useModal } from "../hooks/useModal";
import { useToast } from "../hooks/useToast";

// Default prompts based on translation-workflows documentation
const DEFAULT_OCR_PROMPTS = [
  { id: "1", name: "Standard OCR", prompt: "OCR the page in {language}. Return only the transcribed text." },
  { id: "2", name: "Renaissance Latin (Full)", prompt: `You are transcribing a Renaissance Latin facsimile.

**Instructions**:
- Start with [[notes: describe page condition, layout, typeface, damage]]
- Include [[page: N]] if a page number is visible
- Preserve original capitalization, spelling, and line breaks
- Use Markdown to mirror the source layout:
  - # headings for chapter titles
  - > for centered mottos or dedications
  - *italics* for italic text
  - Markdown tables for indices, columns, or tabular content
- Mark uncertain characters: [[?reading]] or [[alt: optionA / optionB]]
- Note abbreviations: expand only if certain, otherwise [[abbrev: ã = an? am?]]
- Flag continuations: [[continues from previous page]] or [[continues to next page]]

**Output**: Only the transcription with markup. No commentary.` },
  { id: "3", name: "Gothic Typeface", prompt: `OCR the page in {language}. This uses Gothic blackletter typeface.

**Notes**:
- u and n may be indistinguishable; use context
- Common ligatures: ch, ck, st, tz
- Mark uncertain readings with [[?reading]]
- Preserve original spelling and abbreviations` },
  { id: "4", name: "With Marginalia", prompt: `OCR the page in {language}.

**Instructions**:
- Transcribe main text normally
- Marginal notes: place in [[margin: ...]] blocks after the line they reference
- Note if printed or manuscript additions
- Mark uncertain readings with [[?reading]]` },
  { id: "5", name: "Esoteric Symbols", prompt: `OCR the page in {language}. Pay special attention to alchemical, astrological, and esoteric symbols.

**Symbol guide**:
- Zodiac: ♈♉♊♋♌♍♎♏♐♑♒♓
- Planets: ☉☽♄♃♂♀☿
- Elements: △▽ (fire/water), ★ (air)
- Use Unicode when possible, [[symbol: description]] when not

Mark uncertain readings with [[?reading]].` },
];

const DEFAULT_TRANSLATION_PROMPTS = [
  { id: "1", name: "Literal Translation", prompt: "Translate from {source_lang} to {target_lang}. Provide a literal, accurate translation." },
  { id: "2", name: "Renaissance Scholar (Full)", prompt: `You are translating Renaissance {source_lang} into accessible {target_lang}.

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

**Output**: Only the {target_lang} translation with notes. No meta-commentary.` },
  { id: "3", name: "Scholarly Audience", prompt: `Translate from {source_lang} to {target_lang}.

**Target audience**: Scholars familiar with the period
**Tone**: Formal, preserve {source_lang} structure where elegant
**Technical terms**: Use standard scholarly translations
**Notes**: Focus on textual issues, not basic context` },
  { id: "4", name: "General Readers", prompt: `Translate from {source_lang} to {target_lang}.

**Target audience**: Educated general readers
**Tone**: Accessible, prioritize clarity over literalness
**Technical terms**: Always explain on first use
**Notes**: Provide historical and cultural context generously` },
  { id: "5", name: "Esoteric/Alchemical", prompt: `Translate from {source_lang} to {target_lang}. This is an esoteric/alchemical text.

**Key terminology** (preserve consistently):
- anima → "soul" (not "mind" or "spirit")
- spiritus → "spirit" when metaphysical, "breath/air" when physical
- natura → "nature" (capitalize when personified)

Preserve symbolic terminology. Add brief [[notes]] only where essential for comprehension.` },
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

  // Batch processing
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchPaused, setBatchPaused] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, currentPage: 0 });
  const [batchStartPage, setBatchStartPage] = useState(1);
  const [batchEndPage, setBatchEndPage] = useState(1);
  const [batchIncludeOcr, setBatchIncludeOcr] = useState(true);
  const [batchIncludeTranslation, setBatchIncludeTranslation] = useState(true);
  const batchPausedRef = useRef(false);
  const batchCancelledRef = useRef(false);

  // Page split
  const [splitting, setSplitting] = useState(false);

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

  // Current prompt text being edited in modal
  const [currentOcrPromptText, setCurrentOcrPromptText] = useState(() => {
    const prompt = DEFAULT_OCR_PROMPTS.find((p) => p.id === "1");
    return prompt?.prompt || "";
  });
  const [currentTranslationPromptText, setCurrentTranslationPromptText] = useState(() => {
    const prompt = DEFAULT_TRANSLATION_PROMPTS.find((p) => p.id === "1");
    return prompt?.prompt || "";
  });

  // Check if this is demo mode
  const isDemo = book_id === "demo" || book_id?.startsWith("demo-");

  // Utility function to strip markdown image links from text
  const stripImageLinks = useCallback((text: string): string => {
    if (!text) return "";
    // Remove ![alt](url) patterns
    return text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");
  }, []);

  // Process [[notes: ...]] patterns into footnotes
  const processNotesAsFootnotes = useCallback((text: string): { processedText: string; footnotes: string[] } => {
    if (!text) return { processedText: "", footnotes: [] };

    const footnotes: string[] = [];
    let counter = 1;

    // Match various note patterns: [[notes: ...]], [[note: ...]], [[?reading]], [[alt: ...]], [[margin: ...]], etc.
    const notePattern = /\[\[([^\]]+)\]\]/g;

    const processedText = text.replace(notePattern, (match, noteContent) => {
      // Skip page references like [[page: 12]]
      if (noteContent.toLowerCase().startsWith("page:")) {
        return match; // Keep page references inline
      }

      footnotes.push(noteContent.trim());
      return `<sup class="footnote-ref">[${counter++}]</sup>`;
    });

    return { processedText, footnotes };
  }, []);

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

  // OCR handler - uses currentOcrPromptText directly
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
      // Use the current prompt text, replacing placeholders
      const promptWithLanguage = currentOcrPromptText.replace("{language}", pageDetails.ocr.language);

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

  // Translation handler - uses currentTranslationPromptText directly
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
      // Use the current prompt text, replacing placeholders
      const prompt = currentTranslationPromptText
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

  // Batch processing handler
  const runBatchProcessing = async () => {
    if (!book || allPages.length === 0) return;
    if (isDemo) {
      showModalError("Demo Mode", "Batch processing is not available in demo mode.");
      return;
    }

    // Validate page range
    const startIdx = batchStartPage - 1;
    const endIdx = Math.min(batchEndPage - 1, allPages.length - 1);

    if (startIdx < 0 || startIdx > endIdx) {
      showModalError("Invalid Range", "Please select a valid page range.");
      return;
    }

    const pagesToProcess = allPages.slice(startIdx, endIdx + 1);
    const total = pagesToProcess.length;

    setBatchProcessing(true);
    setBatchPaused(false);
    batchPausedRef.current = false;
    batchCancelledRef.current = false;
    setBatchProgress({ current: 0, total, currentPage: pagesToProcess[0]?.page_number || 0 });

    let previousOcrText = "";
    let previousTranslationText = "";

    // Get context from page before start (if exists)
    if (startIdx > 0) {
      const prevPage = allPages[startIdx - 1];
      previousOcrText = prevPage.ocr?.data || "";
      previousTranslationText = prevPage.translation?.data || "";
    }

    for (let i = 0; i < pagesToProcess.length; i++) {
      // Check for cancellation
      if (batchCancelledRef.current) {
        showSuccess(`Batch cancelled after ${i} pages`);
        break;
      }

      // Wait while paused
      while (batchPausedRef.current && !batchCancelledRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const page = pagesToProcess[i];
      setBatchProgress({ current: i + 1, total, currentPage: page.page_number });

      try {
        let currentOcrText = page.ocr?.data || "";
        let currentTranslationText = page.translation?.data || "";

        // Run OCR if selected
        if (batchIncludeOcr) {
          const ocrPrompt = currentOcrPromptText
            .replace("{language}", page.ocr?.language || book.language || "German");

          // Add context from previous page
          const ocrPromptWithContext = previousOcrText
            ? `${ocrPrompt}\n\n**Previous page OCR (for context/continuity)**:\n${previousOcrText.slice(-500)}`
            : ocrPrompt;

          const ocrResponse = await apiService.performOCR({
            pageId: page.id,
            photoUrl: page.photo,
            language: page.ocr?.language || book.language || "German",
            aiModel: pageDetails?.ocr.model || "mistral",
            customPrompt: ocrPromptWithContext,
            autoSave: true,
          });

          currentOcrText = ocrResponse.ocr;
        }

        // Run Translation if selected and OCR exists
        if (batchIncludeTranslation && currentOcrText) {
          const translationPrompt = currentTranslationPromptText
            .replace("{source_lang}", page.ocr?.language || book.language || "German")
            .replace("{target_lang}", page.translation?.language || "English");

          // Add context from previous page
          const translationPromptWithContext = previousTranslationText
            ? `${translationPrompt}\n\n**Previous page translation (for context/continuity)**:\n${previousTranslationText.slice(-500)}`
            : translationPrompt;

          const translationResponse = await apiService.performTranslation({
            pageId: page.id,
            text: currentOcrText,
            sourceLang: page.ocr?.language || book.language || "German",
            targetLang: page.translation?.language || "English",
            aiModel: pageDetails?.translation.model || "gemini",
            customPrompt: translationPromptWithContext,
            autoSave: true,
          });

          currentTranslationText = translationResponse.translation;
        }

        // Update context for next page
        previousOcrText = currentOcrText;
        previousTranslationText = currentTranslationText;

        // Update current page if it matches
        if (page.id === pageDetails?.id) {
          setPageDetails((prev) =>
            prev
              ? {
                  ...prev,
                  ocr: { ...prev.ocr, data: currentOcrText },
                  translation: { ...prev.translation, data: currentTranslationText },
                }
              : null
          );
        }

      } catch (error) {
        console.error(`Error processing page ${page.page_number}:`, error);
        // Continue with next page instead of stopping
      }

      // Small delay between pages to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setBatchProcessing(false);
    setBatchProgress({ current: 0, total: 0, currentPage: 0 });

    if (!batchCancelledRef.current) {
      showSuccess(`Batch processing complete! Processed ${total} pages.`);
    }
  };

  const toggleBatchPause = () => {
    batchPausedRef.current = !batchPausedRef.current;
    setBatchPaused(batchPausedRef.current);
  };

  const cancelBatchProcessing = () => {
    batchCancelledRef.current = true;
    batchPausedRef.current = false;
    setBatchPaused(false);
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

  // Download handlers
  const downloadMarkdown = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadOcrMarkdown = () => {
    if (!pageDetails?.ocr.data || !book) return;
    const bookSlug = (book.title || "book").toLowerCase().replace(/\s+/g, "_").slice(0, 30);
    const pageNum = String(pageDetails.page_number).padStart(3, "0");
    const filename = `${bookSlug}_page_${pageNum}_ocr.md`;

    const content = `# ${book.display_title || book.title}
## Page ${pageDetails.page_number} - OCR Text

**Source**: [Source Library](https://sourcelibrary.vercel.app/book/${book.id})
**Language**: ${pageDetails.ocr.language}
**Generated**: ${new Date().toISOString().split("T")[0]}

---

${pageDetails.ocr.data}

---
*Generated by Source Library - Preserving rare esoteric texts*
`;
    downloadMarkdown(content, filename);
    showSuccess("OCR downloaded as markdown");
  };

  const downloadTranslationMarkdown = () => {
    if (!pageDetails?.translation.data || !book) return;
    const bookSlug = (book.title || "book").toLowerCase().replace(/\s+/g, "_").slice(0, 30);
    const pageNum = String(pageDetails.page_number).padStart(3, "0");
    const filename = `${bookSlug}_page_${pageNum}_translation.md`;

    const content = `# ${book.display_title || book.title}
## Page ${pageDetails.page_number} - Translation

**Source**: [Source Library](https://sourcelibrary.vercel.app/book/${book.id})
**Original Language**: ${pageDetails.ocr.language}
**Translated to**: ${pageDetails.translation.language}
**Generated**: ${new Date().toISOString().split("T")[0]}

---

${pageDetails.translation.data}

---
*Generated by Source Library - Preserving rare esoteric texts*
`;
    downloadMarkdown(content, filename);
    showSuccess("Translation downloaded as markdown");
  };

  const downloadBilingualMarkdown = () => {
    if (!pageDetails || !book) return;
    const bookSlug = (book.title || "book").toLowerCase().replace(/\s+/g, "_").slice(0, 30);
    const pageNum = String(pageDetails.page_number).padStart(3, "0");
    const filename = `${bookSlug}_page_${pageNum}_bilingual.md`;

    const content = `# ${book.display_title || book.title}
## Page ${pageDetails.page_number} - Bilingual Edition

**Source**: [Source Library](https://sourcelibrary.vercel.app/book/${book.id})
**Original Language**: ${pageDetails.ocr.language}
**Translated to**: ${pageDetails.translation.language}
**Generated**: ${new Date().toISOString().split("T")[0]}

---

## Original Text (${pageDetails.ocr.language})

${pageDetails.ocr.data || "*No OCR text available*"}

---

## Translation (${pageDetails.translation.language})

${pageDetails.translation.data || "*No translation available*"}

---
*Generated by Source Library - Preserving rare esoteric texts*
*View original: https://sourcelibrary.vercel.app/translator/${book.id}/${pageDetails.id}*
`;
    downloadMarkdown(content, filename);
    showSuccess("Bilingual edition downloaded as markdown");
  };

  const downloadBilingualPDF = () => {
    if (!pageDetails || !book) return;

    const bookSlug = (book.title || "book").toLowerCase().replace(/\s+/g, "_").slice(0, 30);
    const pageNum = String(pageDetails.page_number).padStart(3, "0");
    const filename = `${bookSlug}_page_${pageNum}_bilingual.pdf`;

    // Create PDF in landscape for side-by-side layout
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const columnWidth = (pageWidth - margin * 3) / 2;
    const contentHeight = pageHeight - margin * 2 - 25; // Leave room for header/footer

    // Header
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text(book.display_title || book.title, margin, margin + 5);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Page ${pageDetails.page_number}`, pageWidth - margin - 20, margin + 5);

    // Divider line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, margin + 10, pageWidth - margin, margin + 10);

    // Column headers
    const headerY = margin + 18;
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Original (${pageDetails.ocr.language})`, margin, headerY);
    pdf.text(`Translation (${pageDetails.translation.language || "English"})`, margin + columnWidth + margin, headerY);

    // Content
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    const contentY = headerY + 8;
    const lineHeight = 4.5;
    const maxLines = Math.floor(contentHeight / lineHeight);

    // Helper to wrap text and render
    const renderColumn = (text: string, x: number, y: number, width: number) => {
      if (!text) {
        pdf.setTextColor(150, 150, 150);
        pdf.text("No content available", x, y);
        pdf.setTextColor(0, 0, 0);
        return;
      }

      const lines = pdf.splitTextToSize(text, width);
      const displayLines = lines.slice(0, maxLines);

      displayLines.forEach((line: string, i: number) => {
        pdf.text(line, x, y + i * lineHeight);
      });

      if (lines.length > maxLines) {
        pdf.setTextColor(150, 150, 150);
        pdf.text(`... (${lines.length - maxLines} more lines)`, x, y + maxLines * lineHeight);
        pdf.setTextColor(0, 0, 0);
      }
    };

    // Render OCR column
    renderColumn(pageDetails.ocr.data || "", margin, contentY, columnWidth);

    // Render Translation column
    renderColumn(pageDetails.translation.data || "", margin + columnWidth + margin, contentY, columnWidth);

    // Center divider
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin + columnWidth + margin / 2, headerY - 5, margin + columnWidth + margin / 2, pageHeight - margin - 10);

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    const footerY = pageHeight - margin;
    pdf.text("Source Library - Preserving rare esoteric texts", margin, footerY);
    pdf.text(`sourcelibrary.vercel.app/book/${book.id}`, pageWidth / 2, footerY, { align: "center" });
    pdf.text(new Date().toISOString().split("T")[0], pageWidth - margin, footerY, { align: "right" });

    pdf.save(filename);
    showSuccess("Bilingual PDF downloaded");
  };

  // Extract right half of current page and add as next page
  const handleSplitPage = async () => {
    if (!pageDetails || !book_id || isDemo) return;

    setSplitting(true);

    try {
      // Fetch image through proxy to avoid CORS issues
      const proxyUrl = apiService.getImageProxyUrl(pageDetails.photo);
      console.log("Fetching image from proxy:", proxyUrl);
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`Failed to fetch image through proxy: ${response.status}`);
      const blob = await response.blob();
      console.log("Fetched blob:", blob.size, "bytes, type:", blob.type);
      const imageUrl = URL.createObjectURL(blob);

      // Load the image from blob URL
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = imageUrl;
      });

      console.log("Image loaded:", img.width, "x", img.height);

      // Clean up blob URL after image loads
      URL.revokeObjectURL(imageUrl);

      // Create canvas for right half only
      const rightCanvas = document.createElement("canvas");
      rightCanvas.width = Math.floor(img.width / 2);
      rightCanvas.height = img.height;
      const rightCtx = rightCanvas.getContext("2d");
      if (!rightCtx) throw new Error("Failed to create canvas context");
      rightCtx.drawImage(img, Math.floor(img.width / 2), 0, rightCanvas.width, img.height, 0, 0, rightCanvas.width, img.height);

      // Convert canvas to blob
      const rightBlob = await new Promise<Blob>((resolve, reject) => {
        rightCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create right image blob"));
        }, "image/jpeg", 0.9);
      });

      console.log("Right half blob:", rightBlob.size, "bytes, type:", rightBlob.type);

      // Create new page for right half - include all required fields
      const rightFile = new File([rightBlob], "right_page.jpg", { type: "image/jpeg" });
      const rightFormData = new FormData();
      rightFormData.append("book_id", book_id);
      rightFormData.append("page_number", String(pageDetails.page_number + 1));
      rightFormData.append("photo", rightFile);
      // Include all required OCR/translation fields (matching BookDetails.tsx pattern)
      rightFormData.append("ocr_language", pageDetails.ocr.language || book?.language || "");
      rightFormData.append("ocr_model", "gemini");
      rightFormData.append("ocr_data", "");
      rightFormData.append("translation_language", pageDetails.translation.language || "English");
      rightFormData.append("translation_model", "gemini");
      rightFormData.append("translation_data", "");

      // Log what we're sending
      console.log("Creating page with:", {
        book_id,
        page_number: pageDetails.page_number + 1,
        file_size: rightFile.size,
        file_type: rightFile.type,
        ocr_language: pageDetails.ocr.language || book?.language || "",
        translation_language: pageDetails.translation.language || "English"
      });

      const newPage = await apiService.createPage(rightFormData);
      console.log("New page created:", newPage);

      // Update allPages list
      const newAllPages = [...allPages];
      const insertIndex = currentPageIndex + 1;
      newAllPages.splice(insertIndex, 0, newPage as PageDetails);
      setAllPages(newAllPages);

      showSuccess("Right half extracted and added as next page. Original page unchanged.");
    } catch (error) {
      console.error("Error splitting page:", error);
      showModalError("Split Failed", `Failed to split page: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSplitting(false);
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
  const handleSelectOcrPrompt = (id: string) => {
    setSelectedOcrPromptId(id);
    const prompt = ocrPrompts.find((p) => p.id === id);
    if (prompt) {
      setCurrentOcrPromptText(prompt.prompt);
    }
  };

  const handleSelectTranslationPrompt = (id: string) => {
    setSelectedTranslationPromptId(id);
    const prompt = translationPrompts.find((p) => p.id === id);
    if (prompt) {
      setCurrentTranslationPromptText(prompt.prompt);
    }
  };

  const addOcrPrompt = () => {
    if (!newPromptName.trim()) return;
    const defaultPrompt = "OCR the page in {language}. Return the transcribed text.";
    const newPrompt: PromptItem = {
      id: Date.now().toString(),
      name: newPromptName,
      prompt: defaultPrompt,
    };
    setOcrPrompts([...ocrPrompts, newPrompt]);
    setSelectedOcrPromptId(newPrompt.id);
    setCurrentOcrPromptText(defaultPrompt);
    setNewPromptName("");
  };

  const addTranslationPrompt = () => {
    if (!newPromptName.trim()) return;
    const defaultPrompt = "Translate from {source_lang} to {target_lang}.";
    const newPrompt: PromptItem = {
      id: Date.now().toString(),
      name: newPromptName,
      prompt: defaultPrompt,
    };
    setTranslationPrompts([...translationPrompts, newPrompt]);
    setSelectedTranslationPromptId(newPrompt.id);
    setCurrentTranslationPromptText(defaultPrompt);
    setNewPromptName("");
  };

  const updateOcrPrompt = (id: string, newPromptText: string) => {
    setOcrPrompts(ocrPrompts.map((p) =>
      p.id === id ? { ...p, prompt: newPromptText } : p
    ));
  };

  const updateTranslationPrompt = (id: string, newPromptText: string) => {
    setTranslationPrompts(translationPrompts.map((p) =>
      p.id === id ? { ...p, prompt: newPromptText } : p
    ));
  };

  const deleteOcrPrompt = (id: string) => {
    if (ocrPrompts.length <= 1) return;
    const remaining = ocrPrompts.filter((p) => p.id !== id);
    setOcrPrompts(remaining);
    if (selectedOcrPromptId === id) {
      setSelectedOcrPromptId(remaining[0].id);
      setCurrentOcrPromptText(remaining[0].prompt);
    }
  };

  const deleteTranslationPrompt = (id: string) => {
    if (translationPrompts.length <= 1) return;
    const remaining = translationPrompts.filter((p) => p.id !== id);
    setTranslationPrompts(remaining);
    if (selectedTranslationPromptId === id) {
      setSelectedTranslationPromptId(remaining[0].id);
      setCurrentTranslationPromptText(remaining[0].prompt);
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

  // Text display component with markdown (strips image links, processes footnotes)
  const TextDisplay = ({
    content,
    placeholder
  }: {
    content: string;
    placeholder: string;
  }) => {
    // Strip image links and process footnotes
    const cleanContent = stripImageLinks(content);
    const { processedText, footnotes } = processNotesAsFootnotes(cleanContent);

    return (
      <div className="h-full max-h-[calc(100vh-300px)] overflow-y-auto">
        {cleanContent ? (
          <div className="prose prose-sm max-w-none font-serif leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkBreaks, remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                // Skip rendering any images that might slip through
                img: () => null,
                p: ({ children }) => (
                  <p className="mb-4 text-gray-800">{children}</p>
                ),
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mb-3 text-gray-900">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-bold mb-2 text-gray-900">{children}</h2>
                ),
                table: ({ children }) => (
                  <table className="min-w-full border-collapse border border-gray-300 my-4">{children}</table>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-semibold text-left">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-300 px-3 py-2">{children}</td>
                ),
                sup: ({ children, className }) => (
                  <sup className={`text-purple-600 font-semibold cursor-help ${className || ""}`}>{children}</sup>
                ),
              }}
            >
              {processedText}
            </ReactMarkdown>
            {/* Footnotes section */}
            {footnotes.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">Notes</h4>
                <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                  {footnotes.map((note, index) => (
                    <li key={index} className="leading-relaxed">
                      <span className="text-purple-600 font-semibold">[{index + 1}]</span> {note}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <BookOpenIcon className="h-12 w-12 mb-2 opacity-50" />
            <p className="text-sm italic">{placeholder}</p>
          </div>
        )}
      </div>
    );
  };

  // Settings Modal Component - render function (not a component to avoid re-mounting)
  const renderSettingsModal = (
    isOpen: boolean,
    onClose: () => void,
    title: string,
    prompts: PromptItem[],
    selectedPromptId: string,
    onSelectPrompt: (id: string) => void,
    onAddPrompt: () => void,
    onDeletePrompt: (id: string) => void,
    onUpdatePrompt: (id: string, prompt: string) => void,
    model: string,
    onModelChange: (model: string) => void,
    models: { value: string; label: string }[],
    type: "ocr" | "translation",
    currentPromptText: string,
    onPromptTextChange: (text: string) => void,
  ) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Model Selection */}
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

            {/* Prompt Selection Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt Template
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedPromptId}
                  onChange={(e) => onSelectPrompt(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  {prompts.map((prompt) => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.name}
                    </option>
                  ))}
                </select>
                {prompts.length > 1 && (
                  <button
                    onClick={() => onDeletePrompt(selectedPromptId)}
                    className="px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete this prompt"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Prompt Text Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prompt Text
                <span className="text-xs text-gray-500 ml-2">
                  (use {type === "ocr" ? "{language}" : "{source_lang}, {target_lang}"} as placeholders)
                </span>
              </label>
              <textarea
                value={currentPromptText}
                onChange={(e) => onPromptTextChange(e.target.value)}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                autoComplete="off"
                spellCheck={false}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => onUpdatePrompt(selectedPromptId, currentPromptText)}
                  className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>

            {/* Add New Prompt */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Create New Prompt
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New prompt name..."
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <button
                  onClick={onAddPrompt}
                  disabled={!newPromptName.trim()}
                  className="flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>
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
              <Link
                to={`/book/${book_id}`}
                className="hover:text-purple-700 transition-colors"
              >
                <h1 className="text-lg font-semibold text-gray-900 hover:text-purple-700 font-serif line-clamp-1">
                  {book?.display_title || book?.title || "Loading..."}
                </h1>
              </Link>
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

            {/* Batch Processing Button */}
            {viewMode === "edit" && (
              <button
                onClick={() => navigate(`/batch/${book_id}`)}
                disabled={allPages.length === 0 || isDemo}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                title={isDemo ? "Batch processing not available in demo mode" : "Process multiple pages"}
              >
                <QueueListIcon className="h-5 w-5" />
                Batch Process
              </button>
            )}
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
              <div className="flex items-center gap-2">
                {viewMode === "edit" && !isDemo && (
                  <button
                    onClick={handleSplitPage}
                    disabled={splitting || !pageDetails}
                    className="flex items-center gap-1 px-2 py-1 bg-amber-100 hover:bg-amber-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-amber-700 disabled:text-gray-400 text-xs font-medium rounded transition-colors"
                    title="Split page into left and right halves"
                  >
                    {splitting ? (
                      <LoadingDots color="#b45309" />
                    ) : (
                      <>
                        <ScissorsIcon className="h-3.5 w-3.5" />
                        Split
                      </>
                    )}
                  </button>
                )}
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                  {pageDetails?.ocr.language || book?.language || "—"}
                </span>
              </div>
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
                  <button
                    onClick={downloadOcrMarkdown}
                    disabled={!pageDetails?.ocr?.data}
                    className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Download as markdown"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* OCR Content */}
              <div className="flex-1 p-4 min-h-0">
                <textarea
                  value={stripImageLinks(pageDetails?.ocr?.data || "")}
                  onChange={(e) => handleOcrTextChange(e.target.value)}
                  placeholder="OCR text will appear here after running OCR..."
                  className="w-full h-full max-h-[calc(100vh-350px)] p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 font-serif text-sm leading-relaxed overflow-y-auto"
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
                <button
                  onClick={downloadTranslationMarkdown}
                  disabled={!pageDetails?.translation?.data}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download translation as markdown"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={downloadBilingualMarkdown}
                  disabled={!pageDetails?.ocr?.data && !pageDetails?.translation?.data}
                  className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download bilingual markdown"
                >
                  .md
                </button>
                <button
                  onClick={downloadBilingualPDF}
                  disabled={!pageDetails?.ocr?.data && !pageDetails?.translation?.data}
                  className="px-2 py-1 text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download bilingual PDF"
                >
                  PDF
                </button>
              </div>
            </div>

            {/* Translation Content */}
            <div className="flex-1 p-4 min-h-0">
              {viewMode === "read" ? (
                <TextDisplay
                  content={pageDetails?.translation?.data || ""}
                  placeholder="Translation will appear here..."
                />
              ) : (
                <textarea
                  value={stripImageLinks(pageDetails?.translation?.data || "")}
                  onChange={(e) => handleTranslationTextChange(e.target.value)}
                  placeholder="Translation will appear here after translating..."
                  className="w-full h-full max-h-[calc(100vh-350px)] p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 font-serif text-sm leading-relaxed overflow-y-auto"
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modals */}
      {renderSettingsModal(
        ocrSettingsOpen,
        () => setOcrSettingsOpen(false),
        "OCR Settings",
        ocrPrompts,
        selectedOcrPromptId,
        handleSelectOcrPrompt,
        addOcrPrompt,
        deleteOcrPrompt,
        updateOcrPrompt,
        pageDetails?.ocr.model || "mistral",
        (model) => handlePageDetailsChange({ ocr: { ...pageDetails!.ocr, model } }),
        OCR_MODELS,
        "ocr",
        currentOcrPromptText,
        setCurrentOcrPromptText
      )}

      {renderSettingsModal(
        translationSettingsOpen,
        () => setTranslationSettingsOpen(false),
        "Translation Settings",
        translationPrompts,
        selectedTranslationPromptId,
        handleSelectTranslationPrompt,
        addTranslationPrompt,
        deleteTranslationPrompt,
        updateTranslationPrompt,
        pageDetails?.translation.model || "gemini",
        (model) => handlePageDetailsChange({ translation: { ...pageDetails!.translation, model } }),
        TRANSLATION_MODELS,
        "translation",
        currentTranslationPromptText,
        setCurrentTranslationPromptText
      )}

      {/* Batch Processing Modal */}
      {batchModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Batch Processing</h2>
              <button
                onClick={() => setBatchModalOpen(false)}
                disabled={batchProcessing}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Progress Indicator (when processing) */}
              {batchProcessing && (
                <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-purple-900">
                      Processing page {batchProgress.currentPage}
                    </span>
                    <span className="text-purple-700">
                      {batchProgress.current} / {batchProgress.total}
                    </span>
                  </div>
                  <div className="w-full bg-purple-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleBatchPause}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        batchPaused
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                      }`}
                    >
                      {batchPaused ? (
                        <>
                          <PlayCircleIcon className="h-4 w-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <PauseIcon className="h-4 w-4" />
                          Pause
                        </>
                      )}
                    </button>
                    <button
                      onClick={cancelBatchProcessing}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors"
                    >
                      <StopIcon className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Configuration (when not processing) */}
              {!batchProcessing && (
                <>
                  <p className="text-sm text-gray-600">
                    Process multiple pages sequentially. Each page uses the previous page's content for context and continuity.
                  </p>

                  {/* Page Range */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Page Range</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={allPages.length}
                        value={batchStartPage}
                        onChange={(e) => setBatchStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="number"
                        min={batchStartPage}
                        max={allPages.length}
                        value={batchEndPage}
                        onChange={(e) => setBatchEndPage(Math.max(batchStartPage, parseInt(e.target.value) || batchStartPage))}
                        className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      <span className="text-sm text-gray-500">of {allPages.length}</span>
                    </div>
                  </div>

                  {/* Operations */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Operations</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={batchIncludeOcr}
                          onChange={(e) => setBatchIncludeOcr(e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Run OCR on each page</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={batchIncludeTranslation}
                          onChange={(e) => setBatchIncludeTranslation(e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">Translate each page</span>
                      </label>
                    </div>
                  </div>

                  {/* Estimate */}
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <strong>{batchEndPage - batchStartPage + 1}</strong> pages will be processed.
                    {batchIncludeOcr && batchIncludeTranslation && " Each page: OCR → Translation."}
                    {batchIncludeOcr && !batchIncludeTranslation && " Each page: OCR only."}
                    {!batchIncludeOcr && batchIncludeTranslation && " Each page: Translation only (using existing OCR)."}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {!batchProcessing && (
              <div className="p-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => setBatchModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={runBatchProcessing}
                  disabled={!batchIncludeOcr && !batchIncludeTranslation}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
                >
                  Start Processing
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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

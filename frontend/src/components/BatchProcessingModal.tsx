import React, { useState, useEffect, useRef } from "react";
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { MAJOR_LANGUAGES, TRANSLATION_LANGUAGES } from "../utils/languages";
import { apiService } from "../services/api";
import { Page, BatchSettings } from "../types";
import Button from "./ui/Buttons/Button";
import AIModelSelect from "./AiModels/AIModelSelect";
import { OCR_MODELS, TRANSLATION_MODELS } from "./AiModels/aiModels";

interface BatchProcessingModalProps {
  visible: boolean;
  onCancel: () => void;
  onComplete: () => void;
  selectedPages: string[];
  allPages: Page[];
  bookId: string;
  initialOcrLanguage: string;
}

interface PageProcessingStatus {
  pageId: string;
  pageNumber: number;
  ocrStatus: "pending" | "processing" | "completed" | "error" | "not_queued";
  translationStatus:
  | "pending"
  | "processing"
  | "completed"
  | "error"
  | "not_queued";
  ocrError?: string;
  translationError?: string;
}

interface ProcessingResults {
  totalPages: number;
  completedPages: number;
  errorPages: number;
  errors: { pageNumber: number; stage: string; error: string }[];
}

// Configuration
const MAX_PARALLEL_PAGES = 3; // Global variable for parallel processing limit

// Utility functions
const getStatusIcon = (status: string) => {
  const icons: { [key: string]: React.ReactElement | null } = {
    pending: <ClockIcon className="h-4 w-4 text-gray-500" />,
    processing: (
      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
    ),
    completed: <CheckCircleIcon className="h-4 w-4 text-green-600" />,
    error: <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />,
  };
  return icons[status] || null;
};

const getStatusText = (status: string, requestType?: string) => {
  const texts: { [key: string]: string } = {
    pending: `Pending ${requestType === "ocr" ? "OCR" : "Translation"}`,
    processing: "Processing...",
    completed: `${requestType === "ocr" ? "OCR" : "Translation"} Completed`,
    error: `${requestType === "ocr" ? "OCR" : "Translation"} Error`,
    not_queued: "Not Queued",
  };
  return texts[status] || status;
};

const BatchProcessingModal: React.FC<BatchProcessingModalProps> = ({
  visible,
  onCancel,
  onComplete,
  selectedPages,
  allPages,
  initialOcrLanguage,
}) => {
  const [pageStatuses, setPageStatuses] = useState<PageProcessingStatus[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<
    "ocr" | "translation" | "complete" | null
  >(null);
  const [batchSettings, setBatchSettings] = useState<BatchSettings>({
    ocrLanguage: initialOcrLanguage,
    translationLanguage: "English",
    processOcr: true,
    processTranslation: true,
    ocrModel: "mistral",
    translationModel: "gemini",
  });
  const [results, setResults] = useState<{
    show: boolean;
    data: ProcessingResults | null;
  }>({
    show: false,
    data: null,
  });

  const resultsRef = useRef<ProcessingResults>({
    totalPages: 0,
    completedPages: 0,
    errorPages: 0,
    errors: [],
  });

  // Add AbortController refs for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null);
  const pageAbortControllersRef = useRef<Map<string, AbortController>>(
    new Map()
  );
  const pageStatusesRef = useRef<PageProcessingStatus[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    pageStatusesRef.current = pageStatuses;
  }, [pageStatuses]);

  // Initialize page statuses
  useEffect(() => {
    if (!visible || selectedPages.length === 0) return;

    const statuses: PageProcessingStatus[] = selectedPages.map((pageId) => {
      const page = allPages.find((p) => p.id === pageId);
      return {
        pageId,
        pageNumber: page?.page_number || 0,
        ocrStatus: batchSettings.processOcr ? "pending" : "not_queued",
        translationStatus: batchSettings.processTranslation
          ? "pending"
          : "not_queued",
      };
    });

    setPageStatuses(statuses);
  }, [
    visible,
    selectedPages,
    allPages,
    batchSettings.processOcr,
    batchSettings.processTranslation,
  ]);

  // Update OCR language
  useEffect(() => {
    setBatchSettings((prev) => ({ ...prev, ocrLanguage: initialOcrLanguage }));
  }, [initialOcrLanguage]);

  // Clean up abort controllers on unmount
  useEffect(() => {
    return () => {
      // Cancel main controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cancel all page controllers
      pageAbortControllersRef.current.forEach((controller) => {
        controller.abort();
      });
      pageAbortControllersRef.current.clear();
    };
  }, []);

  const updatePageStatus = (
    pageId: string,
    updates: Partial<PageProcessingStatus>
  ) => {
    setPageStatuses((prev) =>
      prev.map((status) =>
        status.pageId === pageId ? { ...status, ...updates } : status
      )
    );
  };

  const runOcrForPage = async (pageId: string) => {
    const page = allPages.find((p) => p.id === pageId);
    if (!page) throw new Error("Page not found");

    const pageAbortController = new AbortController();
    pageAbortControllersRef.current.set(pageId, pageAbortController);

    try {
      updatePageStatus(pageId, { ocrStatus: "processing" });

      await apiService.performOCR(
        {
          pageId: pageId,
          photoUrl: page.photo,
          language: batchSettings.ocrLanguage,
          aiModel: batchSettings.ocrModel,
          customPrompt: `OCR the page in ${batchSettings.ocrLanguage} only return ocr`,
          autoSave: true
        }, pageAbortController.signal
      );

      updatePageStatus(pageId, { ocrStatus: "completed" });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        updatePageStatus(pageId, {
          ocrStatus: "error",
          ocrError: "Request cancelled",
        });
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown OCR error";
      updatePageStatus(pageId, {
        ocrStatus: "error",
        ocrError: errorMessage,
      });

      resultsRef.current.errors.push({
        pageNumber: page.page_number,
        stage: "OCR",
        error: errorMessage,
      });
    } finally {
      pageAbortControllersRef.current.delete(pageId);
    }
  };

  const runTranslationForPage = async (
    pageId: string,
    previousTranslation: string | null
  ) => {
    const page = allPages.find((p) => p.id === pageId);
    if (!page) throw new Error("Page not found");

    const pageAbortController = new AbortController();
    pageAbortControllersRef.current.set(pageId, pageAbortController);

    try {
      updatePageStatus(pageId, { translationStatus: "processing" });

      const currentPage = await apiService.getPage(pageId);
      if (!currentPage.ocr?.data) {
        throw new Error("OCR data not found. OCR might have failed.");
      }

      const context = previousTranslation
        ? `The translation of the previous page was: "${previousTranslation}".\n\nUsing that as context internally, `
        : "";

      const text_to_translate = `${context}
Translate the following text:-
**Text to translate:**                          
${currentPage.ocr.data}`;

      const response = await apiService.performTranslation(
        {
          pageId: pageId,
          text: text_to_translate,
          sourceLang: batchSettings.ocrLanguage,
          targetLang: batchSettings.translationLanguage,
          aiModel: batchSettings.translationModel,
          autoSave: true
        }, pageAbortController.signal);

      updatePageStatus(pageId, { translationStatus: "completed" });
      return response.translation;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        updatePageStatus(pageId, {
          translationStatus: "error",
          translationError: "Request cancelled",
        });
        return null;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown translation error";
      updatePageStatus(pageId, {
        translationStatus: "error",
        translationError: errorMessage,
      });
      console.log("Translation Error:", errorMessage);

      resultsRef.current.errors.push({
        pageNumber: page.page_number,
        stage: "Translation",
        error: errorMessage,
      });
      return null;
    } finally {
      pageAbortControllersRef.current.delete(pageId);
    }
  };

  const startBatchProcessing = async () => {
    setProcessing(true);
    abortControllerRef.current = new AbortController();

    resultsRef.current = {
      totalPages: selectedPages.length,
      completedPages: 0,
      errorPages: 0,
      errors: [],
    };

    const sortedPageIds = [...selectedPages].sort((a, b) => {
      const pageA = allPages.find((p) => p.id === a);
      const pageB = allPages.find((p) => p.id === b);
      return (pageA?.page_number || 0) - (pageB?.page_number || 0);
    });

    try {
      // Stage 1: OCR Processing
      if (
        batchSettings.processOcr &&
        !abortControllerRef.current.signal.aborted
      ) {
        setProcessingStage("ocr");

        let currentIndex = 0;
        const activePromises = new Map<string, Promise<void>>();

        const startNextOcr = async (): Promise<void> => {
          if (
            currentIndex >= sortedPageIds.length ||
            abortControllerRef.current?.signal.aborted
          ) {
            return;
          }

          const pageId = sortedPageIds[currentIndex];
          currentIndex++;

          const promise = runOcrForPage(pageId).finally(() => {
            activePromises.delete(pageId);
            if (
              currentIndex < sortedPageIds.length &&
              !abortControllerRef.current?.signal.aborted
            ) {
              startNextOcr();
            }
          });

          activePromises.set(pageId, promise);
        };

        const initialPromises: Promise<void>[] = [];
        for (
          let i = 0;
          i < Math.min(MAX_PARALLEL_PAGES, sortedPageIds.length);
          i++
        ) {
          initialPromises.push(startNextOcr());
        }

        await Promise.all(initialPromises);

        while (
          activePromises.size > 0 &&
          !abortControllerRef.current?.signal.aborted
        ) {
          await Promise.race(Array.from(activePromises.values()));
        }
      }

      if (abortControllerRef.current.signal.aborted) {
        throw new Error("AbortError");
      }

      // Stage 2: Translation Processing
      if (
        batchSettings.processTranslation &&
        !abortControllerRef.current.signal.aborted
      ) {
        setProcessingStage("translation");
        let previousTranslation: string | null = null;

        for (const pageId of sortedPageIds) {
          if (abortControllerRef.current.signal.aborted) break;

          const status = pageStatusesRef.current.find(
            (p) => p.pageId === pageId
          );

          // If OCR was part of this batch, it must be complete.
          // If not, we proceed and let runTranslationForPage check for existing OCR data.
          if (batchSettings.processOcr && status?.ocrStatus !== "completed") {
            if (status?.translationStatus === "pending") {
              updatePageStatus(pageId, {
                translationStatus: "error",
                translationError: "Skipped due to OCR failure.",
              });
            }
            continue; // Skip translation if OCR failed or was skipped
          }

          previousTranslation = await runTranslationForPage(
            pageId,
            previousTranslation
          );
        }
      }

      if (abortControllerRef.current.signal.aborted) {
        throw new Error("AbortError");
      }

      // Finalize results
      const finalStatuses = pageStatusesRef.current;

      const successfulPages = finalStatuses.filter((s) => {
        const ocrOk = !batchSettings.processOcr || s.ocrStatus === "completed";
        const transOk =
          !batchSettings.processTranslation ||
          s.translationStatus === "completed";
        return ocrOk && transOk;
      }).length;

      resultsRef.current.completedPages = successfulPages;
      resultsRef.current.errorPages = selectedPages.length - successfulPages;

      setResults({ show: true, data: { ...resultsRef.current } });
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError")) {
        setResults({
          show: true,
          data: {
            ...resultsRef.current,
            errorPages: resultsRef.current.errorPages + 1,
            errors: [
              ...resultsRef.current.errors,
              {
                pageNumber: 0,
                stage: "System",
                error: "Batch processing failed. Please try again.",
              },
            ],
          },
        });
      }
    } finally {
      setProcessing(false);
      setProcessingStage("complete");
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (processing) {
      // If processing is active, abort and treat as cancel (do NOT call onComplete)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      pageAbortControllersRef.current.forEach((controller) => {
        controller.abort();
      });
      pageAbortControllersRef.current.clear();

      // Reset local state and notify parent via onCancel only
      setPageStatuses([]);
      setProcessingStage(null);
      onCancel();
      return;
    }

    // If not processing, closing the modal is equivalent to completion for the parent:
    // notify both onCancel (to hide) and onComplete (to let parent refresh/handle results).
    setPageStatuses([]);
    setProcessingStage(null);
    onCancel();
    try {
      onComplete();
    } catch (err) {
      // swallow errors from parent callback to avoid breaking UI
      // parent should handle its own errors
      console.error("onComplete handler threw:", err);
    }
  };

  const handleCancelProcessing = () => {
    // Cancel all ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    pageAbortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    pageAbortControllersRef.current.clear();

    // Reset processing state but keep the modal open
    setProcessing(false);
    setProcessingStage(null);

    // Reset page statuses to pending
    setPageStatuses((prev) =>
      prev.map((status) => ({
        ...status,
        ocrStatus: batchSettings.processOcr ? "pending" : "not_queued",
        translationStatus: batchSettings.processTranslation
          ? "pending"
          : "not_queued",
        ocrError: undefined,
        translationError: undefined,
      }))
    );

    // Clear results
    setResults({ show: false, data: null });
    resultsRef.current = {
      totalPages: 0,
      completedPages: 0,
      errorPages: 0,
      errors: [],
    };
  };

  const handleResultsClose = () => {
    setResults({ show: false, data: null });
    setProcessingStage(null);
    onComplete();
  };

  // Computed values
  const getOverallStatus = () => {
    if (!pageStatuses.length) return "not_started";

    const hasProcessing = pageStatuses.some(
      (p) =>
        p.ocrStatus === "processing" || p.translationStatus === "processing"
    );
    const hasErrors = pageStatuses.some(
      (p) => p.ocrStatus === "error" || p.translationStatus === "error"
    );
    const allCompleted = pageStatuses.every(
      (p) =>
        (p.ocrStatus === "completed" || p.ocrStatus === "not_queued") &&
        (p.translationStatus === "completed" ||
          p.translationStatus === "not_queued")
    );

    if (hasProcessing) return "processing";
    if (allCompleted && !hasErrors) return "success";
    if (hasErrors) return "error";
    return "pending";
  };

  const overallStatus = getOverallStatus();
  const completedPages = pageStatuses.filter((p) => {
    const ocrCompleted =
      p.ocrStatus === "completed" || p.ocrStatus === "not_queued";
    const translationCompleted =
      p.translationStatus === "completed" ||
      p.translationStatus === "not_queued";
    const hasNoErrors =
      p.ocrStatus !== "error" && p.translationStatus !== "error";

    return ocrCompleted && translationCompleted && hasNoErrors;
  }).length;

  const progressPercentage = (() => {
    if (pageStatuses.length === 0) return 0;

    let totalSteps = 0;
    let completedSteps = 0;

    if (batchSettings.processOcr) totalSteps += pageStatuses.length;
    if (batchSettings.processTranslation) totalSteps += pageStatuses.length;

    if (totalSteps === 0) return 0;

    pageStatuses.forEach((status) => {
      if (batchSettings.processOcr) {
        if (status.ocrStatus === "completed") completedSteps++;
      }
      if (batchSettings.processTranslation) {
        if (status.translationStatus === "completed") completedSteps++;
      }
    });

    return Math.round((completedSteps / totalSteps) * 100);
  })();

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onWheel={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${overallStatus === "success"
                      ? "bg-green-500"
                      : overallStatus === "error"
                        ? "bg-red-500"
                        : overallStatus === "processing"
                          ? "bg-blue-500 animate-pulse"
                          : "bg-gray-300"
                      }`}
                  ></div>
                  <h2 className="text-lg font-sans font-bold text-gray-900">
                    Batch Processing
                  </h2>
                </div>
                {processing && processingStage && (
                  <span className="text-xs font-medium text-gray-700 bg-gray-200 px-2 py-1 rounded-full">
                    Stage:{` ${processingStage.toUpperCase()}`}
                  </span>
                )}
                <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  <CogIcon className="h-3 w-3" />
                  <span>Max {MAX_PARALLEL_PAGES} pages parallel (OCR)</span>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {/* Settings */}
            {!processing && (
              <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-sm font-sans font-semibold text-gray-900 mb-2">
                  Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* OCR Settings */}
                  <div className="space-y-2 p-2 border border-gray-200 rounded">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={batchSettings.processOcr}
                        onChange={(e) =>
                          setBatchSettings((prev) => ({
                            ...prev,
                            processOcr: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <span className="font-sans font-medium text-gray-900 text-sm">
                        Process OCR
                      </span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 font-sans mb-1">
                          OCR Language
                        </label>
                        <input
                          list="batch-ocr-languages"
                          value={batchSettings.ocrLanguage}
                          disabled={!batchSettings.processOcr}
                          onChange={(e) =>
                            setBatchSettings((prev) => ({
                              ...prev,
                              ocrLanguage: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded bg-white px-2 py-1 text-xs sm:text-sm font-serif focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation disabled:bg-gray-100 disabled:text-gray-500"
                        />
                        <datalist id="batch-ocr-languages">
                          {MAJOR_LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value} />
                          ))}
                        </datalist>
                      </div>
                      <AIModelSelect
                        value={batchSettings.ocrModel}
                        onChange={(value) =>
                          setBatchSettings((prev) => ({
                            ...prev,
                            ocrModel: value,
                          }))
                        }
                        models={OCR_MODELS}
                        disabled={!batchSettings.processOcr}
                        label="AI Model"
                        inputClassName="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 font-serif bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Translation Settings */}
                  <div className="space-y-2 p-2 border border-gray-200 rounded">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={batchSettings.processTranslation}
                        onChange={(e) =>
                          setBatchSettings((prev) => ({
                            ...prev,
                            processTranslation: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                      />
                      <span className="font-sans font-medium text-gray-900 text-sm">
                        Process Translation
                      </span>
                      {batchSettings.processTranslation &&
                        !batchSettings.processOcr && (
                          <span className="text-xs text-yellow-700 bg-yellow-50 p-1 rounded font-sans">
                            (NOTE: Uses existing OCR data.)
                          </span>
                        )}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 font-sans mb-1">
                          Translation Language
                        </label>
                        <input
                          list="batch-translation-languages"
                          value={batchSettings.translationLanguage}
                          disabled={!batchSettings.processTranslation}
                          onChange={(e) =>
                            setBatchSettings((prev) => ({
                              ...prev,
                              translationLanguage: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded bg-white px-2 py-1 text-xs sm:text-sm font-serif focus:outline-none focus:ring-2 focus:ring-gray-500 touch-manipulation disabled:bg-gray-100 disabled:text-gray-500"
                        />
                        <datalist id="batch-translation-languages">
                          {TRANSLATION_LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value} />
                          ))}
                        </datalist>
                      </div>
                      <AIModelSelect
                        value={batchSettings.translationModel}
                        onChange={(value) =>
                          setBatchSettings((prev) => ({
                            ...prev,
                            translationModel: value,
                          }))
                        }
                        models={TRANSLATION_MODELS}
                        disabled={!batchSettings.processTranslation}
                        label="AI Model"
                        inputClassName="w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500 font-serif bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Progress */}
            {pageStatuses.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-sans font-semibold text-gray-900">
                    Progress ({completedPages}/{pageStatuses.length})
                  </h3>
                  {processing && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-blue-600 font-serif font-medium">
                        Active processing...
                      </span>
                    </div>
                  )}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${overallStatus === "success"
                      ? "bg-green-500"
                      : overallStatus === "error"
                        ? "bg-red-500"
                        : overallStatus === "processing"
                          ? "bg-blue-500"
                          : "bg-gray-400"
                      }`}
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="text-center mt-1">
                  <span className="text-xs font-medium text-gray-700">
                    {progressPercentage}%
                  </span>
                </div>
              </div>
            )}

            {/* Page Status */}
            <div className="flex-1 min-h-0 px-4 py-2 flex flex-col">
              <h3 className="text-sm font-sans font-semibold text-gray-900 mb-2 flex-shrink-0">
                Page Status
              </h3>
              <div className="border border-gray-200 rounded flex-1 flex flex-col overflow-hidden">
                <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex-shrink-0">
                  <div className="grid grid-cols-3 gap-4 text-xs font-medium text-gray-700 font-sans">
                    <div>Page</div>
                    <div>OCR Status</div>
                    <div>Translation Status</div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                  {pageStatuses.map((status) => {
                    return (
                      <div
                        key={status.pageId}
                        className="border-b border-gray-100 last:border-b-0"
                      >
                        <div className="px-3 py-2 grid grid-cols-3 gap-4 items-center hover:bg-gray-50">
                          <div className="text-sm font-serif font-medium text-gray-900">
                            Page {status.pageNumber}
                          </div>

                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status.ocrStatus)}
                            <span className="text-xs text-gray-700 font-serif">
                              {getStatusText(status.ocrStatus, "ocr")}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status.translationStatus)}
                            <span className="text-xs text-gray-700 font-serif">
                              {getStatusText(
                                status.translationStatus,
                                "translation"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-2 bg-gray-50 flex-shrink-0">
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-600 font-serif">
                {processing ? (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="animate-pulse w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>
                      Processing {pageStatuses.length} pages •{" "}
                      {batchSettings.processOcr
                        ? `OCR (${batchSettings.ocrLanguage}, ${batchSettings.ocrModel})`
                        : ""}
                      {batchSettings.processOcr &&
                        batchSettings.processTranslation
                        ? " → "
                        : ""}
                      {batchSettings.processTranslation
                        ? `Translation (${batchSettings.translationLanguage}, ${batchSettings.translationModel})`
                        : ""}
                    </span>
                  </div>
                ) : pageStatuses.length > 0 ? (
                  `${pageStatuses.length} pages queued for processing.`
                ) : (
                  "Configure settings and start processing"
                )}
              </div>
              <div className="flex space-x-3">
                {processing && (
                  <Button
                    onClick={handleCancelProcessing}
                    variant="secondary"
                    size="sm"
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                  >
                    Cancel Processing
                  </Button>
                )}
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  size="sm"
                  disabled={processing}
                >
                  Close
                </Button>
                <Button
                  onClick={startBatchProcessing}
                  disabled={
                    processing ||
                    (!batchSettings.processOcr &&
                      !batchSettings.processTranslation)
                  }
                  size="sm"
                >
                  Start Processing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Modal */}
      {results.show && results.data && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {results.data.completedPages === results.data.totalPages &&
                    results.data.errorPages === 0 ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : results.data.errorPages > 0 ? (
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  ) : (
                    <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                  )}
                  <h2 className="text-xl font-serif font-bold text-gray-900">
                    Processing Complete
                  </h2>
                </div>
                <button
                  onClick={handleResultsClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-transparent focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 px-6 py-4">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {results.data.totalPages}
                  </div>
                  <div className="text-sm text-gray-600 font-serif">
                    Total Pages
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {results.data.completedPages}
                  </div>
                  <div className="text-sm text-gray-600 font-serif">
                    Successful
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {results.data.errorPages}
                  </div>
                  <div className="text-sm text-gray-600 font-serif">Failed</div>
                </div>
              </div>

              {results.data.errors.length > 0 && (
                <div>
                  <h3 className="text-lg font-serif font-semibold text-gray-900 mb-3">
                    Error Details
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {results.data.errors.map((error, index) => (
                      <div
                        key={index}
                        className="p-3 bg-red-50 border border-red-200 rounded"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-red-800 text-sm font-serif">
                            {error.pageNumber > 0
                              ? `Page ${error.pageNumber}`
                              : "System"}{" "}
                            - {error.stage}
                          </span>
                        </div>
                        <p className="text-sm text-red-600 font-serif">
                          {error.error}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex justify-end">
                <Button onClick={handleResultsClose}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BatchProcessingModal;

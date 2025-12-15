import React, { useState, useEffect } from "react";
import { DocumentIcon, XMarkIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Page } from "../types";
import { apiService } from "../services/api";

interface PdfSplitProcessorProps {
  bookId: string;
  bookLanguage?: string;
  existingPages?: Page[];
  initialPdfFile?: File;
  onSuccess?: (createdPages: number) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

type ProcessingStatus = "selecting" | "processing" | "preview_complete" | "processing_remaining" | "completed" | "error";

interface ProcessingState {
  status: ProcessingStatus;
  totalPdfPages: number;
  processedPdfPages: number;
  createdPages: number;
  remainingPdfPages: number;
  errors: string[];
  pageIds: string[];
}

const PdfSplitProcessor: React.FC<PdfSplitProcessorProps> = ({
  bookId,
  bookLanguage = "",
  existingPages = [],
  initialPdfFile,
  onSuccess,
  onError,
  onClose,
}) => {
  const [pdfFile, setPdfFile] = useState<File | null>(initialPdfFile || null);
  const [enableSpreadDetection, setEnableSpreadDetection] = useState(true);
  const [splitConfidence, setSplitConfidence] = useState(0.7);
  const [previewCount, setPreviewCount] = useState(10);
  const [translationLanguage, setTranslationLanguage] = useState("English");
  const [showSettings, setShowSettings] = useState(false);
  const [nextPageNumber, setNextPageNumber] = useState(1);

  const [state, setState] = useState<ProcessingState>({
    status: "selecting",
    totalPdfPages: 0,
    processedPdfPages: 0,
    createdPages: 0,
    remainingPdfPages: 0,
    errors: [],
    pageIds: [],
  });

  useEffect(() => {
    const maxPageNumber =
      existingPages.length > 0
        ? Math.max(...existingPages.map((page) => page.page_number))
        : 0;
    setNextPageNumber(maxPageNumber + 1);
  }, [existingPages]);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      alert("PDF file size must be less than 100MB");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a PDF file");
      return;
    }

    setPdfFile(file);
  };

  const processPreview = async () => {
    if (!pdfFile) return;

    setState({
      status: "processing",
      totalPdfPages: 0,
      processedPdfPages: 0,
      createdPages: 0,
      remainingPdfPages: 0,
      errors: [],
      pageIds: [],
    });

    try {
      const result = await apiService.processPdfWithSplitting({
        bookId,
        pdfFile,
        enableSpreadDetection,
        splitConfidenceThreshold: splitConfidence,
        previewCount,
        processAll: false,
        ocrLanguage: bookLanguage,
        translationLanguage,
      });

      setState({
        status: result.remaining_pdf_pages > 0 ? "preview_complete" : "completed",
        totalPdfPages: result.total_pdf_pages,
        processedPdfPages: result.processed_pdf_pages,
        createdPages: result.created_pages,
        remainingPdfPages: result.remaining_pdf_pages,
        errors: result.errors,
        pageIds: result.page_ids,
      });

      if (result.remaining_pdf_pages === 0) {
        setTimeout(() => {
          onSuccess?.(result.created_pages);
        }, 1500);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }));
      setTimeout(() => {
        onError?.(error instanceof Error ? error.message : "Failed to process PDF");
      }, 2000);
    }
  };

  const processRemaining = async () => {
    if (!pdfFile) return;

    setState((prev) => ({
      ...prev,
      status: "processing_remaining",
    }));

    try {
      const startPdfPage = state.processedPdfPages;
      const startPageNumber = nextPageNumber + state.createdPages;

      const result = await apiService.processRemainingPdf({
        bookId,
        pdfFile,
        startPdfPage,
        startPageNumber,
        enableSpreadDetection,
        splitConfidenceThreshold: splitConfidence,
        ocrLanguage: bookLanguage,
        translationLanguage,
      });

      const totalCreated = state.createdPages + result.created_pages;
      const allErrors = [...state.errors, ...result.errors];

      setState({
        status: "completed",
        totalPdfPages: state.totalPdfPages,
        processedPdfPages: state.totalPdfPages,
        createdPages: totalCreated,
        remainingPdfPages: 0,
        errors: allErrors,
        pageIds: [...state.pageIds, ...result.page_ids],
      });

      setTimeout(() => {
        if (allErrors.length > 0) {
          onError?.(`Completed with ${allErrors.length} errors. ${totalCreated} pages created.`);
        } else {
          onSuccess?.(totalCreated);
        }
      }, 1500);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        status: "error",
        errors: [...prev.errors, error instanceof Error ? error.message : "Unknown error"],
      }));
    }
  };

  const handleClose = () => {
    if (state.status !== "processing" && state.status !== "processing_remaining") {
      onClose?.();
    }
  };

  const isProcessing = state.status === "processing" || state.status === "processing_remaining";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-serif font-bold text-gray-900">
            {state.status === "selecting"
              ? "Upload PDF with Spread Detection"
              : state.status === "preview_complete"
              ? "Preview Complete"
              : "Processing PDF"}
          </h3>
          {!isProcessing && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          )}
        </div>

        {state.status === "selecting" && (
          <>
            <p className="text-gray-600 mb-4 font-serif">
              Upload a PDF and we'll automatically detect two-page spreads and split them.
              The first {previewCount} pages will be processed with OCR and translation.
            </p>

            <div className="mb-4">
              <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-amber-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handlePdfChange}
                />
                <div className="p-6 text-center">
                  {pdfFile ? (
                    <div className="space-y-3">
                      <DocumentIcon className="mx-auto h-8 w-8 text-amber-600" />
                      <div className="space-y-2">
                        <p className="text-base font-medium text-gray-900 font-serif break-words">
                          {pdfFile.name}
                        </p>
                        <p className="text-sm text-amber-700 font-serif">
                          Click to change PDF
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <span className="text-amber-700 hover:text-amber-800 font-medium font-serif">
                          Select PDF file
                        </span>
                        <p className="text-sm text-gray-500 mt-1 font-serif">
                          PDF up to 100MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 font-serif"
            >
              <Cog6ToothIcon className="h-4 w-4 mr-1" />
              {showSettings ? "Hide Settings" : "Show Settings"}
            </button>

            {showSettings && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 font-serif">
                    Detect Two-Page Spreads
                  </label>
                  <input
                    type="checkbox"
                    checked={enableSpreadDetection}
                    onChange={(e) => setEnableSpreadDetection(e.target.checked)}
                    className="h-4 w-4 text-amber-600 rounded"
                  />
                </div>

                {enableSpreadDetection && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 font-serif mb-1">
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
                    <p className="text-xs text-gray-500 font-serif">
                      Higher = more confident detection required to split
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-serif mb-1">
                    Preview Pages (with auto OCR/translate)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={previewCount}
                    onChange={(e) => setPreviewCount(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-serif"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-serif mb-1">
                    Translation Language
                  </label>
                  <input
                    type="text"
                    value={translationLanguage}
                    onChange={(e) => setTranslationLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-serif"
                    placeholder="English"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 font-serif transition-colors text-base"
              >
                Cancel
              </button>
              <button
                onClick={processPreview}
                disabled={!pdfFile}
                className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-serif transition-colors disabled:opacity-50 text-base"
              >
                Process Preview
              </button>
            </div>
          </>
        )}

        {(state.status === "processing" || state.status === "processing_remaining") && (
          <>
            <p className="text-gray-600 mb-6 font-serif">
              {state.status === "processing"
                ? "Processing PDF and detecting page spreads. This may take a few minutes..."
                : "Processing remaining pages..."}
            </p>
            <div className="mb-6">
              <div className="animate-pulse flex space-x-2 justify-center mb-4">
                <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                <div className="w-3 h-3 bg-amber-600 rounded-full animation-delay-200"></div>
                <div className="w-3 h-3 bg-amber-600 rounded-full animation-delay-400"></div>
              </div>
              <p className="text-sm text-center text-gray-600 font-serif">
                {state.status === "processing"
                  ? `Processing first ${previewCount} PDF pages with OCR...`
                  : `Processing remaining ${state.remainingPdfPages} PDF pages...`}
              </p>
            </div>
          </>
        )}

        {state.status === "preview_complete" && (
          <>
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-serif mb-2">
                Preview processing complete!
              </p>
              <ul className="text-sm text-green-700 font-serif space-y-1">
                <li>PDF pages processed: {state.processedPdfPages}</li>
                <li>Book pages created: {state.createdPages}</li>
                <li>Remaining PDF pages: {state.remainingPdfPages}</li>
              </ul>
            </div>

            <p className="text-gray-600 mb-4 font-serif text-sm">
              Review the created pages to verify the split quality.
              Then click "Process Remaining" to continue with the rest of the PDF
              (without auto OCR - use batch processing later).
            </p>

            {state.errors.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-sm text-yellow-800 font-serif mb-2">
                  Some errors occurred:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 font-serif">
                  {state.errors.slice(0, 3).map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                  {state.errors.length > 3 && (
                    <li>... and {state.errors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 font-serif transition-colors text-base"
              >
                Review Pages
              </button>
              <button
                onClick={processRemaining}
                className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-serif transition-colors text-base"
              >
                Process Remaining ({state.remainingPdfPages})
              </button>
            </div>
          </>
        )}

        {state.status === "completed" && (
          <div className="text-center">
            <div className="mb-4 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-serif text-lg font-medium mb-2">
                Processing complete!
              </p>
              <p className="text-green-700 font-serif">
                {state.createdPages} pages created from {state.totalPdfPages} PDF pages
              </p>
            </div>

            {state.errors.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                <p className="font-medium text-sm text-yellow-800 font-serif mb-2">
                  Completed with {state.errors.length} errors:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 font-serif">
                  {state.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                  {state.errors.length > 5 && (
                    <li>... and {state.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {state.status === "error" && (
          <div className="text-center">
            <p className="text-red-600 font-serif mb-4">
              An error occurred during processing
            </p>
            {state.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-left">
                <ul className="text-sm text-red-700 space-y-1 font-serif">
                  {state.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 font-serif transition-colors text-base"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfSplitProcessor;

import React, { useState, useEffect } from "react";
import { DocumentIcon, XMarkIcon } from "@heroicons/react/24/outline";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Page, ProgressDetails } from "../types";
import { apiService } from "../services/api";

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfProcessorProps {
  bookId: string;
  startPageNumber: number;
  preSelectedFile?: File | null;
  onSuccess?: (processedPages: number) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  existingPages?: Page[];
}

const PdfProcessor: React.FC<PdfProcessorProps> = ({
  bookId,
  preSelectedFile,
  onSuccess,
  onError,
  onClose,
  existingPages = [], // Add this prop
}) => {
  const [pdfFile, setPdfFile] = useState<File | null>(preSelectedFile || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressDetails, setProgressDetails] = useState<ProgressDetails>({
    currentPage: 0,
    totalPages: 0,
    status: "selecting",
    errors: [],
  });
  const [nextPageNumber, setNextPageNumber] = useState<number>(1);

  useEffect(() => {
    // Calculate next page number from existing pages
    const maxPageNumber =
      existingPages.length > 0
        ? Math.max(...existingPages.map((page) => page.page_number))
        : 0;
    setNextPageNumber(maxPageNumber + 1);

    if (preSelectedFile) {
      setPdfFile(preSelectedFile);
      // If we have a pre-selected file, start processing immediately
      setTimeout(() => {
        processPdf();
      }, 100);
    }
  }, [preSelectedFile, bookId, existingPages]);

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File Size check (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert("PDF file size must be less than 50MB");
      return;
    }
    setPdfFile(file);
  };

  const processPdf = async () => {
    if (!pdfFile) return;

    setIsProcessing(true);
    setUploadProgress(0);
    setProgressDetails({
      currentPage: 0,
      totalPages: 0,
      status: "processing",
      errors: [],
    });

    try {
      // Read PDF file
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const totalPages = pdf.numPages;

      setProgressDetails((prev) => ({
        ...prev,
        totalPages,
        status: "processing",
      }));

      let processedPages = 0;
      const errors: string[] = [];
      let currentPageNumber = nextPageNumber; // Start from the next available page number

      // Process each page sequentially (one by one)
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        try {
          // console.log(`Processing PDF page ${pageNum} of ${totalPages}...`);

          // Get page
          const page = await pdf.getPage(pageNum);

          // Create canvas to render page
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d")!;

          // Set high DPI for better quality
          const viewport = page.getViewport({ scale: 2.0 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Render page to canvas
          await page.render({ canvasContext: context, viewport }).promise;

          // Convert canvas to blob
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
          });

          // Upload this single page using the current page number
          const uploadSuccess = await uploadSinglePage(
            blob,
            pageNum,
            currentPageNumber
          );

          if (uploadSuccess.success) {
            processedPages++;
            currentPageNumber++; // Increment for next page
          } else {
            errors.push(
              `Page ${pageNum}: ${uploadSuccess.error || "Unknown error"}`
            );
            console.error(
              `Failed to upload PDF page ${pageNum}:`,
              uploadSuccess.error
            );
          }

          // Update progress
          const progress = Math.round((pageNum / totalPages) * 100);
          setUploadProgress(progress);
          setProgressDetails((prev) => ({
            ...prev,
            currentPage: pageNum,
            errors: [...errors],
          }));
        } catch (error) {
          console.error(`Error processing page ${pageNum}:`, error);
          errors.push(
            `Page ${pageNum}: ${error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      // Complete processing
      setProgressDetails((prev) => ({
        ...prev,
        status: "completed",
        errors,
      }));

      setTimeout(() => {
        if (errors.length > 0) {
          onError?.(
            `PDF processed with ${errors.length} errors. ${processedPages} pages uploaded successfully.`
          );
        } else {
          onSuccess?.(processedPages);
        }
      }, 1000);
    } catch (error) {
      console.error("Error processing PDF:", error);
      setProgressDetails((prev) => ({
        ...prev,
        status: "error",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      }));
      setTimeout(() => {
        onError?.("Failed to process PDF");
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to upload a single page - simplified without retry logic for page numbers
  const uploadSinglePage = async (
    blob: Blob,
    pdfPageNum: number,
    targetPageNumber: number
  ): Promise<{
    success: boolean;
    pageNumber?: number;
    error?: string;
  }> => {
    try {
      const formData = new FormData();
      formData.append("book_id", bookId);
      formData.append("page_number", targetPageNumber.toString());
      formData.append("photo", blob, `page_${pdfPageNum}.jpg`);
      formData.append("ocr_language", "");
      formData.append("ocr_model", "gemini");
      formData.append("ocr_data", "");
      formData.append("translation_language", "English");
      formData.append("translation_model", "gemini");
      formData.append("translation_data", "");

      await apiService.createPage(formData);
      return { success: true, pageNumber: targetPageNumber };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-serif font-bold text-gray-900">
            {progressDetails.status === "selecting"
              ? "Upload PDF"
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

        {progressDetails.status === "selecting" && !preSelectedFile && (
          <>
            <p className="text-gray-600 mb-6 font-serif">
              Select a PDF file to add its pages to this book. Pages will be
              numbered starting from {nextPageNumber}.
            </p>

            <div className="mb-6">
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
                          PDF up to 50MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 font-serif transition-colors text-base"
              >
                Cancel
              </button>
              <button
                onClick={processPdf}
                disabled={!pdfFile}
                className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-serif transition-colors disabled:opacity-50 text-base"
              >
                Process PDF
              </button>
            </div>
          </>
        )}

        {progressDetails.status === "selecting" && preSelectedFile && (
          <>
            <p className="text-gray-600 mb-6 font-serif">
              Processing your selected PDF file:{" "}
              <strong>{preSelectedFile.name}</strong>
            </p>
            <p className="text-sm text-gray-600 text-center font-serif">
              Preparing to process PDF...
            </p>
          </>
        )}

        {progressDetails.status === "processing" && (
          <>
            <p className="text-gray-600 mb-6 font-serif">
              Please don't leave this page. Processing PDF pages and uploading
              them to the server.
            </p>
            <div className="mb-6">
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-amber-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-center mt-2 text-gray-600 font-serif">
                {progressDetails.currentPage}/{progressDetails.totalPages} pages
                processed
              </p>
            </div>
            <p className="text-sm text-gray-600 text-center font-serif">
              Processing page {progressDetails.currentPage} of{" "}
              {progressDetails.totalPages}
            </p>
          </>
        )}

        {progressDetails.status === "completed" && (
          <div className="text-center">
            <p className="text-green-600 font-serif mb-4">
              Processing completed successfully!
            </p>
            {progressDetails.errors.length > 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-medium text-sm text-yellow-800 font-serif mb-2">
                  Some errors occurred:
                </p>
                <ul className="text-sm text-yellow-700 space-y-1 font-serif">
                  {progressDetails.errors.slice(0, 3).map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                  {progressDetails.errors.length > 3 && (
                    <li className="flex items-start">
                      <span className="text-yellow-500 mr-2">•</span>
                      <span>
                        ... and {progressDetails.errors.length - 3} more errors
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {progressDetails.status === "error" && (
          <div className="text-center">
            <p className="text-red-600 font-serif mb-4">
              An error occurred during processing
            </p>
            {progressDetails.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="font-medium text-sm text-red-800 font-serif mb-2">
                  Errors:
                </p>
                <ul className="text-sm text-red-700 space-y-1 font-serif">
                  {progressDetails.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfProcessor;

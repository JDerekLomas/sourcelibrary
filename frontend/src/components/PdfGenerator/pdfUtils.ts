import { pdf } from "@react-pdf/renderer";
import PdfDownload from "./PdfDownload";
import { Book, Page } from "../../types";
import React from "react";

// bookDetails: Book object
// allPages: array of Page objects
// apiService: service for image proxy
// showSuccess: function(title, message)
// showError: function(title, message)
export async function createAndDownloadPdf(
  bookDetails: Book,
  allPages: Page[],
  apiService: any,
  showSuccess: (title: string, message: string) => void,
  showError: (title: string, message: string) => void
) {
  try {
    // Check if there are any pages at all
    if (!allPages || allPages.length === 0) {
      showError("No Pages", "This book has no pages to generate a PDF.");
      return;
    }

    // Preload all images before creating PDF
    const translatedPages = allPages
      .filter((page) => page.translation?.data?.trim())
      .sort((a, b) => a.page_number - b.page_number);

    // Check if there are any translated pages
    if (translatedPages.length === 0) {
      showError("No Translations", "No translated pages found for this book.");
      return;
    }

    const imageUrls: string[] = [];

    // Collect cover image
    if (bookDetails.thumbnail) {
      imageUrls.push(apiService.getImageProxyUrl(bookDetails.thumbnail));
    }

    // Collect markdown images
    translatedPages.forEach((page) => {
      const text = page.translation?.data || "";
      const lines = text.split("\n");
      lines.forEach((line) => {
        const imageMatch = line.match(/!\[(.*?)\]\((.*?)\)/);
        if (imageMatch) {
          imageUrls.push(apiService.getImageProxyUrl(imageMatch[2]));
        }
      });
    });

    // Remove duplicates
    const uniqueUrls = Array.from(new Set(imageUrls));

    // Preload all images
    const imageMap: Record<string, string> = {};
    const preloadResults = await Promise.allSettled(
      uniqueUrls.map(async (url) => {
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const blob = await resp.blob();
            imageMap[url] = URL.createObjectURL(blob);
            return { success: true, url };
          }
          return { success: false, url, error: 'Response not ok' };
        } catch (error) {
          return { success: false, url, error };
        }
      })
    );

    // Optionally warn if some images failed to load
    const failedImages = preloadResults.filter(
      (result) => result.status === "rejected" || (result.status === "fulfilled" && !result.value.success)
    );
    if (failedImages.length > 0 && uniqueUrls.length > 0) {
      showError(
        "Image Load Warning",
        `Some images (${failedImages.length}) could not be loaded and will not appear in the PDF. PDF is still being generated.`
      );
      // Continue PDF generation even if some images failed
    }

    // Create PDF component with preloaded images
    const pdfComponent = React.createElement(PdfDownload, {
      bookDetails,
      pages: allPages,
      preloadedImages: imageMap,
    }) as React.ReactElement;

    // Generate PDF blob
    const blob = await pdf(pdfComponent).toBlob();

    // Clean up object URLs
    Object.values(imageMap).forEach((objUrl) => URL.revokeObjectURL(objUrl));

    if (!blob) {
      showError("PDF Generation Failed", "PDF blob generation failed.");
      return;
    }

    const url = URL.createObjectURL(blob);

    // Download PDF
    const link = document.createElement("a");
    link.href = url;
    link.download = `${bookDetails.title.replace(/[^a-zA-Z0-9]/g, "_")}_Translated.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccess(
      "PDF Generated",
      "Translation PDF has been downloaded successfully."
    );
  } catch (error) {
    showError(
      "PDF Generation Failed",
      `Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

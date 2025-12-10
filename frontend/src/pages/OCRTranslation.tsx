import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageDetails } from "../types";
import { apiService } from "../services/api";
import Modal from "../components/ui/Modal";
import Toast from "../components/ui/Toast";
import { useModal } from "../hooks/useModal";
import { useToast } from "../hooks/useToast";
import Header from "../components/OCRTranslation/Header";
import PageControls from "../components/OCRTranslation/PageControls";
import PhotoColumn from "../components/OCRTranslation/PhotoColumn";
import OCRColumn from "../components/OCRTranslation/OCRColumn";
import TranslationColumn from "../components/OCRTranslation/TranslationColumn";
import PromptModal from "../components/OCRTranslation/PromptModal";
import { usePaths } from "../hooks/usePaths";
import { Request } from "../types";
import { useAuth } from "../contexts/AuthContext";

const OCRTranslation: React.FC = () => {
  const { book_id, page_id } = useParams<{
    book_id: string;
    page_id: string;
  }>();

  const navigate = useNavigate();
  const paths = usePaths();
  const { username } = useAuth() || {};

  const { modalState, hideModal, showError: showModalError } = useModal();
  const { toast, hideToast, showSuccess, showError } = useToast();

  // State management
  const [bookDetails, setBookDetails] = useState<any>(null);
  const [pageDetails, setPageDetails] = useState<PageDetails | null>(null);
  const [allPages, setAllPages] = useState<PageDetails[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [ocrApiRunning, setOcrApiRunning] = useState(false);
  const [translationApiRunning, setTranslationApiRunning] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [originalOcr, setOriginalOcr] = useState<string>("");
  const [originalTranslation, setOriginalTranslation] = useState<string>("");

  // Prompt state
  const [ocrPromptModalVisible, setOcrPromptModalVisible] = useState(false);
  const [translationPromptModalVisible, setTranslationPromptModalVisible] =
    useState(false);
  const [customOcrPrompt, setCustomOcrPrompt] = useState(
    "OCR the page in {language} only return ocr"
  );
  const [customTranslationPrompt, setCustomTranslationPrompt] = useState(
    "Translate the following {source_lang} text to {target_lang}:\n\n{text}\n\nOnly return the translated text without any additional comments or formatting."
  );
  const [tempOcrPrompt, setTempOcrPrompt] = useState("");
  const [tempTranslationPrompt, setTempTranslationPrompt] = useState("");

  // UI state
  const [viewMode, setViewMode] = useState<
    "both" | "translation" | "photo-translation"
  >("both");
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    if (!book_id) return;

    apiService
      .getBook(book_id)
      .then((data) => {
        const bookData = {
          book_id: data.id,
          title: data.title,
          author: data.author,
          language: data.language,
        };
        setBookDetails(bookData);
      })
      .catch((error) => {
        console.error("Error fetching book:", error);
      });

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
      .catch((error) => {
        console.error("Error fetching book details:", error);
      });
  }, [book_id, page_id]);

  useEffect(() => {
    if (!page_id) return;

    resetPageDataVisuals();

    apiService
      .getPage(page_id)
      .then((data) => {
        setOriginalOcr(data.ocr.data);
        setOriginalTranslation(data.translation.data);
        setPageDetails(data);
      })
      .catch((error) => {
        console.error("Error fetching page details:", error);
      });
  }, [page_id]);

  useEffect(() => {
    if (bookDetails && pageDetails) {
      // Only update if the values are truly empty or undefined, not if user has cleared them
      let needsUpdate = false;
      let updates: any = {};

      if (!pageDetails.ocr.language || pageDetails.ocr.language === "") {
        updates.ocr = { ...pageDetails.ocr, language: bookDetails.language };
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
  }, [bookDetails, pageDetails?.id]); // Remove pageDetails from dependency to prevent loops

  // Event handlers
  const handleImageLoad = () => setImageLoading(false);

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      const previousPage = allPages[currentPageIndex - 1];

      if (!book_id || !previousPage || !previousPage.id) return;
      navigate(paths.translation(book_id, previousPage.id));
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < allPages.length - 1) {
      const nextPage = allPages[currentPageIndex + 1];

      if (!book_id || !nextPage || !nextPage.id) return;
      navigate(paths.translation(book_id, nextPage.id));
    }
  };

  const resetPageDataVisuals = () => {
    setOriginalOcr("");
    setOriginalTranslation("");
    setPageDetails(null);
    setImageLoading(true);
  }

  const handlePageDetailsChange = (updates: any) => {
    setPageDetails((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const handleOcrTextChange = (value: string) => {
    setPageDetails((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        ocr: {
          ...prev.ocr,
          data: value,
        },
      };

      return updated;
    });
  };

  const handleTranslationTextChange = (value: string) => {
    setPageDetails((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        translation: {
          ...prev.translation,
          data: value,
        },
      };
      return updated;
    });
  };

  const fetchOcrData = async () => {
    if (!pageDetails) return;

    setOcrApiRunning(true);

    try {
      const promptWithLanguage = customOcrPrompt.replace(
        "{language}",
        pageDetails.ocr.language
      );
      const response = await apiService.performOCR(
        {
          pageId: pageDetails.id,
          photoUrl: pageDetails.photo,
          language: pageDetails.ocr.language,
          aiModel: pageDetails.ocr.model,
          customPrompt: promptWithLanguage,
          autoSave: false
        }
      );

      setPageDetails((prevDetails) =>
        prevDetails
          ? {
            ...prevDetails,
            ocr: { ...prevDetails.ocr, data: response.ocr },
          }
          : null
      );
    } catch (error) {
      console.error("Error performing OCR:", error);
      showModalError("OCR Failed", "Failed to perform OCR. Please try again.");
    } finally {
      setOcrApiRunning(false);
    }
  };

  const fetchTranslation = async () => {
    if (!pageDetails?.ocr.data) return;

    setTranslationApiRunning(true);

    try {
      let promptWithPlaceholders = customTranslationPrompt
        .replace("{source_lang}", pageDetails.ocr.language)
        .replace("{target_lang}", pageDetails.translation.language)
        .replace("{text}", pageDetails.ocr.data);

      promptWithPlaceholders = `${promptWithPlaceholders}\n\nOnly return the translated text without any additional comments, maintaining the appropriate markdown format and ensuring not to modify the image tag, keeping it intact as it is.`;

      const response = await apiService.performTranslation(
        {
          pageId: pageDetails.id,
          text: pageDetails.ocr.data,
          sourceLang: pageDetails.ocr.language,
          targetLang: pageDetails.translation.language,
          aiModel: pageDetails.translation.model,
          customPrompt: promptWithPlaceholders,
          autoSave: false
        }
      );

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

  const handleSave = async () => {
    if (!pageDetails || !page_id || !book_id) return;

    setIsSaving(true);
    try {
      const oldOcrText = originalOcr;
      const newOcrText = pageDetails.ocr.data || "";
      const oldTranslationText = originalTranslation;
      const newTranslationText = pageDetails.translation.data || "";

      const requestOCR: Request = {
        book_id: book_id,
        page_id: page_id,
        username: username ?? "Unknown User",
        oldText: oldOcrText,
        newText: newOcrText,
        requestType: "ocr",
        status: "pending",
        description: "",
        review: "",
      };

      const requestTranslation: Request = {
        book_id: book_id,
        page_id: page_id,
        username: username ?? "Unknown User",
        oldText: oldTranslationText,
        newText: newTranslationText,
        requestType: "translation",
        status: "pending",
        description: "",
        review: "",
      };

      if (requestOCR.oldText !== requestOCR.newText)
        await apiService.createEditRequest(requestOCR);

      if (requestTranslation.oldText !== requestTranslation.newText)
        await apiService.createEditRequest(requestTranslation);

      showSuccess("Page saved successfully");
    } catch (error) {
      console.error("Error saving page:", error);
      showError(
        `Failed to save page: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Prompt modal handlers
  const showOcrPromptModal = () => {
    setTempOcrPrompt(customOcrPrompt);
    setOcrPromptModalVisible(true);
  };

  const showTranslationPromptModal = () => {
    setTempTranslationPrompt(customTranslationPrompt);
    setTranslationPromptModalVisible(true);
  };

  const handleOcrPromptSave = () => {
    setCustomOcrPrompt(tempOcrPrompt);
    setOcrPromptModalVisible(false);
  };

  const handleTranslationPromptSave = () => {
    setCustomTranslationPrompt(tempTranslationPrompt);
    setTranslationPromptModalVisible(false);
  };

  const handleOcrPromptCancel = () => {
    setOcrPromptModalVisible(false);
    setTempOcrPrompt("");
  };

  const handleTranslationPromptCancel = () => {
    setTranslationPromptModalVisible(false);
    setTempTranslationPrompt("");
  };

  // Grid layout classes based on view mode
  const getGridClasses = () => {
    switch (viewMode) {
      case "translation":
        return "flex flex-col";
      case "photo-translation":
        return "flex flex-col lg:grid lg:grid-cols-2 gap-3 sm:gap-4";
      default:
        return "flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header
        bookDetails={bookDetails}
        pageDetails={pageDetails}
        allPages={allPages}
        currentPageIndex={currentPageIndex}
        viewMode={viewMode}
        fontSize={fontSize}
        onViewModeChange={setViewMode}
        onFontSizeChange={setFontSize}
        onBack={() => {
          if (!book_id) return;
          navigate(paths.bookDetails(book_id))
        }}
      />

      <main className="flex-1 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 overflow-hidden flex flex-col">
        <PageControls
          pageDetails={pageDetails}
          allPages={allPages}
          currentPageIndex={currentPageIndex}
          fontSize={fontSize}
          isSaving={isSaving}
          onPreviousPage={goToPreviousPage}
          onNextPage={goToNextPage}
          onFontSizeChange={setFontSize}
          onSave={handleSave}
        />

        <div className={`flex-1 ${getGridClasses()} min-h-0`}>
          {/* Photo Column */}
          {(viewMode === "both" || viewMode === "photo-translation") && (
            <div className="flex flex-col min-h-0">
              <PhotoColumn
                pageDetails={pageDetails}
                imageLoading={imageLoading}
                ocrApiRunning={ocrApiRunning}
                bookDetails={bookDetails}
                onImageLoad={handleImageLoad}
                onOcrLanguageChange={(language) =>
                  handlePageDetailsChange({
                    ocr: { ...pageDetails?.ocr, language },
                  })
                }
                onOcrPromptEdit={showOcrPromptModal}
                onOcrRun={fetchOcrData}
                onTranslationPromptEdit={showTranslationPromptModal}
                onTranslationRun={fetchTranslation}
                translationApiRunning={translationApiRunning}
                onPageDetailsChange={handlePageDetailsChange}
              />
            </div>
          )}

          {/* OCR Column - Only show in 'both' view */}
          {viewMode === "both" && (
            <div className="flex flex-col min-h-0">
              <OCRColumn
                pageDetails={pageDetails}
                ocrApiRunning={ocrApiRunning}
                translationApiRunning={translationApiRunning}
                fontSize={fontSize}
                onOcrTextChange={handleOcrTextChange}
                onTranslationLanguageChange={(language) =>
                  handlePageDetailsChange({
                    translation: { ...pageDetails?.translation, language },
                  })
                }
                onTranslationPromptEdit={showTranslationPromptModal}
                onTranslationRun={fetchTranslation}
                onPageDetailsChange={handlePageDetailsChange}
              />
            </div>
          )}

          {/* Translation Column */}
          <div className="flex flex-col min-h-0">
            <TranslationColumn
              pageDetails={pageDetails}
              translationApiRunning={translationApiRunning}
              fontSize={fontSize}
              onTranslationTextChange={handleTranslationTextChange}
            />
          </div>
        </div>
      </main>

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Modals */}
      <PromptModal
        visible={ocrPromptModalVisible}
        title="Edit OCR Prompt"
        placeholder="Enter your custom OCR prompt..."
        helpText="Use {language} as a placeholder for the selected language."
        value={tempOcrPrompt}
        onChange={setTempOcrPrompt}
        onSave={handleOcrPromptSave}
        onCancel={handleOcrPromptCancel}
      />

      <PromptModal
        visible={translationPromptModalVisible}
        title="Edit Translation Prompt"
        placeholder="Enter your custom translation prompt..."
        helpText="Use placeholders: {source_lang} for source language, {target_lang} for target language, and {text} for the text to translate."
        value={tempTranslationPrompt}
        onChange={setTempTranslationPrompt}
        onSave={handleTranslationPromptSave}
        onCancel={handleTranslationPromptCancel}
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
    </div>
  );
};

export default OCRTranslation;

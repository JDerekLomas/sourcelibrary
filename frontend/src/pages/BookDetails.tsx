import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PencilIcon,
  BoltIcon,
  TrashIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  UserIcon,
  BookOpenIcon,
  CalendarIcon,
  GlobeAltIcon,
  DocumentIcon,
  TagIcon,
  ShareIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import PageCard from "../components/PageCard";
import BatchProcessingModal from "../components/BatchProcessingModal";
import PdfProcessor from "../components/PdfProcessor";
import CryptoJS from "crypto-js";
import { Book, Page, Category } from "../types";
import { apiService } from "../services/api";
import Modal from "../components/ui/Modal";
import { useModal } from "../hooks/useModal";
import Button from "../components/ui/Buttons/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import { Helmet } from "react-helmet";
import HomeButton from "../components/ui/Buttons/HomeButton";
import { createAndDownloadPdf } from "../components/PdfGenerator/pdfUtils";
import ToggleSwitch from "../components/OCRTranslation/ToggleSwitch";
import { RoleGuard, ResourceType, ActionType } from "../auth/RoleGuard";
import { usePaths } from "../hooks/usePaths";

const BookDetails: React.FC = () => {
  const { book_id } = useParams<{ book_id: string }>();
  const { modalState, hideModal, showError, showSuccess } = useModal();

  const navigate = useNavigate();
  const paths = usePaths();

  const [bookDetails, setBookDetails] = useState<Book | null>(null);
  const [allPages, setAllPages] = useState<Page[]>([]);
  const [displayedPages, setDisplayedPages] = useState<Page[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(20);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [selectAllPages, setSelectAllPages] = useState(false);
  const [deleteBookModalVisible, setDeleteBookModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBookLoading, setDeleteBookLoading] = useState(false);
  const [deletePageModal, setDeletePageModal] = useState<{
    visible: boolean;
    pageId: string | null;
  }>({
    visible: false,
    pageId: null,
  });
  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const [batchModalVisible, setBatchModalVisible] = useState(false);

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfProcessorVisible, setPdfProcessorVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const metaRef = useRef<HTMLDivElement | null>(null);
  const buttonsRef = useRef<HTMLDivElement | null>(null);
  const [inlineButtons, setInlineButtons] = useState(false);
  const [showTranslatedTitle, setShowTranslatedTitle] = useState(true);

  const PAGES_PER_LOAD = 20;

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!book_id) return;

    setPageLoading(true);
    apiService
      .getBookDetails(book_id)
      .then((data) => {
        setBookDetails(data.book);
        const pages = data.pages || [];
        setAllPages(pages);
        setDisplayedPages(pages.slice(0, PAGES_PER_LOAD));
        setCurrentPageIndex(PAGES_PER_LOAD);
      })
      .catch((error) => {
        console.error("Error fetching book details:", error);
        alert("Failed to load book details");
      })
      .finally(() => {
        setPageLoading(false);
      });
    apiService
      .getAllCategories()
      .then(setCategories)
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  }, [book_id]);

  // Detect if the buttons (rendered below meta by default) are pushed off-screen.
  useEffect(() => {
    const checkButtonsVisibility = () => {
      // measure in next paint to ensure layout settled
      requestAnimationFrame(() => {
        const btnEl = buttonsRef.current;
        if (!btnEl) {
          setInlineButtons(false);
          return;
        }
        const rect = btnEl.getBoundingClientRect();
        const viewportBottom = window.innerHeight || document.documentElement.clientHeight;
        // If the buttons' bottom is too close to or below viewport bottom, enable inline mode.
        const SAFE_MARGIN = 80; // pixels from bottom
        if (rect.bottom > viewportBottom - SAFE_MARGIN) {
          setInlineButtons(true);
        } else {
          setInlineButtons(false);
        }
      });
    };

    checkButtonsVisibility();
    window.addEventListener("resize", checkButtonsVisibility);
    window.addEventListener("scroll", checkButtonsVisibility, { passive: true });
    return () => {
      window.removeEventListener("resize", checkButtonsVisibility);
      window.removeEventListener("scroll", checkButtonsVisibility);
    };
  }, [bookDetails, allPages, displayedPages, scrollY]);

  const loadMorePages = () => {
    const nextPages = allPages.slice(0, currentPageIndex + PAGES_PER_LOAD);
    setDisplayedPages(nextPages);
    setCurrentPageIndex(currentPageIndex + PAGES_PER_LOAD);
  };

  const showAllPages = () => {
    setDisplayedPages(allPages);
  };

  const handleDownloadPdf = async () => {
    if (!bookDetails) return;

    setPdfGenerating(true);

    try {
      await createAndDownloadPdf(
        bookDetails,
        allPages,
        apiService,
        showSuccess,
        showError
      );
    } finally {
      setPdfGenerating(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      await uploadPage(file);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadPage(file);
    }
  };

  const uploadPage = async (file: File) => {
    if (!book_id) return;

    setUploadLoading(true);

    try {
      const maxPageNumber =
        allPages.length > 0
          ? Math.max(...allPages.map((page) => page.page_number))
          : 0;
      const nextPageNumber = maxPageNumber + 1;

      const formData = new FormData();
      formData.append("book_id", book_id);
      formData.append("page_number", nextPageNumber.toString());
      formData.append("photo", file);
      formData.append("ocr_language", bookDetails?.language || "");
      formData.append("ocr_model", "gemini");
      formData.append("ocr_data", "");
      formData.append("translation_language", "English");
      formData.append("translation_model", "gemini");
      formData.append("translation_data", "");

      const newPage = await apiService.createPage(formData);
      const updatedPages = [...allPages, newPage];
      setAllPages(updatedPages);

      if (displayedPages.length >= allPages.length) {
        setDisplayedPages([...displayedPages, newPage]);
      }

      showSuccess("Page Added", "Page has been uploaded successfully.");
    } catch (error) {
      console.error("Error uploading page:", error);
      showError(
        "Upload Failed",
        `Failed to upload page: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setUploadLoading(false);
    }
  };

  const handleEditBook = () => {
    if (!book_id) return;
    navigate(paths.editBook(book_id));
  };

  const handleSelectPage = (pageId: string, checked: boolean) => {
    if (checked) {
      setSelectedPages((prev) => [...prev, pageId]);
    } else {
      setSelectedPages((prev) => prev.filter((id) => id !== pageId));
      setSelectAllPages(false);
    }
  };

  const handleSelectAllPages = (checked: boolean) => {
    setSelectAllPages(checked);
    if (checked) {
      setSelectedPages(allPages.map((page) => page.id));
    } else {
      setSelectedPages([]);
    }
  };

  // Select all pages from the current selection's earliest page_number to the last page
  const handleSelectToEnd = () => {
    if (selectedPages.length === 0) {
      showError(
        "No Pages Selected",
        "Please select a page to start from before using Select to End."
      );
      return;
    }

    // Find the smallest page_number among currently selected pages
    const selectedPageObjs = allPages.filter((p) => selectedPages.includes(p.id));
    if (selectedPageObjs.length === 0) {
      showError(
        "Selection Error",
        "Selected pages not found in the current book pages."
      );
      return;
    }

    const startPageNumber = Math.min(...selectedPageObjs.map((p) => p.page_number));

    // Select every page whose page_number is >= startPageNumber
    const pagesToSelect = allPages
      .filter((p) => p.page_number >= startPageNumber)
      .map((p) => p.id);

    setSelectedPages(pagesToSelect);
    setSelectAllPages(pagesToSelect.length === allPages.length);
  };

  const showDeleteModal = (pageId: string) => {
    setDeletePageModal({ visible: true, pageId });
  };

  const handleDeletePage = async () => {
    if (!deletePageModal.pageId) return;

    try {
      await apiService.deletePage(deletePageModal.pageId);
      const updatedPages = allPages.filter(
        (page) => page.id !== deletePageModal.pageId
      );
      setAllPages(updatedPages);
      setDisplayedPages(
        displayedPages.filter((page) => page.id !== deletePageModal.pageId)
      );
      showSuccess("Page Deleted", "Page has been deleted successfully.");
    } catch (error) {
      console.error("Error deleting page:", error);
      showError("Delete Failed", "Failed to delete page. Please try again.");
    }

    setDeletePageModal({ visible: false, pageId: null });
  };

  const handleBulkDeletePages = async () => {
    if (selectedPages.length === 0) return;

    setBulkDeleteLoading(true);

    try {
      const deleteResults = await Promise.allSettled(
        selectedPages.map(async (pageId) => {
          try {
            await apiService.deletePage(pageId);
            return { success: true, pageId };
          } catch (error) {
            console.error(`Failed to delete page ${pageId}:`, error);
            return { success: false, pageId, error };
          }
        })
      );

      const failedDeletes = deleteResults.filter(
        (result) =>
          result.status === "rejected" ||
          (result.status === "fulfilled" && !result.value.success)
      );

      const successfullyDeleted = deleteResults
        .filter(
          (result) => result.status === "fulfilled" && result.value.success
        )
        .map(
          (result) =>
            (
              result as PromiseFulfilledResult<{
                success: boolean;
                pageId: string;
              }>
            ).value.pageId
        );

      const updatedPages = allPages.filter(
        (page) => !successfullyDeleted.includes(page.id)
      );
      setAllPages(updatedPages);
      setDisplayedPages(
        displayedPages.filter((page) => !successfullyDeleted.includes(page.id))
      );

      setSelectedPages([]);
      setSelectAllPages(false);

      if (failedDeletes.length === 0) {
        showSuccess(
          "Pages Deleted",
          `Successfully deleted ${selectedPages.length} pages.`
        );
      } else {
        showError(
          "Partial Deletion",
          `Successfully deleted ${successfullyDeleted.length} out of ${selectedPages.length} pages. Some pages could not be deleted.`
        );
      }
    } catch (error) {
      console.error("Error during bulk delete:", error);
      showError("Delete Failed", "Failed to delete pages. Please try again.");
    } finally {
      setBulkDeleteLoading(false);
      setBulkDeleteModalVisible(false);
    }
  };

  const showBulkDeleteConfirm = () => {
    if (selectedPages.length === 0) {
      showError(
        "No Pages Selected",
        "Please select pages to delete before proceeding."
      );
      return;
    }
    setBulkDeleteModalVisible(true);
  };

  const handleDeleteBook = async () => {
    if (!deletePassword.trim() || !book_id) {
      showError(
        "Password Required",
        "Please enter the admin password to delete this book."
      );
      return;
    }

    setDeleteBookLoading(true);

    try {
      const passwordHash = CryptoJS.MD5(deletePassword).toString();
      await apiService.deleteBook(book_id, passwordHash);
      showSuccess("Book Deleted", "Book has been deleted successfully.", () => {
        navigate(paths.home);
      });
    } catch (error) {
      console.error("Error deleting book:", error);
      showError(
        "Delete Failed",
        error instanceof Error ? error.message : "Failed to delete book"
      );
    } finally {
      setDeleteBookLoading(false);
      setDeleteBookModalVisible(false);
      setDeletePassword("");
    }
  };

  const handleBatchProcess = () => {
    if (selectedPages.length === 0) {
      showError(
        "No Pages Selected",
        "Please select pages to process before starting batch processing."
      );
      return;
    }

    setBatchModalVisible(true);
  };

  const handleBatchComplete = async () => {
    setBatchModalVisible(false);

    setSelectedPages([]);
    setSelectAllPages(false);

    await refreshPages();
  };

  const handleBatchCancel = () => {
    setBatchModalVisible(false);
  };

  const handlePdfSuccess = async () => {
    setPdfProcessorVisible(false);
    await refreshPages();
  };

  const refreshPages = async () => {
    if (!book_id) return;

    try {
      const updatedData = await apiService.getBookDetails(book_id);
      const pages = updatedData.pages || [];
      setAllPages(pages);
      setDisplayedPages(
        pages.slice(0, Math.max(PAGES_PER_LOAD, displayedPages.length))
      );
    } catch (error) {
      console.error("Error refreshing book details:", error);
      showError(
        "Refresh Failed",
        "Failed to refresh pages data. Please reload the page."
      );
    }
  }

  const handlePdfError = (error: string) => {
    console.error("PDF processing error:", error);
    showError("PDF Processing Failed", `PDF processing failed: ${error}`);
  };

  const handleShare = async () => {
    const book_url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: bookDetails?.title,
          text: `Check out this book: ${bookDetails?.title} by ${bookDetails?.author}`,
          url: book_url,
        });
      } catch {
        // User cancelled or error
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(book_url);
        alert("Share link copied to clipboard!");
      } catch {
        alert("Failed to copy link.");
      }
    } else {
      window.prompt("Copy this link:", book_url);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <LoadingSpinner
          theme="gray"
          message="Loading Book"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f3ee] to-[#f3ede6]">
      {/* Helmet for OG meta tags */}
      {bookDetails && (
        <Helmet>
          <title>{bookDetails.title} | Book Details</title>
          <meta property="og:title" content={bookDetails.title} />
          <meta
            property="og:description"
            content={`Read ${bookDetails.title} by ${bookDetails.author}. Language: ${bookDetails.language}.`}
          />
          {bookDetails.thumbnail && (
            <meta property="og:image" content={bookDetails.thumbnail} />
          )}
          <meta property="og:url" content={window.location.href} />
          <meta property="og:type" content="book" />
          {bookDetails.published && (
            <meta
              property="book:release_date"
              content={bookDetails.published}
            />
          )}
          <meta property="book:author" content={bookDetails.author} />
        </Helmet>
      )}

      {/* Hero Header Section with Parallax Thumbnail */}
      {bookDetails && (
        <section className="relative h-[70vh] w-full overflow-hidden">
          {/* Parallax Background Image */}
          <div
            className="absolute inset-0 z-0"
            style={{
              transform: `translateY(${scrollY * 0.5}px)`,
              willChange: 'transform'
            }}
          >
            {bookDetails.thumbnail ? (
              <img
                src={bookDetails.thumbnail}
                alt={bookDetails.title}
                className="absolute inset-0 w-full h-full object-cover scale-110"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <BookOpenIcon className="h-32 w-32 text-gray-600" />
              </div>
            )}
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black/60" />
          </div>

          {/* Header Navigation */}
          <header className="relative z-[50] flex items-center justify-between px-6 py-4 md:px-12">
            <div className="flex items-center space-x-3">
              {/* <div className="p-2 bg-white/10 backdrop-blur-sm border border-white/20">
                <BookOpenIcon className="h-6 w-6 text-white" />
              </div> */}
            </div>
            <HomeButton className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20" />
          </header>

          {/* Book Details Content */}
          <div className="relative z-10 h-[70vh]">
            <div className="absolute left-0 w-full top-[18%] sm:top-[16%] md:top-[20%] px-6 md:px-12">
              <div className="max-w-6xl w-full mx-auto">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  {/* Left: title + meta */}
                  <div className="md:flex-1 md:pr-8">
                    {/* Toggle Switch - only show if display_title exists */}
                    {bookDetails.display_title && (
                      <div className="mb-4">
                        <ToggleSwitch
                          value={showTranslatedTitle}
                          onToggle={setShowTranslatedTitle}
                          leftContent={<span className="px-3 py-1.5 text-sm font-sans">Translated</span>}
                          rightContent={<span className="px-3 py-1.5 text-sm font-sans">Original</span>}
                          className="inline-block"
                        />
                      </div>
                    )}

                    <h1
                      ref={titleRef}
                      className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-4 leading-tight break-words"
                    >
                      {showTranslatedTitle && bookDetails.display_title
                        ? bookDetails.display_title
                        : bookDetails.title}
                    </h1>

                    <div ref={metaRef} className="space-y-3 text-white/90 mb-4">
                      <p className="flex items-center text-xl font-sans">
                        <UserIcon className="h-5 w-5 mr-2" />
                        {bookDetails.author}
                      </p>

                      <div className="flex flex-wrap gap-4 text-base font-sans">
                        <div className="flex items-center">
                          <GlobeAltIcon className="h-5 w-5 mr-2" />
                          <span>{bookDetails.language}</span>
                        </div>
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 mr-2" />
                          <span>{allPages.length} Pages</span>
                        </div>
                        <div className="flex items-center">
                          <CalendarIcon className="h-5 w-5 mr-2" />
                          <span>{bookDetails.published}</span>
                        </div>
                        {bookDetails.categories && bookDetails.categories.length > 0 && (
                          <div className="flex items-center">
                            <TagIcon className="h-5 w-5 mr-2" />
                            <span>
                              {categories
                                .filter((cat) => bookDetails.categories?.includes(cat.id))
                                .map((cat) => cat.name)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Default: buttons below metadata (shared button render uses buttonsRef for measurement) */}
                    {!inlineButtons && (
                      <div ref={buttonsRef} className="mt-4 flex flex-wrap gap-3">
                        <Button onClick={handleShare} variant="primary">
                          <ShareIcon className="h-4 w-4 mr-2" />
                          <span>Share</span>
                        </Button>

                        <Button
                          onClick={handleDownloadPdf}
                          variant="primary"
                          disabled={pdfGenerating}
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          <span>
                            {pdfGenerating ? "Generating..." : "Download Translation"}
                          </span>
                        </Button>

                        <RoleGuard resource={ResourceType.BOOK} action={ActionType.UPDATE}>
                          {/* Edit Button */}
                          <Button
                            onClick={() => handleEditBook()}
                            variant="secondary"
                            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                          >
                            <PencilIcon className="h-4 w-4 mr-2" />
                            <span>Edit Book</span>
                          </Button>

                          {/* Upload PDF Button */}
                          <Button
                            onClick={() => setPdfProcessorVisible(true)}
                            variant="secondary"
                            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                          >
                            <DocumentIcon className="h-4 w-4 mr-2" />
                            <span>Upload Pages (PDF)</span>
                          </Button>
                        </RoleGuard>

                        {/* Delete Button */}
                        <RoleGuard resource={ResourceType.BOOK} action={ActionType.DELETE}>
                          <Button
                            onClick={() => setDeleteBookModalVisible(true)}
                            variant="danger"
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            <span>Delete Book</span>
                          </Button>
                        </RoleGuard>
                      </div>
                    )}
                  </div>

                  {/* Inline: when needed render buttons horizontally at right edge */}
                  {inlineButtons && (
                    <div
                      ref={buttonsRef}
                      className="mt-4 md:mt-0 flex-shrink-0 flex gap-3 md:items-center md:justify-end"
                    >
                      <Button onClick={handleShare} variant="primary">
                        <ShareIcon className="h-4 w-4 mr-2" />
                        <span>Share</span>
                      </Button>

                      <Button
                        onClick={handleDownloadPdf}
                        variant="primary"
                        disabled={pdfGenerating}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        <span>
                          {pdfGenerating ? "Generating..." : "Download Translation"}
                        </span>
                      </Button>

                      <RoleGuard resource={ResourceType.BOOK} action={ActionType.UPDATE}>
                        <Button
                          onClick={() => handleEditBook()}
                          variant="secondary"
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          <span>Edit Book</span>
                        </Button>
                        <Button
                          onClick={() => setPdfProcessorVisible(true)}
                          variant="secondary"
                          className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        >
                          <DocumentIcon className="h-4 w-4 mr-2" />
                          <span>Upload Pages (PDF)</span>
                        </Button>
                      </RoleGuard>
                      <RoleGuard resource={ResourceType.BOOK} action={ActionType.DELETE}>
                        <Button
                          onClick={() => setDeleteBookModalVisible(true)}
                          variant="danger"
                        >
                          <TrashIcon className="h-4 w-4 mr-2" />
                          <span>Delete Book</span>
                        </Button>
                      </RoleGuard>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )
      }

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {bookDetails && (
          <>
            {/* Pages Section */}
            <div className="mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-sans font-bold text-gray-900 mb-2">
                    Book Pages
                  </h2>
                  <p className="text-gray-600 font-sans text-base">
                    {allPages.length} total pages • Showing{" "}
                    {displayedPages.length}
                  </p>
                </div>

                {selectedPages.length > 0 && (
                  <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                    <Button onClick={handleBatchProcess}>
                      <BoltIcon className="h-4 w-4 mr-2" />
                      <span>Batch Process ({selectedPages.length})</span>
                    </Button>
                    <Button onClick={showBulkDeleteConfirm} variant="danger">
                      <TrashIcon className="h-4 w-4 mr-2" />
                      <span>Delete ({selectedPages.length})</span>
                    </Button>
                    <Button onClick={handleSelectToEnd} variant="secondary">
                      Select to End
                    </Button>
                    <Button
                      onClick={() => handleSelectAllPages(!selectAllPages)}
                      variant="secondary"
                    >
                      {selectAllPages ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Pages Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {displayedPages.map((page) => (
                  <PageCard
                    key={page.id}
                    page={page}
                    isSelected={selectedPages.includes(page.id)}
                    onSelect={handleSelectPage}
                    onDelete={showDeleteModal}
                  />
                ))}

                {/* Upload Card */}
                <RoleGuard resource={ResourceType.BOOK} action={ActionType.UPDATE}>
                  <div
                    className="bg-white border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    <div className="h-64 flex flex-col items-center justify-center p-6 text-center">
                      {uploadLoading ? (
                        <div className="space-y-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
                          <p className="text-base font-medium text-gray-700 font-sans">
                            Uploading page...
                          </p>
                        </div>
                      ) : (
                        <>
                          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-base font-medium text-gray-700 mb-2 font-sans">
                            Add New Page
                          </p>
                          <p className="text-sm text-gray-500 font-sans">
                            Drop an image or click to browse
                          </p>
                        </>
                      )}
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileUpload}
                      />
                    </div>
                  </div>
                </RoleGuard>
              </div>

              {/* Load More Buttons */}
              {displayedPages.length < allPages.length && (
                <div className="flex justify-center space-x-4 mt-8">
                  <Button onClick={loadMorePages} variant="secondary">
                    Load More ({allPages.length - displayedPages.length}{" "}
                    remaining)
                  </Button>
                  <Button onClick={showAllPages}>Show All Pages</Button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Delete Page Modal */}
      {
        deletePageModal.visible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-300 p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-serif font-bold mb-4">
                Confirm Deletion
              </h3>
              <p className="text-gray-600 mb-6 font-sans text-base">
                Are you sure you want to delete this page?
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() =>
                    setDeletePageModal({ visible: false, pageId: null })
                  }
                  variant="secondary"
                  className="w-full"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeletePage}
                  variant="danger"
                  className="w-full"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Delete Book Modal */}
      {
        deleteBookModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-300 p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-serif font-bold mb-4">
                Delete Classical Text
              </h3>
              <div className="space-y-4">
                <p className="text-red-700 font-medium font-sans text-base">
                  Warning: This action cannot be undone. All pages and
                  translations will be permanently deleted.
                </p>
                <div className="space-y-2">
                  <label className="block text-base font-medium text-gray-700 font-sans">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter admin password"
                    className="w-full px-4 py-3 text-base border border-gray-300 bg-white focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-sans"
                    style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                  />
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => {
                      setDeleteBookModalVisible(false);
                      setDeletePassword("");
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteBook}
                    disabled={deleteBookLoading}
                    variant="danger"
                    loading={deleteBookLoading}
                    className="w-full"
                  >
                    {deleteBookLoading ? (
                      <span className="flex items-center space-x-2">
                        <span>Deleting Text...</span>
                      </span>
                    ) : (
                      "Delete Book"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Bulk Delete Modal */}
      {
        bulkDeleteModalVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-300 p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-serif font-bold mb-4">
                Delete Multiple Pages
              </h3>
              <div className="space-y-4">
                <p className="text-red-700 font-medium font-sans text-base">
                  Warning: You are about to delete {selectedPages.length} page
                  {selectedPages.length > 1 ? "s" : ""}. This action cannot be
                  undone.
                </p>
                <p className="text-gray-600 font-sans text-sm">
                  All OCR text and translations for these pages will be
                  permanently lost.
                </p>
                <div className="flex space-x-3">
                  <Button
                    onClick={() => setBulkDeleteModalVisible(false)}
                    disabled={bulkDeleteLoading}
                    variant="secondary"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkDeletePages}
                    disabled={bulkDeleteLoading}
                    loading={bulkDeleteLoading}
                    variant="danger"
                    className="w-full"
                  >
                    {bulkDeleteLoading ? (
                      <span className="flex items-center space-x-2">
                        <span>Deleting Pages...</span>
                      </span>
                    ) : (
                      `Delete ${selectedPages.length} Page${selectedPages.length > 1 ? "s" : ""
                      }`
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Batch Processing Modal */}
      <BatchProcessingModal
        visible={batchModalVisible}
        onCancel={handleBatchCancel}
        onComplete={handleBatchComplete}
        selectedPages={selectedPages}
        allPages={allPages}
        bookId={book_id!}
        initialOcrLanguage={bookDetails?.language || "Latin"}
      />

      {/* PDF Processor Modal */}
      {
        pdfProcessorVisible && (
          <PdfProcessor
            bookId={book_id!}
            startPageNumber={0}
            existingPages={allPages}
            onSuccess={handlePdfSuccess}
            onError={handlePdfError}
            onClose={() => setPdfProcessorVisible(false)}
          />
        )
      }

      {/* Modal */}
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
    </div >
  );
};

export default BookDetails;

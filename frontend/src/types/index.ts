export interface OCRTranslation {
    language: string;
    model: string;
    data: string;
}

export interface Page {
    book_id: string;
    page_number: number;
    ocr: OCRTranslation;
    translation: OCRTranslation;
    id: string;
    photo: string;
    thumbnail?: string;
    compressed_photo?: string;
    created_at: string;
    updated_at: string;
}

export interface Book {
    title: string;
    display_title?: string;
    author: string;
    pages_count: number;
    published: string;
    language: string;
    id: string;
    thumbnail: string;
    created_at: string;
    updated_at: string;
    categories?: string[];
}

export interface FeaturedPage {
    id: string;
    book_id: string;
    page_number: number;
    photo: string;
    thumbnail: string;
    compressed_photo: string;
    translation: {
        data: string;
        language: string;
    };
    book_title: string;
    book_author: string;
    book_language: string;
}

export interface BookFormData {
    title: string;
    author: string;
    language: string;
    published: string;
}

export interface ProcessingQueueItem {
    pageId: string;
    pageNumber: number;
    status: 'pending' | 'ocr_processing' | 'translation_processing' | 'completed' | 'error';
    requestType: 'ocr' | 'translation';
    ocrError?: string;
    translationError?: string;
}

export interface BatchSettings {
    ocrLanguage: string;
    translationLanguage: string;
    processOcr: boolean;
    processTranslation: boolean;
    ocrModel: string;
    translationModel: string;
}

export interface BatchRequest {
    pages: {
        page_id: string;
        process_ocr: boolean;
        process_translation: boolean;
        ocr_language: string;
        translation_language: string;
        custom_ocr_prompt?: string;
        custom_translation_prompt?: string;
    }[];
    max_concurrent: number;
}

export interface BatchResult {
    results: {
        page_id: string;
        status: 'completed' | 'error';
        error?: string;
    }[];
    summary: {
        completed: number;
        failed: number;
    };
}

export interface OCRResponse {
  ocr: string;
}

export interface TranslationResponse {
  translation: string;
}

export interface ProgressDetails {
    currentPage: number;
    totalPages: number;
    status: 'selecting' | 'processing' | 'completed' | 'error';
    errors: string[];
}

export interface PageDetails {
    id: string;
    book_id: string;
    page_number: number;
    photo: string;
    thumbnail?: string;
    compressed_photo?: string;
    ocr: {
        language: string;
        model: string;
        data: string;
    };
    translation: {
        language: string;
        model: string;
        data: string;
    };
    created_at: string;
    updated_at: string;
}

export interface BookDetailsResponse {
    book: Book;
    pages: Page[];
}

export interface NextPageNumberResponse {
    next_page_number: number;
}

export interface Language {
    value: string;
    label: string;
}

export interface ProcessingResults {
    totalRequests: number;
    completedRequests: number;
    errorRequests: number;
    errors: { pageNumber: number; requestType: string; error: string }[];
}

export interface Request {
    id?: string;
    book_id: string;
    page_id: string;
    username: string;
    oldText: string;
    newText: string;
    requestType: 'ocr' | 'translation';
    status: 'pending' | 'accepted' | 'rejected';
    description?: string;
    review?: string;
    created_at?: string;
    updated_at?: string;
    book_title?: string;
    page_number?: number;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
}

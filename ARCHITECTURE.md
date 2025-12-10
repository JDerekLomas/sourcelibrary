# Source Library - Architecture Documentation

## Overview

Source Library is a **multi-tenant digital archive platform** for digitizing and translating rare texts. It was built to support the Ancient Wisdom Trust's mission to preserve Hermetic, esoteric, and humanist texts from the Bibliotheca Philosophica Hermetica collection.

## Current State vs. Intended State

### What Exists Now

The codebase has **two distinct parts**:

1. **Marketing Pages** (static routes at `/`, `/about`, `/contact`)
   - Video hero sections showcasing the Embassy of the Free Mind
   - FAQ about the Source Library mission
   - No books displayed on homepage (BookCarousel is commented out)

2. **Library Application** (tenant-scoped routes at `/:tenant/*`)
   - Full book/page management
   - OCR and translation workflows
   - Admin dashboard
   - Requires a valid tenant slug in URL (e.g., `/root/library`)

### The Problem

The homepage (`/`) shows a marketing page, not the library. To see books:
- You must navigate to `/:tenant` (e.g., `/root`)
- The tenant must exist in the database
- The backend must be running and accessible

---

## Application Structure

```
Frontend (React + Vite + Tailwind)
├── / (HomePage.tsx)           → Marketing page with videos
├── /about (AboutPage.tsx)     → About the mission
├── /contact (ContactPage.tsx) → Contact form (disabled)
└── /:tenant/* (TenantScopedRoutes)
    ├── / or /library          → LibraryPage (book grid)
    ├── /book/:book_id         → BookDetails (pages grid)
    ├── /translation/:book_id/:page_id → OCRTranslation editor
    ├── /login                 → User login
    ├── /discover              → Random translated passages
    ├── /addbook               → Create new book (protected)
    ├── /book/edit/:book_id    → Edit book (protected)
    └── /admin/*               → Admin dashboard (protected)

Backend (FastAPI + Python)
├── /book/                     → Book CRUD
├── /page/                     → Page CRUD
├── /ocr/                      → OCR processing
├── /translate/                → Translation processing
├── /auth/                     → JWT authentication
├── /tenant/                   → Multi-tenancy
├── /user/                     → User management
├── /category/                 → Book categories
├── /requests/                 → Edit request workflow
└── /discover/                 → Random content API
```

---

## The Translation Pipeline

This is the core functionality of Source Library.

### Step 1: Upload Book & Pages

1. User creates a book with metadata (title, author, language, publication date)
2. User uploads page images (JPEG, PNG) or a PDF
3. PDF is split into individual page images
4. Images are stored in AWS S3 with thumbnails generated

### Step 2: OCR (Optical Character Recognition)

**Purpose:** Extract text from scanned page images.

**Process:**
```
Page Image (S3 URL)
       ↓
   AI Model (Mistral or Gemini)
       ↓
   Extracted Text (Markdown format)
       ↓
   Saved to MongoDB (page.ocr.data)
```

**AI Models:**
- **Mistral OCR** (default): Uses `mistral-ocr-latest` model
  - Specialized OCR model
  - Returns markdown with embedded images
  - Extracts diagrams/illustrations as separate images → uploaded to S3
  - Image references replaced with S3 URLs in markdown

- **Google Gemini** (alternative): Uses `gemini-2.5-pro`
  - General vision model
  - Simpler text extraction
  - No image extraction

**Default OCR Prompt:**
```
OCR the page in {language} only return ocr.
If two pages, ocr the left page first and then the right page.
```

**Custom prompts** can be provided for specialized texts.

### Step 3: Translation

**Purpose:** Translate OCR'd text from source language to target language.

**Process:**
```
OCR Text + Source Language + Target Language
       ↓
   AI Model (Gemini or Mistral)
       ↓
   Translated Text
       ↓
   Saved to MongoDB (page.translation.data)
```

**AI Models:**
- **Google Gemini** (default): Better multilingual capabilities
- **Mistral** (alternative): Uses `mistral-large-latest`

**Default Translation Prompt:**
```
You are a professional translator. Translate the following text
from {source_lang} to {target_lang}.

**Strictly follow these rules:**
1. Preserve ALL markdown formatting (headers, lists, bold, italics, etc.).
2. Do NOT modify or remove any image tags (e.g., `![alt text](image_url)`).
3. Do NOT add new formatting, comments, quoting original text, or explanations.
4. Translate ONLY the text content. Ignore code blocks, links, or non-text elements.
5. Maintain the original structure and line breaks.

---
{text}
---
```

### Step 4: Review & Edit

The OCR/Translation editor (`/translation/:book_id/:page_id`) provides:
- Three-column layout: Original Image | OCR Text | Translation
- Inline editing of OCR and translation text
- Language selectors for source and target
- AI model selectors
- Custom prompt editing
- Save creates an **Edit Request** for admin review

### Step 5: Batch Processing

For bulk processing:
1. Select multiple pages from BookDetails
2. Open Batch Processing Modal
3. Configure OCR language, translation language, AI models
4. Process all selected pages sequentially
5. Progress tracked with error handling

---

## Data Model

### Book
```typescript
{
  id: string
  tenant_id: string
  title: string
  display_title: string      // AI-translated title (auto-generated)
  author: string
  language: string           // Original language (Latin, German, etc.)
  published: string          // Publication year
  thumbnail: string          // S3 URL
  categories: string[]       // Category IDs
  pages_count: number        // Computed
}
```

### Page
```typescript
{
  id: string
  tenant_id: string
  book_id: string
  page_number: number
  photo: string              // Original image S3 URL
  thumbnail: string          // Thumbnail S3 URL
  compressed_photo: string   // Web-optimized S3 URL
  ocr: {
    language: string         // Source language
    model: string            // "mistral" or "gemini"
    data: string             // OCR text (markdown)
    image_urls: string[]     // Extracted diagram S3 URLs
    updated_at: datetime
  }
  translation: {
    language: string         // Target language
    model: string            // AI model used
    data: string             // Translated text
  }
}
```

---

## Multi-Tenancy

The platform supports multiple organizations, each with:
- Isolated data (books, pages, users)
- Custom branding (logo, colors, header video)
- Configurable role permissions

**How it works:**
1. URL contains tenant slug: `/root/library`, `/ritman/library`
2. Frontend sends `X-Tenant-Slug` header with all API requests
3. Backend validates tenant, scopes all queries to that tenant
4. Each tenant has separate users, roles, permissions

**Default tenant:** `root` (system administrator)

---

## Authentication

- **JWT tokens** for authentication
- **Access token:** 15 minutes, stored in memory
- **Refresh token:** 15 days, HTTP-only secure cookie
- **Auto-refresh:** Axios interceptor handles 401 → refresh flow
- **Password hashing:** Argon2 with pepper

**Default credentials:**
- Username: `root`
- Password: `admin@5678`

---

## AWS S3 Storage Structure

```
s3://bucket/
└── tenants/{tenant_id}/
    └── books/{book_id}/
        ├── thumbnails/
        │   └── 400w_{uuid}.jpg         # Book cover
        └── pages/{page_id}/
            ├── page_{uuid}.jpg          # Original scan
            ├── thumbnails/
            │   └── 400w_{uuid}.jpg      # Page thumbnail
            ├── compressed/
            │   └── 400w_{uuid}.jpg      # Web-optimized
            └── content/
                └── ocr_{uuid}.jpg       # Extracted diagrams
```

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:8080        # Backend URL
VITE_TURNSTILE_SITE_KEY=xxx               # Cloudflare CAPTCHA
```

### Backend (.env)
```
# Database
MONGO_URI_CELL_DEFAULT=mongodb+srv://...
MONGO_DB_CELL_DEFAULT=sourcelibrary

# Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
S3_BUCKET_CELL_DEFAULT=xxx
S3_REGION_CELL_DEFAULT=ap-south-1

# AI Services
GEMINI_API_KEY=xxx
MISTRAL_API_KEY=xxx
OPENAI_API_KEY=xxx                        # Optional

# Auth
JWT_SECRET_KEY=xxx
PASSWORD_PEPPER=xxx

# Server
CORS_ORIGINS=http://localhost:5173
```

---

## Key Files

| Purpose | Frontend | Backend |
|---------|----------|---------|
| Entry point | `src/App.tsx` | `src/main.py` |
| Routing | `src/TenantScopedRoutes.tsx` | N/A |
| API client | `src/services/api.ts` | N/A |
| OCR UI | `src/pages/OCRTranslation.tsx` | `src/ocr/routes/ocr_router.py` |
| Translation | (same page) | `src/translate/routes/translate_router.py` |
| AI clients | N/A | `src/ai/services/mistral_ai.py`, `gemini_ai.py` |
| Auth | `src/contexts/AuthContext.tsx` | `src/auth/` |
| Tenant | `src/contexts/TenantContext.tsx` | `src/tenant/` |

---

## Current Issues

1. **Homepage doesn't show books** - `BookCarousel` is commented out
2. **404 on /root** - Tenant validation may fail if backend unavailable
3. **Marketing vs. App disconnect** - Static pages separate from tenant-scoped app

---

## Recommended Improvements

1. **Show books on homepage** - Uncomment `BookCarousel` or embed `AllBooks`
2. **Default tenant routing** - Redirect `/` to `/root/library` or make homepage the library
3. **SEO for book pages** - Consider SSR/Next.js for public book pages
4. **Fallback UI** - Better error states when backend is unavailable

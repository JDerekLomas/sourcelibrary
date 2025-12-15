# Translation System Overview

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACES                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Web App       │   Claude Code   │   Python Scripts            │
│   (translate/)  │   (/latin-*)    │   (translate_book.py)       │
└────────┬────────┴────────┬────────┴────────────┬────────────────┘
         │                 │                     │
         ▼                 ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      TRANSLATION ENGINE                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   OCR       │→ │ Translation │→ │  Summary    │              │
│  │   Stage     │  │   Stage     │  │   Stage     │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
         │                                       │
         ▼                                       ▼
┌─────────────────┐                   ┌─────────────────┐
│  Image Sources  │                   │  Output Files   │
│  - Internet     │                   │  - OCR text     │
│    Archive      │                   │  - Translation  │
│  - PDF uploads  │                   │  - Summary JSON │
│  - ZIP images   │                   │  - Glossary     │
└─────────────────┘                   └─────────────────┘
```

## Processing Pipeline

### Stage 1: Image Acquisition

**Sources:**
- Internet Archive: `https://archive.org/download/{id}/page/n{page}.jpg`
- Uploaded PDFs: Rendered to images via pdf2image
- ZIP uploads: Pre-extracted page images

### Stage 2: OCR (Optical Character Recognition)

Input: Page image
Output: Latin text with structural markup

**Process:**
1. Send image to vision model (GPT-4o or Claude)
2. Transcribe visible text faithfully
3. Preserve layout, abbreviations, formatting
4. Note uncertain readings with `[[?]]` markers
5. Flag page continuations

### Stage 3: Translation

Input: OCR text + previous page context
Output: English translation

**Process:**
1. Read OCR output and prior page translation
2. Maintain terminology consistency via glossary
3. Translate with accessible, scholarly tone
4. Preserve structure (tables, headings, etc.)
5. Add inline notes for context

### Stage 4: Summary & Extraction

Input: Translation text
Output: Structured metadata

**Extracts:**
- 2-3 sentence summary
- Key terms (Latin → English)
- People mentioned
- Concepts introduced
- Confidence score
- Review flags

## AI Providers

| Provider | Model | Best For |
|----------|-------|----------|
| OpenAI | GPT-4o | OCR (vision), fast translation |
| Anthropic | Claude Opus | Complex philosophical texts |
| Anthropic | Claude Sonnet | Cost-effective batch processing |

## Context Management

Each page receives context from previous pages:
- Previous OCR (for continuation detection)
- Previous translation (for consistency)
- Running glossary (for terminology)
- Book-level metadata

This enables coherent translation of multi-page arguments, tracked terminology, and proper handling of sentences that span page breaks.

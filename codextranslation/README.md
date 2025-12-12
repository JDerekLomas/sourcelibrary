# Codex Translation Workspace

A standalone translator-focused UI prototype for the Source Library vision. The goal is to give translators a dedicated cockpit for ingesting folios, orchestrating OCR/translation jobs, and comparing results before publishing to the public source library.

## What's Included

- **Workspace layout** with three columns: project overview + folio stack, immersive reading window, and control panels.
- **Upload + ingestion controls** to register PDFs or single-page assets, connect catalog entries, and create blank folios.
- **Context-aware prompts** for OCR and translation models with model cards showing capability hints.
- **Comparative viewer** rendering the page image placeholder alongside editable markdown for OCR + translation, optimized for diffing.
- **Context stitching panel** surfacing previous page excerpts so prompts include the correct history.
- **Version control timeline** representing commits, OCR runs, and translation reviews with badges that would map to real Git commits/DOI snapshots.
- **State reducer + mock data** emulating a book (Marsilio Ficino's *De Mysteriis Aegyptiorum*) with five folios so the UI feels real immediately after cloning.

## Getting Started

> Network installs are disabled in this environment. If you have internet access, run the standard Vite commands below.

```bash
cd codextranslation
npm install
npm run dev
```

The dev server is configured to use port `5174` so it can run next to the existing Source Library frontend.

## Next Steps

1. **Hook up to real services** – wire the reducer actions to backend calls for uploading assets, triggering OCR/translation jobs, and persisting edits.
2. **Context packaging** – convert the context panel behavior into actual payload builders that include previous folio data when calling the AI services.
3. **Diff + review tooling** – integrate a markdown diff viewer so translators can approve/reject segments before promoting to the reader experience.
4. **Version control plumbing** – connect the timeline + commit actions to a git-backed content store (or the platform’s request workflow) so every change is traceable.
5. **User + permission flows** – embed role-aware affordances for administrators, curators, translators, and reviewers per the larger product requirements.

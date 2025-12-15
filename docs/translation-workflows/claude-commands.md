# Claude Code Commands

CLI commands for translating Latin texts using Claude Code.

## Available Commands

| Command | Purpose |
|---------|---------|
| `/latin-page` | Process a single page (OCR + translate + summarize) |
| `/latin-book-preview` | Generate 15-page preview of a new book |
| `/latin-book-run` | Process full book with refined prompts |
| `/latin-book-compile` | Generate summaries, glossary, and indices |

## `/latin-page`

Process a single page image through the full pipeline.

### Usage
```
/latin-page <image-path> [options]
```

### Options
- `--prompts <file>` — Custom prompts file (default: built-in prompts)
- `--context <folder>` — Project folder for previous page context
- `--page <N>` — Page number (auto-detected from filename if possible)

### Examples
```bash
# Basic usage
/latin-page data/translations/ficino_de_vita/pages/045/image.jpg

# With project context
/latin-page pages/046/image.jpg --context data/translations/ficino_de_vita --page 46

# With custom prompts
/latin-page page.jpg --prompts my_prompts.md
```

### Output Format
```markdown
## OCR
[transcribed Latin text with markup]

## Translation
[English translation with notes]

## Summary
[2-3 sentence summary]

## Extracted Data
- **Key Terms**: term (translation), ...
- **People**: Name, ...
- **Concepts**: concept, ...
- **Confidence**: 0.X
- **Flags**: [issues for review]
```

---

## `/latin-book-preview`

Initialize a new book project and process the first 15 pages.

### Usage
```
/latin-book-preview <source> [options]
```

### Source Types
- Internet Archive identifier: `ia:devitalibritresc00fici`
- Local PDF: `/path/to/book.pdf`
- Folder of images: `/path/to/pages/`

### Options
- `--title <title>` — Book title
- `--author <author>` — Author name
- `--pages <N>` — Preview pages (default: 15)

### Examples
```bash
# From Internet Archive
/latin-book-preview ia:devitalibritresc00fici --title "De Vita" --author "Ficino"

# From local PDF
/latin-book-preview ~/Downloads/ficino_de_vita.pdf --title "De Vita"

# From image folder
/latin-book-preview ~/scans/de_vita/ --title "De Vita" --author "Ficino"
```

### What It Creates
```
data/translations/ficino_de_vita/
├── metadata.json
├── project_prompts.md    ← Edit this before full run
├── glossary.json
└── pages/
    ├── 001/ through 015/
```

### After Preview

1. Review the 15 pages in `pages/`
2. Edit `project_prompts.md` based on what you see
3. Update `glossary.json` with key terminology
4. Run `/latin-book-run` when ready

---

## `/latin-book-run`

Process remaining pages of a book using refined prompts.

### Usage
```
/latin-book-run <project-folder> [options]
```

### Options
- `--start <N>` — Start from page N (default: after preview)
- `--end <N>` — End at page N (default: last page)
- `--retry-failed` — Retry pages that previously failed

### Examples
```bash
# Continue after preview
/latin-book-run data/translations/ficino_de_vita

# Process specific range
/latin-book-run data/translations/ficino_de_vita --start 50 --end 100

# Retry failed pages
/latin-book-run data/translations/ficino_de_vita --retry-failed
```

### Requirements
- `metadata.json` must exist
- `project_prompts.md` should be customized
- Preview pages should be reviewed

### Progress
- Updates `metadata.json` with progress
- Creates page folders as processing completes
- Updates `glossary.json` with new terms

---

## `/latin-book-compile`

Generate summaries, glossary, and indices from completed translation.

### Usage
```
/latin-book-compile <project-folder>
```

### Example
```bash
/latin-book-compile data/translations/ficino_de_vita
```

### Requirements
- All pages should be processed
- Each page needs `summary.json`

### What It Generates
```
data/translations/ficino_de_vita/
├── sections/
│   ├── section_01.md
│   ├── section_02.md
│   └── ...
├── glossary_full.md
├── indices.md
├── book_summary.md
└── flags.md
```

### Section Grouping
- Approximately 25-50 pages per section
- Respects detected chapter breaks
- Can be manually adjusted

---

## Workflow Example

Complete workflow for translating a book:

```bash
# 1. Initialize and preview
/latin-book-preview ia:devitalibritresc00fici --title "De Vita Libri Tres" --author "Marsilio Ficino"

# 2. Review output in data/translations/ficino_de_vita/pages/
#    Edit project_prompts.md based on what you see

# 3. Process full book
/latin-book-run data/translations/ficino_de_vita

# 4. Monitor progress
ls data/translations/ficino_de_vita/pages/ | wc -l

# 5. Generate compilation
/latin-book-compile data/translations/ficino_de_vita

# 6. Review flags.md for expert attention items
cat data/translations/ficino_de_vita/flags.md
```

---

## Tips

### For Better Results
- Always review the preview before full run
- Customize prompts for this specific text
- Build the glossary incrementally
- Check context continuity between pages

### For Efficiency
- Process similar texts together (reuse prompts)
- Use `--retry-failed` for intermittent issues
- Compile after batches, not just at the end

### For Quality Control
- Spot-check throughout, not just preview
- Review `flags.md` before publishing
- Compare with existing translations if available

---

## Troubleshooting

### "No previous page context"
Normal for page 1. For other pages, ensure the previous page was processed.

### "Image not found"
Check the path. For IA sources, ensure the identifier is correct and IA is accessible.

### "OCR confidence low"
The image may be damaged or the typeface unusual. Review manually and update prompts.

### "Glossary conflict"
Same term translated differently. Review and standardize in `glossary.json`.

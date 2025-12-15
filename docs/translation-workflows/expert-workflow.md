# Expert Workflow Guide

A step-by-step guide for subject matter experts translating Renaissance Latin texts.

## Phase 1: Project Setup

### 1.1 Select Source

**Option A: Internet Archive**
- Browse the IA catalog at `/translate/catalog`
- Search by author, title, or date range
- Click "Translate" to start a new project

**Option B: Upload PDF**
- Go to `/translate/new`
- Upload your PDF file
- System renders pages to images automatically

**Option C: Upload Images**
- Prepare page images as numbered files (page_001.jpg, etc.)
- ZIP the folder
- Upload via `/translate/new`

### 1.2 Configure Initial Settings

- **Provider**: OpenAI (faster) or Anthropic (may be better for complex texts)
- **Preview pages**: 15 (default) — enough to assess quality
- **Max pages**: Leave blank for full book, or set limit

## Phase 2: Preview Generation

The system processes 15 pages with default prompts.

**What happens:**
1. Each page image is sent to the vision model
2. OCR extracts the Latin text
3. Translation converts to English
4. Summary extracts key terms and concepts

**Review while processing:**
- Watch progress in the dashboard
- First results appear within minutes

## Phase 3: Expert Review

This is the critical phase where your expertise shapes the final product.

### 3.1 Review OCR Quality

**Check for:**
- [ ] Abbreviation expansion accuracy
- [ ] Special characters (ę, æ, œ, ſ)
- [ ] Greek passages
- [ ] Marginal notes captured
- [ ] Page numbers correct
- [ ] Table/list structure preserved

**Common issues:**
- Ligatures misread (ct, st, fi)
- u/v confusion
- Long s (ſ) vs f
- Macrons and tildes

### 3.2 Review Translation Quality

**Check for:**
- [ ] Technical terminology accuracy
- [ ] Consistent rendering of key terms
- [ ] Philosophical concepts properly conveyed
- [ ] Names and references identified
- [ ] Tone appropriate for audience
- [ ] No hallucinated content

**Common issues:**
- Generic translations of specialized terms
- Missing context for obscure references
- Over-literal or over-free renderings

### 3.3 Edit Project Prompts

Based on your review, customize `project_prompts.md`:

```markdown
## OCR Prompt

**Book-specific notes**:
- Typeface: Roman with italic emphasis
- Common abbreviations: ꝗ = que, ã = an/am, ē = en/em
- Recurring elements: Marginal citations in smaller type

## Translation Prompt

**Book-specific notes**:
- Target audience: Graduate students in philosophy
- Tone: Scholarly but accessible
- Key terminology decisions:
  - anima mundi → "world soul" (not "soul of the world")
  - intellectus agens → "agent intellect" (standard term)
  - spiritus → "spirit" when metaphysical, "breath" when physical
```

## Phase 4: Full Production

Once satisfied with the preview:

1. Click "Continue Full Translation"
2. System processes remaining pages
3. Monitor progress in dashboard
4. Pages use your refined prompts

**Timing estimates:**
- 100 pages: ~30 minutes
- 300 pages: ~90 minutes
- 500 pages: ~2.5 hours

## Phase 5: Post-Processing

### 5.1 Compilation

The system generates:
- Section summaries (every 25-50 pages)
- Full glossary with page references
- Index of persons
- Index of concepts
- Book-level summary

### 5.2 Expert Review of Compilation

**Review:**
- [ ] Glossary consistency
- [ ] Index completeness
- [ ] Summary accuracy
- [ ] Section breaks logical

### 5.3 Flag Review

Check `flags.md` for:
- Low-confidence OCR passages
- Translation uncertainties
- Structural ambiguities

These need expert attention before publication.

## Phase 6: Export & Publication

**Export formats:**
- Markdown (for editing)
- PDF (for distribution)
- EPUB (for e-readers)
- JSON (for databases)

**Citation format:**
> [Author], *[Title]*, trans. Second Renaissance (2025), p. X.

## Tips for Best Results

### Prompt Refinement

1. **Be specific about terminology**: List key terms and preferred translations
2. **Describe the text type**: Philosophical treatise vs. medical manual vs. poetry
3. **Specify audience**: Scholars, students, general readers
4. **Note recurring structures**: Dialogues, arguments, lists, citations

### Quality Control

1. **Spot-check throughout**: Don't just review preview pages
2. **Check difficult passages**: Technical arguments, Greek quotes, poetry
3. **Verify references**: Names, dates, cited works
4. **Compare with existing translations**: If partial translations exist

### Efficiency

1. **Process similar texts together**: Refine prompts once, reuse
2. **Build a terminology database**: Export glossaries for future use
3. **Document decisions**: Future experts will thank you

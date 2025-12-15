# Translation Prompts

Default prompts and customization guidelines for each stage of the translation pipeline.

## OCR Prompt (Default)

```
You are transcribing a Renaissance Latin facsimile.

**Input**: A page image and the previous page's OCR (for context/continuity).

**Instructions**:
- Start with `[[notes: describe page condition, layout, typeface, damage, any continuation from previous page]]`
- Include `[[page: N]]` if a page number is visible
- Preserve original capitalization, spelling, and line breaks
- Use Markdown to mirror the source layout:
  - `#` headings for chapter titles
  - `>` for centered mottos or dedications
  - `*italics*` for italic text
  - Markdown tables for indices, columns, or tabular content
- Mark uncertain characters: `[[?reading]]` or `[[alt: optionA / optionB]]`
- Note abbreviations: expand only if certain, otherwise `[[abbrev: ã = an? am?]]`
- Flag continuations: `[[continues from previous page]]` or `[[continues to next page]]`

**Output**: Only the transcription with markup. No commentary.
```

### OCR Customization Options

**For Gothic typefaces:**
```
- Typeface: Gothic blackletter
- Note: u and n may be indistinguishable; use context
- Common ligatures: ch, ck, st, tz
```

**For texts with extensive abbreviations:**
```
- Common abbreviations in this text:
  - ꝗ = que (always)
  - ꝑ = per/par
  - ꝓ = pro
  - 9 = con/cum
  - ã/ē/ĩ/õ/ũ = nasal (an/en/in/on/un)
```

**For texts with marginalia:**
```
- Marginal notes: Transcribe in [[margin: ...]] blocks
- Place after the line they reference
- Note if printed or manuscript additions
```

---

## Translation Prompt (Default)

```
You are translating Renaissance Latin into accessible English.

**Input**: The OCR text and the previous page's translation (for context/continuity).

**Instructions**:
- Start with `[[notes: context from prior page, tricky phrases, historical references, terminology choices]]`
- Mirror the source layout exactly:
  - Preserve headings, centered text, paragraph breaks
  - Keep Markdown tables in the same structure
  - Maintain line breaks where meaningful
- Use inline `[[notes]]` for:
  - Alternate translation possibilities
  - Historical context a general reader needs
  - Technical terms that require explanation
- Style: warm and accessible, like a museum label—explain references rather than leaving jargon
- Preserve proper names; add context in notes on first occurrence
- Use consistent terminology throughout (reference the glossary)

**Output**: Only the English translation with notes. No meta-commentary.
```

### Translation Customization Options

**For scholarly audience:**
```
- Target audience: Scholars familiar with the period
- Tone: Formal, preserve Latin structure where elegant
- Technical terms: Use standard scholarly translations
- Notes: Focus on textual issues, not basic context
```

**For general readers:**
```
- Target audience: Educated general readers
- Tone: Accessible, prioritize clarity over literalness
- Technical terms: Always explain on first use
- Notes: Provide historical and cultural context generously
```

**For specific terminology:**
```
Key terminology decisions:
- anima → "soul" (not "mind" or "spirit")
- intellectus → "intellect" (not "understanding")
- spiritus → "spirit" when metaphysical, "breath/air" when physical
- ratio → "reason" (not "ratio" or "calculation")
- natura → "nature" (capitalize when personified)
```

---

## Summary Prompt (Default)

```
Extract key information from this page for indexing and synthesis.

**Instructions**:
- Write a 2-3 sentence summary for a non-specialist reader
- Extract:
  - **Key terms**: Latin word/phrase → English translation (with brief context)
  - **People**: Names mentioned with their role/significance
  - **Concepts**: Ideas introduced or developed on this page
- Note connections to previous pages
- Flag any uncertainties or passages needing expert review
- Rate confidence (0.0-1.0) based on OCR clarity and translation certainty

**Output format**:
```json
{
  "summary": "...",
  "key_terms": [{"latin": "...", "english": "...", "context": "..."}],
  "people": [{"name": "...", "role": "..."}],
  "concepts": ["..."],
  "connections": "...",
  "flags": ["..."],
  "confidence": 0.X
}
```
```

### Summary Customization Options

**For philosophical texts:**
```
- Focus on: Arguments, claims, logical structure
- Track: Premises, conclusions, objections, replies
- Note: References to other philosophers
```

**For scientific/medical texts:**
```
- Focus on: Procedures, substances, observations
- Track: Ingredients, dosages, methods
- Note: Anatomical terms, plant names
```

**For historical/biographical texts:**
```
- Focus on: Events, dates, relationships
- Track: People, places, institutions
- Note: Chronological markers, genealogies
```

---

## Project Prompts Template

Copy this to `project_prompts.md` in your project folder and customize:

```markdown
# Project Prompts

## Book Information
- **Title**: [Full title]
- **Author**: [Author name]
- **Date**: [Publication date]
- **Source**: [IA identifier or other source]

---

## OCR Prompt

[Copy default OCR prompt here]

**Book-specific notes**:
- Typeface: [Roman/Gothic/mixed]
- Common abbreviations: [list patterns]
- Recurring elements: [marginalia, running headers, etc.]
- Known issues: [damaged pages, faded ink, etc.]

---

## Translation Prompt

[Copy default translation prompt here]

**Book-specific notes**:
- Target audience: [scholars/students/general]
- Tone: [formal/accessible/preserve archaic flavor]
- Key terminology decisions:
  - [Latin term] → [English] — [reasoning]
  - [Latin term] → [English] — [reasoning]

---

## Summary Prompt

[Copy default summary prompt here]

**Book-specific notes**:
- Important figures to track: [list names]
- Core concepts: [list themes]
- Summary emphasis: [what matters most]

---

## Expert Notes

- [ ] Preview reviewed on: [date]
- [ ] Prompt adjustments made: [describe]
- [ ] Known issues: [list problems]
- [ ] Ready for full run: [ ] Yes / [ ] No
```

---

## Prompt Engineering Tips

### For Better OCR

1. **Describe the typeface**: Models handle Roman better than Gothic
2. **List common abbreviations**: Reduces guessing
3. **Note damage patterns**: Helps model handle gaps
4. **Specify language mix**: Latin with Greek? Hebrew? Vernacular?

### For Better Translation

1. **Be explicit about terminology**: Don't assume standard translations
2. **Define the audience**: Dramatically affects word choice
3. **Give examples**: "Translate *spiritus* as 'spirit' in philosophical contexts, as in: *spiritus mundi* → 'spirit of the world'"
4. **Note genre**: Philosophical treatise vs. letter vs. poetry

### For Better Summaries

1. **Specify what to track**: Not all books need the same metadata
2. **Define importance**: What makes something worth flagging?
3. **Set confidence thresholds**: When should experts be alerted?

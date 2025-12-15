# Project File Structure

Organization of translation project folders and output files.

## Project Folder Layout

```
data/translations/{author}_{short_title}/
├── metadata.json           # Book metadata and settings
├── project_prompts.md      # Customized prompts (editable)
├── glossary.json           # Running terminology database
├── pages/
│   ├── 001/
│   │   ├── image.jpg       # Source page image
│   │   ├── ocr.md          # Transcribed Latin text
│   │   ├── translation.md  # English translation
│   │   └── summary.json    # Extracted metadata
│   ├── 002/
│   │   └── ...
│   └── NNN/
│       └── ...
├── sections/               # Generated after compilation
│   ├── section_01.md
│   ├── section_02.md
│   └── ...
├── glossary_full.md        # Compiled glossary with references
├── indices.md              # Person/concept/place indices
├── book_summary.md         # Full book overview
└── flags.md                # Items needing expert review
```

## File Descriptions

### Core Project Files

#### `metadata.json`
```json
{
  "title": "De Vita Libri Tres",
  "author": "Marsilio Ficino",
  "year": 1489,
  "source": "ia:devitalibritresc00fici",
  "total_pages": 342,
  "provider": "openai",
  "created_at": "2025-01-15T10:30:00Z",
  "status": "processing",
  "preview_completed": true,
  "prompts_version": 2
}
```

#### `project_prompts.md`
Expert-editable prompts file. See [prompts.md](prompts.md) for template.

#### `glossary.json`
```json
{
  "terms": [
    {
      "latin": "anima mundi",
      "english": "world soul",
      "first_page": 12,
      "pages": [12, 45, 89, 112],
      "context": "The animating principle of the cosmos in Neoplatonic philosophy"
    },
    {
      "latin": "spiritus",
      "english": "spirit",
      "first_page": 8,
      "pages": [8, 15, 23, 34],
      "context": "The subtle body mediating between soul and physical matter"
    }
  ]
}
```

### Page-Level Files

#### `pages/NNN/ocr.md`
```markdown
[[notes: Clean print, Roman type, page in good condition]]
[[page: 45]]

CAPVT DECIMVM

De spiritu mundi, & quomodo per ipsum anima mundi
operatur in sublunaria.

Spiritus mundi est corpus quoddam tenuissimum, quasi non corpus,
& quasi iam anima, vel quasi non anima & quasi iam corpus...

[[continues to next page]]
```

#### `pages/NNN/translation.md`
```markdown
[[notes: Continues argument from p.44 about the world soul's operations]]

CHAPTER TEN

On the spirit of the world, and how through it the world soul
operates in sublunary things.

The spirit of the world [[notes: *spiritus mundi*, the intermediary between
the world soul and matter]] is a certain most subtle body, almost not a body
and almost already soul, or almost not soul and almost already body...

[[continues to next page]]
```

#### `pages/NNN/summary.json`
```json
{
  "page_number": 45,
  "summary": "Ficino introduces the concept of the world spirit (spiritus mundi) as the intermediary between the immaterial world soul and physical matter. This subtle body enables the soul to act upon the material world.",
  "key_terms": [
    {
      "latin": "spiritus mundi",
      "english": "spirit of the world",
      "context": "The subtle body through which the world soul operates"
    }
  ],
  "people": [],
  "concepts": ["world spirit", "subtle body", "soul-body mediation"],
  "connections": "Continues from chapter 9's discussion of the world soul",
  "flags": [],
  "confidence": 0.92
}
```

### Compilation Files

#### `sections/section_01.md`
```markdown
# Section 1: The Nature of Spirit (Pages 1-50)

## Summary
The first section establishes Ficino's understanding of spirit as the
mediating substance between soul and body...

## Key Themes
- The tripartite nature of reality (soul, spirit, body)
- Spirit as the vehicle of cosmic sympathy
- Medical and cosmological uses of the spirit concept

## Important Terms Introduced
| Latin | English | First Appears |
|-------|---------|---------------|
| spiritus | spirit | p. 8 |
| anima mundi | world soul | p. 12 |
| sympathia | sympathy | p. 23 |

## People Mentioned
- Plato (pp. 5, 12, 34): Source for the world soul doctrine
- Plotinus (pp. 15, 28): Neoplatonic elaboration of spirit

## Notable Passages
- p. 12: "The world soul is like an artist..." — key metaphor
- p. 45: Definition of spiritus mundi — central to the argument
```

#### `glossary_full.md`
```markdown
# Glossary

## A

**anima mundi** (world soul) — pp. 12, 45, 89, 112
  The animating principle of the cosmos, derived from Plato's Timaeus.
  Ficino understands it as the source of all life and motion in the
  material world, operating through the intermediary of spirit.

**astrum** (star, celestial body) — pp. 23, 56, 78
  Used both for individual stars and for celestial influences generally.
  In medical contexts, refers to the astral or stellar quality of substances.

## S

**spiritus** (spirit) — pp. 8, 15, 23, 34, 45...
  The subtle body that mediates between soul and gross matter. Ficino
  distinguishes three types: natural spirit (liver), vital spirit (heart),
  and animal spirit (brain).

**spiritus mundi** (world spirit) — pp. 45, 67, 89
  The cosmic equivalent of individual spirit; the medium through which
  the world soul acts upon sublunary matter.
```

#### `indices.md`
```markdown
# Index of Persons
- Aristotle: 34, 56, 78, 112
- Avicenna: 89, 102, 145
- Ficino, Marsilio: passim
- Plato: 5, 12, 34, 67, 89, 112
- Plotinus: 15, 28, 45, 78, 112
- Proclus: 23, 89

# Index of Concepts
- Astral influence: 23, 56-78, 134
- Celestial bodies: 23, 34, 56, 78
- Emanation: 12, 45, 89
- Natural magic: 145-167
- Spirit (spiritus): 8, 15, 23, 34, 45...
- World soul: 12, 45, 89, 112

# Index of Places
- Alexandria: 34
- Florence: 156, 178
- Rome: 134
```

#### `book_summary.md`
```markdown
# De Vita Libri Tres
## Marsilio Ficino (1489)

### Overview
Ficino's *Three Books on Life* represents the culmination of Renaissance
natural philosophy and medicine. The work synthesizes Neoplatonic metaphysics,
Hermetic magic, and Galenic medicine into a comprehensive guide for
maintaining health—especially the health of scholars and contemplatives...

### Structure
- **Book I** (pp. 1-120): On caring for the health of scholars
- **Book II** (pp. 121-240): On prolonging life
- **Book III** (pp. 241-342): On obtaining life from the heavens

### Major Themes
1. **Spirit as mediator**: The subtle body enables cosmic sympathy
2. **Scholarly melancholy**: Saturn's influence on contemplatives
3. **Natural magic**: Capturing celestial virtues in material substances
4. **Medical advice**: Diet, exercise, and lifestyle for intellectuals

### Historical Significance
The *De Vita* was one of the most influential texts of Renaissance natural
philosophy, read by generations of physicians, philosophers, and practitioners
of natural magic...

### Translation Notes
- Total pages: 342
- Processing confidence: 89%
- Passages flagged for expert review: 23 (see flags.md)

### How to Cite
Ficino, Marsilio. *Three Books on Life*, trans. Second Renaissance (2025), p. X.
```

#### `flags.md`
```markdown
# Passages Requiring Expert Review

## Low Confidence OCR

- **p. 42, line 12**: "[[?incertum]]" — possible readings: incertum, in certum, in centrum
- **p. 89, lines 5-8**: Faded ink, several words uncertain
- **p. 156**: Water damage to lower margin

## Translation Uncertainties

- **p. 23**: "caelestis ignis" — translated as "celestial fire" but could mean "heavenly passion"
- **p. 67**: Ambiguous pronoun reference in long periodic sentence
- **p. 112**: Technical astrological term "antiscia" — verify standard translation

## Structural Questions

- **pp. 45-46**: Chapter break unclear in original — verify division
- **p. 200**: Possible missing page in source — compare with other editions

## Terminology Consistency

- **spiritus**: Check that natural/vital/animal spirit distinctions maintained
- **anima vs. animus**: Verify consistent treatment throughout
```

## Naming Conventions

### Project Folder Names
```
{author_surname}_{short_title}
```
Examples:
- `ficino_de_vita`
- `pico_heptaplus`
- `agrippa_occult_philosophy`

### Page Numbering
- Use zero-padded numbers: `001`, `002`, ... `999`
- Match the printed page numbers where possible
- For unnumbered pages, use sequence numbers with prefix: `front_01`, `index_01`

### File Names
- Use lowercase
- Use underscores for spaces
- Be descriptive but concise

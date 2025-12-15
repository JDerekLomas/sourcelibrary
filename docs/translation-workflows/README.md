# Translation Workflows

Documentation for the Second Renaissance Latin translation system.

## Overview

This system enables expert-driven translation of Renaissance Latin texts using AI assistance. The workflow emphasizes human expertise while leveraging LLMs for OCR and draft translation.

## Documents

| File | Description |
|------|-------------|
| [overview.md](overview.md) | High-level architecture and philosophy |
| [expert-workflow.md](expert-workflow.md) | Step-by-step guide for subject matter experts |
| [prompts.md](prompts.md) | Default and customizable prompts |
| [file-structure.md](file-structure.md) | Project folder organization |
| [claude-commands.md](claude-commands.md) | CLI commands for Claude Code |

## Quick Start

1. **Preview**: Generate 15-page sample with default prompts
2. **Review**: Expert reviews OCR accuracy and translation quality
3. **Refine**: Adjust prompts based on this specific text
4. **Produce**: Run full book with refined prompts
5. **Compile**: Generate indices, glossary, and summaries

## Key Principles

- **Expert-driven**: Subject matter experts control quality and terminology
- **Iterative refinement**: Prompts are tuned per-book for best results
- **Context continuity**: Each page builds on previous pages
- **Structured output**: Consistent format for downstream processing

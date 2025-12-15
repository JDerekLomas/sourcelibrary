#!/usr/bin/env python3
"""
Generate summaries for Ehrenhart's "Nosce te ipsum" pages.
Uses the translation text to extract key information.
"""

import subprocess
import json
import os

API_BASE = "https://book-translation-backend-391835035966.asia-south1.run.app"
BOOK_ID = "6909caa0cf28baa1b4cafc87"
TENANT = "ritman"
OUTPUT_DIR = "/Users/dereklomas/sourcelibrary/data/translations/ehrenhart_nosce_te_ipsum"

SUMMARY_PROMPT = """Extract key information from this translated page for indexing and synthesis.

**Instructions**:
- Write a 2-3 sentence summary for a non-specialist reader
- Extract:
  - **Key terms**: German word/phrase → English translation (with brief context)
  - **People**: Names mentioned with their role/significance
  - **Concepts**: Ideas introduced or developed on this page
- Note connections to previous pages
- Flag any uncertainties or passages needing expert review
- Rate confidence (0.0-1.0) based on translation clarity

**Output ONLY valid JSON** in this exact format (no markdown, no explanation):
{"summary": "...", "key_terms": [{"german": "...", "english": "...", "context": "..."}], "people": [{"name": "...", "role": "..."}], "concepts": ["..."], "connections": "...", "flags": ["..."], "confidence": 0.X}

**Page Translation**:
"""

def get_all_pages():
    """Get all pages from the book"""
    cmd = [
        "curl", "-s", f"{API_BASE}/book/details/{BOOK_ID}",
        "-H", f"X-Tenant-Slug: {TENANT}",
        "--max-time", "30"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        data = json.loads(result.stdout)
        return data.get("pages", [])
    return []

def generate_summary(page_num, translation_text):
    """Generate summary using the API"""
    prompt = SUMMARY_PROMPT + translation_text[:3000]  # Truncate if too long

    payload = json.dumps({
        "page_id": "summary",  # Dummy ID
        "text": prompt,
        "source_lang": "English",
        "target_lang": "English",
        "ai_model": "gemini",
        "auto_save": False
    })

    cmd = [
        "curl", "-s", "-X", "POST", f"{API_BASE}/translate/",
        "-H", f"X-Tenant-Slug: {TENANT}",
        "-H", "Content-Type: application/json",
        "-d", payload,
        "--max-time", "60"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            data = json.loads(result.stdout)
            response = data.get("translation", "")
            # Try to parse as JSON
            # Clean up response
            response = response.strip()
            if response.startswith("```"):
                lines = response.split("\n")
                response = "\n".join(lines[1:-1])
            return json.loads(response)
        except json.JSONDecodeError:
            return {"error": "Could not parse JSON", "raw": response}
    return {"error": result.stderr}

def main():
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(f"{OUTPUT_DIR}/pages", exist_ok=True)

    print("=" * 60)
    print("Generating summaries for Ehrenhart's 'Nosce te ipsum'")
    print("=" * 60)

    pages = get_all_pages()
    all_summaries = []

    for page in pages:
        page_num = page.get("page_number")
        translation = page.get("translation", {}).get("data", "")
        ocr = page.get("ocr", {}).get("data", "")

        print(f"\n--- Page {page_num} ---")

        if not translation or len(translation) < 10:
            print(f"  [SKIP] No translation content")
            continue

        print(f"  [1] Translation: {len(translation)} chars")
        print(f"  [2] Generating summary...")

        summary = generate_summary(page_num, translation)

        if "error" not in summary:
            print(f"  [2] Success!")
            # Save individual page summary
            page_dir = f"{OUTPUT_DIR}/pages/{page_num:03d}"
            os.makedirs(page_dir, exist_ok=True)

            with open(f"{page_dir}/summary.json", "w") as f:
                json.dump(summary, f, indent=2)

            with open(f"{page_dir}/ocr.md", "w") as f:
                f.write(ocr)

            with open(f"{page_dir}/translation.md", "w") as f:
                f.write(translation)

            summary["page_number"] = page_num
            all_summaries.append(summary)
        else:
            print(f"  [2] Error: {summary}")

    # Save all summaries
    with open(f"{OUTPUT_DIR}/all_summaries.json", "w") as f:
        json.dump(all_summaries, f, indent=2)

    print("\n" + "=" * 60)
    print(f"Summaries saved to: {OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    main()

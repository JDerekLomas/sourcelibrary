#!/usr/bin/env python3
"""
Translate remaining pages of Ehrenhart's book.
Fetches OCR text from the API and translates pages 5-12.
"""

import subprocess
import json
import time
import tempfile
import os

API_BASE = "https://book-translation-backend-391835035966.asia-south1.run.app"
BOOK_ID = "6909caa0cf28baa1b4cafc87"
TENANT = "ritman"

# Pages that need translation (5-12)
PAGES_TO_TRANSLATE = [
    {"num": 5, "id": "6909cab9cf28baa1b4cafc91"},
    {"num": 6, "id": "6909cabccf28baa1b4cafc93"},
    {"num": 7, "id": "6909cac0cf28baa1b4cafc95"},
    {"num": 8, "id": "6909cac4cf28baa1b4cafc97"},
    {"num": 9, "id": "6909cac7cf28baa1b4cafc99"},
    {"num": 10, "id": "6909cacbcf28baa1b4cafc9b"},
    {"num": 11, "id": "6909cacecf28baa1b4cafc9d"},
    {"num": 12, "id": "6909cad2cf28baa1b4cafc9f"},
]

def get_page_ocr(page_id):
    """Get OCR text for a page from the API"""
    cmd = [
        "curl", "-s", f"{API_BASE}/page/{page_id}",
        "-H", f"X-Tenant-Slug: {TENANT}",
        "--max-time", "30"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            data = json.loads(result.stdout)
            return data.get("ocr", {}).get("data", "")
        except:
            return ""
    return ""

def translate_page(page_id, ocr_text):
    """Translate OCR text using a temp file to handle special chars"""
    # Write text to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
        f.write(ocr_text)
        temp_path = f.name

    try:
        # Use @ to read from file
        cmd = [
            "curl", "-s", "-X", "POST", f"{API_BASE}/translate/",
            "-H", f"X-Tenant-Slug: {TENANT}",
            "-F", f"page_id={page_id}",
            "-F", f"text=<{temp_path}",
            "-F", "source_lang=German",
            "-F", "target_lang=English",
            "-F", "ai_model=gemini",
            "-F", "auto_save=true",
            "--max-time", "120"
        ]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode == 0:
            try:
                data = json.loads(result.stdout)
                return data
            except:
                # Try alternative: pass text directly but truncated
                return {"error": result.stdout}
        return {"error": result.stderr}
    finally:
        os.unlink(temp_path)

def translate_page_direct(page_id, ocr_text):
    """Direct translation via JSON body"""
    # Escape the text for JSON
    import urllib.request
    import ssl

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    data = json.dumps({
        "page_id": page_id,
        "text": ocr_text,
        "source_lang": "German",
        "target_lang": "English",
        "ai_model": "gemini",
        "auto_save": True
    }).encode('utf-8')

    req = urllib.request.Request(
        f"{API_BASE}/translate/",
        data=data,
        headers={
            "X-Tenant-Slug": TENANT,
            "Content-Type": "application/json"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=120, context=ctx) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

def main():
    print("=" * 60)
    print("Translating remaining pages (5-12)")
    print("=" * 60)

    for page in PAGES_TO_TRANSLATE:
        page_num = page["num"]
        page_id = page["id"]

        print(f"\n--- Page {page_num} ({page_id}) ---")

        # Get OCR text
        print("  [1] Fetching OCR...")
        ocr_text = get_page_ocr(page_id)
        if not ocr_text:
            print("  [ERROR] No OCR text found")
            continue
        print(f"  [1] Got {len(ocr_text)} chars")

        # Translate
        print("  [2] Translating...")
        result = translate_page_direct(page_id, ocr_text)

        if "translation" in result:
            print(f"  [2] Success: {len(result['translation'])} chars")
        else:
            print(f"  [2] Error: {result.get('error', result)}")

        time.sleep(3)  # Rate limit

    print("\n" + "=" * 60)
    print("Translation complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()

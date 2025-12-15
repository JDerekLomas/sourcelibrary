#!/usr/bin/env python3
"""
Process Ehrenhart's "Nosce te ipsum" book through the translation pipeline.
- Translate page 1 (has OCR)
- OCR pages 5-15
- Translate pages 5-15
"""

import subprocess
import json
import time

API_BASE = "https://book-translation-backend-391835035966.asia-south1.run.app"
BOOK_ID = "6909caa0cf28baa1b4cafc87"
TENANT = "ritman"

# Page data from the book
PAGES = [
    {"num": 1, "id": "6909caabcf28baa1b4cafc89", "has_ocr": True, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909caabcf28baa1b4cafc89/page_f52a845a-ee65-4db6-b759-f8a29f28c48d.jpg"},
    {"num": 2, "id": "6909caaecf28baa1b4cafc8b", "has_ocr": True, "has_trans": True, "photo": ""},
    {"num": 3, "id": "6909cab2cf28baa1b4cafc8d", "has_ocr": True, "has_trans": True, "photo": ""},
    {"num": 4, "id": "6909cab5cf28baa1b4cafc8f", "has_ocr": True, "has_trans": True, "photo": ""},
    {"num": 5, "id": "6909cab9cf28baa1b4cafc91", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cab9cf28baa1b4cafc91/page_495bb649-537e-48f5-8b1a-c6383ba05385.jpg"},
    {"num": 6, "id": "6909cabccf28baa1b4cafc93", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cabccf28baa1b4cafc93/page_44d8e6b9-0988-4af1-a575-1466b3adf2b6.jpg"},
    {"num": 7, "id": "6909cac0cf28baa1b4cafc95", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cac0cf28baa1b4cafc95/page_b8d6a655-03df-4d00-9df0-88fcaa2764d8.jpg"},
    {"num": 8, "id": "6909cac4cf28baa1b4cafc97", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cac4cf28baa1b4cafc97/page_9b78eb2b-4914-4f48-b3ee-72d3ee57b8cf.jpg"},
    {"num": 9, "id": "6909cac7cf28baa1b4cafc99", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cac7cf28baa1b4cafc99/page_7640ffc8-5abb-416d-b5c6-3d7c4cc678c0.jpg"},
    {"num": 10, "id": "6909cacbcf28baa1b4cafc9b", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cacbcf28baa1b4cafc9b/page_c9e8ed8b-aab8-4249-96fa-65bcb30964a3.jpg"},
    {"num": 11, "id": "6909cacecf28baa1b4cafc9d", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cacecf28baa1b4cafc9d/page_a3464385-e9d3-4a8b-92b5-a26f30c5e3b8.jpg"},
    {"num": 12, "id": "6909cad2cf28baa1b4cafc9f", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cad2cf28baa1b4cafc9f/page_81520c59-3206-48a5-9003-cfd8c445f59e.jpg"},
    {"num": 13, "id": "6909cad6cf28baa1b4cafca1", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cad6cf28baa1b4cafca1/page_637d1c86-f1ca-4234-940a-d2ced07cfe65.jpg"},
    {"num": 14, "id": "6909cad9cf28baa1b4cafca3", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cad9cf28baa1b4cafca3/page_60092276-5bb3-4d12-a845-91e34aff1a36.jpg"},
    {"num": 15, "id": "6909cadccf28baa1b4cafca5", "has_ocr": False, "has_trans": False, "photo": "https://book-translation-data.s3.amazonaws.com/6909caa0cf28baa1b4cafc87/6909cadccf28baa1b4cafca5/page_823ec777-a9dc-4869-a03f-595865c61755.jpg"},
]

def run_ocr(page_id, photo_url, language="German"):
    """Run OCR on a page"""
    cmd = [
        "curl", "-s", "-X", "POST", f"{API_BASE}/ocr/",
        "-H", f"X-Tenant-Slug: {TENANT}",
        "-F", f"page_id={page_id}",
        "-F", f"photo_url={photo_url}",
        "-F", f"language={language}",
        "-F", "ai_model=mistral",
        "-F", "auto_save=true",
        "--max-time", "120"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            return json.loads(result.stdout)
        except:
            return {"error": result.stdout}
    return {"error": result.stderr}

def run_translation(page_id, text, source_lang="German", target_lang="English"):
    """Run translation on OCR text"""
    cmd = [
        "curl", "-s", "-X", "POST", f"{API_BASE}/translate/",
        "-H", f"X-Tenant-Slug: {TENANT}",
        "-F", f"page_id={page_id}",
        "-F", f"text={text}",
        "-F", f"source_lang={source_lang}",
        "-F", f"target_lang={target_lang}",
        "-F", "ai_model=gemini",
        "-F", "auto_save=true",
        "--max-time", "120"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        try:
            return json.loads(result.stdout)
        except:
            return {"error": result.stdout}
    return {"error": result.stderr}

def get_page_ocr(page_id):
    """Get existing OCR for a page"""
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

def main():
    print("=" * 60)
    print("Processing Ehrenhart's 'Nosce te ipsum'")
    print("=" * 60)

    # Process pages that need work
    for page in PAGES:
        page_num = page["num"]
        page_id = page["id"]

        print(f"\n--- Page {page_num} ({page_id}) ---")

        # Skip pages 2-4 (already complete)
        if page["has_ocr"] and page["has_trans"]:
            print(f"  [SKIP] Already complete")
            continue

        # Run OCR if needed
        if not page["has_ocr"] and page["photo"]:
            print(f"  [OCR] Running OCR...")
            result = run_ocr(page_id, page["photo"])
            if "ocr" in result:
                print(f"  [OCR] Success: {len(result['ocr'])} chars")
                page["ocr_text"] = result["ocr"]
                time.sleep(2)  # Rate limit
            else:
                print(f"  [OCR] Error: {result}")
                continue
        elif page["has_ocr"]:
            # Get existing OCR
            print(f"  [OCR] Fetching existing OCR...")
            page["ocr_text"] = get_page_ocr(page_id)
            print(f"  [OCR] Found: {len(page.get('ocr_text', ''))} chars")

        # Run translation if we have OCR
        if page.get("ocr_text") and not page["has_trans"]:
            print(f"  [TRANS] Running translation...")
            result = run_translation(page_id, page["ocr_text"])
            if "translation" in result:
                print(f"  [TRANS] Success: {len(result['translation'])} chars")
                time.sleep(2)  # Rate limit
            else:
                print(f"  [TRANS] Error: {result}")

    print("\n" + "=" * 60)
    print("Processing complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()

import { useEffect, useState } from "react";
import { api } from "../api";

const emptyState = {
  books: [],
  pages: [],
};

export function TranslatorWorkspace() {
  const [books, setBooks] = useState(emptyState.books);
  const [pages, setPages] = useState(emptyState.pages);
  const [selectedBook, setSelectedBook] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [pageData, setPageData] = useState(null);
  const [context, setContext] = useState(null);
  const [ocrPrompt, setOcrPrompt] = useState("");
  const [translationPrompt, setTranslationPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    async function bootstrap() {
      const [prompts, bookList] = await Promise.all([
        api.getPrompts(),
        api.getBooks(),
      ]);
      setOcrPrompt(prompts.ocr_prompt);
      setTranslationPrompt(prompts.translation_prompt);
      setBooks(bookList);
      if (bookList.length) {
        setSelectedBook(bookList[0].id);
      }
    }
    bootstrap().catch((err) => setStatus(err.message));
  }, []);

  useEffect(() => {
    if (!selectedBook) return;
    async function loadPages() {
      const data = await api.getPages(selectedBook);
      setPages(data);
      if (data.length) {
        setSelectedPage(data[0].id);
      } else {
        setSelectedPage("");
      }
    }
    loadPages().catch((err) => setStatus(err.message));
  }, [selectedBook]);

  useEffect(() => {
    if (!selectedPage) {
      setPageData(null);
      setContext(null);
      setComments([]);
      return;
    }
    async function loadPage() {
      const [page, ctx, notes] = await Promise.all([
        api.getPage(selectedPage),
        api.getContext(selectedPage),
        api.listComments(selectedPage),
      ]);
      setPageData(page);
      setContext(ctx);
      setComments(notes);
    }
    loadPage().catch((err) => setStatus(err.message));
  }, [selectedPage]);

  async function handleRunOCR() {
    if (!pageData) return;
    setIsBusy(true);
    setStatus("Running OCR...");
    try {
      const updated = await api.runOCR({
        page_id: pageData.id,
        language: pageData.ocr_language,
        prompt: ocrPrompt.replace("{language}", pageData.ocr_language),
      });
      setPageData(updated);
      setStatus("OCR updated");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRunTranslation() {
    if (!pageData || !pageData.ocr_text) {
      setStatus("Run OCR first");
      return;
    }
    setIsBusy(true);
    setStatus("Translating...");
    try {
      const updated = await api.runTranslation({
        page_id: pageData.id,
        source_language: pageData.ocr_language,
        target_language: pageData.translation_language,
        prompt: translationPrompt
          .replace("{source_lang}", pageData.ocr_language)
          .replace("{target_lang}", pageData.translation_language)
          .replace("{text}", pageData.ocr_text ?? ""),
      });
      setPageData(updated);
      setStatus("Translation ready");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAddComment(event) {
    event.preventDefault();
    if (!pageData) return;
    const form = event.currentTarget;
    const author = form.author.value.trim() || "Translator";
    const body = form.body.value.trim();
    if (!body) return;
    await api.createComment(pageData.id, { author, body });
    const updatedComments = await api.listComments(pageData.id);
    setComments(updatedComments);
    form.reset();
  }

  const versions = pageData?.versions ?? [];

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Translator Workspace</h2>
          <p>Upload context, run OCR/translation, and review diffs.</p>
        </div>
        <div className="status-text">{status}</div>
      </header>

      <div className="selectors">
        <label>
          Book
          <select value={selectedBook} onChange={(e) => setSelectedBook(e.target.value)}>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Page
          <select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)}>
            {pages.map((page) => (
              <option key={page.id} value={page.id}>
                Page {page.page_number}
              </option>
            ))}
          </select>
        </label>
      </div>

      {pageData ? (
        <div className="workspace-grid">
          <div className="workspace-column">
            <img src={pageData.image_url} alt="Page facsimile" className="page-image" />
            <div className="context-cards">
              <ContextCard label="Previous" content={context?.previous_page?.ocr_text} />
              <ContextCard label="Current" content={pageData.ocr_text || "No OCR yet"} />
              <ContextCard label="Next" content={context?.next_page?.ocr_text} />
            </div>
            <form className="comment-form" onSubmit={handleAddComment}>
              <h4>Notes</h4>
              <input name="author" placeholder="Name" />
              <textarea name="body" placeholder="Leave guidance for reviewers" />
              <button type="submit">Add Comment</button>
            </form>
            <ul className="comment-list">
              {comments.map((comment) => (
                <li key={comment.id}>
                  <strong>{comment.author}</strong>
                  <p>{comment.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="workspace-column">
            <h3>OCR Prompt</h3>
            <textarea value={ocrPrompt} onChange={(e) => setOcrPrompt(e.target.value)} />
            <button disabled={isBusy} onClick={handleRunOCR}>
              Run OCR
            </button>
            <pre className="text-block">{pageData.ocr_text || "OCR output will appear here."}</pre>
          </div>

          <div className="workspace-column">
            <h3>Translation Prompt</h3>
            <textarea value={translationPrompt} onChange={(e) => setTranslationPrompt(e.target.value)} />
            <button disabled={isBusy} onClick={handleRunTranslation}>
              Run Translation
            </button>
            <pre className="text-block">
              {pageData.translation_text || "Run translation to populate this column."}
            </pre>
            <h4>Snapshots</h4>
            <ul className="history-list">
              {versions.map((version) => (
                <li key={version.version_id}>
                  <span>{new Date(version.created_at).toLocaleString()}</span>
                  <p>{version.note || "Captured"}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p>Select a page to start translating.</p>
      )}
    </section>
  );
}

function ContextCard({ label, content }) {
  return (
    <article className="context-card">
      <h4>{label}</h4>
      <p>{content || "—"}</p>
    </article>
  );
}

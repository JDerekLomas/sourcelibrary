import { useEffect, useState } from "react";
import { api } from "../api";

export function CurationAdmin() {
  const [books, setBooks] = useState([]);
  const [savingId, setSavingId] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const data = await api.getBooks();
    setBooks(data);
  }

  async function handlePublish(bookId, draft) {
    setSavingId(bookId);
    try {
      await api.publishBook(bookId, draft);
      await refresh();
    } finally {
      setSavingId("");
    }
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Library Curation & Admin</h2>
          <p>Assign DOIs, manage featuring, and expose approval requests.</p>
        </div>
      </header>

      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>DOI</th>
            <th>Featured</th>
            <th>Version</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <CurationRow key={book.id} book={book} onPublish={handlePublish} saving={savingId === book.id} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function CurationRow({ book, onPublish, saving }) {
  const [draft, setDraft] = useState({
    doi: book.doi || "",
    featured: book.featured,
    published_version_id: book.published_version_id || "",
  });

  useEffect(() => {
    setDraft({
      doi: book.doi || "",
      featured: book.featured,
      published_version_id: book.published_version_id || "",
    });
  }, [book]);

  return (
    <tr>
      <td>
        <strong>{book.title}</strong>
        <p>{book.author}</p>
      </td>
      <td>
        <input
          value={draft.doi}
          placeholder="Assign DOI"
          onChange={(e) => setDraft({ ...draft, doi: e.target.value })}
        />
      </td>
      <td>
        <label className="toggle">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
          />
          <span>{draft.featured ? "Featured" : "Hidden"}</span>
        </label>
      </td>
      <td>
        <input
          value={draft.published_version_id}
          placeholder="Version ID"
          onChange={(e) => setDraft({ ...draft, published_version_id: e.target.value })}
        />
      </td>
      <td>
        <button onClick={() => onPublish(book.id, draft)} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </td>
    </tr>
  );
}

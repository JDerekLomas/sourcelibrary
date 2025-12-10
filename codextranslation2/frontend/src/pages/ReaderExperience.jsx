import { useEffect, useState } from "react";
import { api } from "../api";

export function ReaderExperience() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    api.getBooks().then((data) => {
      setBooks(data);
      setFiltered(data);
    });
  }, []);

  useEffect(() => {
    if (!query) {
      setFiltered(books);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      books.filter((book) =>
        `${book.title} ${book.author} ${book.language} ${book.keywords.join(" ")}`
          .toLowerCase()
          .includes(q)
      )
    );
  }, [query, books]);

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <h2>Reader Experience</h2>
          <p>Discover curated texts, thumbnails, and translator insights.</p>
        </div>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, author, keyword"
        />
      </header>

      <div className="grid">
        {filtered.map((book) => (
          <article key={book.id} className="card">
            <div className="card__meta">
              <span className="pill">{book.language}</span>
              {book.featured && <span className="pill pill--accent">Featured</span>}
            </div>
            <h3>{book.title}</h3>
            <p>{book.author}</p>
            <small>{book.keywords.join(", ")}</small>
            <footer>
              <span>DOI: {book.doi || "pending"}</span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

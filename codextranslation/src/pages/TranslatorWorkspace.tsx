import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ComparisonViewer from '../components/ComparisonViewer';
import ContextPanel from '../components/ContextPanel';
import PageNavigator from '../components/PageNavigator';
import PromptPanel from '../components/PromptPanel';
import UploadManager from '../components/UploadManager';
import VersionPanel from '../components/VersionPanel';
import BookOverview from '../components/BookOverview';
import useWorkspaceState from '../hooks/useWorkspaceState';
import '../styles/workspace.css';

const TranslatorWorkspace: React.FC = () => {
  const {
    books,
    selectedBookId,
    setSelectedBookId,
    pages,
    currentPage,
    versions,
    setCurrentPage,
    updatePage,
    isLoading,
    error,
  } = useWorkspaceState();

  const selectedBook = books.find(book => book.id === selectedBookId);

  const handleOcrUpdate = (pageId: string, newOcr: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      updatePage(pageId, { ...page, ocrText: newOcr });
    }
  };

  const handleTranslationUpdate = (pageId: string, newTranslation: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      updatePage(pageId, { ...page, translationText: newTranslation });
    }
  };

  if (isLoading) {
    return <div className="workspace-loading">Loading workspace...</div>;
  }

  if (error) {
    return <div className="workspace-error">Error: {error}</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="workspace-grid">
        <header className="workspace-header">
          <h1>Translator Workspace</h1>
          <div className="book-selection">
            <label htmlFor="book-select">Select Book:</label>
            <select
              id="book-select"
              value={selectedBookId || ''}
              onChange={(e) => setSelectedBookId(e.target.value)}
              disabled={books.length === 0}
            >
              <option value="" disabled>
                {books.length > 0 ? 'Choose a book' : 'No books available'}
              </option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </div>
          {selectedBook && (
            <BookOverview
              title={selectedBook.title}
              author={selectedBook.author}
              publicationDate={selectedBook.publicationDate}
              canonicalId={selectedBook.canonicalId}
            />
          )}
        </header>

        <main className="workspace-main">
          {selectedBookId && pages.length > 0 ? (
            <ComparisonViewer
              page={pages[currentPage]}
              onOcrUpdate={handleOcrUpdate}
              onTranslationUpdate={handleTranslationUpdate}
            />
          ) : (
            <div className="workspace-placeholder">
              {selectedBookId ? 'No pages available for this book.' : 'Please select a book to start translating.'}
            </div>
          )}
        </main>

        <aside className="workspace-left-sidebar">
          {selectedBookId && pages.length > 0 && (
            <PageNavigator
              pages={pages}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          )}
        </aside>

        <aside className="workspace-right-sidebar">
          <ContextPanel />
          {selectedBookId && pages.length > 0 && (
            <PromptPanel
              bookId={selectedBookId}
              page={pages[currentPage]}
              updatePage={updatePage}
            />
          )}
          <VersionPanel versions={versions} />
          <UploadManager onFilesUpload={(files) => console.log(files)} />
        </aside>

        <footer className="workspace-footer">
          <p>Translator Workspace Footer</p>
        </footer>
      </div>
    </DndProvider>
  );
};

export default TranslatorWorkspace;
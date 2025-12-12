import React from 'react';
import { Page } from '../types';

interface ComparisonViewerProps {
  page: Page;
  onOcrUpdate: (pageId: string, newOcr: string) => void;
  onTranslationUpdate: (pageId: string, newTranslation: string) => void;
}

const ComparisonViewer: React.FC<ComparisonViewerProps> = ({ page, onOcrUpdate, onTranslationUpdate }) => {
  if (!page) {
    return <div className="comparison-viewer-empty">Select a page to view</div>;
  }

  return (
    <div className="comparison-viewer">
      <div className="viewer-column image-column">
        <h3>Source Image</h3>
        <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} style={{ maxWidth: '100%' }} />
      </div>
      <div className="viewer-column ocr-column">
        <h3>OCR Text (Editable)</h3>
        <textarea
          value={page.ocrText}
          onChange={(e) => onOcrUpdate(page.id, e.target.value)}
          rows={20}
          style={{ width: '100%', fontFamily: 'monospace' }}
        />
      </div>
      <div className="viewer-column translation-column">
        <h3>Translation (Editable)</h3>
        <textarea
          value={page.translationText}
          onChange={(e) => onTranslationUpdate(page.id, e.target.value)}
          rows={20}
          style={{ width: '100%', fontFamily: 'sans-serif' }}
        />
      </div>
    </div>
  );
};

export default ComparisonViewer;
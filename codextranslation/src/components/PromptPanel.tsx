import React, { useState } from 'react';
import { Page } from '../types';
import { translatePage } from '../services/api';

interface PromptPanelProps {
  bookId: string;
  page: Page;
  updatePage: (pageId: string, updatedPage: Partial<Page>) => void;
}

const PromptPanel: React.FC<PromptPanelProps> = ({ bookId, page, updatePage }) => {
  const [targetLanguage, setTargetLanguage] = useState('en'); // Default to English
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const handleTranslate = async () => {
    if (!bookId || !page || !page.id || !targetLanguage) {
      setTranslationError('Missing book ID, page, or target language.');
      return;
    }

    setIsTranslating(true);
    setTranslationError(null);

    try {
      const translatedContent = await translatePage(bookId, page.id, targetLanguage);
      // Assuming translatedContent contains a field like 'translated_text'
      if (translatedContent && translatedContent.translated_text) {
        updatePage(page.id, { translationText: translatedContent.translated_text });
      } else {
        // If the backend returns the whole page object after translation
        updatePage(page.id, { translationText: translatedContent.translationText });
      }
    } catch (err) {
      setTranslationError('Failed to get translation. Please try again.');
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="prompt-panel">
      <h3>AI Prompts & Translation</h3>
      
      {/* Assuming OCR Prompt and Translation Prompt are still relevant, keep them */}
      <div className="prompt-group">
        <label htmlFor="target-language">Target Language</label>
        <select
          id="target-language"
          value={targetLanguage}
          onChange={(e) => setTargetLanguage(e.target.value)}
          disabled={isTranslating}
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          {/* Add more languages as supported by the backend */}
        </select>
      </div>

      <button onClick={handleTranslate} disabled={isTranslating}>
        {isTranslating ? 'Translating...' : 'Translate Page'}
      </button>
      {translationError && <p style={{ color: 'red' }}>{translationError}</p>}
    </div>
  );
};

export default PromptPanel;
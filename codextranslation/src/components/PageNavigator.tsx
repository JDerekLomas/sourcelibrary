import React from 'react';
import { Page } from '../types';

interface PageNavigatorProps {
  pages: Page[];
  currentPage: number;
  onPageChange: (pageIndex: number) => void;
}

const PageNavigator: React.FC<PageNavigatorProps> = ({ pages, currentPage, onPageChange }) => {
  return (
    <div className="page-navigator">
      <h3>Pages</h3>
      <div className="thumbnail-list">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className={`thumbnail-item ${index === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(index)}
          >
            <img src={page.imageUrl} alt={`Page ${page.pageNumber}`} />
            <span>Page {page.pageNumber}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageNavigator;
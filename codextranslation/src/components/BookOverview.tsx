import React from 'react';

interface BookOverviewProps {
  title: string;
  author: string;
  publicationDate: string;
  canonicalId: string;
}

const BookOverview: React.FC<BookOverviewProps> = ({ title, author, publicationDate, canonicalId }) => {
  return (
    <div>
      <h2>{title}</h2>
      <p><strong>Author:</strong> {author}</p>
      <p><strong>Date:</strong> {publicationDate}</p>
      <p><strong>ID:</strong> {canonicalId}</p>
    </div>
  );
};

export default BookOverview;
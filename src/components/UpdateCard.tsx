import React from 'react';

export interface Update {
  id: string;
  title: string;
  published: string;
  contentSnippet: string;
  link: string;
  categories: string[];
}

export default function UpdateCard({ update }: { update: Update }) {
  // Format the date nicely
  const date = new Date(update.published);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);

  return (
    <a href={update.link} target="_blank" rel="noopener noreferrer" className="update-card">
      <div className="update-card-date">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        {formattedDate}
      </div>
      <h2 className="update-card-title">{update.title}</h2>
      <p className="update-card-snippet">{update.contentSnippet}</p>
      
      {update.categories && update.categories.length > 0 && (
        <div className="update-card-categories">
          {update.categories.slice(0, 3).map((category) => (
            <span key={category} className="category-tag">
              {category}
            </span>
          ))}
          {update.categories.length > 3 && (
            <span className="category-tag">+{update.categories.length - 3}</span>
          )}
        </div>
      )}
    </a>
  );
}

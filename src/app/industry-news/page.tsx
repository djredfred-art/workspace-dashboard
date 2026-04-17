import React from 'react';
import Parser from 'rss-parser';

export const revalidate = 3600;

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  source?: string;
}

async function getIndustryNews(): Promise<NewsItem[]> {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=schools+technology+AI+Google&hl=en-US&gl=US&ceid=US:en');
    
    return feed.items.map(item => {
      // Very basic HTML stripping for snippet
      let snippet = (item.contentSnippet || item.content || '').replace(/<[^>]*>?/gm, '');
      snippet = snippet.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      if (snippet.length > 150) snippet = snippet.substring(0, 147) + '...';

      return {
        id: item.guid || item.link || String(Math.random()),
        title: item.title || 'No Title',
        link: item.link || '#',
        pubDate: item.pubDate || new Date().toISOString(),
        contentSnippet: snippet,
        source: item.creator || item.source || 'Google News'
      };
    });
  } catch (error) {
    console.error('Error fetching industry news:', error);
    return [];
  }
}

export default async function IndustryNews() {
  const news = await getIndustryNews();

  return (
    <main>
      <header className="dashboard-header">
        <h1>Industry News</h1>
        <p>Latest articles about schools, AI, and Google technology from around the web.</p>
      </header>

      <div className="container">
        {news.length === 0 ? (
          <div className="error-container">
            <h3>Unable to load news</h3>
            <p>We couldn't fetch the latest industry news at this time. Please try again later.</p>
          </div>
        ) : (
          <div className="updates-grid">
            {news.map((item) => {
              const date = new Date(item.pubDate);
              const formattedDate = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              }).format(date);

              return (
                <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="update-card">
                  <div className="update-card-date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {formattedDate}
                  </div>
                  <h2 className="update-card-title">{item.title}</h2>
                  <p className="update-card-snippet">{item.contentSnippet}</p>
                  <div className="update-card-categories">
                    <span className="category-tag">{item.source}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

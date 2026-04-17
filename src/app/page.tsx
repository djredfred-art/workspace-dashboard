import React from 'react';
import UpdateCard, { Update } from '@/components/UpdateCard';

export const revalidate = 3600; // revalidate every hour

async function getUpdates(): Promise<Update[]> {
  try {
    const res = await fetch('https://workspaceupdates.googleblog.com/feeds/posts/default?alt=json', {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch updates: ${res.status}`);
    }

    const data = await res.json();
    const entries = data.feed.entry || [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allUpdates = entries.map((entry: any) => {
      const title = entry.title?.$t || 'Untitled Update';
      const published = entry.published?.$t || new Date().toISOString();
      const content = entry.content?.$t || entry.summary?.$t || '';
      
      // Extract main link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const linkObj = entry.link?.find((l: any) => l.rel === 'alternate');
      const link = linkObj ? linkObj.href : '#';

      // Extract categories
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const categories = entry.category ? entry.category.map((c: any) => c.term).filter((c: string) => !c.includes('http')) : [];

      // Very basic HTML stripping for the snippet
      let text = content.replace(/<[^>]*>?/gm, '');
      text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      const contentSnippet = text.length > 150 ? text.substring(0, 147) + '...' : text;

      return {
        id: entry.id?.$t || link,
        title,
        published,
        contentSnippet,
        link,
        categories,
        rawContent: content
      };
    });

    // Filter to only include updates relevant to schools (look for "Education" in title, snippet, or content)
    return allUpdates.filter((update: any) => {
      const searchString = `${update.title} ${update.contentSnippet} ${update.rawContent}`.toLowerCase();
      return searchString.includes('education');
    });
  } catch (error) {
    console.error('Error fetching workspace updates:', error);
    return [];
  }
}

export default async function Dashboard() {
  const updates = await getUpdates();

  return (
    <main>
      <header className="dashboard-header">
        <h1>Google Workspace Updates</h1>
        <p>Daily breakdown of important Workspace updates for K12 and Higher Ed institutions.</p>
      </header>

      <div className="container">
        {updates.length === 0 ? (
          <div className="error-container">
            <h3>Unable to load updates</h3>
            <p>We couldn't fetch the latest Google Workspace updates at this time. Please check your connection or try again later.</p>
          </div>
        ) : (
          <div className="updates-grid">
            {updates.map((update) => (
              <UpdateCard key={update.id} update={update} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

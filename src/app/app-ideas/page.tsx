'use client';

import React, { useState, useEffect } from 'react';

interface Idea {
  title: string;
  problem: string;
  solution: string;
}

export default function AppIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchIdeas() {
      try {
        const res = await fetch('/api/analyze-news');
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to analyze news');
        }
        
        if (data.ideas) {
          setIdeas(data.ideas);
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchIdeas();
  }, []);

  return (
    <main>
      <header className="dashboard-header">
        <h1>AI App Ideas</h1>
        <p>Brainstorming innovative EdTech solutions based on today's news.</p>
      </header>

      <div className="container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Gemini is reading the news and brainstorming...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h3>Analysis Failed</h3>
            <p>{error}</p>
            <p style={{marginTop: '1rem', fontSize: '0.9em'}}>Make sure your GEMINI_API_KEY is configured in your environment variables.</p>
          </div>
        ) : (
          <div className="updates-grid">
            {ideas.map((idea, idx) => (
              <div key={idx} className="update-card">
                <div className="update-card-date">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  App Concept
                </div>
                <h2 className="update-card-title" style={{ color: '#a78bfa' }}>{idea.title}</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: '#fca5a5' }}>Problem:</strong> 
                  <p className="update-card-snippet" style={{ display: 'inline', marginLeft: '0.5rem' }}>{idea.problem}</p>
                </div>
                <div>
                  <strong style={{ color: '#6ee7b7' }}>Solution:</strong> 
                  <p className="update-card-snippet" style={{ marginTop: '0.5rem' }}>{idea.solution}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

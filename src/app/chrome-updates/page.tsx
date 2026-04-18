'use client';

import React, { useState, useEffect } from 'react';

interface ChromeUpdate {
  title: string;
  summary: string;
  k12Importance: string;
  link: string;
}

export default function ChromeUpdates() {
  const [updates, setUpdates] = useState<ChromeUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const res = await fetch('/api/chrome-updates');
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch Chrome updates');
        }
        
        if (data.updates) {
          setUpdates(data.updates);
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUpdates();
  }, []);

  return (
    <main>
      <header className="dashboard-header">
        <h1>Chrome OS & Browser Updates</h1>
        <p>Latest Stable release notes analyzed for K-12 environments.</p>
      </header>

      <div className="container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Analyzing the latest Chrome Release Notes...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h3>Analysis Failed</h3>
            <p>{error}</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="error-container">
            <h3>No Updates Found</h3>
            <p>Could not find any recent Stable Chrome releases.</p>
          </div>
        ) : (
          <div className="updates-grid" style={{ gridTemplateColumns: '1fr' }}>
            {updates.map((update, idx) => (
              <div key={idx} className="update-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h2 className="update-card-title" style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: '#60a5fa' }}>{update.title}</h2>
                  <p style={{ color: '#e5e7eb', lineHeight: '1.6', fontSize: '1.05rem' }}>{update.summary}</p>
                </div>
                
                <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #f472b6', marginTop: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#f472b6' }}>🏫 Why it matters for K-12</h3>
                  <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#d1d5db' }}>{update.k12Importance}</p>
                </div>
                
                <a href={update.link} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9em', display: 'inline-block' }}>Read Official Release Notes &rarr;</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

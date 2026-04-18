'use client';

import React, { useState, useEffect } from 'react';

interface Recommendation {
  title: string;
  summary: string;
  link: string;
  k12Staff: string;
  k12Students: string;
  higherEd: string;
}

export default function BestPractices() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchRecs() {
      try {
        const res = await fetch('/api/best-practices');
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to generate best practices');
        }
        
        if (data.recommendations) {
          setRecs(data.recommendations);
        } else {
          throw new Error('Unexpected response format');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRecs();
  }, []);

  return (
    <main>
      <header className="dashboard-header">
        <h1>Admin Best Practices</h1>
        <p>Expert consulting advice on how to configure the newest Admin Console settings.</p>
      </header>

      <div className="container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Our AI Consultant is analyzing the latest Admin settings...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <h3>Analysis Failed</h3>
            <p>{error}</p>
          </div>
        ) : recs.length === 0 ? (
          <div className="error-container">
            <h3>No Updates Found</h3>
            <p>Could not find any recent Google Workspace updates regarding Admin settings.</p>
          </div>
        ) : (
          <div className="updates-grid" style={{ gridTemplateColumns: '1fr' }}>
            {recs.map((rec, idx) => (
              <div key={idx} className="update-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <h2 className="update-card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fcd34d' }}>{rec.title}</h2>
                  <p style={{ color: '#9ca3af', lineHeight: '1.6' }}>{rec.summary}</p>
                  <a href={rec.link} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9em', display: 'inline-block', marginTop: '0.5rem' }}>Read Official Update &rarr;</a>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #60a5fa' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#60a5fa' }}>🏫 K-12 Staff</h3>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#e5e7eb' }}>{rec.k12Staff}</p>
                  </div>
                  
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #34d399' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#34d399' }}>🎒 K-12 Students</h3>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#e5e7eb' }}>{rec.k12Students}</p>
                  </div>

                  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid #a78bfa' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: '#a78bfa' }}>🎓 Higher Ed</h3>
                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#e5e7eb' }}>{rec.higherEd}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

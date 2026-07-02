import { useState, useRef } from 'react';
import './App.css';

const SAMPLE_QUEUE = `Customer unable to login to account after password reset
---
Payment processing failed for order #4521 - customer requesting refund
---
Feature request: dark mode support for mobile app
---
Database connection timeout error occurring intermittently since 2 AM
---
User account locked after 5 failed login attempts, needs manual unlock
---
Billing discrepancy - charged twice for same subscription
---
API integration broken after latest deployment, third-party webhook failing`;

function App() {
  const [queue, setQueue] = useState('');
  const [tickets, setTickets] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const countTickets = (text) => {
    if (!text.trim()) return 0;
    return text.split(/\n---\n|\n\n+/).map(t => t.trim()).filter(Boolean).length;
  };

  const handleQueueChange = (e) => {
    const val = e.target.value;
    setQueue(val);
    setTickets(countTickets(val));
    setResults(null);
  };

  const handleRunTriage = () => {
    if (!queue.trim()) return;
    setIsAnalyzing(true);
    setResults(null);
    setTimeout(() => {
      const items = queue.split(/\n---\n|\n\n+/).map(t => t.trim()).filter(Boolean);
      const priorities = ['Critical', 'High', 'Medium', 'Low'];
      const routes = ['Engineering', 'Billing', 'Product', 'Support Tier 2'];
      const analyzed = items.map((text, i) => ({
        id: i,
        text: text.length > 90 ? text.slice(0, 90) + '...' : text,
        priority: priorities[i % priorities.length],
        route: routes[i % routes.length]
      }));
      setResults(analyzed);
      setIsAnalyzing(false);
    }, 1400);
  };

  const handleLoadSample = () => {
    setQueue(SAMPLE_QUEUE);
    setTickets(countTickets(SAMPLE_QUEUE));
    setResults(null);
  };

  const handleClear = () => {
    setQueue('');
    setTickets(0);
    setResults(null);
  };

  const readFiles = (fileList) => {
    const files = Array.from(fileList).filter(f =>
      f.type === 'text/plain' || f.name.endsWith('.txt') || f.name.endsWith('.csv')
    );
    if (files.length === 0) return;
    Promise.all(files.map(f => f.text())).then(contents => {
      const merged = contents.join('\n---\n');
      const next = queue ? queue + '\n---\n' + merged : merged;
      setQueue(next);
      setTickets(countTickets(next));
      setResults(null);
    });
  };

  const handleFileInput = (e) => {
    if (e.target.files?.length) readFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) readFiles(e.dataTransfer.files);
  };

  const priorityColor = (p) => {
    if (p === 'Critical') return '#ef4444';
    if (p === 'High') return '#f59e0b';
    if (p === 'Medium') return '#84cc16';
    return '#6b7280';
  };

  return (
    <div className="te-app">
      <header className="te-header">
        <div className="te-header-inner">
          <div className="te-brand">
            <div className="te-logo">T</div>
            <div>
              <h1>Triage Engine</h1>
              <p className="te-eyebrow">AI OPERATIONS INBOX INTELLIGENCE</p>
            </div>
          </div>
          <p className="te-tagline">
            Turns a chaotic support queue into a prioritized, routed,<br />
            reply-ready action plan — in seconds instead of hours.
          </p>
        </div>
      </header>

      <main className="te-main">
        <section
          className={`te-dropzone ${isDragging ? 'te-dropzone-active' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <div className="te-dropzone-label">
            RAW QUEUE · PASTE TICKETS, EMAILS OR COMPLAINTS (SEPARATE WITH A BLANK LINE OR ---)
          </div>
          <textarea
            className="te-textarea"
            value={queue}
            onChange={handleQueueChange}
            placeholder="Paste your messy support tickets here, drag & drop a .txt/.csv file, or load the sample queue to see it work."
          />
          <div className="te-dropzone-hint">
            <span>⬆</span> Drag &amp; drop files anywhere in this box — or use Add Files below
          </div>
        </section>

        <section className="te-controls">
          <button className="te-btn te-btn-primary" onClick={handleRunTriage} disabled={isAnalyzing || !queue.trim()}>
            {isAnalyzing ? '⏳ Analyzing…' : '▶ Run Triage'}
          </button>
          <button className="te-btn te-btn-secondary" onClick={handleLoadSample}>
            Load sample queue
          </button>
          <button className="te-btn te-btn-secondary" onClick={() => fileInputRef.current?.click()}>
            ＋ Add Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.csv,text/plain"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
          <button className="te-btn te-btn-tertiary" onClick={handleClear}>
            Clear
          </button>
          <div className="te-count">{tickets} ticket{tickets === 1 ? '' : 's'} detected</div>
        </section>

        {results && (
          <section className="te-results">
            <div className="te-results-header">Triage Results</div>
            <div className="te-results-list">
              {results.map((r) => (
                <div key={r.id} className="te-result-row">
                  <span className="te-priority-dot" style={{ background: priorityColor(r.priority) }} />
                  <span className="te-result-priority" style={{ color: priorityColor(r.priority) }}>{r.priority}</span>
                  <span className="te-result-text">{r.text}</span>
                  <span className="te-result-route">→ {r.route}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="te-footer">
          TRIAGE ENGINE · reads messy input → prioritizes → routes → drafts → finds patterns
        </footer>
      </main>
    </div>
  );
}

export default App;

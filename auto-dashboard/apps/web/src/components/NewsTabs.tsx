'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, NewsItem } from '@/lib/api';

const TAGS = ['Launches', 'Analysis', 'Deal', 'Dealership', 'Forecast', 'Technology & Innovation'];

export default function NewsTabs() {
  const [tag, setTag] = useState(TAGS[0]);
  const { data, isLoading, error } = useQuery({
    queryKey: ['news', tag],
    queryFn: () => api<NewsItem[]>(`/dashboard/news?tag=${encodeURIComponent(tag)}`),
  });

  return (
    <section className="panel">
      <h2>News and Forecast</h2>
      <div className="tabs" role="tablist">
        {TAGS.map((t) => (
          <button key={t} role="tab" aria-selected={tag === t}
            className={`tab ${tag === t ? 'active' : ''}`} onClick={() => setTag(t)}>{t}</button>
        ))}
      </div>
      {isLoading && <div className="status">Loading…</div>}
      {error && <div className="status err">Could not load data</div>}
      {data && data.length === 0 && <div className="empty">No Data Reported</div>}
      {data && data.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '18px 0 0' }}>
          {data.map((a) => (
            <li key={a._id} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
              <strong>{a.title}</strong>
              <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
                {new Date(a.publishedAt).toLocaleDateString('en-IN')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

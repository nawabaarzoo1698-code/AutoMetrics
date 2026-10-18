'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, SupplierPage } from '@/lib/api';

const PAGE_SIZE = 8;

export default function SupplierCarousel() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', page],
    queryFn: () => api<SupplierPage>(`/dashboard/suppliers?page=${page}&limit=${PAGE_SIZE}`),
    placeholderData: (prev) => prev,
  });
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <section className="panel">
      <div className="head-row">
        <h2>Suppliers on AutoMetrics</h2>
        <a href="#" style={{ color: 'var(--muted)' }}>View All Suppliers</a>
      </div>
      {isLoading && <div className="status">Loading…</div>}
      {error && <div className="status err">Could not load data</div>}
      {data && (
        <>
          <div className="carousel">
            {data.items.map((s) => (
              <div className="sup" key={s._id}>
                <div className="logo-box">{s.name.charAt(0)}</div>
                {s.name}
              </div>
            ))}
          </div>
          <div className="pager">
            <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>‹ Prev</button>
            <span style={{ alignSelf: 'center' }}>{page} / {pages}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= pages}>Next ›</button>
          </div>
        </>
      )}
    </section>
  );
}

'use client';
import { useQuery } from '@tanstack/react-query';
import { api, DealerRow } from '@/lib/api';

export default function DealersTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dealers'],
    queryFn: () => api<DealerRow[]>('/dashboard/dealers'),
  });

  return (
    <section className="panel">
      <h2>Dealers on AutoMetrics</h2>
      {isLoading && <div className="status">Loading…</div>}
      {error && <div className="status err">Could not load data</div>}
      {data && (
        <table className="t">
          <thead><tr><th>Name</th><th className="r">Network</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.name}><td>{d.name}</td><td className="r">{d.network}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

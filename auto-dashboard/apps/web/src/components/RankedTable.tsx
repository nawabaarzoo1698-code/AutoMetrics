'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, Ranked } from '@/lib/api';
import { fmtUnits } from '@/lib/format';
import Pct from './Pct';
import MonthSelect from './MonthSelect';

type Tab = { label: string; segment: 'PV' | '2W' | '3W' | 'CV' };

// Generic ranked list: top models and top OEMs share it.
export default function RankedTable({ title, endpoint, tabs, defaultMonth }: {
  title: string; endpoint: 'top-models' | 'top-oems'; tabs: Tab[]; defaultMonth: string;
}) {
  const [month, setMonth] = useState(defaultMonth);
  const [segment, setSegment] = useState(tabs[0].segment);

  const { data, isLoading, error } = useQuery({
    queryKey: [endpoint, month, segment],
    queryFn: () => api<Ranked[]>(`/dashboard/${endpoint}?month=${month}&segment=${segment}`),
    enabled: !!month,
  });

  return (
    <section className="panel">
      <div className="head-row">
        <h2>{title}</h2>
        <MonthSelect value={month} onChange={setMonth} label={`${title} month`} />
      </div>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.segment} role="tab" aria-selected={segment === t.segment}
            className={`tab ${segment === t.segment ? 'active' : ''}`} onClick={() => setSegment(t.segment)}>
            {t.label}
          </button>
        ))}
      </div>
      {isLoading && <div className="status">Loading…</div>}
      {error && <div className="status err">Could not load data</div>}
      {data && data.length === 0 && <div className="empty">No Data Reported</div>}
      {data && data.length > 0 && (
        <table className="t">
          <thead><tr><th>Name</th><th className="r">Units sold</th><th className="r">Month change</th></tr></thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.name}>
                <td>{r.name}</td>
                <td className="r">{fmtUnits(r.units)}</td>
                <td className="r"><Pct value={r.changePct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

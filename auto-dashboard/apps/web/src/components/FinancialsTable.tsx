'use client';
import { useQuery } from '@tanstack/react-query';
import { api, Financial } from '@/lib/api';
import { fmtCr } from '@/lib/format';
import Pct from './Pct';

export default function FinancialsTable({ fy = 2023 }: { fy?: number }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['financials', fy],
    queryFn: () => api<Financial[]>(`/dashboard/financials?fy=${fy}`),
  });

  return (
    <section className="panel">
      <h2>Revenue &amp; Net Profit for OEMs (FY {String(fy).slice(-2)})</h2>
      {isLoading && <div className="status">Loading…</div>}
      {error && <div className="status err">Could not load data</div>}
      {data && (
        <table className="t">
          <thead><tr><th>OEM</th><th className="r">Revenue</th><th className="r">Net profit</th></tr></thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.oem}>
                <td>{r.oem}</td>
                <td className="r">{fmtCr(r.revenueCr)}<span className="sub"><Pct value={r.revenueGrowthPct} /></span></td>
                <td className="r">{fmtCr(r.netProfitCr)}<span className="sub"><Pct value={r.profitGrowthPct} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

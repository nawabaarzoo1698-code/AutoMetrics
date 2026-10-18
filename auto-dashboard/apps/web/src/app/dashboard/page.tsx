'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api, auth, Summary } from '@/lib/api';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import StatCard from '@/components/StatCard';
import RankedTable from '@/components/RankedTable';
import FinancialsTable from '@/components/FinancialsTable';
import SupplierCarousel from '@/components/SupplierCarousel';
import DealersTable from '@/components/DealersTable';
import NewsTabs from '@/components/NewsTabs';
import { useMonths } from '@/components/MonthSelect';

function useSummary(month: string) {
  return useQuery({
    queryKey: ['summary', month],
    queryFn: () => api<Summary>(`/dashboard/summary?month=${month}`),
  });
}

// Each stat card has its own month picker, like the original.
function SummaryRow({ latest }: { latest: string }) {
  const [months, setMonths] = useState({ production: latest, domesticSales: latest, exports: latest });
  const prod = useSummary(months.production);
  const sales = useSummary(months.domesticSales);
  const exp = useSummary(months.exports);

  return (
    <section className="panel">
      <div className="grid3">
        <StatCard title="Domestic Production" card={prod.data?.production} month={months.production}
          onMonth={(m) => setMonths((s) => ({ ...s, production: m }))} />
        <StatCard title="Domestic Sales" card={sales.data?.domesticSales} month={months.domesticSales}
          onMonth={(m) => setMonths((s) => ({ ...s, domesticSales: m }))} />
        <StatCard title="Exports" card={exp.data?.exports} month={months.exports}
          onMonth={(m) => setMonths((s) => ({ ...s, exports: m }))} />
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const { data: months } = useMonths();

  useEffect(() => {
    if (!auth.getToken()) router.replace('/login');
    else setReady(true);
  }, [router]);

  if (!ready) return null;
  const latest = months?.[0];

  return (
    <>
      <TopBar />
      <main className="page">
        <div className="crumbs">AutoMetrics &gt; <span className="cur">Home</span></div>
        {!latest ? (
          <div className="panel status">Loading dashboard… (is the API running and seeded?)</div>
        ) : (
          <>
            <SummaryRow latest={latest} />
            <div className="split">
              <FinancialsTable fy={2023} />
              <SupplierCarousel />
            </div>
            <div className="grid2" style={{ marginBottom: 28 }}>
              <RankedTable title="Top Selling Models" endpoint="top-models" defaultMonth={latest}
                tabs={[{ label: 'Passenger Vehicles', segment: 'PV' }, { label: 'Two Wheelers', segment: '2W' }]} />
              <RankedTable title="Top Selling OEMs" endpoint="top-oems" defaultMonth={latest}
                tabs={[{ label: 'Commercial Vehicles', segment: 'CV' }, { label: 'Passenger Vehicles', segment: 'PV' }, { label: 'Two Wheelers', segment: '2W' }]} />
            </div>
            <div className="grid2">
              <NewsTabs />
              <DealersTable />
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { fmtMonth } from '@/lib/format';

export function useMonths() {
  return useQuery({ queryKey: ['months'], queryFn: () => api<string[]>('/dashboard/months') });
}

export default function MonthSelect({ value, onChange, label = 'Select month' }: {
  value: string; onChange: (m: string) => void; label?: string;
}) {
  const { data: months = [] } = useMonths();
  return (
    <select className="monthpick" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      {months.map((m) => <option key={m} value={m}>{fmtMonth(m)}</option>)}
    </select>
  );
}

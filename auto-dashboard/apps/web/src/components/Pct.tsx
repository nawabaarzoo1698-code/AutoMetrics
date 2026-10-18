// Red down arrow / green up arrow, like the original dashboard.
export default function Pct({ value, large = false }: { value: number | null; large?: boolean }) {
  if (value === null) return <span className={`flat ${large ? 'pct-lg' : ''}`}>n/a</span>;
  const cls = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : '';
  const text = large ? `${Math.abs(value).toFixed(2)}%` : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  return <span className={`${cls} ${large ? 'pct-lg' : ''}`}>{text} {arrow}</span>;
}

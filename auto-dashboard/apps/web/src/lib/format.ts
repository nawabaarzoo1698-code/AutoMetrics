export const fmtUnits = (n: number) => n.toLocaleString('en-IN');

export function fmtMonth(m: string): string {
  const [y, mo] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString('en-US', {
    month: 'short', year: 'numeric', timeZone: 'UTC',
  });
}

export const fmtCr = (n: number) => `${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })} CR`;

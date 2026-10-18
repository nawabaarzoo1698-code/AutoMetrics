const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'ad_token';
const USER_KEY = 'ad_user';

export type StoredUser = { name: string; email: string };

export const auth = {
  getToken: () => (typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY)),
  getUser: (): StoredUser | null => {
    if (typeof window === 'undefined') return null;
    try { return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null'); } catch { return null; }
  },
  save: (token: string, user: StoredUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = auth.getToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401 && typeof window !== 'undefined' && path !== '/auth/login') {
    auth.clear();
    window.location.href = '/login';
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

// ---- response types (mirror the API) ----
export type Child = { name: string; units: number; changePct: number | null };
export type Group = Child & { segment: string; children: Child[] };
export type Card = { metric: string; month: string; totalUnits: number; changePct: number | null; groups: Group[] };
export type Summary = { month: string; production: Card; domesticSales: Card; exports: Card };
export type Ranked = { name: string; units: number; changePct: number | null };
export type Financial = {
  oem: string; revenueCr: number; netProfitCr: number; revenueGrowthPct: number; profitGrowthPct: number;
};
export type Supplier = { _id: string; name: string; products: string[] };
export type SupplierPage = { items: Supplier[]; total: number; page: number; limit: number };
export type DealerRow = { name: string; network: number };
export type NewsItem = { _id: string; title: string; body?: string; tag: string; publishedAt: string };

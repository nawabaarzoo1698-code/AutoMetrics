'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, auth, StoredUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api<{ token: string; user: StoredUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      auth.save(res.token, res.user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>Auto<span style={{ color: 'var(--brand)' }}>Metrics</span></h1>
        <p>Sign in to view the dashboard</p>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="err" style={{ marginTop: 12 }}>{error}</div>}
        <button className="go" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <div className="hint">Demo account is prefilled (from the seed script).</div>
      </form>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

const NAV = ['Vehicle Trends', 'Retail Sales', 'Search Suppliers', 'Search OEMs', 'Compare', 'Archive', 'Reports', 'Contact Us'];

export default function TopBar() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => { setName(auth.getUser()?.name ?? ''); }, []);

  function logout() {
    auth.clear();
    router.replace('/login');
  }

  return (
    <>
      <header className="topbar">
        <Link href="/dashboard" className="logo">Auto<span>Metrics</span></Link>
        <form className="search" onSubmit={(e) => e.preventDefault()}>
          <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          <button type="submit" aria-label="Search">🔍</button>
        </form>
        <div className="usermenu">
          <button onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
            <span className="avatar">{name.charAt(0).toUpperCase() || '?'}</span>
            Hi, {name || 'there'} ▾
          </button>
          {open && (
            <div className="dropdown" role="menu">
              <button onClick={logout} role="menuitem">Log out</button>
            </div>
          )}
        </div>
      </header>
      <nav className="nav">
        <Link href="/dashboard" className="home" aria-label="Home">🏠</Link>
        {NAV.map((n) => <a key={n} href="#">{n}</a>)}
      </nav>
    </>
  );
}

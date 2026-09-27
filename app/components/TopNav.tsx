'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '../../lib/supabase/client';

type Account = {
  authenticated: boolean;
  plan?: 'free' | 'paid' | 'admin';
  generationCredits?: number;
};

export default function TopNav() {
  const pathname = usePathname();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((res) => res.json())
      .then(setAccount)
      .catch(() => setAccount({ authenticated: false }));
  }, []);

  const isPaid = account?.plan === 'paid' || account?.plan === 'admin';

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const items = [
    { href: '/', label: 'Karakterek' },
    ...(isPaid ? [{ href: '/character/new', label: 'Karakter létrehozása' }] : []),
    { href: '/credits', label: 'Kreditek' },
    { href: '/presets', label: 'Presetek' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="shrink-0 [font-family:var(--font-montserrat)] text-sm font-bold italic tracking-[-0.02em] text-zinc-300"
        >
          Vállalhatatlan<span className="text-xl">🐰</span>
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Fő navigáció">
          {items.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors md:text-sm ${
                  active
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {account?.authenticated && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500">{account.generationCredits ?? 0} kredit</span>
            <button type="button" onClick={handleSignOut} className="rounded-lg border border-gray-800 px-3 py-2 text-xs text-gray-400 hover:bg-gray-900 hover:text-white">
              Kilépés
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

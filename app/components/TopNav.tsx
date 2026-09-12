'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Karakterek' },
  { href: '/character/new', label: 'Karakter létrehozása' },
  { href: '/presets', label: 'Presetek' },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-black/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="shrink-0 [font-family:var(--font-montserrat)] text-sm font-bold italic tracking-[-0.02em] text-white md:text-base"
        >
          Vállalhatatlan Illusztrációs Motor
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
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: 'Characters' },
  { href: '/character/new', label: 'Create Character' },
  { href: '/presets', label: 'Presets' },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-black/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-6 px-4 py-3 md:px-8">
        <Link
          href="/"
          className="shrink-0 font-sans text-sm font-bold italic tracking-tight text-white md:text-base"
        >
          Vállalhatatlan Illusztrációs Motor
        </Link>

        <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Main navigation">
          {items.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded px-3 py-2 text-xs font-semibold transition-colors md:text-sm ${
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/compare', label: 'Compare' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-white/10 bg-[#0d111b]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-green-400 text-lg tracking-tight">
          <span className="text-xl">⚡</span>
          FRC Auto Scout
        </Link>
        <nav className="flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

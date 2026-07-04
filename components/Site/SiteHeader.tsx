'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Wordmark } from '@/components/Brand';
import DemoButton from './DemoButton';

const links = [
  { href: '/research', label: 'Design notes' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/security', label: 'Security' },
  { href: '/contact', label: 'Contact' },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-line">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
        <Link href="/" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted hover:text-ink transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-ink border border-line hover:border-faint rounded-lg transition-colors"
          >
            Sign in
          </Link>
          <DemoButton />
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 -mr-2 text-ink"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8">
            {open ? (
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-line bg-white px-5 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-ink py-1.5"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-line flex flex-col gap-2">
            <DemoButton className="w-full px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors text-center" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="w-full px-4 py-2.5 text-sm font-medium text-ink border border-line rounded-lg text-center"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { Wordmark } from '@/components/Brand';

interface Crumb {
  label: string;
  href?: string;
}

export default function TopNav({ crumbs = [] }: { crumbs?: Crumb[] }) {
  const { data: session } = useSession();
  const isDemo = session?.user?.email === 'demo@themis.app';

  return (
    <>
      {isDemo && (
        <div className="bg-accent-soft border-b border-accent-border px-5 py-2 text-center">
          <p className="text-accent text-xs">
            Demo workspace, shared sample data, cleared periodically. Do not enter real case information.
          </p>
        </div>
      )}
      <nav className="border-b border-line bg-white px-5 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/dashboard" className="shrink-0">
              <Wordmark markClass="w-5 h-5" textClass="text-base" />
            </Link>
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-2.5 min-w-0">
                <span className="text-line">/</span>
                {c.href ? (
                  <Link href={c.href} className="text-muted hover:text-ink text-sm truncate transition-colors">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink text-sm font-medium truncate">{c.label}</span>
                )}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-ink text-sm font-medium leading-tight">{session?.user?.name}</p>
              <p className="text-faint text-xs leading-tight">
                {(session?.user as { station?: string })?.station}
              </p>
            </div>
            {!isDemo && (
              <Link
                href="/dashboard/settings"
                className="p-2 text-muted hover:text-ink transition-colors"
                aria-label="Settings"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34h0a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55h0a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87v0a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" />
                </svg>
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-3 py-1.5 text-muted hover:text-ink text-sm border border-line hover:border-faint rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}

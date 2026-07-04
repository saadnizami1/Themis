'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wordmark } from '@/components/Brand';
import DemoButton from '@/components/Site/DemoButton';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/dashboard');
    }
  };

  const inputCls =
    'w-full bg-white border border-line rounded-lg px-4 py-2.5 text-ink focus:border-accent outline-none transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-5">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-line p-8 space-y-6">
          <div>
            <Link href="/">
              <Wordmark textClass="text-xl" />
            </Link>
            <p className="text-muted mt-2 text-sm">
              Officer access. Accounts are provisioned by your department.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputCls}
                placeholder="officer@station.gov"
              />
            </div>
            <div>
              <label className="block text-sm text-muted mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputCls}
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-red-700 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="pt-4 border-t border-line">
            <p className="text-muted text-sm mb-3">Just evaluating? No account needed.</p>
            <DemoButton className="w-full py-2.5 border border-line hover:border-faint text-ink text-sm font-medium rounded-lg transition-colors" />
          </div>
        </div>
        <p className="text-center text-xs text-faint mt-6">
          <Link href="/terms" className="hover:text-muted transition-colors">Terms</Link>
          {' · '}
          <Link href="/privacy" className="hover:text-muted transition-colors">Privacy</Link>
        </p>
      </div>
    </div>
  );
}

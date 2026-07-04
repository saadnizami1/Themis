'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/Dashboard/TopNav';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const isDemo = session?.user?.email === 'demo@themis.app';

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirm) {
      setMessage({ ok: false, text: 'New passwords do not match' });
      return;
    }
    setSaving(true);
    const res = await fetch('/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ ok: false, text: data.error || 'Something went wrong' });
    } else {
      setMessage({ ok: true, text: 'Password updated' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    }
  };

  const inputCls =
    'w-full bg-white border border-line rounded-lg px-4 py-2.5 text-ink text-sm focus:border-accent outline-none transition-colors';

  return (
    <div className="min-h-screen bg-surface">
      <TopNav crumbs={[{ label: 'Settings' }]} />

      <div className="max-w-xl mx-auto px-5 py-6 sm:py-8 space-y-5">
        <div className="bg-white rounded-xl border border-line p-5 sm:p-6">
          <h1 className="text-ink font-medium">Account</h1>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Name</dt>
              <dd className="text-ink">{session?.user?.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Email</dt>
              <dd className="text-ink">{session?.user?.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Station</dt>
              <dd className="text-ink">{(session?.user as { station?: string })?.station}</dd>
            </div>
          </dl>
          <p className="text-faint text-xs mt-4">
            Name and station changes are handled by your department administrator.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-line p-5 sm:p-6">
          <h2 className="text-ink font-medium">Change password</h2>
          {isDemo ? (
            <p className="text-muted text-sm mt-3">
              The demo account is shared and cannot be modified.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1.5">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1.5">
                  New password <span className="text-faint">— at least 10 characters</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1.5">Confirm new password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputCls}
                />
              </div>

              {message && (
                <p className={`text-sm ${message.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                  {message.text}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

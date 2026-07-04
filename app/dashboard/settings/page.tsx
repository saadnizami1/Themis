'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/Dashboard/TopNav';

const labelCls = 'block font-mono text-[11px] uppercase tracking-[0.14em] text-faint mb-2';
const inputCls =
  'w-full bg-white border border-line rounded-sm px-4 py-2.5 text-ink text-sm focus:border-accent outline-none transition-colors';
const primaryBtn =
  'px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-sm transition-colors disabled:opacity-60';
const quietBtn =
  'px-4 py-2 border border-line hover:border-faint text-ink text-sm font-medium rounded-sm transition-colors';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [canChangeName, setCanChangeName] = useState<boolean | null>(null);
  const [nextChangeAt, setNextChangeAt] = useState<string | null>(null);

  const isDemo = session?.user?.email === 'demo@themis.app';

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || isDemo) return;
    fetch('/api/account/name')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setCanChangeName(d.canChange);
        setNextChangeAt(d.nextChangeAt);
      })
      .catch(() => {});
  }, [status, isDemo]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const startEditName = () => {
    setNameDraft(session?.user?.name || '');
    setNameMessage(null);
    setEditingName(true);
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameSaving(true);
    setNameMessage(null);
    const res = await fetch('/api/account/name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameDraft }),
    });
    const data = await res.json();
    setNameSaving(false);
    if (!res.ok) {
      setNameMessage({ ok: false, text: data.error || 'Something went wrong' });
      return;
    }
    await update({ name: data.name });
    setEditingName(false);
    setCanChangeName(false);
    setNextChangeAt(data.nextChangeAt);
    setNameMessage({ ok: true, text: 'Name updated across the workspace.' });
  };

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

  return (
    <div className="min-h-screen bg-paper">
      <TopNav crumbs={[{ label: 'Settings' }]} />

      <div className="max-w-xl mx-auto px-5 py-6 sm:py-8 space-y-5">
        {/* Account */}
        <div className="bg-white border border-line p-5 sm:p-7">
          <h1 className="font-serif text-2xl tracking-tight">Account</h1>

          <div className="mt-5 divide-y divide-line">
            {/* Name row */}
            <div className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Name</p>
                  {!editingName && (
                    <p className="text-ink text-sm mt-1.5">{session?.user?.name}</p>
                  )}
                </div>
                {!isDemo && !editingName && canChangeName !== false && (
                  <button onClick={startEditName} className={quietBtn}>
                    Edit
                  </button>
                )}
              </div>

              {editingName && (
                <form onSubmit={saveName} className="mt-3 space-y-3">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                    autoFocus
                    className={inputCls}
                  />
                  <div className="flex items-center gap-3">
                    <button type="submit" disabled={nameSaving} className={primaryBtn}>
                      {nameSaving ? 'Saving...' : 'Save name'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingName(false)}
                      className={quietBtn}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {nameMessage && (
                <p className={`text-sm mt-2 ${nameMessage.ok ? 'text-accent' : 'text-red-700'}`}>
                  {nameMessage.text}
                </p>
              )}
              {!isDemo && (
                <p className="text-faint text-xs mt-2">
                  {canChangeName === false && nextChangeAt
                    ? `Names can be changed once every 30 days. Next change available ${fmtDate(nextChangeAt)}.`
                    : 'Can be changed once every 30 days.'}
                </p>
              )}
            </div>

            {/* Email row */}
            <div className="py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Email</p>
              <p className="text-ink text-sm mt-1.5">{session?.user?.email}</p>
            </div>

            {/* Station row */}
            <div className="py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Station</p>
              <p className="text-ink text-sm mt-1.5">
                {(session?.user as { station?: string })?.station}
              </p>
              <p className="text-faint text-xs mt-2">
                Station changes are handled by your department administrator.
              </p>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white border border-line p-5 sm:p-7">
          <h2 className="font-serif text-2xl tracking-tight">Change password</h2>
          {isDemo ? (
            <p className="text-muted text-sm mt-3">
              The demo account is shared and cannot be modified.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-5 space-y-4">
              <div>
                <label className={labelCls}>Current password</label>
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
                <label className={labelCls}>
                  New password <span className="normal-case tracking-normal">(at least 10 characters)</span>
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
                <label className={labelCls}>Confirm new password</label>
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
                <p className={`text-sm ${message.ok ? 'text-accent' : 'text-red-700'}`}>
                  {message.text}
                </p>
              )}

              <button type="submit" disabled={saving} className={primaryBtn}>
                {saving ? 'Saving...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

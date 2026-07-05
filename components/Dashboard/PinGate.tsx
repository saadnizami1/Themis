'use client';

import { useState } from 'react';
import { setCaseKey } from '@/lib/case-key';

// Unlock screen for PIN-protected demo cases. On success the case key is
// kept for the browser session and the parent refetches.
export default function PinGate({
  caseId,
  caseNumber,
  onUnlocked,
}: {
  caseId: string;
  caseNumber?: string;
  onUnlocked: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError('Enter the 4-digit PIN');
      return;
    }
    setBusy(true);
    setError('');
    const res = await fetch(`/api/cases/${caseId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || 'Wrong PIN');
      setPin('');
      return;
    }
    setCaseKey(caseId, data.caseKey);
    onUnlocked();
  };

  return (
    <div className="max-w-sm mx-auto mt-10">
      <div className="bg-white border border-line p-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          PIN required
        </p>
        <h1 className="font-serif text-2xl tracking-tight mt-3">
          This case is protected.
        </h1>
        {caseNumber && (
          <p className="font-mono text-[11px] tracking-[0.04em] text-faint mt-1.5">{caseNumber}</p>
        )}
        <p className="text-muted text-sm mt-3 leading-relaxed">
          Whoever filed this case set a PIN for it. Enter it to open the case, its
          interviews, and its reports.
        </p>

        <form onSubmit={submit} className="mt-5">
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            placeholder="0000"
            aria-label="Case PIN"
            className="w-36 bg-white border border-line rounded-sm px-4 py-2.5 text-ink font-mono text-xl tracking-[0.4em] text-center focus:border-accent outline-none transition-colors"
          />
          {error && <p className="text-red-700 text-sm mt-3">{error}</p>}
          <div className="flex items-center gap-4 mt-5">
            <button
              type="submit"
              disabled={busy || pin.length !== 4}
              className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-sm transition-colors disabled:opacity-60"
            >
              {busy ? 'Checking...' : 'Unlock'}
            </button>
            <span className="text-faint text-xs">Attempts are limited.</span>
          </div>
        </form>
      </div>
    </div>
  );
}

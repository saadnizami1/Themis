'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Alert {
  id: string;
  interviewNumber: number;
  victimName: string | null;
  caseId: string;
  case: { caseNumber: string; incidentType: string };
}

// Polls for safety escalations so an officer sees them without refreshing.
export default function EscalationBanner() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch('/api/alerts')
        .then((r) => (r.ok ? r.json() : { escalated: [] }))
        .then((d) => {
          if (!cancelled) setAlerts(d.escalated || []);
        })
        .catch(() => {});
    load();
    const iv = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="bg-white border border-red-200 shadow-[inset_3px_0_0_0_#DC2626] p-4 sm:p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
        <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-red-700">
          Safety escalation{alerts.length > 1 ? 's' : ''}, review required
        </h2>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => (
          <Link
            key={a.id}
            href={`/dashboard/cases/${a.caseId}/interview/${a.id}`}
            className="flex items-center justify-between gap-3 bg-white border border-red-200 rounded-sm px-4 py-3 hover:border-red-400 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-ink text-sm font-medium truncate">
                {a.case.caseNumber} · Interview #{a.interviewNumber}
                {a.victimName ? ` · ${a.victimName}` : ''}
              </p>
              <p className="text-muted text-xs mt-0.5">
                The interview was paused for the witness&apos;s safety. Contact the witness.
              </p>
            </div>
            <span className="text-red-700 text-sm font-medium shrink-0">Review</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import CaseCard from '@/components/Dashboard/CaseCard';
import TopNav from '@/components/Dashboard/TopNav';
import EscalationBanner from '@/components/Dashboard/EscalationBanner';

interface Interview {
  id: string;
  status: string;
  interviewNumber: number;
  createdAt: string;
  contradictions: unknown;
}

interface Case {
  id: string;
  caseNumber: string;
  incidentType: string;
  description: string;
  createdAt: string;
  interviews: Interview[];
}

function Skeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-surface border border-line h-24 animate-pulse" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();
  const [cases, setCases] = useState<Case[] | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [caseNumber, setCaseNumber] = useState('');
  const [incidentType, setIncidentType] = useState('');
  const [description, setDescription] = useState('');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/cases')
        .then((r) => r.json())
        .then((data) => setCases(Array.isArray(data) ? data : []));
    }
  }, [status]);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');

    let reportPath: string | null = null;
    let reportText: string | null = null;

    if (reportFile) {
      const fd = new FormData();
      fd.append('file', reportFile);
      const up = await fetch('/api/upload', { method: 'POST', body: fd });
      const upData = await up.json();
      if (up.ok) {
        reportPath = upData.path;
        reportText = upData.text || null;
      }
    }

    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseNumber, incidentType, description, reportPath, reportText }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setFormError(data.error || 'Failed to create case');
    } else {
      setCases((prev) => [{ ...data, interviews: [] }, ...(prev || [])]);
      setShowForm(false);
      setCaseNumber('');
      setIncidentType('');
      setDescription('');
      setReportFile(null);
    }
  };

  const allInterviews = (cases || []).flatMap((c) => c.interviews);
  const stats = [
    { label: 'Cases', value: (cases || []).length, cls: 'text-ink' },
    { label: 'Interviews', value: allInterviews.length, cls: 'text-ink' },
    {
      label: 'Completed',
      value: allInterviews.filter((i) => i.status === 'completed').length,
      cls: 'text-ink',
    },
    {
      label: 'Escalations',
      value: allInterviews.filter((i) => i.status === 'escalated').length,
      cls: allInterviews.some((i) => i.status === 'escalated') ? 'text-red-700' : 'text-ink',
    },
  ];

  const inputCls =
    'w-full bg-white border border-line rounded-sm px-4 py-2 text-ink text-sm focus:border-accent outline-none transition-colors';

  return (
    <div className="min-h-screen bg-paper">
      <TopNav />

      <div className="max-w-5xl mx-auto px-5 py-6 sm:py-8 space-y-6">
        <EscalationBanner />

        {/* Ledger strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-white border border-line divide-x divide-line">
          {stats.map((s, i) => (
            <div key={s.label} className={`p-4 sm:p-5 ${i > 1 ? 'border-t border-line sm:border-t-0' : ''}`}>
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{s.label}</p>
              <p className={`font-serif text-3xl mt-1.5 tabular-nums ${s.cls}`}>
                {cases === null ? '-' : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Case registry</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-sm transition-colors"
          >
            New case
          </button>
        </div>

        {/* Create Case Form */}
        {showForm && (
          <form
            onSubmit={handleCreateCase}
            className="bg-white border border-line p-5 sm:p-6 space-y-4 animate-fadeUp"
          >
            <h2 className="font-serif text-2xl tracking-tight">New case</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted mb-1.5">Case number</label>
                <input
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  required
                  placeholder="FIR-2026-0001"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1.5">Incident type</label>
                <input
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  required
                  placeholder="Robbery, assault…"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">
                Description <span className="text-faint">(context for the interviewer, never shown to the witness)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
                placeholder="What is known from initial reports."
                className={`${inputCls} resize-none`}
              />
            </div>

            <div>
              <label className="block text-sm text-muted mb-1.5">
                Report PDF <span className="text-faint">(optional)</span>
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-line hover:border-accent hover:text-accent text-ink text-sm font-medium rounded-sm cursor-pointer transition-colors">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.4 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.82-2.83l8.49-8.48"
                    />
                  </svg>
                  {reportFile ? 'Replace file' : 'Attach report'}
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onClick={(e) => ((e.target as HTMLInputElement).value = '')}
                    onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                  />
                </label>
                {reportFile ? (
                  <span className="inline-flex items-center gap-2.5 font-mono text-[12px] text-muted bg-surface border border-line rounded-sm px-3 py-1.5 max-w-full">
                    <span className="truncate max-w-[14rem]">{reportFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setReportFile(null)}
                      aria-label="Remove file"
                      className="text-faint hover:text-red-700 transition-colors leading-none"
                    >
                      &#215;
                    </button>
                  </span>
                ) : (
                  <span className="text-faint text-sm">Parsed once at upload, used as interview context.</span>
                )}
              </div>
            </div>

            {formError && <p className="text-red-700 text-sm">{formError}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-sm transition-colors disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Create case'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-line hover:border-faint text-ink text-sm font-medium rounded-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Case List */}
        {cases === null ? (
          <Skeleton />
        ) : cases.length === 0 ? (
          <div className="text-center py-16 text-faint bg-white border border-dashed border-line">
            <p className="text-sm">No cases yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cases.map((c) => (
              <CaseCard key={c.id} {...c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

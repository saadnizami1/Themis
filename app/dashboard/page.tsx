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
        <div key={i} className="bg-surface border border-line rounded-xl h-24 animate-pulse" />
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
      cls: 'text-emerald-700',
    },
    {
      label: 'Escalations',
      value: allInterviews.filter((i) => i.status === 'escalated').length,
      cls: allInterviews.some((i) => i.status === 'escalated') ? 'text-red-700' : 'text-ink',
    },
  ];

  const inputCls =
    'w-full bg-white border border-line rounded-lg px-4 py-2 text-ink text-sm focus:border-accent outline-none transition-colors';

  return (
    <div className="min-h-screen bg-surface">
      <TopNav />

      <div className="max-w-5xl mx-auto px-5 py-6 sm:py-8 space-y-5">
        <EscalationBanner />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-line p-4">
              <p className="text-xs text-faint uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${s.cls}`}>
                {cases === null ? '–' : s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-muted text-sm">Cases</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
          >
            New case
          </button>
        </div>

        {/* Create Case Form */}
        {showForm && (
          <form
            onSubmit={handleCreateCase}
            className="bg-white rounded-xl border border-line p-5 sm:p-6 space-y-4 animate-fadeUp"
          >
            <h2 className="text-ink font-medium">New case</h2>

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
                Description <span className="text-faint">— context for the interviewer, never shown to the witness</span>
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
                Report PDF <span className="text-faint">— optional</span>
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                className="text-sm text-muted"
              />
            </div>

            {formError && <p className="text-red-700 text-sm">{formError}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {creating ? 'Creating…' : 'Create case'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2 border border-line hover:border-faint text-ink text-sm font-medium rounded-lg transition-colors"
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
          <div className="text-center py-16 text-faint bg-white rounded-xl border border-dashed border-line">
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

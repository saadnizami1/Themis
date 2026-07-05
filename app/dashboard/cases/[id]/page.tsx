'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ContradictionBadge from '@/components/Dashboard/ContradictionBadge';
import StatusBadge from '@/components/Dashboard/StatusBadge';
import TopNav from '@/components/Dashboard/TopNav';
import PinGate from '@/components/Dashboard/PinGate';
import { caseKeyHeaders } from '@/lib/case-key';

interface Interview {
  id: string;
  status: string;
  language: string;
  interviewNumber: number;
  createdAt: string;
  completedAt: string | null;
  accessToken: string;
  victimName: string | null;
  contradictions: {
    items?: Array<{ topic: string; severity: string }>;
  } | null;
}

interface CaseDetail {
  id: string;
  caseNumber: string;
  incidentType: string;
  description: string;
  createdAt: string;
  interviews: Interview[];
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [lockedInfo, setLockedInfo] = useState<{ caseNumber?: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [copied, setCopied] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadCase = () => {
    setLockedInfo(null);
    fetch(`/api/cases/${params.id}`, { headers: caseKeyHeaders(String(params.id)) })
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 403 && data.locked) {
          setLockedInfo({ caseNumber: data.caseNumber });
          return;
        }
        if (r.ok) setCaseData(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (status === 'authenticated') loadCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, status]);

  const generateLink = async () => {
    setGenerating(true);
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...caseKeyHeaders(String(params.id)) },
      body: JSON.stringify({ caseId: params.id }),
    });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) {
      setNewLink(data.interviewUrl);
      setCaseData((prev) =>
        prev
          ? {
              ...prev,
              interviews: [...prev.interviews, { ...data.interview, contradictions: null }],
            }
          : prev
      );
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 1500);
  };

  if (lockedInfo) {
    return (
      <div className="min-h-screen bg-paper">
        <TopNav crumbs={[{ label: lockedInfo.caseNumber || 'Locked case' }]} />
        <div className="max-w-5xl mx-auto px-5 py-8">
          <PinGate
            caseId={String(params.id)}
            caseNumber={lockedInfo.caseNumber}
            onUnlocked={loadCase}
          />
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-paper">
        <TopNav />
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div className="bg-white border border-line rounded-xl h-32 animate-pulse" />
        </div>
      </div>
    );
  }

  const totalContradictions = caseData.interviews.reduce(
    (acc, iv) => acc + (iv.contradictions?.items?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-paper">
      <TopNav crumbs={[{ label: caseData.caseNumber }]} />

      <div className="max-w-5xl mx-auto px-5 py-6 sm:py-8 space-y-5">
        {/* Header */}
        <div className="bg-white rounded-xl border border-line p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-2xl tracking-tight text-ink">{caseData.incidentType}</h1>
                {totalContradictions > 0 && <ContradictionBadge count={totalContradictions} />}
              </div>
              <p className="text-faint text-xs font-mono tracking-[0.04em] mt-1">{caseData.caseNumber}</p>
              <p className="text-muted text-sm mt-3 max-w-xl leading-relaxed">{caseData.description}</p>
            </div>
            <button
              onClick={generateLink}
              disabled={generating}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 shrink-0 self-start"
            >
              {generating ? 'Generating…' : 'New interview link'}
            </button>
          </div>
        </div>

        {/* New Link */}
        {newLink && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-fadeUp">
            <p className="text-emerald-900 text-sm font-medium mb-2">Interview link created</p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <code className="text-emerald-900 text-xs bg-white border border-emerald-200 rounded-lg px-3 py-2 flex-1 truncate">
                {newLink}
              </code>
              <button
                onClick={() => copy(newLink, 'new')}
                className="text-xs text-emerald-900 px-3 py-2 bg-white border border-emerald-200 rounded-lg transition-colors shrink-0"
              >
                {copied === 'new' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-emerald-800/70 text-xs mt-2">
              Send this to the witness. No sign-in needed. Works best in Chrome or Edge with a
              microphone and camera; typing is available as a fallback.
            </p>
          </div>
        )}

        {/* Interviews */}
        <div>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint mb-3">
            Interviews ({caseData.interviews.length})
          </h2>

          {caseData.interviews.length === 0 ? (
            <div className="text-center py-12 text-faint bg-white rounded-xl border border-dashed border-line">
              <p className="text-sm">No interviews yet. Generate a link to begin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {caseData.interviews.map((iv) => {
                const contraCount = iv.contradictions?.items?.length || 0;
                const hasReport = ['completed', 'terminated', 'escalated'].includes(iv.status);
                return (
                  <div
                    key={iv.id}
                    className={`bg-white border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      iv.status === 'escalated'
                        ? 'border-red-300 shadow-[inset_3px_0_0_0_#DC2626]'
                        : 'border-line'
                    }`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="text-faint text-base shrink-0">#{iv.interviewNumber}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge status={iv.status} />
                          <span className="text-xs text-faint">
                            {iv.language === 'ur' ? 'Urdu' : 'English'}
                          </span>
                          {iv.victimName && (
                            <span className="text-xs text-muted">· {iv.victimName}</span>
                          )}
                          {contraCount > 0 && <ContradictionBadge count={contraCount} />}
                        </div>
                        <p className="text-faint text-xs mt-1">
                          Created {new Date(iv.createdAt).toLocaleDateString()}
                          {iv.completedAt && ` · ended ${new Date(iv.completedAt).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {(iv.status === 'pending' || iv.status === 'in_progress') && (
                        <button
                          onClick={() =>
                            copy(`${window.location.origin}/interview/${iv.accessToken}`, iv.id)
                          }
                          className="text-xs text-ink px-3 py-1.5 border border-line hover:border-faint rounded-lg transition-colors"
                        >
                          {copied === iv.id ? 'Copied' : 'Copy link'}
                        </button>
                      )}
                      {hasReport && (
                        <Link
                          href={`/dashboard/cases/${caseData.id}/interview/${iv.id}`}
                          className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium text-white ${
                            iv.status === 'escalated'
                              ? 'bg-red-700 hover:bg-red-800'
                              : 'bg-accent hover:bg-accent-hover'
                          }`}
                        >
                          {iv.status === 'escalated' ? 'Review escalation' : 'View report'}
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

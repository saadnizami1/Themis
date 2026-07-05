'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import type { AnalysisResult } from '@/lib/linguistic-analysis';
import TopNav from '@/components/Dashboard/TopNav';
import StatusBadge from '@/components/Dashboard/StatusBadge';
import PinGate from '@/components/Dashboard/PinGate';
import { caseKeyHeaders } from '@/lib/case-key';

const ReportViewer = dynamic(() => import('@/components/Dashboard/ReportViewer'), {
  ssr: false,
  loading: () => (
    <div className="text-faint animate-pulse py-8 text-center text-sm">Loading report…</div>
  ),
});

interface InterviewData {
  id: string;
  interviewNumber: number;
  language: string;
  victimName: string | null;
  victimAge: number | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
  videoPath: string | null;
  transcript: Array<{ role: string; content: string; phase?: string; timestamp?: string }> | null;
  liveNotes: Array<{ turn: number; phase: string; note: string; signals: string[]; distressLevel: string }> | null;
  escalation: Array<{ at: string; reason: string; distressLevel: string; ongoingDanger: boolean; selfHarmRisk: boolean }> | null;
  linguisticFlags: AnalysisResult | null;
  contradictions: {
    items?: AnalysisResult['contradictions'];
    statementSummary?: string;
    followUpQuestions?: string[];
  } | null;
  case: {
    id: string;
    caseNumber: string;
    incidentType: string;
    description: string;
    interviews: { id: string }[];
    officer: { name: string };
  };
}

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [lockedInfo, setLockedInfo] = useState<{ caseNumber?: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadReport = () => {
    setLockedInfo(null);
    fetch(`/api/interviews/${params.iid}/report`, {
      headers: caseKeyHeaders(String(params.id)),
    })
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 403 && data.locked) {
          setLockedInfo({ caseNumber: data.caseNumber });
          return;
        }
        if (r.ok) setInterview(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (status === 'authenticated') loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.iid, status]);

  if (lockedInfo) {
    return (
      <div className="min-h-screen bg-paper">
        <TopNav crumbs={[{ label: lockedInfo.caseNumber || 'Locked case' }]} />
        <div className="max-w-5xl mx-auto px-5 py-8">
          <PinGate
            caseId={String(params.id)}
            caseNumber={lockedInfo.caseNumber}
            onUnlocked={loadReport}
          />
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="min-h-screen bg-paper">
        <TopNav />
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div className="bg-white border border-line rounded-xl h-32 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <TopNav
        crumbs={[
          { label: interview.case.caseNumber, href: `/dashboard/cases/${interview.case.id}` },
          { label: `Interview #${interview.interviewNumber}` },
        ]}
      />

      <div className="max-w-5xl mx-auto px-5 py-6 sm:py-8 space-y-5">
        <div className="bg-white rounded-xl border border-line p-5 sm:p-6">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-lg font-semibold text-ink">
              {interview.case.incidentType} · Interview #{interview.interviewNumber}
            </h1>
            <StatusBadge status={interview.status} />
          </div>
          <div className="flex gap-4 mt-2 text-sm text-muted flex-wrap">
            {interview.victimName && (
              <span>
                Witness: {interview.victimName}
                {interview.victimAge ? `, ${interview.victimAge}` : ''}
              </span>
            )}
            <span>{interview.language === 'ur' ? 'Urdu' : 'English'}</span>
            {interview.completedAt && (
              <span>Ended {new Date(interview.completedAt).toLocaleString()}</span>
            )}
          </div>
        </div>

        <ReportViewer interview={interview} caseId={interview.case.id} />
      </div>
    </div>
  );
}

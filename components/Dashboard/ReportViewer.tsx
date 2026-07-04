'use client';

import { useState } from 'react';
import type { AnalysisResult } from '@/lib/linguistic-analysis';

interface LiveNote {
  turn: number;
  phase: string;
  note: string;
  signals: string[];
  distressLevel: string;
}

interface EscalationEvent {
  at: string;
  reason: string;
  distressLevel: string;
  ongoingDanger: boolean;
  selfHarmRisk: boolean;
}

interface ReportViewerProps {
  interview: {
    id: string;
    interviewNumber: number;
    language: string;
    victimName?: string | null;
    victimAge?: number | null;
    status: string;
    completedAt?: string | null;
    createdAt: string;
    videoPath?: string | null;
    transcript?: Array<{ role: string; content: string; phase?: string; timestamp?: string }> | null;
    liveNotes?: LiveNote[] | null;
    escalation?: EscalationEvent[] | null;
    linguisticFlags?: AnalysisResult | null;
    contradictions?: {
      items?: AnalysisResult['contradictions'];
      statementSummary?: string;
      followUpQuestions?: string[];
    } | null;
  };
}

const severityCls: Record<string, string> = {
  low: 'bg-surface text-muted border-line',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  high: 'bg-red-50 text-red-800 border-red-200',
  minor: 'bg-surface text-muted border-line',
  significant: 'bg-amber-50 text-amber-800 border-amber-200',
  major: 'bg-red-50 text-red-800 border-red-200',
};

export default function ReportViewer({ interview }: ReportViewerProps) {
  const [tab, setTab] = useState<'analysis' | 'transcript' | 'observations' | 'video'>('analysis');

  const analysis = interview.linguisticFlags;
  const contraData = interview.contradictions;
  const contradictions = contraData?.items || [];
  const followUp = contraData?.followUpQuestions || [];
  const summary = contraData?.statementSummary || '';
  const transcript = (interview.transcript || []).filter((e) => e.role !== 'event');
  const liveNotes = interview.liveNotes || [];
  const escalation = interview.escalation || [];

  const tabs = [
    { id: 'analysis' as const, label: 'Analysis' },
    { id: 'transcript' as const, label: `Transcript (${transcript.length})` },
    { id: 'observations' as const, label: `Observations (${liveNotes.length})` },
    ...(interview.videoPath ? [{ id: 'video' as const, label: 'Recording' }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Escalation record, never buried in a tab */}
      {escalation.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-5">
          <h3 className="text-red-900 font-medium text-sm mb-3">Safety escalation record</h3>
          <div className="space-y-2">
            {escalation.map((e, i) => (
              <div key={i} className="bg-white border border-red-200 rounded-lg p-4 text-sm space-y-2">
                <p className="text-ink">{e.reason}</p>
                <div className="flex flex-wrap gap-2 text-xs items-center">
                  <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200">
                    distress: {e.distressLevel}
                  </span>
                  {e.ongoingDanger && (
                    <span className="px-2 py-0.5 rounded-full bg-red-700 text-white">
                      ongoing danger reported
                    </span>
                  )}
                  {e.selfHarmRisk && (
                    <span className="px-2 py-0.5 rounded-full bg-red-700 text-white">
                      self-harm risk
                    </span>
                  )}
                  <span className="text-faint ml-auto">{new Date(e.at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-red-800/80 text-xs mt-3">
            The interview was paused and the witness told help is being arranged. Contact the
            witness directly and follow your department&apos;s safeguarding procedure.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-line">
          <p className="text-xs text-faint uppercase tracking-wide">Consistency</p>
          <p className="text-2xl font-semibold text-ink mt-1">
            {analysis?.overallConsistencyScore ?? '-'}
            <span className="text-sm text-faint font-normal">/100</span>
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-line">
          <p className="text-xs text-faint uppercase tracking-wide">Flags</p>
          <p className="text-2xl font-semibold text-ink mt-1">
            {analysis?.linguisticFlags?.length ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-line">
          <p className="text-xs text-faint uppercase tracking-wide">Positive</p>
          <p className="text-2xl font-semibold text-emerald-700 mt-1">
            {analysis?.positiveIndicators?.length ?? 0}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
              tab === t.id
                ? 'bg-ink text-white'
                : 'bg-white text-muted border border-line hover:border-faint'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'analysis' && (
        <div className="space-y-5">
          {summary && (
            <div className="bg-white rounded-xl border border-line p-5">
              <h3 className="text-xs font-medium text-faint mb-2 uppercase tracking-wide">
                Statement summary
              </h3>
              <p className="text-ink text-sm leading-relaxed whitespace-pre-line">{summary}</p>
            </div>
          )}

          {contradictions.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h3 className="text-red-900 font-medium text-sm mb-3">
                {contradictions.length} cross-interview contradiction
                {contradictions.length > 1 ? 's' : ''}
              </h3>
              <div className="space-y-2">
                {contradictions.map((c, i) => (
                  <div key={i} className="bg-white border border-red-200 rounded-lg p-4 text-sm">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-ink font-medium">{c.topic}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${severityCls[c.severity] || ''}`}>
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-muted">Interview 1: &quot;{c.claim_interview_1}&quot;</p>
                    <p className="text-muted">Interview 2: &quot;{c.claim_interview_2}&quot;</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis?.positiveIndicators && analysis.positiveIndicators.length > 0 && (
            <div className="bg-white border border-line rounded-xl p-5">
              <h3 className="text-xs font-medium text-faint mb-3 uppercase tracking-wide">
                Positive indicators
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.positiveIndicators.map((pi, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-800"
                  >
                    {pi.replace(/_/g, ' ').toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-line p-5">
            <h3 className="text-xs font-medium text-faint mb-1 uppercase tracking-wide">
              Linguistic indicators
            </h3>
            <p className="text-faint text-xs mb-4">
              Computational indicators from language patterns, not clinical findings. Professional
              review required.
            </p>
            {analysis?.linguisticFlags && analysis.linguisticFlags.length > 0 ? (
              <div className="space-y-4">
                {analysis.linguisticFlags.map((f, i) => (
                  <div key={i} className="border-l-2 border-line pl-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-ink text-sm font-medium">
                        {f.type.replace(/_/g, ' ').toLowerCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${severityCls[f.severity] || ''}`}>
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-muted text-sm mt-1">&quot;{f.evidence}&quot;</p>
                    <p className="text-faint text-xs mt-0.5">{f.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-sm">No significant flags identified.</p>
            )}
          </div>

          {followUp.length > 0 && (
            <div className="bg-white border border-line rounded-xl p-5">
              <h3 className="text-xs font-medium text-faint mb-3 uppercase tracking-wide">
                Recommended follow-up questions
              </h3>
              <ol className="space-y-2 text-sm text-ink">
                {followUp.map((q, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="text-faint shrink-0">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {tab === 'transcript' && (
        <div className="bg-white rounded-xl border border-line p-5 max-h-[32rem] overflow-y-auto">
          <div className="space-y-4">
            {transcript.map((entry, i) => (
              <div key={i} className="text-sm">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-xs font-medium uppercase tracking-wide ${
                      entry.role === 'ai' ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    {entry.role === 'ai' ? 'Themis' : 'Witness'}
                  </span>
                  {entry.phase && <span className="text-faint text-xs">· {entry.phase}</span>}
                  {entry.timestamp && (
                    <span className="text-faint text-xs ml-auto">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p className={entry.role === 'ai' ? 'text-muted' : 'text-ink'}>{entry.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'observations' && (
        <div className="bg-white rounded-xl border border-line p-5">
          <p className="text-faint text-xs mb-4">
            Turn-by-turn notes recorded by the interviewer during the session. Internal work
            product, not part of the court report.
          </p>
          {liveNotes.length === 0 ? (
            <p className="text-muted text-sm">No observations recorded.</p>
          ) : (
            <div className="space-y-3">
              {liveNotes.map((n, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="text-faint font-mono text-xs pt-0.5 shrink-0 w-8">T{n.turn}</span>
                  <div>
                    <p className="text-ink">{n.note}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {n.signals?.map((s, j) => (
                        <span
                          key={j}
                          className="px-2 py-0.5 bg-surface border border-line rounded-full text-xs text-muted"
                        >
                          {s.replace(/_/g, ' ')}
                        </span>
                      ))}
                      {n.distressLevel !== 'none' && (
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-800">
                          distress: {n.distressLevel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'video' && interview.videoPath && (
        <div className="bg-white rounded-xl border border-line p-5">
          <video
            controls
            src={`/api/interviews/${interview.id}/video`}
            className="w-full rounded-lg bg-ink max-h-[28rem]"
          />
          <p className="text-faint text-xs mt-3">
            Served via a time-limited signed URL to the case officer only.
          </p>
        </div>
      )}

      {/* PDF Downloads */}
      <div className="flex gap-3 flex-wrap">
        <a
          href={`/api/pdf/${interview.id}/court`}
          download={`themis-court-report-${interview.id}.pdf`}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors"
        >
          Court report (PDF)
        </a>
        <a
          href={`/api/pdf/${interview.id}/police`}
          download={`themis-police-report-${interview.id}.pdf`}
          className="px-4 py-2 bg-white border border-line hover:border-faint text-ink text-sm font-medium rounded-lg transition-colors"
        >
          Internal report (PDF)
        </a>
      </div>
    </div>
  );
}

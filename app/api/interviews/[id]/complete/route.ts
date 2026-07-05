import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { prisma } from '@/lib/prisma';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { runLinguisticAnalysis, generateFollowUpQuestions } from '@/lib/linguistic-analysis';
import { generateVictimStatementSummary } from '@/lib/report-generator';
import type { TranscriptEntry } from '@/lib/interview-engine';

// Finalize an interview: run the full linguistic analysis pipeline and set
// the final status. Called by the witness client after the closing message
// (completed), an early stop (terminated), or a safety hold (escalated, // status is preserved, analysis still runs so nothing is lost).
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Analysis is the most expensive call in the app; never let it be spammed.
  const rl = rateLimit(`complete:${params.id}`, 3, 60 * 60_000);
  if (!rl.ok) {
    const r = tooMany(rl.retryAfterSec);
    return NextResponse.json(r.body, r.init);
  }

  const body = await req.json().catch(() => ({}));
  const { token, endReason } = body as { token?: string; endReason?: string };

  const interview = await prisma.interview.findUnique({
    where: { id: params.id },
    include: { case: true },
  });

  if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!token || interview.accessToken !== token) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (interview.status === 'completed' || interview.status === 'terminated') {
    return NextResponse.json({ ok: true, already: true });
  }

  const transcript = (((interview.transcript as unknown as TranscriptEntry[]) || []) as TranscriptEntry[])
    .filter((e) => e.role !== 'event');

  // Fetch previous interviews for cross-interview analysis
  const prevInterviews = await prisma.interview.findMany({
    where: {
      caseId: interview.caseId,
      id: { not: interview.id },
      status: 'completed',
    },
    orderBy: { interviewNumber: 'asc' },
    select: { transcript: true, interviewNumber: true },
  });

  const previousTranscripts = prevInterviews
    .map((pi) => pi.transcript as unknown as TranscriptEntry[] | null)
    .filter((t): t is TranscriptEntry[] => t !== null)
    .map((t) => t.filter((e) => e.role !== 'event'));

  // Run the analysis pipeline. If the AI provider is down or rate-limited,
  // the interview must still finalize, the officer can regenerate analysis
  // later, but a witness's completed interview may never be left dangling.
  let analysis;
  let followUpQuestions: string[] = [];
  let statementSummary = '';
  try {
    analysis = await runLinguisticAnalysis({
      transcript,
      previousTranscripts,
      language: interview.language,
    });
    followUpQuestions = await generateFollowUpQuestions(transcript, analysis.contradictions);
    const caseMetadata = `Case ${interview.case.caseNumber}, ${interview.case.incidentType}. Interview ${interview.interviewNumber}.`;
    statementSummary = await generateVictimStatementSummary(transcript, caseMetadata);
  } catch (err) {
    console.error('[complete] analysis pipeline failed, finalizing without it:', err);
    analysis = {
      linguisticFlags: [],
      contradictions: [],
      positiveIndicators: [],
      overallConsistencyScore: 0,
      summaryNote:
        'Automatic analysis was unavailable when this interview ended. The transcript is complete and safe.',
    };
  }

  const flagsJson = JSON.parse(JSON.stringify(analysis)) as object;
  const contradictionsJson = JSON.parse(
    JSON.stringify({ items: analysis.contradictions, followUpQuestions, statementSummary, endReason })
  ) as object;

  // Escalated interviews keep their status so the officer's alert persists.
  const finalStatus =
    interview.status === 'escalated'
      ? 'escalated'
      : endReason === 'witness_stopped'
      ? 'terminated'
      : 'completed';

  await prisma.interview.update({
    where: { id: params.id },
    data: {
      status: finalStatus,
      completedAt: new Date(),
      linguisticFlags: flagsJson,
      contradictions: contradictionsJson,
    },
  });

  return NextResponse.json({
    ok: true,
    status: finalStatus,
    hasContradictions: analysis.contradictions.length > 0,
    flagCount: analysis.linguisticFlags.length,
    consistencyScore: analysis.overallConsistencyScore,
  });
}

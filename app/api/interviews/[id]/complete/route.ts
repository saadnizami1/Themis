import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { prisma } from '@/lib/prisma';
import { rateLimit, tooMany } from '@/lib/rate-limit';
import { analyzeAndStore } from '@/lib/finalize';

// Finalize an interview: run the full linguistic analysis pipeline and set
// the final status. Called by the witness client after the closing message
// (completed), an early stop (terminated), or a safety hold (escalated;
// status is preserved, analysis still runs so nothing is lost).
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
  if (
    interview.status === 'completed' ||
    interview.status === 'terminated' ||
    interview.status === 'expired'
  ) {
    return NextResponse.json({ ok: true, already: true });
  }

  // Escalated interviews keep their status so the officer's alert persists.
  const finalStatus =
    interview.status === 'escalated'
      ? 'escalated'
      : endReason === 'witness_stopped'
      ? 'terminated'
      : 'completed';

  const analysis = await analyzeAndStore(interview, finalStatus, endReason);

  return NextResponse.json({
    ok: true,
    status: finalStatus,
    hasContradictions: analysis.contradictions.length > 0,
    flagCount: analysis.linguisticFlags.length,
    consistencyScore: analysis.overallConsistencyScore,
  });
}

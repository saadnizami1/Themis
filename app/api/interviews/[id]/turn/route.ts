import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { prisma } from '@/lib/prisma';
import { runTurn } from '@/lib/interview-engine';
import type { TurnEvent } from '@/lib/interview-engine';

// The single agentic endpoint driving the interview. The witness client sends
// events; the engine decides what Themis does next. Access is gated by the
// interview's unguessable access token.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { token, event } = body as { token: string; event: TurnEvent };

  if (!token || !event?.type) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const interview = await prisma.interview.findUnique({
    where: { id: params.id },
    select: { accessToken: true, status: true },
  });
  if (!interview || interview.accessToken !== token) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (interview.status === 'completed' || interview.status === 'terminated') {
    return NextResponse.json({ error: 'Interview already ended' }, { status: 410 });
  }

  try {
    const result = await runTurn(params.id, event);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[turn] engine error:', err);
    return NextResponse.json(
      { error: 'The interviewer is temporarily unavailable. Please wait a moment and try again.' },
      { status: 503 }
    );
  }
}

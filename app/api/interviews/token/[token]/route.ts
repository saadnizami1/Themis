import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

// Witness uses this to validate their link and get the interview state
// (including enough to resume an interrupted session).
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const interview = await prisma.interview.findUnique({
    where: { accessToken: params.token },
    select: {
      id: true,
      status: true,
      language: true,
      interviewNumber: true,
      currentPhase: true,
      consentAt: true,
      victimName: true,
    },
  });

  if (!interview) return NextResponse.json({ error: 'Invalid link' }, { status: 404 });

  if (interview.status === 'completed' || interview.status === 'terminated') {
    return NextResponse.json(
      { error: 'already_completed', status: interview.status },
      { status: 410 }
    );
  }

  return NextResponse.json(interview);
}

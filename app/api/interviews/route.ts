import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { caseUnlocked } from '@/lib/case-lock';
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit';

const MAX_INTERVIEWS_PER_CASE = 8;

// Create a new interview (generates access token / victim link)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const officerId = (session.user as { id?: string }).id;
  if (!officerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = rateLimit(`new-interview:${officerId}:${clientIp(req)}`, 10, 60 * 60_000);
  if (!rl.ok) {
    const r = tooMany(rl.retryAfterSec);
    return NextResponse.json(r.body, r.init);
  }

  const body = await req.json();
  const { caseId } = body;

  if (!caseId) return NextResponse.json({ error: 'caseId required' }, { status: 400 });

  // Verify case belongs to this officer
  const c = await prisma.case.findFirst({ where: { id: caseId, officerId } });
  if (!c) return NextResponse.json({ error: 'Case not found' }, { status: 404 });

  // PIN-locked cases can only be extended by whoever holds the PIN
  if (!caseUnlocked(c, req)) {
    return NextResponse.json({ error: 'This case is PIN-protected', locked: true }, { status: 403 });
  }

  // Determine interview number
  const existingCount = await prisma.interview.count({ where: { caseId } });
  if (existingCount >= MAX_INTERVIEWS_PER_CASE) {
    return NextResponse.json(
      { error: `A case can hold at most ${MAX_INTERVIEWS_PER_CASE} interviews` },
      { status: 429 }
    );
  }

  const interview = await prisma.interview.create({
    data: {
      caseId,
      interviewNumber: existingCount + 1,
      status: 'pending',
    },
  });

  const interviewUrl = `${process.env.NEXTAUTH_URL}/interview/${interview.accessToken}`;

  return NextResponse.json({ interview, interviewUrl }, { status: 201 });
}

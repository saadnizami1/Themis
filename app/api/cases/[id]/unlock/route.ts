import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyPin, mintCaseKey, isValidPin } from '@/lib/case-lock';
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit';

// Exchange a correct 4-digit PIN for a short-lived case key. Tightly rate
// limited: 10,000 combinations do not survive 5 attempts per 10 minutes.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = rateLimit(`unlock:${params.id}:${clientIp(req)}`, 5, 10 * 60_000);
  if (!rl.ok) {
    const r = tooMany(rl.retryAfterSec);
    return NextResponse.json(
      { error: 'Too many attempts. Wait a few minutes and try again.' },
      r.init
    );
  }

  const { pin } = await req.json();
  if (!isValidPin(pin)) {
    return NextResponse.json({ error: 'Enter the 4-digit PIN' }, { status: 400 });
  }

  const officerId = (session.user as { id?: string }).id;
  const c = await prisma.case.findFirst({
    where: { id: params.id, officerId },
    select: { id: true, pinHash: true },
  });
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!c.pinHash) return NextResponse.json({ caseKey: mintCaseKey(c.id) });

  const ok = await verifyPin(pin, c.pinHash);
  if (!ok) return NextResponse.json({ error: 'Wrong PIN' }, { status: 403 });

  return NextResponse.json({ caseKey: mintCaseKey(c.id) });
}

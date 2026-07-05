import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
export const dynamic = 'force-dynamic';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hashPin, isValidPin, mintCaseKey } from '@/lib/case-lock';
import { verifyChallenge } from '@/lib/challenge';
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit';

const DEMO_EMAIL = 'demo@themis.app';
const DEMO_MAX_ACTIVE_CASES = 30;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const officerId = (session.user as { id?: string }).id;
  if (!officerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cases = await prisma.case.findMany({
    where: { officerId },
    include: {
      interviews: {
        select: {
          id: true,
          status: true,
          language: true,
          interviewNumber: true,
          createdAt: true,
          completedAt: true,
          contradictions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Never ship pinHash to the client. Locked cases appear in the list but
  // their substance (description, analysis output) stays behind the PIN.
  const sanitized = cases.map((c) => {
    const { pinHash, ...rest } = c;
    const locked = !!pinHash;
    return {
      ...rest,
      locked,
      description: locked ? '' : rest.description,
      interviews: rest.interviews.map((iv) => ({
        ...iv,
        contradictions: locked ? null : iv.contradictions,
      })),
    };
  });

  return NextResponse.json(sanitized);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const officerId = (session.user as { id?: string }).id;
  if (!officerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const isDemo = session.user.email === DEMO_EMAIL;

  const rl = rateLimit(`cases:${officerId}:${clientIp(req)}`, 6, 60 * 60_000);
  if (!rl.ok) {
    const r = tooMany(rl.retryAfterSec);
    return NextResponse.json(r.body, r.init);
  }

  const body = await req.json();
  const { caseNumber, incidentType, description, reportPath, reportText, pin, challenge } = body;

  if (!caseNumber || !incidentType || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (
    String(caseNumber).length > 40 ||
    String(incidentType).length > 80 ||
    String(description).length > 2000 ||
    (reportText && String(reportText).length > 20000)
  ) {
    return NextResponse.json({ error: 'A field exceeds its maximum length' }, { status: 400 });
  }

  let pinHash: string | null = null;
  if (isDemo) {
    // Shared workspace: creation requires the observation check and a PIN
    // that will protect this case from other visitors.
    if (!verifyChallenge(challenge?.token, challenge?.answer)) {
      return NextResponse.json(
        { error: 'Observation check failed or expired. Try it again.' },
        { status: 400 }
      );
    }
    if (!isValidPin(pin)) {
      return NextResponse.json(
        { error: 'Set a 4-digit PIN to protect your case' },
        { status: 400 }
      );
    }
    const activeCount = await prisma.case.count({ where: { officerId } });
    if (activeCount >= DEMO_MAX_ACTIVE_CASES) {
      return NextResponse.json(
        { error: 'The demo workspace is full right now. It is cleared periodically; please try again later.' },
        { status: 429 }
      );
    }
    pinHash = await hashPin(pin);
  }

  const existing = await prisma.case.findUnique({ where: { caseNumber } });
  if (existing) {
    return NextResponse.json({ error: 'Case number already exists' }, { status: 409 });
  }

  const newCase = await prisma.case.create({
    data: {
      caseNumber,
      incidentType,
      description,
      pinHash,
      reportPath: reportPath || null,
      reportText: reportText || null,
      officerId,
    },
  });

  const { pinHash: _ph, ...safe } = newCase;
  return NextResponse.json(
    {
      ...safe,
      locked: !!pinHash,
      // The creator starts unlocked; other demo visitors must enter the PIN.
      caseKey: pinHash ? mintCaseKey(newCase.id) : null,
    },
    { status: 201 }
  );
}

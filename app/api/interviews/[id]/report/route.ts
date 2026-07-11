import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { caseUnlocked } from '@/lib/case-lock';
import { isPastExpiry, linkExpiresAt } from '@/lib/expiry';
import { analyzeAndStore } from '@/lib/finalize';
import type { TranscriptEntry } from '@/lib/interview-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const officerId = (session.user as { id?: string }).id;

  let interview = await prisma.interview.findFirst({
    where: {
      id: params.id,
      case: { officerId },
    },
    include: {
      case: {
        include: {
          officer: { select: { name: true } },
          interviews: { select: { id: true } },
        },
      },
    },
  });

  if (!interview) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!caseUnlocked(interview.case, req)) {
    return NextResponse.json(
      {
        error: 'This case is PIN-protected',
        locked: true,
        caseId: interview.case.id,
        caseNumber: interview.case.caseNumber,
      },
      { status: 403 }
    );
  }

  // Lazy expiry: a link that ran out flips to expired the moment anyone
  // looks. If the witness had already said anything, the partial transcript
  // is analyzed right here so the officer still gets a report of whatever
  // took place before the link died.
  const needsExpiry = interview.status === 'expired' || isPastExpiry(interview);
  if (needsExpiry) {
    const spoken = (((interview.transcript as unknown as TranscriptEntry[]) || []) as TranscriptEntry[])
      .filter((e) => e.role !== 'event');
    if (spoken.length > 0 && !interview.linguisticFlags) {
      await analyzeAndStore(interview, 'expired', 'link_expired', linkExpiresAt(interview.createdAt));
      interview = (await prisma.interview.findFirst({
        where: { id: params.id },
        include: {
          case: {
            include: {
              officer: { select: { name: true } },
              interviews: { select: { id: true } },
            },
          },
        },
      }))!;
    } else if (interview.status !== 'expired') {
      await prisma.interview.update({ where: { id: params.id }, data: { status: 'expired' } });
      interview.status = 'expired';
    }
  }

  const { pinHash, ...safeCase } = interview.case;
  return NextResponse.json({ ...interview, case: { ...safeCase, locked: !!pinHash } });
}

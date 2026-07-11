import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
export const dynamic = 'force-dynamic';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { caseUnlocked } from '@/lib/case-lock';
import { sweepExpiredForCase } from '@/lib/expiry';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const officerId = (session.user as { id?: string }).id;

  // 72-hour link expiry is applied lazily on read.
  await sweepExpiredForCase(params.id);

  const c = await prisma.case.findFirst({
    where: { id: params.id, officerId },
    include: {
      officer: { select: { name: true } },
      interviews: {
        orderBy: { interviewNumber: 'asc' },
      },
    },
  });

  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!caseUnlocked(c, req)) {
    return NextResponse.json(
      { error: 'This case is PIN-protected', locked: true, caseNumber: c.caseNumber },
      { status: 403 }
    );
  }

  const { pinHash, ...safe } = c;
  return NextResponse.json({ ...safe, locked: !!pinHash });
}

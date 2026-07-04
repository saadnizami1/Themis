import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Live safety alerts for the officer's dashboard: any interview under this
// officer's cases that the AI escalated. Polled by the dashboard.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const officerId = (session.user as { id?: string }).id;
  if (!officerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const escalated = await prisma.interview.findMany({
    where: {
      status: 'escalated',
      case: { officerId },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      interviewNumber: true,
      victimName: true,
      escalation: true,
      caseId: true,
      case: { select: { caseNumber: true, incidentType: true } },
    },
  });

  return NextResponse.json({ escalated });
}

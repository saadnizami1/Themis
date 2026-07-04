import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const officerId = (session.user as { id?: string }).id;

  const interview = await prisma.interview.findFirst({
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

  return NextResponse.json(interview);
}

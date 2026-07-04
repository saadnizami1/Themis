import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
export const dynamic = 'force-dynamic';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const officerId = (session.user as { id?: string }).id;

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

  return NextResponse.json(c);
}

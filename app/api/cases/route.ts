import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
export const dynamic = 'force-dynamic';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  return NextResponse.json(cases);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const officerId = (session.user as { id?: string }).id;
  if (!officerId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { caseNumber, incidentType, description, reportPath, reportText } = body;

  if (!caseNumber || !incidentType || !description) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      reportPath: reportPath || null,
      reportText: reportText || null,
      officerId,
    },
  });

  return NextResponse.json(newCase, { status: 201 });
}

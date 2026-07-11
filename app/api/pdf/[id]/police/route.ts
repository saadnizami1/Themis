import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { caseUnlocked } from '@/lib/case-lock';
import { renderToBuffer } from '@react-pdf/renderer';
import { PoliceReport } from '@/components/PDF/PoliceReport';
import React from 'react';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse('Unauthorized', { status: 401 });

  const officerId = (session.user as { id?: string }).id;

  const interview = await prisma.interview.findFirst({
    where: { id: params.id, case: { officerId } },
    include: {
      case: {
        include: {
          officer: { select: { name: true } },
        },
      },
    },
  });

  if (!interview) return new NextResponse('Not found', { status: 404 });
  if (!caseUnlocked(interview.case, req)) {
    return new NextResponse('This case is PIN-protected', { status: 403 });
  }
  if (!['completed', 'terminated', 'escalated', 'expired'].includes(interview.status)) {
    return new NextResponse('Interview not yet completed', { status: 400 });
  }
  const spokenEntries = ((interview.transcript as unknown as Array<{ role: string }>) || []).filter(
    (e) => e.role !== 'event'
  );
  if (spokenEntries.length === 0) {
    return new NextResponse('No interview content to report', { status: 400 });
  }

  const props = {
    interview: interview as Parameters<typeof PoliceReport>[0]['interview'],
    caseData: interview.case,
    officerName: interview.case.officer?.name || session.user.name || 'Officer',
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(PoliceReport, props as any) as any;
  const buffer = await renderToBuffer(element);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="police-report-${interview.id}.pdf"`,
    },
  });
}

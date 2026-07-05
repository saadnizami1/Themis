import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { caseUnlocked } from '@/lib/case-lock';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { renderToBuffer } from '@react-pdf/renderer';
import { CourtReport } from '@/components/PDF/CourtReport';
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
          interviews: { select: { id: true } },
        },
      },
    },
  });

  if (!interview) return new NextResponse('Not found', { status: 404 });
  if (!caseUnlocked(interview.case, req)) {
    return new NextResponse('This case is PIN-protected', { status: 403 });
  }
  if (!['completed', 'terminated', 'escalated'].includes(interview.status)) {
    return new NextResponse('Interview not yet completed', { status: 400 });
  }

  const props = {
    interview: interview as Parameters<typeof CourtReport>[0]['interview'],
    caseData: interview.case,
    officerName: interview.case.officer?.name || session.user.name || 'Officer',
    totalInterviews: interview.case.interviews?.length || 1,
  };

  // renderToBuffer expects ReactElement<DocumentProps>; cast through unknown
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(CourtReport, props as any) as any;
  const buffer = await renderToBuffer(element);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="court-report-${interview.id}.pdf"`,
    },
  });
}

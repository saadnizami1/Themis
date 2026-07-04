import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

// Record witness consent + identity at interview start.
// Transcript appends now happen server-side in the turn engine.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { token, victimName, victimAge, language } = body as {
    token: string;
    victimName?: string;
    victimAge?: string | number;
    language?: string;
  };

  const interview = await prisma.interview.findUnique({
    where: { id: params.id },
    select: { accessToken: true },
  });
  if (!interview || interview.accessToken !== token) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.interview.update({
    where: { id: params.id },
    data: {
      ...(victimName !== undefined && { victimName, consentName: victimName }),
      ...(victimAge !== undefined && victimAge !== '' && { victimAge: Number(victimAge) }),
      ...(language !== undefined && { language }),
      consentAt: new Date(),
      status: 'in_progress',
    },
  });

  return NextResponse.json({ ok: true });
}

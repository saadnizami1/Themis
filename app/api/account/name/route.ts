import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CHANGE_WINDOW_DAYS = 30;

function nextChangeAt(nameChangedAt: Date | null): Date | null {
  if (!nameChangedAt) return null;
  return new Date(nameChangedAt.getTime() + CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, nameChangedAt: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const next = nextChangeAt(user.nameChangedAt);
  const canChange = !next || next.getTime() <= Date.now();
  return NextResponse.json({
    name: user.name,
    canChange,
    nextChangeAt: canChange ? null : next,
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // The demo account is shared and public; it cannot be modified.
  if (session.user.email === 'demo@themis.app') {
    return NextResponse.json({ error: 'The demo account cannot be modified' }, { status: 403 });
  }

  const { name } = await req.json();
  const trimmed = String(name || '').trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2 || trimmed.length > 80) {
    return NextResponse.json(
      { error: 'Name must be between 2 and 80 characters' },
      { status: 400 }
    );
  }

  const userId = (session.user as { id?: string }).id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, nameChangedAt: true },
  });
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (trimmed === user.name) {
    return NextResponse.json({ error: 'That is already your name' }, { status: 400 });
  }

  const next = nextChangeAt(user.nameChangedAt);
  if (next && next.getTime() > Date.now()) {
    return NextResponse.json(
      {
        error: `Names can be changed once every ${CHANGE_WINDOW_DAYS} days. Next change available ${next.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        nextChangeAt: next,
      },
      { status: 429 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { name: trimmed, nameChangedAt: new Date() },
    select: { name: true, nameChangedAt: true },
  });

  return NextResponse.json({
    ok: true,
    name: updated.name,
    nextChangeAt: nextChangeAt(updated.nameChangedAt),
  });
}

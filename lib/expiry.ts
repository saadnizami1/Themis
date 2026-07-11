import { prisma } from './prisma';

// Interview links are valid for 72 hours from creation. An interview that
// is not completed inside that window expires: the link stops working and
// the dashboard says so. There is no cron here; expiry is applied lazily
// wherever interviews are read, which keeps every surface consistent.

export const LINK_TTL_MS = 72 * 60 * 60 * 1000;

export function linkExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + LINK_TTL_MS);
}

export function isPastExpiry(iv: { status: string; createdAt: Date }): boolean {
  return (
    (iv.status === 'pending' || iv.status === 'in_progress') &&
    Date.now() > linkExpiresAt(iv.createdAt).getTime()
  );
}

// Flip every overdue pending/in_progress interview this officer owns.
export async function sweepExpiredForOfficer(officerId: string): Promise<void> {
  await prisma.interview.updateMany({
    where: {
      status: { in: ['pending', 'in_progress'] },
      createdAt: { lt: new Date(Date.now() - LINK_TTL_MS) },
      case: { officerId },
    },
    data: { status: 'expired' },
  });
}

export async function sweepExpiredForCase(caseId: string): Promise<void> {
  await prisma.interview.updateMany({
    where: {
      status: { in: ['pending', 'in_progress'] },
      createdAt: { lt: new Date(Date.now() - LINK_TTL_MS) },
      caseId,
    },
    data: { status: 'expired' },
  });
}

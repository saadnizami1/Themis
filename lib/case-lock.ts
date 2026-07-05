import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

// PIN protection for demo-workspace cases. A correct PIN mints a short-lived
// HMAC "case key" the client sends back (x-case-key header, or ?ck= for
// links that cannot carry headers: PDFs and video). The PIN hash never
// leaves the server.

const KEY_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function secret(): string {
  return process.env.NEXTAUTH_SECRET || 'dev-secret';
}

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, pinHash: string): Promise<boolean> {
  return bcrypt.compare(pin, pinHash);
}

export function isValidPin(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{4}$/.test(pin);
}

export function mintCaseKey(caseId: string): string {
  const exp = Date.now() + KEY_TTL_MS;
  const sig = createHmac('sha256', secret()).update(`${caseId}.${exp}`).digest('base64url');
  return `${exp}.${sig}`;
}

export function verifyCaseKey(caseId: string, key: string | null): boolean {
  if (!key) return false;
  const dot = key.indexOf('.');
  if (dot === -1) return false;
  const exp = Number(key.slice(0, dot));
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac('sha256', secret()).update(`${caseId}.${exp}`).digest('base64url');
  const given = key.slice(dot + 1);
  if (expected.length !== given.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
  } catch {
    return false;
  }
}

// Reads the case key from wherever the client could put it.
export function caseKeyFromRequest(req: NextRequest): string | null {
  return req.headers.get('x-case-key') || req.nextUrl.searchParams.get('ck');
}

// True when the request may open this case's content.
export function caseUnlocked(
  c: { id: string; pinHash: string | null },
  req: NextRequest
): boolean {
  if (!c.pinHash) return true;
  return verifyCaseKey(c.id, caseKeyFromRequest(req));
}

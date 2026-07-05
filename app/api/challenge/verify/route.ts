import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createHmac, timingSafeEqual } from 'crypto';
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit';

// Signature-only check for instant client feedback. Does NOT consume the
// token; consumption happens where the challenge is spent (case creation).
// This reveals nothing a 1-in-4 guess at creation would not already yield.
export async function POST(req: NextRequest) {
  const rl = rateLimit(`challenge-verify:${clientIp(req)}`, 60, 10 * 60_000);
  if (!rl.ok) {
    const r = tooMany(rl.retryAfterSec);
    return NextResponse.json(r.body, r.init);
  }

  const { token, answer } = await req.json();
  if (typeof token !== 'string' || typeof answer !== 'number') {
    return NextResponse.json({ ok: false });
  }
  const parts = token.split('.');
  if (parts.length !== 3) return NextResponse.json({ ok: false });
  const [nonce, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return NextResponse.json({ ok: false });

  const secret = process.env.NEXTAUTH_SECRET || 'dev-secret';
  const expected = createHmac('sha256', secret)
    .update(`${nonce}.${exp}.${answer}`)
    .digest('base64url');
  let ok = false;
  try {
    ok = expected.length === sig.length && timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    ok = false;
  }
  return NextResponse.json({ ok });
}

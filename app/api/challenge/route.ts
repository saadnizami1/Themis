import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createChallenge } from '@/lib/challenge';
import { rateLimit, clientIp, tooMany } from '@/lib/rate-limit';

// Issues an observation-check challenge (exhibit SVG + question + signed
// token). Verification happens where the challenge is spent (case creation).
export async function GET(req: NextRequest) {
  const rl = rateLimit(`challenge:${clientIp(req)}`, 30, 10 * 60_000);
  if (!rl.ok) {
    const r = tooMany(rl.retryAfterSec);
    return NextResponse.json(r.body, r.init);
  }
  return NextResponse.json(createChallenge());
}

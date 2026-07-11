import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// The quick check: Themis's bot deterrent. One small arithmetic question
// with three answer options. The correct answer index travels only inside
// an HMAC token, so the page payload never states the answer outright.
// This deters casual automation; the hard quotas and rate limits behind it
// are the real wall.

const TTL_MS = 5 * 60 * 1000;

function secret(): string {
  return process.env.NEXTAUTH_SECRET || 'dev-secret';
}

function rand(n: number): number {
  return Math.floor(Math.random() * n);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Challenge {
  question: string;
  options: string[];
  token: string;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createChallenge(): Challenge {
  const a = 11 + rand(78); // 11..88
  const b = 3 + rand(9); // 3..11
  const sum = a + b;

  // Two nearby decoys, all distinct.
  const decoys = new Set<number>();
  while (decoys.size < 2) {
    const off = (1 + rand(4)) * (rand(2) === 0 ? -1 : 1);
    const d = sum + off;
    if (d !== sum && d > 0) decoys.add(d);
  }

  const options = shuffle([sum, ...Array.from(decoys)]).map(String);
  const answerIndex = options.indexOf(String(sum));

  const nonce = randomBytes(8).toString('base64url');
  const exp = Date.now() + TTL_MS;
  const payload = `${nonce}.${exp}.${answerIndex}`;
  const token = `${nonce}.${exp}.${sign(payload)}`;

  return { question: `What is ${a} + ${b}?`, options, token };
}

// One-time-use guard, best effort per instance.
const used = new Map<string, number>();

export function verifyChallenge(token: unknown, answerIndex: unknown): boolean {
  if (typeof token !== 'string' || typeof answerIndex !== 'number') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [nonce, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  if (used.has(token)) return false;

  const expected = sign(`${nonce}.${exp}.${answerIndex}`);
  if (expected.length !== sig.length) return false;
  let ok = false;
  try {
    ok = timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
  if (!ok) return false;

  used.set(token, exp);
  // Prune expired one-time entries.
  if (used.size > 5000) {
    const now = Date.now();
    const entries = Array.from(used.entries());
    for (const [t, e] of entries) if (e < now) used.delete(t);
  }
  return true;
}

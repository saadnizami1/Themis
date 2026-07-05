import { NextRequest } from 'next/server';

// In-memory sliding-window rate limiter. Per serverless instance, so the
// effective global limit is (limit x warm instances); good enough as a
// flood brake for a pilot without adding external infrastructure. All
// expensive routes ALSO have absolute quotas (case counts, turn caps) that
// are enforced in the database and cannot be reset by cycling instances.

const buckets = new Map<string, number[]>();
let lastSweep = Date.now();

function sweep(now: number) {
  // Occasionally drop empty buckets so the map cannot grow unbounded.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  const entries = Array.from(buckets.entries());
  for (const [key, hits] of entries) {
    if (hits.length === 0 || hits[hits.length - 1] < now - 60 * 60_000) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  sweep(now);
  const hits = (buckets.get(key) || []).filter((t) => t > now - windowMs);
  if (hits.length >= limit) {
    const retryAfterSec = Math.ceil((hits[0] + windowMs - now) / 1000);
    buckets.set(key, hits);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSec: 0 };
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export function tooMany(retryAfterSec: number) {
  return {
    body: { error: 'Too many requests. Please wait a moment and try again.' },
    init: { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  };
}

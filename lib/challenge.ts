import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

// The observation check: Themis's bot deterrent, styled as a tiny witness
// exercise. The server draws a small "exhibit" of three evidence-room items,
// the client shows it for a few seconds, hides it, and asks one recall
// question. The correct answer index travels only inside an HMAC token, so
// the page payload never states the answer outright. This deters casual
// automation; the hard quotas and rate limits behind it are the real wall.

const TTL_MS = 5 * 60 * 1000;

function secret(): string {
  return process.env.NEXTAUTH_SECRET || 'dev-secret';
}

interface Item {
  id: string;
  label: string;
  draw: (color: string) => string; // inner SVG, 48x48 viewBox
}

// Simple line-art evidence items, drawn in the app's visual language.
const ITEMS: Item[] = [
  {
    id: 'key',
    label: 'key',
    draw: (c) =>
      `<g stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"><circle cx="15" cy="17" r="7"/><path d="M20 22L36 38M31 33l5-5M27 29l4-4"/></g>`,
  },
  {
    id: 'watch',
    label: 'watch',
    draw: (c) =>
      `<g stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"><circle cx="24" cy="24" r="11"/><path d="M24 17v7l5 3M20 6h8l1 5M20 42h8l1-5" /></g>`,
  },
  {
    id: 'briefcase',
    label: 'briefcase',
    draw: (c) =>
      `<g stroke="${c}" stroke-width="2.6" fill="none" stroke-linejoin="round"><rect x="8" y="16" width="32" height="22" rx="2"/><path d="M18 16v-5h12v5M8 26h32"/></g>`,
  },
  {
    id: 'umbrella',
    label: 'umbrella',
    draw: (c) =>
      `<g stroke="${c}" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M6 24a18 18 0 0136 0z"/><path d="M24 24v14a4 4 0 01-8 0"/></g>`,
  },
  {
    id: 'spectacles',
    label: 'pair of spectacles',
    draw: (c) =>
      `<g stroke="${c}" stroke-width="2.6" fill="none"><circle cx="13" cy="28" r="7"/><circle cx="35" cy="28" r="7"/><path d="M20 28h8M6 28l-2-6M42 28l2-6"/></g>`,
  },
  {
    id: 'mug',
    label: 'mug',
    draw: (c) =>
      `<g stroke="${c}" stroke-width="2.6" fill="none" stroke-linejoin="round"><path d="M10 14h22v20a6 6 0 01-6 6H16a6 6 0 01-6-6z"/><path d="M32 18h6a5 5 0 010 10h-6"/></g>`,
  },
];

const COLORS: Array<{ name: string; hex: string }> = [
  { name: 'green', hex: '#1E4B3B' },
  { name: 'blue', hex: '#1D4ED8' },
  { name: 'red', hex: '#B4231F' },
  { name: 'amber', hex: '#B45309' },
  { name: 'violet', hex: '#6D28D9' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface Challenge {
  svg: string;
  question: string;
  options: string[];
  token: string;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createChallenge(): Challenge {
  const items = shuffle(ITEMS).slice(0, 3);
  const colors = shuffle(COLORS).slice(0, 4); // 3 used + 1 decoy option
  const target = Math.floor(Math.random() * 3);

  const scene = items
    .map(
      (item, i) =>
        `<g transform="translate(${14 + i * 64}, 10)">${item.draw(colors[i].hex)}</g>`
    )
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 72" role="img" aria-label="Exhibit with three items">${scene}<line x1="8" y1="66" x2="212" y2="66" stroke="#E6E3DA" stroke-width="2"/></svg>`;

  const question = `What colour was the ${items[target].label}?`;
  const options = shuffle(colors.map((c) => c.name));
  const answerIndex = options.indexOf(colors[target].name);

  const nonce = randomBytes(8).toString('base64url');
  const exp = Date.now() + TTL_MS;
  const payload = `${nonce}.${exp}.${answerIndex}`;
  const token = `${nonce}.${exp}.${sign(payload)}`;

  return { svg, question, options, token };
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

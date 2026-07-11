'use client';

import { useEffect, useRef, useState } from 'react';

// The hero's product artifact: an interview excerpt that replays itself like
// a live session. Lines type out with their timestamps, then the screening
// verdict stamps in. Plays once when scrolled into view; small replay
// control; honours prefers-reduced-motion by rendering the finished record.

const LINES = [
  {
    time: '14:32:06',
    speaker: 'Themis',
    text: 'You said there was a man near the counter. Tell me everything you remember about him.',
  },
  {
    time: '14:32:41',
    speaker: 'Witness',
    text: 'He stood close to the register, maybe a metre from it. I could see his hands the whole time.',
  },
];

const SCREEN_NOTE =
  'Question passed. No new detail introduced: "the counter" originated with the witness in the free narrative.';

const CHAR_MS = 14;
const LINE_PAUSE_MS = 450;
const STAMP_PAUSE_MS = 500;

type Playback = { line: number; chars: number; stamp: boolean; done: boolean };

const FINISHED: Playback = { line: LINES.length, chars: 0, stamp: true, done: true };

export default function SpecimenReplay() {
  const ref = useRef<HTMLDivElement>(null);
  const [pb, setPb] = useState<Playback>({ line: -1, chars: 0, stamp: false, done: false });
  const [reduced, setReduced] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    if (mq.matches) setPb(FINISHED);
  }, []);

  // Drive the playback one tick at a time.
  useEffect(() => {
    if (reduced || pb.done || pb.line < 0) return;
    const tick = () => {
      setPb((p) => {
        if (p.line >= LINES.length) {
          if (!p.stamp) return { ...p, stamp: true };
          return { ...p, done: true };
        }
        const lineText = LINES[p.line].text;
        if (p.chars < lineText.length) {
          // Type a few characters per tick so long lines stay brisk.
          return { ...p, chars: Math.min(lineText.length, p.chars + 2) };
        }
        return { line: p.line + 1, chars: 0, stamp: false, done: false };
      });
    };
    const delay =
      pb.line >= LINES.length
        ? STAMP_PAUSE_MS
        : pb.chars === 0
        ? LINE_PAUSE_MS
        : CHAR_MS;
    timerRef.current = setTimeout(tick, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pb, reduced]);

  // Start when scrolled into view.
  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPb((p) => (p.line === -1 ? { line: 0, chars: 0, stamp: false, done: false } : p));
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const replay = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPb({ line: 0, chars: 0, stamp: false, done: false });
  };

  const playing = pb.line >= 0 && !pb.done;

  return (
    <figure ref={ref} className="border border-line bg-white">
      <figcaption className="flex items-center justify-between gap-3 px-5 py-3 border-b border-line">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          {playing && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
          Interview record
        </span>
        <span className="font-mono text-[11px] tracking-[0.04em] text-faint">
          FIR-2026-0187 / 02
        </span>
      </figcaption>

      <div className="p-5 sm:p-6 font-mono text-[12.5px] leading-relaxed space-y-4 min-h-[16rem]">
        {LINES.map((line, i) => {
          if (pb.line < i && !pb.done) return null;
          const full = pb.done || pb.line > i;
          const text = full ? line.text : line.text.slice(0, pb.chars);
          const typing = !full && pb.line === i;
          return (
            <div key={i} className="grid grid-cols-[4.5rem_1fr] gap-x-4">
              <span className="text-faint">{line.time}</span>
              <div>
                <span className="text-faint uppercase text-[10.5px] tracking-[0.14em]">
                  {line.speaker}
                </span>
                <p className="text-ink mt-1">
                  {text}
                  {typing && <span className="inline-block w-[7px] h-[1.1em] bg-accent/70 align-text-bottom ml-0.5 animate-pulse" />}
                </p>
              </div>
            </div>
          );
        })}

        {(pb.stamp || pb.done) && (
          <div
            className="pt-4 border-t border-line grid grid-cols-[4.5rem_1fr] gap-x-4"
            style={
              reduced
                ? undefined
                : { animation: 'fadeUp 0.45s cubic-bezier(0.22,1,0.36,1) both' }
            }
          >
            <span className="text-accent uppercase text-[10.5px] tracking-[0.14em] pt-0.5">
              Screen
            </span>
            <p className="text-muted text-[12px]">{SCREEN_NOTE}</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-2.5 border-t border-line">
        <span className="text-faint text-xs">
          Excerpt from a sample case, replayed as it happened.
        </span>
        <button
          type="button"
          onClick={replay}
          disabled={playing}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted hover:text-ink transition-colors disabled:opacity-40"
        >
          Replay
        </button>
      </div>
    </figure>
  );
}

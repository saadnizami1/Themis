'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// The observation check: Themis's bot deterrent as a tiny witness exercise.
// An exhibit of three items appears for five seconds, disappears, and one
// recall question is asked. Server-rendered SVG; the answer travels only
// inside an HMAC token.

export interface SolvedChallenge {
  token: string;
  answer: number;
}

type Stage = 'loading' | 'memorize' | 'question' | 'solved' | 'error';

const LOOK_MS = 5000;

export default function ObservationCheck({
  onChange,
}: {
  onChange: (solved: SolvedChallenge | null) => void;
}) {
  const [stage, setStage] = useState<Stage>('loading');
  const [svg, setSvg] = useState('');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [progress, setProgress] = useState(0);
  const [missed, setMissed] = useState(false);
  const [checking, setChecking] = useState(false);
  const rafRef = useRef(0);

  const load = useCallback(async (afterMiss: boolean) => {
    cancelAnimationFrame(rafRef.current);
    setStage('loading');
    setMissed(afterMiss);
    onChange(null);
    try {
      const res = await fetch('/api/challenge');
      if (!res.ok) throw new Error();
      const d = await res.json();
      setSvg(d.svg);
      setQuestion(d.question);
      setOptions(d.options);
      setToken(d.token);
      setStage('memorize');
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / LOOK_MS);
        setProgress(p);
        if (p < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setStage('question');
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setStage('error');
    }
  }, [onChange]);

  useEffect(() => {
    load(false);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = async (index: number) => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await fetch('/api/challenge/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answer: index }),
      });
      const d = await res.json();
      setChecking(false);
      if (d.ok) {
        setStage('solved');
        setMissed(false);
        onChange({ token, answer: index });
      } else {
        load(true);
      }
    } catch {
      setChecking(false);
      load(true);
    }
  };

  return (
    <div className="border border-line bg-white">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          Observation check
        </span>
        {stage === 'solved' && (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            Passed
          </span>
        )}
      </div>

      <div className="p-4">
        {stage === 'loading' && (
          <div className="h-24 flex items-center justify-center">
            <span className="text-faint text-sm">Preparing the exhibit...</span>
          </div>
        )}

        {stage === 'error' && (
          <div className="h-24 flex flex-col items-center justify-center gap-2">
            <span className="text-faint text-sm">The exhibit could not be loaded.</span>
            <button type="button" onClick={() => load(false)} className="text-sm text-ink border-b border-ink/30 hover:border-ink">
              Try again
            </button>
          </div>
        )}

        {stage === 'memorize' && (
          <div>
            <p className="text-muted text-sm mb-3">
              {missed ? 'Not quite. A new exhibit; look carefully.' : 'A witness notices things. Study the exhibit.'}
            </p>
            <div
              className="mx-auto max-w-[16rem]"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <div className="h-px bg-line mt-4 relative overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-accent"
                style={{ width: `${(1 - progress) * 100}%`, height: '2px', top: '-0.5px' }}
              />
            </div>
          </div>
        )}

        {stage === 'question' && (
          <div>
            <p className="text-ink text-sm font-medium">{question}</p>
            <p className="text-faint text-xs mt-1">From memory.</p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  disabled={checking}
                  onClick={() => pick(i)}
                  className="px-3 py-2 border border-line hover:border-accent hover:text-accent text-ink text-sm rounded-sm transition-colors text-center capitalize disabled:opacity-60"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {stage === 'solved' && (
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-muted text-sm">
              Well observed. You may file the case.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

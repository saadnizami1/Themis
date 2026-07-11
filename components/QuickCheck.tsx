'use client';

import { useCallback, useEffect, useState } from 'react';

// The quick check: one small sum, three options, instant feedback.
// Server-signed; the answer never appears in the page payload.

export interface SolvedChallenge {
  token: string;
  answer: number;
}

type Stage = 'loading' | 'question' | 'solved' | 'error';

export default function QuickCheck({
  onChange,
}: {
  onChange: (solved: SolvedChallenge | null) => void;
}) {
  const [stage, setStage] = useState<Stage>('loading');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [token, setToken] = useState('');
  const [missed, setMissed] = useState(false);
  const [checking, setChecking] = useState(false);

  const load = useCallback(async (afterMiss: boolean) => {
    setStage('loading');
    setMissed(afterMiss);
    onChange(null);
    try {
      const res = await fetch('/api/challenge');
      if (!res.ok) throw new Error();
      const d = await res.json();
      setQuestion(d.question);
      setOptions(d.options);
      setToken(d.token);
      setStage('question');
    } catch {
      setStage('error');
    }
  }, [onChange]);

  useEffect(() => {
    load(false);
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
          Quick check
        </span>
        {stage === 'solved' && (
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            Passed
          </span>
        )}
      </div>

      <div className="p-4">
        {stage === 'loading' && (
          <div className="h-16 flex items-center justify-center">
            <span className="text-faint text-sm">One moment...</span>
          </div>
        )}

        {stage === 'error' && (
          <div className="h-16 flex flex-col items-center justify-center gap-2">
            <span className="text-faint text-sm">The check could not be loaded.</span>
            <button
              type="button"
              onClick={() => load(false)}
              className="text-sm text-ink border-b border-ink/30 hover:border-ink"
            >
              Try again
            </button>
          </div>
        )}

        {stage === 'question' && (
          <div>
            <p className="text-ink text-sm font-medium">
              {missed ? 'Not quite. Try this one: ' : ''}
              {question}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              {options.map((opt, i) => (
                <button
                  key={`${opt}-${i}`}
                  type="button"
                  disabled={checking}
                  onClick={() => pick(i)}
                  className="px-3 py-2 border border-line hover:border-accent hover:text-accent text-ink font-mono text-sm rounded-sm transition-colors text-center disabled:opacity-60"
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
            <p className="text-muted text-sm">Done. You may file the case.</p>
          </div>
        )}
      </div>
    </div>
  );
}

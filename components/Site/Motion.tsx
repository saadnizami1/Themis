'use client';

// Interaction patterns adapted from 21st.dev community components, ported
// off framer-motion onto this site's vanilla scroll primitives:
//
// - RevealHeading: "Auto Revealing Heading" by reapollo
//   https://21st.dev/@larsen66/components/auto-revealing-heading
// - TextReveal: "Text Reveal" by Magic UI
//   https://21st.dev/@dillionverma/components/text-reveal
//
// Both degrade to static text without JS and honour prefers-reduced-motion.

import { useEffect, useRef, useState } from 'react';
import { useScrollProgress } from './Scroll';

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Staggered per-word reveal, triggered once when the heading enters view.
export function RevealHeading({
  text,
  className = '',
  stagger = 70,
  delay = 0,
}: {
  text: string;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(' ');
  const visible = shown || reduced;

  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden
          className="inline-block"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'none' : 'translateY(0.5em)',
            transition: reduced
              ? 'none'
              : `opacity 0.6s cubic-bezier(0.22,1,0.36,1) ${delay + i * stagger}ms, transform 0.6s cubic-bezier(0.22,1,0.36,1) ${delay + i * stagger}ms`,
          }}
        >
          {word}
          {i < words.length - 1 ? ' ' : ''}
        </span>
      ))}
    </span>
  );
}

// Scroll-driven word-by-word reveal inside a tall sticky section. The
// paragraph inks in as the reader scrolls through it.
export function TextReveal({
  text,
  className = '',
  heightVh = 200,
}: {
  text: string;
  className?: string;
  heightVh?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(wrapRef);
  const reduced = usePrefersReducedMotion();
  const words = text.split(' ');
  // Finish inking slightly before the section releases.
  const p = Math.min(1, progress * 1.15);

  return (
    <div ref={wrapRef} className="relative" style={{ height: reduced ? 'auto' : `${heightVh}vh` }}>
      <div className={reduced ? '' : 'sticky top-0 flex h-screen items-center'}>
        <p className={`flex flex-wrap ${className}`} aria-label={text}>
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            const o = reduced ? 1 : Math.min(1, Math.max(0, (p - start) / (end - start)));
            return (
              <span key={i} aria-hidden className="relative mr-[0.28em]">
                <span className="absolute opacity-20">{word}</span>
                <span style={{ opacity: o }}>{word}</span>
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}

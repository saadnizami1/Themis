'use client';

import { useEffect, useRef, useState } from 'react';

// Scroll primitives for the marketing pages. No animation library:
// IntersectionObserver for reveals, one rAF-throttled scroll listener for
// scroll-linked sections. Everything degrades to static content without JS.

export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

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
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(24px)',
        transition: `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Returns 0..1 progress of scrolling through a tall wrapper element.
function useScrollProgress(ref: React.RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        if (total <= 0) return;
        const p = Math.min(1, Math.max(0, -rect.top / total));
        setProgress(p);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);

  return progress;
}

export interface Panel {
  kicker: string;
  title: string;
  body: string;
  note: string;
}

// Sticky horizontal walkthrough: the page keeps scrolling while the panels
// slide sideways. On small screens it renders as stacked cards instead.
export function StickyPanels({ panels, heading }: { panels: Panel[]; heading: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const progress = useScrollProgress(wrapRef);
  const shift = progress * (panels.length - 1);

  return (
    <>
      {/* Mobile: stacked */}
      <section className="md:hidden max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-2xl font-semibold tracking-tight mb-8">{heading}</h2>
        <div className="space-y-4">
          {panels.map((p) => (
            <Reveal key={p.title}>
              <div className="border border-line rounded-2xl p-6 bg-white">
                <p className="text-accent text-xs font-semibold uppercase tracking-widest">{p.kicker}</p>
                <h3 className="text-xl font-semibold mt-2">{p.title}</h3>
                <p className="text-muted text-sm mt-3 leading-relaxed">{p.body}</p>
                <p className="text-faint text-xs mt-4 pt-4 border-t border-line">{p.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Desktop: sticky horizontal */}
      <section
        ref={wrapRef}
        className="hidden md:block relative"
        style={{ height: `${panels.length * 60 + 100}vh` }}
      >
        <div className="sticky top-0 h-screen overflow-hidden flex flex-col justify-center">
          <div className="max-w-6xl mx-auto px-5 w-full mb-10 flex items-end justify-between">
            <h2 className="text-3xl font-semibold tracking-tight">{heading}</h2>
            <span className="text-faint text-sm tabular-nums">
              {String(Math.min(panels.length, Math.floor(shift) + 1)).padStart(2, '0')} /{' '}
              {String(panels.length).padStart(2, '0')}
            </span>
          </div>
          <div
            className="flex gap-6 will-change-transform pl-[max(1.25rem,calc((100vw-72rem)/2))]"
            style={{ transform: `translateX(calc(${-shift} * (min(44rem, 70vw) + 1.5rem)))` }}
          >
            {panels.map((p, i) => {
              const active = Math.round(shift) === i;
              return (
                <article
                  key={p.title}
                  className={`shrink-0 w-[min(44rem,70vw)] rounded-3xl border p-10 transition-all duration-500 ${
                    active ? 'border-accent-border bg-accent-soft/40' : 'border-line bg-white'
                  }`}
                >
                  <p className="text-accent text-xs font-semibold uppercase tracking-widest">{p.kicker}</p>
                  <h3 className="text-3xl font-semibold mt-3 tracking-tight">{p.title}</h3>
                  <p className="text-muted mt-5 leading-relaxed max-w-xl">{p.body}</p>
                  <p className="text-faint text-sm mt-8 pt-6 border-t border-line max-w-xl">{p.note}</p>
                </article>
              );
            })}
          </div>
          {/* Progress rail */}
          <div className="max-w-6xl mx-auto px-5 w-full mt-10">
            <div className="h-px bg-line relative">
              <div
                className="absolute inset-y-0 left-0 bg-accent transition-none"
                style={{ width: `${progress * 100}%`, height: '2px', top: '-0.5px' }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Simple counter that animates when scrolled into view.
export function Stat({ value, suffix = '', label }: { value: number; suffix?: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const dur = 1200;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / dur);
          setN(Math.round(value * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <div ref={ref}>
      <p className="text-4xl sm:text-5xl font-semibold tracking-tight tabular-nums">
        {n}
        {suffix}
      </p>
      <p className="text-muted text-sm mt-2">{label}</p>
    </div>
  );
}

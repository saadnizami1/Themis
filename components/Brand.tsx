export function Mark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path strokeLinecap="round" d="M12 3v18M8 21h8M12 6l-6 2m6-2l6 2" />
      <path strokeLinecap="round" d="M6 8l-2.5 5a3 3 0 005 0L6 8zm12 0l-2.5 5a3 3 0 005 0L18 8z" />
    </svg>
  );
}

export function Wordmark({ markClass = 'w-6 h-6', textClass = 'text-lg' }: { markClass?: string; textClass?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <Mark className={markClass} />
      <span className={`font-semibold tracking-tight ${textClass}`}>Themis</span>
    </span>
  );
}

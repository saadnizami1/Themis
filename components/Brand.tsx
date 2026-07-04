/*
 * Brand mark: a balance scale whose column is a serif T, recreated as a
 * vector from the Themis logo so it stays crisp at every size.
 *
 * To use the original PNG instead, save it as public/logo.png and replace
 * the <Mark/> + text in Wordmark with:
 *   <img src="/logo.png" alt="Themis" className="h-7 w-auto" />
 */

export function Mark({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 104" className={className} fill="currentColor" aria-hidden>
      {/* Beam / T crossbar */}
      <path d="M6 12h108v10H6z" />
      {/* Column with flared serif base */}
      <path d="M52 22h16v58c0 2 1.6 4 4.4 5l7.6 3v6H40v-6l7.6-3c2.8-1 4.4-3 4.4-5V22z" />
      {/* Left pan strings */}
      <g stroke="currentColor" strokeWidth="3" fill="none">
        <path d="M25 24v34M25 24L11 58M25 24l14 34" />
      </g>
      {/* Left pan bowl */}
      <path d="M8 58h34c0 10-7.6 17-17 17S8 68 8 58z" />
      {/* Right pan strings */}
      <g stroke="currentColor" strokeWidth="3" fill="none">
        <path d="M95 24v34M95 24L81 58M95 24l14 34" />
      </g>
      {/* Right pan bowl */}
      <path d="M78 58h34c0 10-7.6 17-17 17s-17-7-17-17z" />
    </svg>
  );
}

export function Wordmark({
  markClass = 'w-7 h-7',
  textClass = 'text-lg',
}: {
  markClass?: string;
  textClass?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink">
      <Mark className={markClass} />
      <span className={`font-bold tracking-[0.08em] ${textClass}`}>THEMIS</span>
    </span>
  );
}

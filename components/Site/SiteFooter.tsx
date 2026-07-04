import Link from 'next/link';
import { Wordmark } from '@/components/Brand';

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="max-w-6xl mx-auto px-5 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <Wordmark textClass="text-base" markClass="w-5 h-5" />
            <p className="text-faint text-xs mt-2">Structured witness interviews for investigators.</p>
          </div>
          <nav className="grid grid-cols-2 sm:flex gap-x-8 gap-y-2 text-sm">
            <Link href="/methodology" className="text-muted hover:text-ink transition-colors">Methodology</Link>
            <Link href="/security" className="text-muted hover:text-ink transition-colors">Security</Link>
            <Link href="/contact" className="text-muted hover:text-ink transition-colors">Contact</Link>
            <Link href="/terms" className="text-muted hover:text-ink transition-colors">Terms</Link>
            <Link href="/privacy" className="text-muted hover:text-ink transition-colors">Privacy</Link>
            <Link href="/login" className="text-muted hover:text-ink transition-colors">Sign in</Link>
          </nav>
        </div>
        <p className="text-faint text-xs mt-8 leading-relaxed max-w-3xl">
          Themis produces computational indicators for professional review. It does not determine
          truthfulness or deception, and its output must be reviewed by qualified forensic
          professionals before investigative or legal use.
        </p>
      </div>
    </footer>
  );
}

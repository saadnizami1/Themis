import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import { Reveal } from './Scroll';

export default function PageShell({
  title,
  intro,
  kicker,
  wide = false,
  children,
}: {
  title: string;
  intro?: string;
  kicker?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />
      <main className={`flex-1 w-full ${wide ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-5 py-12 sm:py-16`}>
        <Reveal>
          {kicker && (
            <p className="text-accent text-xs font-semibold uppercase tracking-widest mb-3">{kicker}</p>
          )}
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight leading-tight">{title}</h1>
          {intro && <p className="text-muted mt-5 leading-relaxed max-w-2xl">{intro}</p>}
        </Reveal>
        <div className="mt-12 space-y-12">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <div className="text-muted text-sm leading-relaxed mt-3 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-ink">
          {children}
        </div>
      </section>
    </Reveal>
  );
}

export function CardGrid({
  items,
  cols = 2,
}: {
  items: Array<{ title: string; body: string }>;
  cols?: 2 | 3;
}) {
  return (
    <div className={`grid gap-3 mt-5 sm:grid-cols-2 ${cols === 3 ? 'lg:grid-cols-3' : ''}`}>
      {items.map((it) => (
        <div
          key={it.title}
          className="rounded-xl border border-line bg-white p-5 hover:border-accent-border transition-colors"
        >
          <p className="font-medium text-ink text-sm">{it.title}</p>
          <p className="text-muted text-sm mt-1.5 leading-relaxed">{it.body}</p>
        </div>
      ))}
    </div>
  );
}

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
    <div className="min-h-screen bg-paper flex flex-col">
      <SiteHeader />
      <main className={`flex-1 w-full ${wide ? 'max-w-5xl' : 'max-w-3xl'} mx-auto px-5 py-14 sm:py-20`}>
        <Reveal>
          {kicker && (
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent mb-4">{kicker}</p>
          )}
          <h1 className="font-serif text-4xl sm:text-6xl tracking-tight leading-[1.06]">{title}</h1>
          {intro && <p className="text-muted mt-6 leading-relaxed max-w-2xl">{intro}</p>}
        </Reveal>
        <div className="mt-14 space-y-12">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="pt-8 border-t border-line">
        <h2 className="font-serif text-2xl tracking-tight">{title}</h2>
        <div className="text-muted text-sm leading-relaxed mt-4 space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-ink">
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
    <div className={`grid mt-6 gap-px bg-line border border-line sm:grid-cols-2 ${cols === 3 ? 'lg:grid-cols-3' : ''}`}>
      {items.map((it) => (
        <div key={it.title} className="bg-white p-5">
          <p className="font-medium text-ink text-sm">{it.title}</p>
          <p className="text-muted text-sm mt-1.5 leading-relaxed">{it.body}</p>
        </div>
      ))}
    </div>
  );
}

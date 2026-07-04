import PageShell, { Section } from '@/components/Site/PageShell';
import { Reveal } from '@/components/Site/Scroll';

export const metadata = { title: 'Contact | Themis' };

export default function ContactPage() {
  return (
    <PageShell
      kicker="Contact"
      title="Talk to the team"
      intro="Themis is in a pilot phase. For pilot participation, methodology questions, or feedback, get in touch directly."
    >
      <Reveal>
        <a
          href="mailto:saadnizami@icloud.com"
          className="block rounded-2xl border border-line bg-gradient-to-br from-white to-accent-soft/50 p-8 hover:border-accent-border transition-colors group"
        >
          <p className="text-faint text-xs uppercase tracking-widest">Email</p>
          <p className="text-xl sm:text-2xl font-semibold mt-2 text-ink group-hover:text-accent transition-colors break-all">
            saadnizami@icloud.com
          </p>
          <p className="text-muted text-sm mt-3">We usually reply within two working days.</p>
        </a>
      </Reveal>

      <Section title="For departments">
        <p>
          If you are evaluating Themis for a police department or investigative unit, the
          fastest way to assess it is the demo workspace on the home page. It contains a
          complete sample case with a transcript, analysis, and reports, and you can run a live
          interview on yourself. We are happy to walk through methodology, data handling, and
          deployment questions by email.
        </p>
      </Section>

      <Section title="For researchers">
        <p>
          The design notes describe the interview architecture, the screening model, and the
          safety design in detail, with references. If you work in investigative interviewing,
          forensic linguistics, or related fields, we would genuinely like to hear where the
          design falls short.
        </p>
      </Section>

      <Section title="Security reports">
        <p>
          Suspected vulnerabilities can be sent to the same address. Please include steps to
          reproduce.
        </p>
      </Section>
    </PageShell>
  );
}

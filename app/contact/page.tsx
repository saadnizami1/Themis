import PageShell, { Section } from '@/components/Site/PageShell';

export const metadata = { title: 'Contact — Themis' };

export default function ContactPage() {
  return (
    <PageShell
      title="Contact"
      intro="Themis is in a pilot phase. For pilot participation, questions, or feedback, get in touch directly."
    >
      <Section title="Email">
        <p>
          <a
            href="mailto:saadnizami@icloud.com"
            className="text-accent underline underline-offset-2 text-base"
          >
            saadnizami@icloud.com
          </a>
        </p>
        <p>We usually reply within two working days.</p>
      </Section>

      <Section title="For departments">
        <p>
          If you are evaluating Themis for a police department or investigative unit, the fastest
          way to assess it is the demo workspace on the home page — it contains a complete sample
          case with a transcript, analysis, and reports, and you can run a live interview on
          yourself. We are happy to walk through methodology, data handling, and deployment
          questions by email.
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

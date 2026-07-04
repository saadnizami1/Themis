import PageShell, { Section } from '@/components/Site/PageShell';

export const metadata = { title: 'Terms of Use — Themis' };

export default function TermsPage() {
  return (
    <PageShell
      title="Terms of Use"
      intro="Last updated 4 July 2026. These terms cover the pilot programme."
    >
      <Section title="1. What Themis is">
        <p>
          Themis is an AI-assisted forensic interview platform operated for authorised law
          enforcement use. It conducts structured, recorded interviews of victims and witnesses
          and produces transcripts, computational linguistic analysis, and reports for the
          investigating officer.
        </p>
        <p>
          These terms apply to <strong>officers</strong> (credentialed law-enforcement users),{' '}
          <strong>interview participants</strong> (victims and witnesses using a private link),
          and <strong>demo visitors</strong> (anyone using the public demo workspace).
        </p>
      </Section>

      <Section title="2. The interviewer is an AI system">
        <p>
          Interviews are conducted entirely by software. No human is listening or watching live.
          This is disclosed to every participant before the interview begins, and proceeding
          requires explicit consent. AI systems make mistakes; participants are instructed to say
          so when anything the interviewer says is unclear or wrong, and the correction becomes
          part of the record.
        </p>
      </Section>

      <Section title="3. Participant rights">
        <p>Every interview participant may, at any time and without giving a reason:</p>
        <ul>
          <li>take a break (&quot;I need a break&quot;);</li>
          <li>have a question repeated or rephrased;</li>
          <li>decline to answer — &quot;I don&apos;t know&quot; is always acceptable;</li>
          <li>stop the interview entirely (&quot;I want to stop&quot;) — a partial interview is never held against a participant;</li>
          <li>use English or Urdu.</li>
        </ul>
        <p>
          If the system detects acute distress or disclosure of ongoing danger, it pauses the
          interview, shows support information, and alerts the investigating officer. This cannot
          be disabled.
        </p>
      </Section>

      <Section title="4. Recording">
        <p>
          Interviews are recorded in full: video, transcript, and timestamps. Consent at the start
          of the interview covers this recording. Interview material is used solely for the
          relevant investigation and any resulting proceedings, is accessible only to the case
          officer, is never used to train AI models, and is never sold.
        </p>
      </Section>

      <Section title="5. Analysis is not evidence of truth or deception">
        <p>
          Themis produces computational linguistic indicators — patterns such as hedging,
          specificity, and cross-interview contradiction. They are not lie detection, clinical
          findings, or credibility determinations. Officers and downstream readers must treat all
          output as an investigative aid requiring independent professional review. Themis output
          alone must never be the basis for charging, arrest, or any adverse action.
        </p>
      </Section>

      <Section title="6. Officer obligations">
        <ul>
          <li>Use the service only for lawful, authorised investigations.</li>
          <li>Keep credentials confidential; you are responsible for activity under your account.</li>
          <li>Send interview links only to the intended participant.</li>
          <li>Follow your department&apos;s safeguarding procedures for minors and vulnerable adults, including guardian presence where required.</li>
          <li>Respond promptly to safety escalations.</li>
          <li>Do not attempt to elicit leading or suggestive questioning or to bypass the system&apos;s safeguards.</li>
        </ul>
      </Section>

      <Section title="7. The demo workspace">
        <p>
          The demo is a shared workspace with fictional data, provided so anyone can evaluate the
          product. Do not enter real case information, personal data, or anything confidential.
          Demo content is visible to other visitors and is cleared periodically without notice.
        </p>
      </Section>

      <Section title="8. Availability and liability">
        <p>
          The service is provided on a pilot basis, as is and as available. Session state is
          preserved, so an interrupted interview can resume from the same link. To the maximum
          extent permitted by law, the operators of Themis are not liable for indirect or
          consequential damages. The investigating agency remains solely responsible for all
          investigative and legal decisions.
        </p>
      </Section>

      <Section title="9. Changes and contact">
        <p>
          Material changes to these terms will be communicated to participating departments.
          Questions:{' '}
          <a href="mailto:saadnizami@icloud.com" className="text-accent underline underline-offset-2">
            saadnizami@icloud.com
          </a>
          .
        </p>
      </Section>
    </PageShell>
  );
}

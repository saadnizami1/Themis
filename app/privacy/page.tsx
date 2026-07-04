import PageShell, { Section } from '@/components/Site/PageShell';

export const metadata = { title: 'Privacy Notice | Themis' };

export default function PrivacyPage() {
  return (
    <PageShell
      title="Privacy Notice"
      intro="Last updated 4 July 2026. This notice covers interview participants, officers, and demo visitors during the pilot programme. Themis processes case data on behalf of the investigating agency, which remains the data controller."
    >
      <Section title="1. What we collect">
        <p><strong>From interview participants:</strong></p>
        <ul>
          <li>name and age, as given at the consent screen;</li>
          <li>the interview recording: video, transcript, timestamps;</li>
          <li>the system&apos;s computational analysis of the transcript;</li>
          <li>consent records and safety-relevant events (breaks, stops, escalations).</li>
        </ul>
        <p>
          <strong>From officers:</strong> name, official email, station, and the case material you
          enter. <strong>From demo visitors:</strong> nothing beyond what you type into the shared
          demo workspace.
        </p>
        <p>No advertising identifiers, no analytics trackers. Only the cookies required for sign-in.</p>
      </Section>

      <Section title="2. How interview data is used">
        <ul>
          <li>to conduct the interview (transcribed answers are sent to an AI inference provider to generate the next question);</li>
          <li>to produce the transcript, analysis, and reports for the case officer;</li>
          <li>to alert the officer when an interview is paused for safety.</li>
        </ul>
        <p>
          Interview data is never used to train AI models, never used for marketing, and never
          sold. Uploaded case documents serve only as private interviewer context and are never
          shown to the participant.
        </p>
      </Section>

      <Section title="3. AI processing">
        <p>
          Transcripts (text only) are processed by Groq, Inc. under zero-retention API terms to
          generate questions, screen them, and produce analysis. Video recordings are never sent
          to AI providers.
        </p>
      </Section>

      <Section title="4. Storage and access">
        <ul>
          <li>Records are stored in a managed PostgreSQL database (Supabase), encrypted at rest;</li>
          <li>recordings and documents are stored in private buckets; playback uses time-limited signed URLs;</li>
          <li>interview material is visible only to the authenticated case officer;</li>
          <li>interview links are unguessable single-case tokens that stop working after the interview ends;</li>
          <li>all traffic is TLS in transit.</li>
        </ul>
      </Section>

      <Section title="5. Retention">
        <p>
          Interview material is kept for the duration of the investigation and any resulting
          proceedings, per the investigating agency&apos;s evidence-retention rules, then deleted.
          During the pilot, agencies can request deletion of specific material at any time. Demo
          workspace content is cleared periodically without notice.
        </p>
      </Section>

      <Section title="6. Participant rights">
        <p>Through the investigating officer or the agency&apos;s designated contact, participants may:</p>
        <ul>
          <li>request a copy of their transcript;</li>
          <li>request correction of factual errors in their personal details;</li>
          <li>withdraw consent for further interviews;</li>
          <li>ask how their data has been used.</li>
        </ul>
        <p>
          Because interview material may be evidence in an active investigation, some rights (such
          as erasure) can be limited by law while proceedings are ongoing.
        </p>
      </Section>

      <Section title="7. Children and vulnerable participants">
        <p>
          Participants under 18 are asked to have a guardian or trusted adult present; the consent
          screen detects an entered age under 18 and says so. The investigating agency&apos;s
          safeguarding procedures apply in full.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          Privacy questions and requests:{' '}
          <a href="mailto:saadnizami@icloud.com" className="text-accent underline underline-offset-2">
            saadnizami@icloud.com
          </a>
          , or through your investigating officer.
        </p>
      </Section>
    </PageShell>
  );
}

import PageShell, { Section } from '@/components/Site/PageShell';

export const metadata = { title: 'Security — Themis' };

export default function SecurityPage() {
  return (
    <PageShell
      title="Security"
      intro="How interview material is stored, who can see it, and what leaves the system. Written for the pilot; a fuller whitepaper follows before general availability."
    >
      <Section title="Access model">
        <ul>
          <li>Officer accounts are provisioned by the administrator. There is no public registration.</li>
          <li>Officers see only their own cases. Every case query is scoped to the signed-in officer.</li>
          <li>Witnesses need no account. Each interview link carries an unguessable single-case token, verified server-side on every request, and it stops working once the interview ends.</li>
          <li>Passwords are stored as bcrypt hashes. Sessions use signed JWTs.</li>
        </ul>
      </Section>

      <Section title="Storage">
        <ul>
          <li>Case records, transcripts, and analysis live in a managed PostgreSQL database, encrypted at rest by the provider.</li>
          <li>Video recordings and uploaded documents live in private storage buckets with no public access. Playback uses time-limited signed URLs issued only to the authenticated case officer.</li>
          <li>Recordings upload directly from the witness&apos;s browser to storage over TLS; they do not pass through application servers.</li>
          <li>All traffic is TLS in transit.</li>
        </ul>
      </Section>

      <Section title="AI processing">
        <ul>
          <li>Interview transcripts (text only) are sent to an inference provider to generate and screen questions and to run post-interview analysis.</li>
          <li>Video and audio recordings are never sent to AI providers.</li>
          <li>Interview material is never used to train models.</li>
          <li>Uploaded case documents are used only as private interviewer context and are never shown or read to the witness.</li>
        </ul>
      </Section>

      <Section title="What the demo workspace is">
        <p>
          The public demo signs visitors into a shared workspace containing fictional sample data.
          Anything entered there is visible to other demo visitors and is cleared periodically. Do
          not put real case information in the demo.
        </p>
      </Section>

      <Section title="Reporting a concern">
        <p>
          If you believe you have found a security issue, contact us at{' '}
          <a href="mailto:saadnizami@icloud.com" className="text-accent underline underline-offset-2">
            saadnizami@icloud.com
          </a>
          . We read every report.
        </p>
      </Section>
    </PageShell>
  );
}

import PageShell, { Section, CardGrid } from '@/components/Site/PageShell';

export const metadata = { title: 'Security | Themis' };

const guarantees = [
  { title: 'No public registration', body: 'Officer accounts are provisioned by the administrator. The only open door is the clearly labelled demo workspace with fictional data.' },
  { title: 'Officer-scoped access', body: 'Every case query is scoped to the signed-in officer. Officers cannot see each other\'s cases.' },
  { title: 'Tokenised witness links', body: 'Witnesses need no account. Each link carries an unguessable single-case token, verified server-side on every request, dead once the interview ends.' },
  { title: 'Hashed credentials', body: 'Passwords are stored as bcrypt hashes. Sessions are signed JWTs.' },
  { title: 'Private storage', body: 'Recordings and documents live in private buckets. Playback uses time-limited signed URLs issued only to the case officer.' },
  { title: 'Direct-to-storage uploads', body: 'Recordings travel from the witness\'s browser to storage over TLS. They do not pass through application servers.' },
];

const aiRules = [
  { title: 'Text only', body: 'Only transcript text is sent for AI inference. Video and audio never leave storage.' },
  { title: 'No training', body: 'Interview material is never used to train models, by us or by providers.' },
  { title: 'Context stays private', body: 'Uploaded case documents inform the interviewer privately and are never shown or read to the witness.' },
];

export default function SecurityPage() {
  return (
    <PageShell
      kicker="Security"
      title="Where the data lives and who can touch it"
      intro="How interview material is stored, who can see it, and what leaves the system. Written plainly for the pilot; a fuller whitepaper follows before general availability."
      wide
    >
      <Section title="The short version">
        <p>
          Interview material is evidence, and the system is built around that fact. Records live
          in a managed PostgreSQL database encrypted at rest. Recordings live in private storage
          buckets with no public access. Everything moves over TLS. The only person who can see
          a case is the officer who owns it.
        </p>
        <CardGrid items={guarantees} cols={3} />
      </Section>

      <Section title="AI processing">
        <p>
          Themis uses a language-model inference provider to generate and screen interview
          questions and to run post-interview analysis. Three rules bound that relationship:
        </p>
        <CardGrid items={aiRules} cols={3} />
      </Section>

      <Section title="The demo workspace">
        <p>
          The public demo signs visitors into a shared workspace containing fictional sample
          data. Anything entered there is visible to other demo visitors and is cleared
          periodically. Do not put real case information in the demo.
        </p>
      </Section>

      <Section title="Retention">
        <p>
          Interview material is retained for the duration of the investigation and any resulting
          proceedings, in line with the investigating agency&apos;s evidence-retention rules,
          after which it is deleted. During the pilot, agencies may request deletion of specific
          material at any time.
        </p>
      </Section>

      <Section title="Reporting a concern">
        <p>
          If you believe you have found a security issue, contact us at{' '}
          <a href="mailto:saadnizami@icloud.com" className="text-accent underline underline-offset-2">
            saadnizami@icloud.com
          </a>{' '}
          with steps to reproduce. We read every report.
        </p>
      </Section>
    </PageShell>
  );
}

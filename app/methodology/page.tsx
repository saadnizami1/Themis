import Link from 'next/link';
import PageShell, { Section, CardGrid } from '@/components/Site/PageShell';
import { Reveal } from '@/components/Site/Scroll';

export const metadata = { title: 'Methodology | Themis' };

const validatorCategories = [
  { title: 'Presupposition', body: 'Assumes a fact the witness has not established.' },
  { title: 'Forced choice', body: "Offers options that may exclude the witness's actual answer." },
  { title: 'Detail insertion', body: 'Introduces a person, object, colour or time the witness never mentioned.' },
  { title: 'Verb intensity loading', body: 'Uses loaded verbs implying severity or intent not established.' },
  { title: 'Confirmation pressure', body: 'Phrasing that pushes the witness to confirm rather than recall.' },
  { title: 'Authority pressure', body: 'Invokes legal consequence or urgency to compel an answer.' },
  { title: 'Temporal compression', body: 'Forces a sequence before the witness has offered one.' },
  { title: 'Acquiescence trap', body: "Phrased so that agreeing means confirming the interviewer's version." },
  { title: 'Misinformation embedding', body: 'Uses case-file details as if the witness had said them.' },
  { title: 'Closure pressure', body: 'Rushes the witness or signals the interview is nearly over.' },
];

const indicators = [
  { title: 'Hedging language', body: 'Qualifiers concentrated in specific parts of the account.' },
  { title: 'Over-specificity', body: 'Unusual precision where generic recall would be expected.' },
  { title: 'Under-specificity', body: 'Conspicuous vagueness where detail would be natural.' },
  { title: 'Timeline inconsistency', body: 'Internal contradictions in the sequence of events.' },
  { title: 'Formulaic language', body: 'Scripted-sounding phrases repeated verbatim.' },
  { title: 'Emotional mismatch', body: 'Tone inconsistent with the reported events.' },
  { title: 'Spontaneous corrections', body: 'Unprompted self-correction. A positive indicator.' },
  { title: 'Unprompted detail', body: 'Volunteered peripheral detail. A positive indicator.' },
];

const phases = [
  ['Introduction', 'Ground rules and rapport. No case content allowed.', '3-6 exchanges'],
  ['Warm-up', 'Free-recall practice on a neutral topic.', '2-4 exchanges'],
  ['Recollection', 'Mental context reinstatement through sensory cues only.', '2-3 exchanges'],
  ['Account', 'Uninterrupted free narrative. Open invitations first.', '4-20 exchanges'],
  ['Follow-up', 'Probes limited to details the witness has raised.', '2-8 exchanges'],
  ['Closing', 'Final open check, without pressure.', '1-3 exchanges'],
];

export default function MethodologyPage() {
  return (
    <PageShell
      kicker="Methodology"
      title="The research the system stands on"
      intro="Themis is built on the two most validated frameworks in investigative interviewing, with an independent screening layer derived from the eyewitness-suggestibility literature. This page lists exactly what is enforced and how."
      wide
    >
      <Section title="Interview structure">
        <p>
          Interviews follow the NICHD Investigative Interview Protocol (Lamb, Orbach,
          Hershkowitz, Esplin and Horowitz, 2007) combined with the Cognitive Interview (Fisher
          and Geiselman, 1992). Six phases run in fixed order, and the engine enforces minimum
          and maximum exchange counts per phase in code. The interviewer cannot skip free
          recall, cannot probe ahead of the witness&apos;s own account, and cannot keep a witness
          in a phase indefinitely.
        </p>
      </Section>

      <Reveal>
        <div className="rounded-2xl border border-line overflow-hidden">
          {phases.map(([name, desc, count], i) => (
            <div
              key={name}
              className={`grid grid-cols-[3rem_1fr] sm:grid-cols-[4rem_11rem_1fr_8rem] gap-x-4 gap-y-1 items-baseline px-5 sm:px-7 py-4 ${
                i > 0 ? 'border-t border-line' : ''
              } ${i % 2 === 1 ? 'bg-surface/50' : 'bg-white'}`}
            >
              <span className="text-faint text-sm tabular-nums">0{i + 1}</span>
              <span className="font-medium text-ink text-sm">{name}</span>
              <span className="text-muted text-sm col-span-2 sm:col-span-1 col-start-2 sm:col-start-auto">
                {desc}
              </span>
              <span className="text-faint text-xs sm:text-right col-start-2 sm:col-start-auto">{count}</span>
            </div>
          ))}
        </div>
      </Reveal>

      <Section title="Question screening">
        <p>
          Before any generated question is spoken, an independent model screens it against ten
          categories of suggestive questioning, informed by Loftus and Palmer (1974) and the
          misinformation-effect literature that followed. Flagged questions are rewritten; if no
          safe rewrite is found after two attempts, a neutral open prompt is used instead.
        </p>
        <CardGrid items={validatorCategories} />
      </Section>

      <Section title="Safety monitoring">
        <p>
          Every witness response is assessed for distress level, disclosure of ongoing danger,
          and self-harm risk. Elevated distress prompts an offer to pause. Critical distress,
          ongoing danger, or self-harm risk stops the interview: the witness sees emergency
          contact information and the case officer&apos;s dashboard is flagged. A calm request to
          stop is honoured as a right, not treated as an emergency.
        </p>
      </Section>

      <Section title="Post-interview analysis">
        <p>
          Completed transcripts are analysed for eight linguistic indicator types, and
          statements are compared across all interviews in the case for contradictions, which
          are quoted verbatim and rated by severity. All findings are computational indicators
          derived from language patterns. They are not clinical assessments, they carry no claim
          about truthfulness, and they require review by qualified forensic professionals before
          any use.
        </p>
        <CardGrid items={indicators} />
      </Section>

      <Section title="References">
        <ul>
          <li>
            Lamb, M. E., Orbach, Y., Hershkowitz, I., Esplin, P. W., and Horowitz, D. (2007). A
            structured forensic interview protocol improves the quality and informativeness of
            investigative interviews with children. <em>Child Abuse and Neglect, 31</em>(11-12),
            1201-1231.
          </li>
          <li>
            Fisher, R. P., and Geiselman, R. E. (1992). <em>Memory-enhancing techniques for
            investigative interviewing: The cognitive interview.</em> Charles C Thomas.
          </li>
          <li>
            Loftus, E. F., and Palmer, J. C. (1974). Reconstruction of automobile destruction: An
            example of the interaction between language and memory. <em>Journal of Verbal
            Learning and Verbal Behavior, 13</em>(5), 585-589.
          </li>
        </ul>
        <p className="pt-2">
          For the full architectural write-up, read the{' '}
          <Link href="/research" className="text-accent underline underline-offset-2">
            design notes
          </Link>
          .
        </p>
      </Section>
    </PageShell>
  );
}

import PageShell, { Section } from '@/components/Site/PageShell';

export const metadata = { title: 'Methodology — Themis' };

const validatorCategories = [
  ['Presupposition', 'Assumes a fact the witness has not established.'],
  ['Forced choice', 'Offers options that may exclude the witness\'s actual answer.'],
  ['Detail insertion', 'Introduces a person, object, colour or time the witness never mentioned.'],
  ['Verb intensity loading', 'Uses loaded verbs implying severity or intent not established.'],
  ['Confirmation pressure', 'Phrasing that pushes the witness to confirm rather than recall.'],
  ['Authority pressure', 'Invokes legal consequence or urgency to compel an answer.'],
  ['Temporal compression', 'Forces a sequence before the witness has offered one.'],
  ['Acquiescence trap', 'Phrased so that agreeing means confirming the interviewer\'s version.'],
  ['Misinformation embedding', 'Uses case-file details as if the witness had said them.'],
  ['Closure pressure', 'Rushes the witness or signals the interview is nearly over.'],
];

const indicators = [
  ['Hedging language', 'Qualifiers concentrated in specific parts of the account.'],
  ['Over-specificity', 'Unusual precision where generic recall would be expected.'],
  ['Under-specificity', 'Conspicuous vagueness where detail would be natural.'],
  ['Timeline inconsistency', 'Internal contradictions in the sequence of events.'],
  ['Formulaic language', 'Scripted-sounding phrases repeated verbatim.'],
  ['Emotional mismatch', 'Tone inconsistent with the reported events.'],
  ['Spontaneous corrections', 'Unprompted self-correction — a positive indicator.'],
  ['Unprompted detail', 'Volunteered peripheral detail — a positive indicator.'],
];

export default function MethodologyPage() {
  return (
    <PageShell
      title="Methodology"
      intro="Themis is built on the two most validated frameworks in investigative interviewing research, with an independent screening layer derived from the eyewitness-suggestibility literature."
    >
      <Section title="Interview structure">
        <p>
          Interviews follow the NICHD Investigative Interview Protocol (Lamb, Orbach, Hershkowitz,
          Esplin &amp; Horowitz, 2007) combined with the Cognitive Interview (Fisher &amp;
          Geiselman, 1992). Six phases run in fixed order: introduction and ground rules,
          narrative practice on a neutral topic, mental context reinstatement, free narrative,
          clarification limited to witness-mentioned details, and a non-pressuring close.
        </p>
        <p>
          The software enforces minimum and maximum exchange counts per phase. The interviewer
          cannot skip free recall, cannot probe ahead of the witness&apos;s own account, and cannot
          keep a witness in a phase indefinitely.
        </p>
      </Section>

      <Section title="Question screening">
        <p>
          Before any generated question is spoken, an independent model screens it against ten
          categories of suggestive questioning, informed by Loftus &amp; Palmer (1974) and the
          subsequent misinformation-effect literature. Flagged questions are rewritten; if no safe
          rewrite is found, a neutral open prompt is used instead.
        </p>
        <ul>
          {validatorCategories.map(([name, desc]) => (
            <li key={name}>
              <strong>{name}.</strong> {desc}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Safety monitoring">
        <p>
          Every witness response is assessed for distress level, disclosure of ongoing danger, and
          self-harm risk. Elevated distress prompts an offer to pause. Critical distress, ongoing
          danger, or self-harm risk stops the interview: the witness sees emergency contact
          information and the case officer&apos;s dashboard is flagged. A calm request to stop is
          honoured as a right, not treated as an emergency.
        </p>
      </Section>

      <Section title="Post-interview analysis">
        <p>
          Completed transcripts are analysed for eight linguistic indicator types, and statements
          are compared across all interviews in the case for contradictions, which are quoted and
          rated by severity.
        </p>
        <ul>
          {indicators.map(([name, desc]) => (
            <li key={name}>
              <strong>{name}.</strong> {desc}
            </li>
          ))}
        </ul>
        <p>
          All findings are computational indicators derived from language patterns. They are not
          clinical assessments, they carry no claim about truthfulness, and they require review by
          qualified forensic professionals before any use.
        </p>
      </Section>

      <Section title="References">
        <ul>
          <li>Lamb, M. E., Orbach, Y., Hershkowitz, I., Esplin, P. W., &amp; Horowitz, D. (2007). A structured forensic interview protocol improves the quality and informativeness of investigative interviews with children. <em>Child Abuse &amp; Neglect, 31</em>(11–12), 1201–1231.</li>
          <li>Fisher, R. P., &amp; Geiselman, R. E. (1992). <em>Memory-enhancing techniques for investigative interviewing: The cognitive interview.</em> Charles C Thomas.</li>
          <li>Loftus, E. F., &amp; Palmer, J. C. (1974). Reconstruction of automobile destruction: An example of the interaction between language and memory. <em>Journal of Verbal Learning and Verbal Behavior, 13</em>(5), 585–589.</li>
        </ul>
      </Section>
    </PageShell>
  );
}

import Link from 'next/link';
import SiteHeader from '@/components/Site/SiteHeader';
import SiteFooter from '@/components/Site/SiteFooter';
import { Reveal } from '@/components/Site/Scroll';

export const metadata = {
  title: 'Design Notes | Themis',
  description:
    'How the Themis AI interviewer is designed: the turn engine, question screening, the safety model, and the limits we impose on the system.',
};

function H2({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold tracking-tight mt-16 mb-5 flex items-baseline gap-4">
      <span className="text-faint text-base tabular-nums shrink-0">{n}</span>
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold tracking-tight mt-10 mb-3">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-[15px] text-ink/80 leading-[1.8] mb-4">{children}</p>;
}

function Figure({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <figure className="my-8">
      <div className="border border-line rounded-2xl bg-surface/60 p-6 sm:p-8 overflow-x-auto">
        {children}
      </div>
      <figcaption className="text-faint text-xs mt-3 text-center">{caption}</figcaption>
    </figure>
  );
}

const pipelineSteps = ['Witness speaks', 'Safety read', 'Intent + action decision', 'Question screening', 'Spoken aloud'];

const categories = [
  ['Presupposition', 'assumes a fact the witness has not stated'],
  ['Forced choice', 'offers options that may exclude the true answer'],
  ['Detail insertion', 'introduces a person, object, colour, or time'],
  ['Verb intensity loading', 'implies severity or intent through word choice'],
  ['Confirmation pressure', 'pushes the witness to agree rather than recall'],
  ['Authority pressure', 'invokes consequence or urgency to compel'],
  ['Temporal compression', 'forces a sequence the witness has not offered'],
  ['Acquiescence trap', 'agreeing means adopting the interviewer\'s version'],
  ['Misinformation embedding', 'treats case-file details as the witness\'s words'],
  ['Closure pressure', 'signals the interview is nearly over'],
];

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />

      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-14 sm:py-20">
        {/* Paper header */}
        <Reveal>
          <p className="text-accent text-xs font-semibold uppercase tracking-widest">Design notes</p>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight mt-4 leading-tight">
            Designing an AI interviewer that cannot lead the witness
          </h1>
          <p className="text-faint text-sm mt-5">Themis pilot programme · July 2026 · 12 minute read</p>
        </Reveal>

        {/* Abstract */}
        <Reveal delay={100}>
          <div className="mt-10 rounded-2xl border border-line bg-surface/60 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-faint mb-3">Abstract</p>
            <p className="text-sm text-ink/80 leading-relaxed">
              Investigative interviews shape the evidence they collect. Decades of research show
              that small changes in question wording alter what witnesses remember and report,
              and that the errors this introduces are largely irreversible. Themis is an attempt
              to build an interviewer whose questioning discipline does not vary: a software
              system that conducts recorded victim and witness interviews under the NICHD
              protocol, screens every question against the suggestibility literature before
              speaking it, monitors witness safety on every conversational turn, and confines
              its own analytical claims to reviewable linguistic indicators. This note describes
              the architecture, the constraints we impose on the model, the safety design, and
              the things the system is deliberately unable to do.
            </p>
          </div>
        </Reveal>

        <H2 n="1">The problem: interviews contaminate evidence</H2>
        <P>
          Human memory is not a recording. Loftus and Palmer showed in 1974 that changing a
          single verb in a question ("how fast were the cars going when they <em>smashed</em>{' '}
          into each other" versus "when they <em>hit</em> each other") changed both the speed
          witnesses estimated and what they claimed to have seen a week later. The misinformation
          effect this exposed has been replicated for fifty years: details embedded in questions
          migrate into memory, and once there, they are indistinguishable from the original
          event.
        </P>
        <P>
          Police interviewing has responded with structured protocols. The NICHD Investigative
          Interview Protocol and the Cognitive Interview both work by front-loading free recall,
          delaying focused questions, and forbidding suggestion. They demonstrably improve the
          quality of testimony. The difficulty is adherence: protocol discipline decays under
          time pressure, case familiarity, and fatigue. A human interviewer who already believes
          they know what happened finds it genuinely hard not to ask about the red car.
        </P>
        <P>
          Themis starts from a simple observation: a machine has no beliefs about the case to
          leak. If the software is built so that suggestive questions are structurally difficult
          to produce, protocol adherence stops being a matter of training and starts being a
          property of the system.
        </P>

        <H2 n="2">Interview structure</H2>
        <P>
          Every Themis interview runs through six phases in a fixed order: introduction and
          ground rules, narrative practice on a neutral topic, sensory context reinstatement,
          free narrative account, clarification, and closing. Each phase has a minimum and a
          maximum number of exchanges, enforced by the engine rather than suggested to the
          model. The model may propose advancing early; the engine refuses until the minimum is
          met. The model may want to linger; the engine forces progression at the maximum.
        </P>
        <P>
          Two rules matter more than the rest. Free narrative always precedes probing, and
          probes may only reference details the witness has personally raised. The second rule
          is enforced twice: once in the interviewer\'s instructions, and again by an independent
          screening model that sees only what the witness actually said and rejects questions
          that import anything else.
        </P>

        <H2 n="3">The turn engine</H2>
        <P>
          Themis is not a chat loop. Each conversational turn is a decision procedure with five
          stages, and the model\'s output is a structured decision, not free text.
        </P>
        <Figure caption="Figure 1. One conversational turn. The microphone is closed whenever the system is speaking.">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-fit">
            {pipelineSteps.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className="flex-1 rounded-xl border border-line bg-white px-4 py-3 text-center">
                  <p className="text-[11px] text-faint tabular-nums">0{i + 1}</p>
                  <p className="text-sm font-medium whitespace-nowrap">{s}</p>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <span className="hidden sm:block text-faint shrink-0">→</span>
                )}
              </div>
            ))}
          </div>
        </Figure>
        <P>
          When the witness finishes speaking, the transcribed answer is assessed in a single
          structured call that returns four things: a safety read (distress level, disclosure of
          ongoing danger, self-harm risk), an intent classification (a substantive answer, a
          request for a break or a repeat, a request to stop, a question about the process), a
          chosen action, and a one-sentence internal observation that is stored for the case
          officer but never spoken.
        </P>
        <P>
          The action space is small and closed: ask the next question, advance to the next
          phase, offer a break, ask the witness to confirm they want to stop, end the interview,
          or escalate for safety. The engine then validates the chosen action against the phase
          rules, so a model error cannot skip free recall or trap a witness in an endless phase.
          Two degenerate behaviours discovered in testing are handled in code: a question
          identical to the previous one is treated as evidence the phase is exhausted, and a
          screening rewrite that arrives wrapped in meta-instructions is stripped down to the
          question itself before it can be spoken.
        </P>

        <H3>Voice, and why the microphone is managed</H3>
        <P>
          The interview is spoken. Questions are delivered by speech synthesis and answers are
          transcribed live. The microphone is closed the entire time the system is speaking and
          reopens only after synthesis ends, so the interviewer\'s own voice can never be
          transcribed as the witness\'s answer. Witnesses control the room by voice: asking for
          the question again is handled instantly on the device, and requests for a break or to
          stop are understood by the engine in whatever words the witness uses. On browsers
          without speech recognition the interview degrades to spoken questions with typed
          answers rather than refusing to run.
        </P>

        <H2 n="4">Question screening</H2>
        <P>
          Before any generated question is spoken, a second model with no stake in the
          conversation examines it against ten categories drawn from the suggestibility
          literature. The screening model sees the candidate question and the witness\'s own
          statements, nothing else. If the question fails, the screener proposes a rewrite,
          which is checked again; after two failed rewrites a neutral open prompt is used
          instead. The categories:
        </P>
        <Figure caption="Table 1. The ten screening categories applied to every candidate question.">
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
            {categories.map(([name, desc]) => (
              <div key={name} className="flex gap-2.5 text-sm items-baseline">
                <span className="w-1 h-1 rounded-full bg-accent shrink-0 translate-y-[-2px]" />
                <p>
                  <span className="font-medium">{name}:</span>{' '}
                  <span className="text-muted">{desc}</span>
                </p>
              </div>
            ))}
          </div>
        </Figure>
        <P>
          Screening is defence in depth, not the only defence. The interviewer\'s own
          instructions forbid the same categories, and the phase structure removes most
          opportunities to violate them. In testing, the most common screening intervention is
          softening a focused probe that arrived one phase too early.
        </P>

        <H2 n="5">The safety model</H2>
        <P>
          An interview with no human present needs an explicit answer to a hard question: what
          happens when the witness is in trouble? Themis treats this as a first-class part of
          every turn rather than an exception path.
        </P>
        <P>
          Every safety read distinguishes distress from danger. Elevated distress prompts the
          interviewer to offer a pause. Critical distress, a disclosure of ongoing danger, or
          any indication of self-harm risk stops the interview immediately: the witness sees
          emergency contact information and a plain statement that help is being arranged, the
          recording is preserved, and the case officer\'s dashboard is flagged within seconds.
          Escalation is not reversible from inside the interview; only the officer can decide
          what happens next.
        </P>
        <P>
          One asymmetry is deliberate. A calm, clear request to stop is honoured as a right, not
          treated as an emergency. The witness is asked once, without pressure, whether they
          want to end; a second confirmation ends the interview with a partial record preserved.
          Early testing showed language models tend to label any stop request as critical
          distress, so the engine explicitly refuses to escalate on distress signals alone when
          the witness is simply exercising the right to leave.
        </P>

        <H2 n="6">What the analysis does and does not claim</H2>
        <P>
          After an interview ends, the transcript is analysed for eight linguistic indicator
          types: hedging concentration, over- and under-specificity, internal timeline
          consistency, formulaic repetition, emotional mismatch, spontaneous self-correction,
          and unprompted peripheral detail. The last two are positive indicators and are always
          reported alongside concerns. When a case holds more than one interview, statements are
          compared across sessions and contradictions are quoted verbatim with topic and
          severity.
        </P>
        <P>
          Everything the analysis produces is labelled a computational indicator. The system
          makes no claim about truthfulness, produces no credibility score of a person, and its
          reports state on their face that professional review is required. This is not a
          hedge. Linguistic patterns have documented associations with recall quality, but they
          are weak, contested signals, and treating them as verdicts would repeat the polygraph
          mistake with better typography.
        </P>

        <H2 n="7">Limitations</H2>
        <P>
          Themis inherits the limits of its parts. Speech recognition degrades with accent
          distance, background noise, and code-switching, and a transcription error can survive
          into analysis; the recording exists partly so errors can be caught. The language model
          can misclassify intent or produce a clumsy question; screening and phase enforcement
          bound the damage but do not eliminate it. Urdu support relies on browser speech
          engines that vary in quality across devices, which is why every language path keeps a
          typed fallback.
        </P>
        <P>
          There are also limits we chose. The system interviews one witness at a time, does not
          interview suspects, does not analyse video or voice affect, and does not integrate
          with case-management systems during the pilot. Each of these is a scoping decision,
          revisited deliberately rather than drifted into.
        </P>

        <H2 n="8">References</H2>
        <ul className="text-sm text-ink/75 leading-relaxed space-y-3 mt-2">
          <li>
            Fisher, R. P., &amp; Geiselman, R. E. (1992). <em>Memory-enhancing techniques for
            investigative interviewing: The cognitive interview.</em> Charles C Thomas.
          </li>
          <li>
            Lamb, M. E., Orbach, Y., Hershkowitz, I., Esplin, P. W., &amp; Horowitz, D. (2007). A
            structured forensic interview protocol improves the quality and informativeness of
            investigative interviews with children. <em>Child Abuse &amp; Neglect, 31</em>(11-12),
            1201-1231.
          </li>
          <li>
            Loftus, E. F., &amp; Palmer, J. C. (1974). Reconstruction of automobile destruction:
            An example of the interaction between language and memory. <em>Journal of Verbal
            Learning and Verbal Behavior, 13</em>(5), 585-589.
          </li>
        </ul>

        {/* End CTA */}
        <div className="mt-16 pt-8 border-t border-line flex flex-col sm:flex-row gap-3">
          <Link
            href="/methodology"
            className="px-5 py-2.5 border border-line hover:border-faint text-ink text-sm font-medium rounded-lg transition-colors text-center"
          >
            Methodology in detail
          </Link>
          <Link
            href="/contact"
            className="px-5 py-2.5 border border-line hover:border-faint text-ink text-sm font-medium rounded-lg transition-colors text-center"
          >
            Contact the team
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

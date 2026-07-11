import Link from 'next/link';
import SiteHeader from '@/components/Site/SiteHeader';
import SiteFooter from '@/components/Site/SiteFooter';
import DemoButton from '@/components/Site/DemoButton';
import { Reveal, StickyPanels, Stat } from '@/components/Site/Scroll';
import { RevealHeading, TextReveal } from '@/components/Site/Motion';
import SpecimenReplay from '@/components/Site/SpecimenReplay';

const refusals = [
  'Mention any detail the witness has not raised themselves.',
  'Suggest a name, a face, a place, a time, or a weapon.',
  'Praise, pressure, or reassure a witness toward an answer.',
  'Interrupt a narrative once it has begun.',
  'Continue past a disclosure of ongoing danger.',
  'Overrule a request to pause or to stop.',
];

const capabilities = [
  {
    title: 'Protocol enforcement',
    body: 'Six interview phases, from rapport to closing, in a fixed order. The engine enforces sequence and pacing in code, not by convention.',
  },
  {
    title: 'Question screening',
    body: 'Every generated question is checked against ten categories of suggestive questioning before it is spoken. A flagged question is rewritten, not asked.',
  },
  {
    title: 'Safety monitoring',
    body: 'Each answer receives a safety read. A disclosure of ongoing danger stops the interview and alerts the case officer within seconds.',
  },
  {
    title: 'Witness control',
    body: 'A break, a repeat, or an end to the interview, at any time, by voice or by typing. The room obeys the witness.',
  },
  {
    title: 'Contradiction analysis',
    body: 'Statements are compared across every interview in a case. Differences are quoted, categorised by topic, and rated by severity.',
  },
  {
    title: 'Two reports',
    body: 'A court report with methodology and disclaimers, and an internal report with recommended follow-up questions for the next session.',
  },
];

const phasePanels = [
  {
    kicker: 'Phase 01',
    title: 'Introduction',
    body: 'Ground rules first. The witness hears that "I don\'t know" is always an acceptable answer, that they can correct the interviewer, and that they can pause or stop at any time.',
    note: 'No case content is allowed in this phase. Rapport is built without touching the incident.',
  },
  {
    kicker: 'Phase 02',
    title: 'Warm-up',
    body: 'A practice round of free recall on a neutral topic, usually the witness\'s morning. This trains the pattern the whole interview relies on: long, uninterrupted answers.',
    note: 'Narrative practice measurably improves the quality of later substantive recall.',
  },
  {
    kicker: 'Phase 03',
    title: 'Recollection',
    body: 'The witness is guided back to the scene through senses only. What could you see, what could you hear, how did it feel. No facts are suggested, nothing is named.',
    note: 'Context reinstatement is one of the strongest documented memory retrieval aids.',
  },
  {
    kicker: 'Phase 04',
    title: 'Account',
    body: 'One open invitation, then silence: tell me everything that happened, from the very beginning to the very end. The interviewer does not interrupt, evaluate, or redirect.',
    note: 'Free narrative comes before any probe, always. This ordering is enforced by the engine.',
  },
  {
    kicker: 'Phase 05',
    title: 'Follow-up',
    body: 'Focused questions, but only about details the witness has already raised. If the witness never mentioned a car, the interviewer cannot ask about one.',
    note: 'Every question in this phase passes the ten-category screening model before being spoken.',
  },
  {
    kicker: 'Phase 06',
    title: 'Closing',
    body: 'A final open check: anything you want to add, anything you are unsure about. The interview ends without pressure and thanks the witness for their time.',
    note: 'The witness can revise or flag uncertainty about anything said, and it enters the record.',
  },
];

const pipeline = [
  ['Listen', 'The witness speaks. The microphone is closed whenever Themis is talking, so its own voice can never enter the record.'],
  ['Assess', 'Each response gets a safety read: distress level, disclosure of ongoing danger, self-harm risk. A calm request to stop is a right, not an emergency.'],
  ['Decide', 'The engine chooses one action: ask, probe deeper, advance the phase, offer a break, confirm a stop, end, or escalate. Phase rules are enforced in code.'],
  ['Screen', 'If the action is a question, an independent model checks it against ten categories of suggestive questioning. Failures are rewritten before speech.'],
  ['Speak', 'Only then is the question spoken aloud, in the witness\'s language, and the cycle repeats.'],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col overflow-x-clip">
      <SiteHeader />

      {/* Hero: full-bleed dark record room */}
      <section className="bg-ink text-paper overflow-hidden">
        <div className="max-w-6xl mx-auto px-5 pt-10 sm:pt-14 pb-16 sm:pb-24">
          {/* Ruled meta strip */}
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-white/15 pb-5 font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">
              <span>Pilot programme 2026</span>
              <span className="hidden sm:inline">NICHD protocol</span>
              <span>English / Urdu</span>
            </div>
          </Reveal>

          {/* Display headline */}
          <h1 className="font-serif tracking-tight leading-[0.98] mt-10 sm:mt-14 text-[14.5vw] sm:text-[5.4rem] lg:text-[7rem] xl:text-[7.6rem]">
            <RevealHeading text="Nothing suggested." stagger={90} />
            <br />
            <RevealHeading
              text="Everything on the record."
              stagger={70}
              delay={280}
              className="italic text-[#BACFC1]"
            />
          </h1>

          <div className="grid lg:grid-cols-[1fr_minmax(0,27rem)] gap-12 lg:gap-20 items-start mt-12 sm:mt-16">
            <div className="max-w-xl">
              <Reveal delay={500}>
                <p className="text-paper/70 text-lg leading-relaxed">
                  Themis conducts recorded witness interviews for police investigations. It
                  follows the NICHD protocol, screens every question before speaking it, and
                  produces court-ready records.
                </p>
              </Reveal>
              <Reveal delay={600}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-9">
                  <DemoButton className="px-6 py-3 bg-paper hover:bg-white text-ink text-sm font-medium rounded-sm transition-colors text-center disabled:opacity-60" />
                  <Link
                    href="/research"
                    className="text-sm text-paper/90 border-b border-paper/40 hover:border-paper pb-0.5 transition-colors w-fit"
                  >
                    Read the design notes
                  </Link>
                </div>
              </Reveal>
              <Reveal delay={700}>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/40 mt-12">
                  No polygraph &nbsp;/&nbsp; No biometrics &nbsp;/&nbsp; No lie detection
                </p>
              </Reveal>
            </div>
            <Reveal delay={350}>
              <div className="shadow-[14px_14px_0_rgba(251,250,246,0.07)]">
                <SpecimenReplay />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Ledger strip */}
      <section className="border-b border-line bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 divide-x divide-line border-x border-line">
          {[
            { value: 6, label: 'protocol phases, order enforced in code' },
            { value: 10, label: 'categories of suggestive questioning screened' },
            { value: 8, label: 'linguistic indicators in every analysis' },
            { value: 2, label: 'languages, spoken and transcribed' },
          ].map((s, i) => (
            <div key={s.label} className={`p-8 sm:p-10 ${i > 1 ? 'border-t border-line lg:border-t-0' : ''}`}>
              <Stat value={s.value} label={s.label} />
            </div>
          ))}
        </div>
      </section>

      {/* Manifesto: scroll-driven text reveal */}
      <section className="max-w-5xl mx-auto px-5 w-full">
        <TextReveal
          text="A memory is evidence. Handled carelessly, it changes. Themis exists so that nothing in the interview room, no habit, no hunch, no leading question, can alter what a witness remembers."
          className="font-serif text-3xl sm:text-5xl leading-[1.25] tracking-tight"
        />
      </section>

      {/* Refusals */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28 grid lg:grid-cols-[minmax(0,24rem)_1fr] gap-12 lg:gap-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
              By design
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl tracking-tight mt-4">
              Built to refuse.
            </h2>
            <p className="text-muted mt-6 leading-relaxed">
              Most interview errors are not lies. They are suggestions, absorbed and repeated
              until they sound like memory. So the interviewer&apos;s constraints matter more
              than its abilities. There are six things it will not do.
            </p>
          </Reveal>
          <div>
            {refusals.map((r, i) => (
              <Reveal key={r} delay={i * 60}>
                <div className="grid grid-cols-[3rem_1fr] gap-4 py-5 border-t border-line items-baseline">
                  <span className="font-mono text-faint text-sm tabular-nums">0{i + 1}</span>
                  <p className="text-ink leading-relaxed">{r}</p>
                </div>
              </Reveal>
            ))}
            <div className="border-t border-line" />
          </div>
        </div>
      </section>

      {/* Capabilities: indexed ruled list */}
      <section className="border-t border-line bg-white">
        <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              The record
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl tracking-tight mt-4 max-w-2xl">
              What a case gets.
            </h2>
          </Reveal>
          <div className="mt-14">
            {capabilities.map((c, i) => (
              <Reveal key={c.title} delay={(i % 2) * 60}>
                <div className="grid sm:grid-cols-[3rem_16rem_1fr] gap-2 sm:gap-6 py-6 border-t border-line items-baseline">
                  <span className="font-mono text-faint text-sm tabular-nums">0{i + 1}</span>
                  <h3 className="font-medium">{c.title}</h3>
                  <p className="text-muted text-sm leading-relaxed max-w-xl">{c.body}</p>
                </div>
              </Reveal>
            ))}
            <div className="border-t border-line" />
          </div>
        </div>
      </section>

      {/* Sticky phase walkthrough */}
      <div className="border-t border-line">
        <StickyPanels heading="Six phases. One fixed order." panels={phasePanels} />
      </div>

      {/* Turn pipeline */}
      <section className="bg-ink text-paper">
        <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/50">
              Every single turn
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl tracking-tight mt-4 max-w-2xl">
              Five checks between hearing an answer and asking the next question.
            </h2>
          </Reveal>
          <ol className="mt-14">
            {pipeline.map(([title, body], i) => (
              <Reveal key={title} delay={i * 70}>
                <li className="grid sm:grid-cols-[3rem_10rem_1fr] gap-2 sm:gap-6 py-7 border-t border-white/10 items-baseline">
                  <span className="font-mono text-paper/40 text-sm tabular-nums">0{i + 1}</span>
                  <h3 className="font-serif text-2xl">{title}</h3>
                  <p className="text-paper/60 text-sm leading-relaxed max-w-xl">{body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Limits */}
      <section className="border-b border-line">
        <div className="max-w-6xl mx-auto px-5 py-20 sm:py-24 grid lg:grid-cols-[minmax(0,24rem)_1fr] gap-10 lg:gap-20">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Limits</p>
            <h2 className="font-serif text-3xl sm:text-4xl tracking-tight mt-4">
              No polygraph. No biometrics. No lie detection.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-muted leading-relaxed max-w-xl lg:pt-10">
              Themis flags linguistic patterns for professional review and always shows positive
              indicators alongside concerns. Its output is an investigative aid, never a verdict.
              Recordings are stored privately and served only to the authenticated case officer.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Reading */}
      <section className="max-w-6xl mx-auto px-5 py-16 sm:py-20 w-full">
        <div className="grid sm:grid-cols-2 border border-line divide-y sm:divide-y-0 sm:divide-x divide-line bg-white">
          <Reveal>
            <Link href="/research" className="group block p-8 sm:p-10 h-full hover:bg-surface/60 transition-colors">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
                Design notes
              </p>
              <h3 className="font-serif text-2xl mt-3">How the interviewer is designed</h3>
              <p className="text-muted text-sm mt-3 leading-relaxed">
                The full write-up: the turn engine, the safety model, what the interviewer is
                forbidden from doing, and why. With references.
              </p>
              <span className="inline-block font-mono text-[12px] text-ink mt-6 group-hover:translate-x-1 transition-transform">
                Read it &rarr;
              </span>
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <Link href="/methodology" className="group block p-8 sm:p-10 h-full hover:bg-surface/60 transition-colors">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                Methodology
              </p>
              <h3 className="font-serif text-2xl mt-3">Protocols, screening, and analysis</h3>
              <p className="text-muted text-sm mt-3 leading-relaxed">
                The research the system stands on: NICHD, the Cognitive Interview, and the
                suggestibility literature, with every screening category listed.
              </p>
              <span className="inline-block font-mono text-[12px] text-ink mt-6 group-hover:translate-x-1 transition-transform">
                Read it &rarr;
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line bg-white">
        <div className="max-w-6xl mx-auto px-5 py-20 sm:py-28">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="font-serif text-4xl sm:text-5xl tracking-tight">
                Run an interview on yourself.
              </h2>
              <p className="text-muted mt-5 leading-relaxed">
                Open the demo workspace, file a case with its own PIN, and take a live
                interview. Minutes later you have the transcript, the analysis, and both
                reports, exactly as an investigator would.
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-9">
                <DemoButton className="px-6 py-3 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-sm transition-colors text-center disabled:opacity-60" />
                <Link
                  href="/contact"
                  className="text-sm text-ink border-b border-ink/30 hover:border-ink pb-0.5 transition-colors w-fit"
                >
                  Talk to us about a pilot
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

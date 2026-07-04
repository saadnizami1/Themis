import Link from 'next/link';
import SiteHeader from '@/components/Site/SiteHeader';
import SiteFooter from '@/components/Site/SiteFooter';
import DemoButton from '@/components/Site/DemoButton';
import { Reveal, StickyPanels, Stat } from '@/components/Site/Scroll';
import { Mark } from '@/components/Brand';

const features = [
  {
    title: 'Protocol enforcement',
    body: 'Six interview phases, from rapport to closing. The software enforces order and pacing, not the interviewer\'s habits.',
  },
  {
    title: 'Question screening',
    body: 'Every generated question is checked against ten categories of suggestive questioning before it is spoken. Flagged questions are rewritten, not asked.',
  },
  {
    title: 'Safety monitoring',
    body: 'If a witness discloses ongoing danger or shows acute distress, the interview stops itself and the case officer is alerted within seconds.',
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
    <div className="min-h-screen bg-white flex flex-col overflow-x-clip">
      <SiteHeader />

      {/* Hero */}
      <section className="relative">
        {/* Gradient field */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[80rem] h-[40rem] rounded-full opacity-60 blur-3xl bg-[radial-gradient(closest-side,rgba(29,78,216,0.14),transparent)]" />
          <div className="absolute top-40 -left-40 w-[40rem] h-[30rem] rounded-full opacity-50 blur-3xl bg-[radial-gradient(closest-side,rgba(59,130,246,0.10),transparent)]" />
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(11,15,25,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(11,15,25,0.04) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black, transparent)',
              WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 0%, black, transparent)',
            }}
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 pt-20 sm:pt-32 pb-20 sm:pb-28">
          <Reveal>
            <p className="inline-flex items-center gap-2 text-xs text-muted border border-line rounded-full px-3.5 py-1.5 bg-white/70 backdrop-blur">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Pilot programme, now taking department enquiries
            </p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mt-7 max-w-4xl">
              Witness interviews,
              <br />
              <span className="bg-gradient-to-r from-accent via-blue-500 to-accent bg-clip-text text-transparent">
                done by the book.
              </span>{' '}
              Every time.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="text-muted text-lg mt-8 leading-relaxed max-w-2xl">
              Themis is an AI interviewer for police investigations. It follows the NICHD
              protocol, screens every question before speaking it, and produces court-ready
              records in English and Urdu.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="flex flex-col sm:flex-row gap-3 mt-10">
              <DemoButton className="px-7 py-3.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-accent/25 text-center" />
              <Link
                href="/research"
                className="px-7 py-3.5 border border-line hover:border-faint text-ink font-medium rounded-xl transition-colors text-center bg-white/70 backdrop-blur"
              >
                Read the design notes
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-line bg-surface/60">
        <div className="max-w-6xl mx-auto px-5 py-14 grid grid-cols-2 lg:grid-cols-4 gap-10">
          <Reveal><Stat value={6} label="protocol phases, enforced in code" /></Reveal>
          <Reveal delay={80}><Stat value={10} label="categories of suggestive questioning screened" /></Reveal>
          <Reveal delay={160}><Stat value={8} label="linguistic indicators in every analysis" /></Reveal>
          <Reveal delay={240}><Stat value={2} label="languages, spoken and transcribed" /></Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-5 py-20 sm:py-28 w-full">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight max-w-2xl">
            Built so nothing the system does can contaminate a witness&apos;s memory.
          </h2>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 90}>
              <div className="group relative rounded-2xl border border-line p-7 h-full bg-white transition-all duration-300 hover:border-accent-border hover:shadow-[0_8px_40px_-12px_rgba(29,78,216,0.15)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted text-sm mt-3 leading-relaxed">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Sticky phase walkthrough */}
      <div className="border-y border-line bg-surface/40">
        <StickyPanels heading="Six phases. One fixed order." panels={phasePanels} />
      </div>

      {/* Turn pipeline */}
      <section className="relative bg-ink text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute -bottom-52 left-1/3 w-[60rem] h-[36rem] rounded-full opacity-30 blur-3xl bg-[radial-gradient(closest-side,rgba(59,130,246,0.35),transparent)]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-5 py-20 sm:py-28">
          <Reveal>
            <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-widest">Every single turn</p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 max-w-2xl">
              Five checks between hearing an answer and asking the next question.
            </h2>
          </Reveal>
          <ol className="mt-14 space-y-0">
            {pipeline.map(([title, body], i) => (
              <Reveal key={title} delay={i * 80}>
                <li className="grid sm:grid-cols-[4rem_10rem_1fr] gap-2 sm:gap-6 py-7 border-t border-white/10 items-baseline">
                  <span className="text-blue-300/60 text-sm tabular-nums">0{i + 1}</span>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed max-w-xl">{body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Plain statement */}
      <section className="max-w-3xl mx-auto px-5 py-20 sm:py-28 text-center">
        <Reveal>
          <span className="inline-block w-10 h-10 text-ink mb-6"><Mark className="w-10 h-10" /></span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            No polygraph. No biometrics. No lie detection.
          </h2>
          <p className="text-muted mt-5 leading-relaxed">
            Themis flags linguistic patterns for professional review and always shows positive
            indicators alongside concerns. Its output is an investigative aid, never a verdict.
            Recordings are stored privately and served only to the authenticated case officer.
          </p>
        </Reveal>
      </section>

      {/* Reading */}
      <section className="max-w-6xl mx-auto px-5 pb-20 sm:pb-28 w-full">
        <div className="grid sm:grid-cols-2 gap-4">
          <Reveal>
            <Link
              href="/research"
              className="group block rounded-2xl border border-line p-8 h-full bg-gradient-to-br from-white to-accent-soft/50 hover:border-accent-border transition-colors"
            >
              <p className="text-accent text-xs font-semibold uppercase tracking-widest">Design notes</p>
              <h3 className="text-xl font-semibold mt-3">How the AI interviewer is designed</h3>
              <p className="text-muted text-sm mt-3 leading-relaxed">
                The full write-up: the turn engine, the safety model, what the interviewer is
                forbidden from doing, and why. With references.
              </p>
              <span className="inline-block text-accent text-sm font-medium mt-5 group-hover:translate-x-1 transition-transform">
                Read it
              </span>
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <Link
              href="/methodology"
              className="group block rounded-2xl border border-line p-8 h-full bg-white hover:border-accent-border transition-colors"
            >
              <p className="text-faint text-xs font-semibold uppercase tracking-widest">Methodology</p>
              <h3 className="text-xl font-semibold mt-3">Protocols, screening, and analysis</h3>
              <p className="text-muted text-sm mt-3 leading-relaxed">
                The research the system stands on: NICHD, the Cognitive Interview, and the
                suggestibility literature, with every screening category listed.
              </p>
              <span className="inline-block text-ink text-sm font-medium mt-5 group-hover:translate-x-1 transition-transform">
                Read it
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-5 pb-24 w-full">
        <Reveal>
          <div className="relative rounded-3xl overflow-hidden border border-line">
            <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-accent-soft via-white to-white" />
            <div aria-hidden className="absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl bg-[radial-gradient(closest-side,rgba(29,78,216,0.18),transparent)]" />
            <div className="relative px-8 sm:px-14 py-14 sm:py-20 text-center">
              <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                See a complete case in two minutes.
              </h2>
              <p className="text-muted mt-4 max-w-xl mx-auto">
                The demo workspace contains a full sample case: transcript, analysis,
                observations, and both reports. You can also run a live interview on yourself.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <DemoButton className="px-7 py-3.5 bg-accent hover:bg-accent-hover text-white font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-accent/25" />
                <Link
                  href="/contact"
                  className="px-7 py-3.5 border border-line hover:border-faint text-ink font-medium rounded-xl transition-colors bg-white"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </div>
  );
}

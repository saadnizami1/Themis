import Link from 'next/link';
import SiteHeader from '@/components/Site/SiteHeader';
import SiteFooter from '@/components/Site/SiteFooter';
import DemoButton from '@/components/Site/DemoButton';

const features = [
  {
    title: 'Protocol enforcement',
    body: 'Six interview phases, from rapport to closing. The system enforces the order and pacing — it does not depend on the interviewer\'s habits.',
  },
  {
    title: 'Question screening',
    body: 'Every generated question is checked against ten categories of suggestive questioning before it is spoken. Flagged questions are rewritten, not asked.',
  },
  {
    title: 'Safety monitoring',
    body: 'If a witness discloses ongoing danger or shows acute distress, the interview stops itself and the case officer is alerted.',
  },
  {
    title: 'Witness control',
    body: 'Witnesses can ask for a break, a repeat, or an end to the interview at any time — by voice or by typing. The room obeys.',
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

const steps = [
  ['Create the case', 'Log the case number, incident type, and any context the interviewer should have. Context is never shown to the witness.'],
  ['Send one link', 'The witness opens it in a browser. No account, no installation. English or Urdu.'],
  ['Themis interviews', 'A spoken, recorded interview following the NICHD protocol. Each question is screened before it is asked.'],
  ['Review the record', 'Transcript, video, linguistic analysis, contradiction flags, and both reports — in one place.'],
];

const phases = [
  ['1 · Introduction', 'Ground rules and rapport. No case content.'],
  ['2 · Warm-up', 'Free-recall practice on a neutral topic.'],
  ['3 · Recollection', 'Context reinstatement through sensory cues.'],
  ['4 · Account', 'Uninterrupted free narrative, open invitations first.'],
  ['5 · Follow-up', 'Probes limited to details the witness has raised.'],
  ['6 · Closing', 'Final check, without pressure.'],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-16 sm:pt-24 pb-16 sm:pb-24 w-full">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1]">
            Structured witness interviews, conducted the same way every time.
          </h1>
          <p className="text-muted text-lg mt-6 leading-relaxed max-w-2xl">
            Themis is an AI interviewer for police investigations. It follows the NICHD protocol,
            screens every question before speaking it, and produces court-ready records.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <DemoButton className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors text-center" />
            <Link
              href="/login"
              className="px-6 py-3 border border-line hover:border-faint text-ink font-medium rounded-lg transition-colors text-center"
            >
              Officer sign in
            </Link>
          </div>
          <p className="text-faint text-sm mt-8">
            English and Urdu · NICHD protocol · Cognitive Interview method
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-line bg-surface">
        <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight max-w-xl">
            Built so nothing the system does can contaminate a witness&apos;s memory.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-line rounded-xl p-6">
                <h3 className="font-medium">{f.title}</h3>
                <p className="text-muted text-sm mt-2 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-5 py-16 sm:py-20 w-full">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">How it works</h2>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {steps.map(([title, body], i) => (
            <li key={title} className="border border-line rounded-xl p-6">
              <span className="text-faint text-sm">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="font-medium mt-2">{title}</h3>
              <p className="text-muted text-sm mt-2 leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Method */}
      <section className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-5 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 lg:gap-16">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Not a chatbot. A protocol, enforced by software.
            </h2>
            <p className="text-white/70 text-sm mt-5 leading-relaxed">
              Themis implements the NICHD Investigative Interview Protocol (Lamb et al., 2007) and
              the Cognitive Interview (Fisher &amp; Geiselman, 1992). Free recall comes before
              probing. Probes only touch details the witness has raised. Every question passes an
              independent screening model, built on the suggestibility research of Loftus &amp;
              Palmer (1974), before it is spoken.
            </p>
            <p className="text-white/70 text-sm mt-4 leading-relaxed">
              Analysis output is labelled as computational indicators, never verdicts. Themis
              assists the investigator and the court. It replaces neither.
            </p>
            <Link
              href="/methodology"
              className="inline-block mt-6 text-sm text-white border-b border-white/40 hover:border-white pb-0.5 transition-colors"
            >
              Read the methodology
            </Link>
          </div>
          <ul className="space-y-2.5 self-center">
            {phases.map(([label, body]) => (
              <li key={label} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 border border-white/15 rounded-lg px-4 py-3">
                <span className="text-white/90 text-sm font-medium whitespace-nowrap">{label}</span>
                <span className="text-white/60 text-sm">{body}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Plain statement */}
      <section className="max-w-3xl mx-auto px-5 py-16 sm:py-20 text-center">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
          No polygraph. No biometrics. No lie detection.
        </h2>
        <p className="text-muted text-sm mt-4 leading-relaxed">
          Themis flags linguistic patterns for professional review and always shows positive
          indicators alongside concerns. Recordings are stored privately and served only to the
          authenticated case officer.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}

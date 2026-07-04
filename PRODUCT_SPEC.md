# Themis (formerly TruthLens) — Product Specification (Draft v0.3)

> **Status of this document:** on 2026-07-03 the product was renamed **Themis** and substantially rebuilt — agentic turn engine (safety monitoring, intent classification, phase decisions in one AI call per turn), witness voice commands, break/resume, safety escalation with live officer alerts, witness-initiated stop flow, resumable sessions, signed-URL video uploads to Supabase Storage, landing page + Terms + Privacy, and a light institutional redesign. The README is now the accurate implementation reference; sections below describing "current code" reflect the pre-rebuild TruthLens and are kept for the product rationale and the **Open Questions (§17)**, several of which the rebuild resolved: the escalation/distress path (B.5) now exists, interviews are resumable (D.12), the Anthropic dependency is removed, and consent now requires accepting Terms/Privacy with an under-18 guardian notice (partially addresses B.4). Legal sign-off (B.3), retention policy (B.6), and audit logging (B.7) remain open.

## 0. Decisions made so far

| Question | Decision |
|---|---|
| Which LLM backend? (§7, §13, old open Q9) | **Standardize on Groq** (`llama-3.3-70b-versatile`). The `@anthropic-ai/sdk` dependency is vestigial and should be removed as cleanup; README/`.env.example` should stop referencing Anthropic/`lib/anthropic.ts`. |
| What stage is this? (old open Q1) | **Real pilot, with an actual department in mind** — not a thesis prototype or portfolio piece. This raises the bar significantly on everything in §17.B (legal/ethical) — those are no longer hypothetical and should be treated as pre-launch blockers, not someday-questions. |
| Human-in-the-loop during questioning? (old open Q4, Q12) | **Firm design decision — no human present during questioning is the point**, not a v1 shortcut. Any future "officer can watch/intervene live" feature would be an explicit deviation from the core value proposition, not a natural extension of it. |

Given "real pilot" + "no human present" together, **§17.B (legal & ethical)** is now the highest-priority open section in this document — those questions gate whether this can ethically go in front of a real victim at all, not just how the product should be scoped.

---

## 1. One-line description

TruthLens is a web platform that lets a police officer send a crime victim or witness a private link to an **AI-conducted forensic interview** — structured, non-leading, and speech-driven — and then automatically produces a **linguistic consistency analysis** and **two audience-specific PDF reports** (court + internal police), including contradiction-flagging across multiple interviews of the same person over time.

## 2. Problem it's trying to solve

Human-led investigative interviews of victims/witnesses are:
- **Inconsistent in quality.** Officers aren't all trained in NICHD/Cognitive Interview technique, and even trained interviewers slip into leading questions, especially under time pressure or with distressing cases.
- **Vulnerable to contamination.** Leading questions, suggestion, and repeated interviewing are well-documented causes of unreliable testimony (Loftus & Palmer, etc.). A bad question early in a case can taint everything downstream.
- **Hard to audit.** There's often no rigorous, structured record of *how* an account was elicited — only what was said.
- **Hard to track across time.** When a person is interviewed more than once (follow-ups, re-investigation, new officer), nobody is systematically diffing statement #1 against statement #2 for contradictions.

TruthLens's bet: an AI interviewer, constrained by a hard rulebook and a second AI "validator" that rejects dangerous questions before they're ever asked, can conduct a *more* methodologically consistent interview than an average human, and can also do the tedious cross-referencing work (linguistic pattern-spotting, contradiction detection across sessions) that nobody currently has time to do by hand.

## 3. Who this is for

- **Primary user: the officer/investigator.** Creates cases, generates interview links, reviews completed interviews, downloads/reads reports, decides what to do next (charge, close, re-interview, escalate).
- **Primary subject, not a "user" in the login sense: the victim/witness.** Receives a link, no account needed, goes through the interview once (or multiple times across a case's life) via UUID token.
- **Implicit downstream reader: a court / prosecutor**, who receives the "court" PDF as one input among others — explicitly *not* as a stand-alone verdict on truthfulness.

## 4. Core design principles (as encoded in the current code)

1. **The AI may never introduce facts.** It can only ask about details the witness themself already said. It is explicitly told not to use the police report to feed information back to the witness — the report is "context only."
2. **Open recall before probing.** Every phase favors "tell me everything" over specific questions; focused probes only come after free narrative is exhausted.
3. **A second AI acts as gatekeeper.** Every generated question is validated against 10 named "dangerous question" categories before it's ever spoken to the witness. Failing questions get rewritten (up to 2 retries) rather than asked.
4. **Findings are "indicators," never verdicts.** Every report, PDF, and UI surface that shows linguistic-analysis output explicitly labels it as a computational indicator, not a clinical or legal determination of truthfulness, and states it must be reviewed by a qualified professional.
5. **No human is in the room during questioning.** The interview is delivered via TTS and answered via STT/typed fallback, entirely in-browser — by design, so the *only* variable is the AI's adherence to protocol (no human tone-of-voice, body language, or improvisation to control for). **This is a firm design decision, not a v1 simplification** (see §0) — which makes the legal/ethical questions in §17.B the top priority for this project.
6. **Language- and culture-aware.** English and Urdu are both first-class; the system prompt explicitly instructs against phrasing that implies "you must agree with me," accounting for collectivist-culture deference norms.

## 5. End-to-end flow

### 5.1 Officer flow
1. Log in (`/login`, NextAuth credentials + bcrypt).
2. Create a case: case number, incident type, free-text description, optional police-report PDF upload (parsed via `pdf-parse` and used only as AI context, never surfaced to the witness).
3. Generate an interview: system mints a UUID-style `accessToken` and a shareable link (`/interview/[token]`). Multiple interviews can be attached to one case (`interviewNumber` increments), enabling re-interviews over time.
4. Share the link with the victim/witness through whatever out-of-band channel the officer uses today (SMS, in person, etc. — TruthLens does not send it).
5. Once the interview is marked `completed`, the officer opens the case and can:
   - Watch/read the transcript.
   - View the linguistic-analysis flags and consistency score.
   - View any cross-interview contradictions (once ≥2 interviews exist for the same case/person).
   - Generate/download the **Court Report PDF** and the **Police Report PDF**.

### 5.2 Victim/witness flow
1. Open the emailed/texted link — no login, no account, just the token.
2. Choose language: English or Urdu.
3. Consent screen — confirms understanding, provides name and age (optional/likely required — see open questions).
4. Interview begins: AI speaks (TTS) the current phase's opening prompt or next question; the witness answers by speaking (STT, Web Speech API) or typing as fallback; webcam recording runs throughout and is stored server-side.
5. AI silently walks through six structured phases (below), generating each next question live via Groq's Llama 3.3 70B, validating it, and deciding when to advance phase.
6. Interview ends after the closing phase; status flips to `completed`; video, transcript, and (post-processed) analysis become available to the officer.

## 6. Interview methodology — six-phase structure

Implemented in `lib/interview-phases.ts`, grounded in the NICHD Protocol (Lamb et al., 2007) and the Cognitive Interview (Fisher & Geiselman, 1992):

| # | Phase (internal id) | Label (EN / UR) | Purpose | Exchange bounds | Key constraint |
|---|---|---|---|---|---|
| 1 | `rapport` | Introduction / تعارف | Ground rules, trust, sets expectations ("no right or wrong answers", "tell me if I get something wrong") | 3–6 | No case content |
| 2 | `narrative_practice` | Warm-Up / تیاری | Practice free recall on a neutral topic (e.g. "what did you do this morning") | 2–4 | Strictly neutral topic |
| 3 | `context_reinstatement` | Recollection / یادداشت | Mentally return witness to the scene via sensory cues (sight/sound/feeling) | 2–3 | Sensory cues only, no leading detail |
| 4 | `substantive` | Your Account / آپ کی بات | The actual free narrative of the incident, open invitations first | 4–20 | Open-ended invitations before any probes |
| 5 | `clarification` | Follow-Up / مزید سوالات | Focused probes, but only on details the witness already raised | 2–8 | Witness-grounded only |
| 6 | `closing` | Closing / اختتام | Final catch-all ("anything else?", "anything you're unsure about?") | 1–3 | Non-pressuring |

Phase advancement (`shouldAdvancePhase`) is rule-based, not purely model-judged: it waits for the phase's minimum exchange count, forces advancement at the max, and has a heuristic early-exit if the witness's most recent answer is very short (<10 words) once the minimum has been met.

## 7. AI question generation & validation pipeline

- **Generation model:** Groq-hosted `llama-3.3-70b-versatile` (see `lib/ai.ts`). Each call is given: case context (withheld from witness), prior interview reports for the same person (withheld from witness), current phase, language, and the running transcript. It's instructed to output *only* the next question/prompt — no preamble.
- **Validator model:** a second Groq call, acting as "forensic interview quality controller," trained (via prompt) on Loftus & Palmer (1974), NICHD (Lamb et al. 2007), and Fisher & Geiselman. It screens every candidate question for 10 categories before it is spoken:

  | Category | What it catches |
  |---|---|
  | PRESUPPOSITION | Assumes a fact not yet stated by the witness |
  | FORCED_CHOICE | "Was it A or B" when neither may be true |
  | DETAIL_INSERTION | Smuggles in a specific the witness never mentioned |
  | VERB_INTENSITY_LOADING | "Smashed" vs "hit" — loaded verb choice biasing recall |
  | CONFIRMATION_PRESSURE | Pushes witness to confirm rather than recall |
  | AUTHORITY_PRESSURE | Leverages the AI/officer's authority to induce compliance |
  | TEMPORAL_COMPRESSION | Collapses/conflates timeline in a leading way |
  | ACQUIESCENCE_TRAP | Phrasing that nudges toward "yes" regardless of truth |
  | MISINFORMATION_EMBEDDING | States something false as if established fact |
  | CLOSURE_PRESSURE | Rushes the witness toward ending disclosure prematurely |

  If a question is flagged, the validator's suggested rewrite is used, with up to 2 retries before (presumably) falling back to a safe generic prompt — **confirm actual fallback behavior, see open questions**.

- **Model choice (resolved, see §0):** standardized on Groq's Llama 3.3 70B for all generation/validation/analysis/report-writing. The `@anthropic-ai/sdk` dependency is vestigial and slated for removal.

## 8. Speech & video capture

- **TTS:** browser-native `SpeechSynthesisUtterance` (no server-side voice synthesis).
- **STT:** browser-native `webkitSpeechRecognition` / Web Speech API, with a typed-text fallback field if unsupported. Urdu STT uses the `ur-PK` locale.
- **Browser requirement:** Chrome or Edge only (Web Speech API support). The interview page detects and warns otherwise.
- **Webcam:** recorded throughout the interview and stored server-side under `/uploads/videos/`, served only to authenticated officers — never made public, never given a token-based witness-facing URL.

## 9. Post-interview linguistic analysis

Implemented in `lib/linguistic-analysis.ts`, run after an interview completes:
- **8 computational indicator types** (per README: hedging language, over-specificity, under-specificity, formulaic/rehearsed-sounding language, and others in that family — confirm full canonical list, see open questions).
- **Overall consistency score, 0–100**, surfaced in both PDFs.
- **Positive indicators** — signals associated with genuine recall (spontaneous correction, appropriate uncertainty, etc.) are tracked and shown alongside negative flags, so the report isn't one-sided.
- Every surface (UI + both PDFs) explicitly labels this output as "computational indicators — not clinical diagnoses," with a disclaimer that a qualified forensic professional must review before any legal use.

## 10. Cross-interview contradiction detection

When a case/person has more than one completed interview, the system compares statements across interviews (`claim_interview_1` vs `claim_interview_2` on a shared `topic`, each with a severity rating) and surfaces these as **Contradiction Flags**, distinct from within-interview linguistic flags. This is the main payoff of allowing multiple `Interview` rows per `Case` (`interviewNumber` tracks ordering).

## 11. Reporting — two audiences, two documents

Both are generated via `@react-pdf/renderer` from the same underlying transcript + analysis data, but are structurally and tonally different:

### Court Report (`components/PDF/CourtReport.tsx`)
- Cover page: case number, incident type, "Interview N of M," date, reviewing officer, witness name/age, language, interview reference ID.
- §1 Methodology (explains NICHD/Cognitive Interview + AI-conducted, no-human-present framing).
- §2 Witness Statement Summary (AI-generated narrative summary).
- §3 Linguistic Consistency Assessment (score + positive indicators + flags, with the "computational indicator, not diagnosis" disclaimer inline).
- §4 Cross-Interview Contradictions (only if present).
- §5 Full Interview Transcript, timestamped, interviewer/witness labeled.
- Closing disclaimer block reiterating AI limitations and need for professional review.
- Tone: formal, muted colors, meant to be handed to a court/legal audience.

### Police Report (`components/PDF/PoliceReport.tsx`)
- Header: case, interview #, officer — marked **"CONFIDENTIAL — NOT FOR COURT SUBMISSION."**
- §1 Case Summary (incident type + officer's own description).
- §2 Interview Status (status, language, duration, number of witness exchanges).
- §3 Key Facts Mentioned by Witness (first 12 witness utterances as bullets, "+N more, see transcript").
- §4 Contradiction Flags.
- §5 Linguistic Indicator Summary (condensed) + consistency score.
- §6 **Recommended Follow-Up Questions** (investigative leads for the officer — this section does *not* appear in the court report).
- §7 Raw Transcript (Q/A shorthand, denser than the court version).
- Tone: operational/internal, red accent color, meant strictly for the investigating officer's own workflow — never for disclosure.

The key product decision already baked in: **the officer-facing document gets investigative leads and unredacted internal framing; the court document is deliberately narrower and more defensible.**

## 12. Data model (current Prisma schema)

```
User (officer)
 ├─ id, email, password (bcrypt), name, station, role ("officer" default)
 └─ cases: Case[]

Case
 ├─ id, caseNumber (unique), incidentType, description, reportPath (uploaded PDF)
 ├─ officer: User
 └─ interviews: Interview[]

Interview
 ├─ id, caseId → Case
 ├─ accessToken (unique, victim-facing)
 ├─ victimName?, victimAge?, language ("en"/"ur")
 ├─ status ("pending" → "completed", presumably others)
 ├─ videoPath?, transcript (Json), linguisticFlags (Json), contradictions (Json)
 ├─ courtReport?, policeReport? (rendered text/refs)
 ├─ interviewNumber (default 1), createdAt, completedAt?
```

Notable: there's no explicit `Person`/`Witness` entity distinct from `Interview` — cross-interview linking for "the same person across cases/time" currently appears to happen at the `Case` level via multiple `Interview` rows, not via a first-class witness identity. **This matters a lot for the contradiction-detection story and is flagged as an open question below.**

## 13. Technology stack (as implemented today)

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Auth | NextAuth (credentials provider) + Prisma adapter, bcryptjs for password hashing |
| Database | PostgreSQL via Prisma ORM |
| LLM (generation/validation/analysis/reports) | Groq — `llama-3.3-70b-versatile` (standardized, §0) |
| LLM SDK to be removed | `@anthropic-ai/sdk` (Claude) — vestigial, cleanup pending |
| PDF generation | `@react-pdf/renderer` |
| File upload / parsing | `multer`, `pdf-parse` |
| TTS/STT | Native browser Web Speech API (Chrome/Edge only) |
| Styling | Tailwind CSS |
| IDs | `uuid`, Prisma `cuid()` |

## 14. Security & privacy posture (current)

- Victims authenticate purely via an unguessable per-interview token in the URL — no account, no password.
- Recorded video is stored server-side and gated behind officer authentication; never exposed via witness-facing routes.
- Uploaded police reports are used only as LLM context and are explicitly instructed never to be disclosed to the witness.
- No third-party "lie detection" API is used — all analysis is first-party prompt-based LLM inference, explicitly framed as non-clinical.
- **Not yet addressed anywhere in the code** (see open questions): data retention windows, encryption at rest for video/transcripts, audit logging of officer access, multi-tenancy/department isolation, consent-withdrawal handling.

## 15. Current build status (as of 2026-07-03)

- Code is feature-complete-looking across auth, case management, interview flow, PDF generation, question validation, and linguistic analysis. `npx tsc --noEmit` passes clean.
- `.env` now exists locally with `DATABASE_URL`, `ANTHROPIC_API_KEY`, `GROQ_API_KEY`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `UPLOAD_DIR` — ahead of `.env.example`, which is missing `GROQ_API_KEY`.
- Not yet confirmed: git repo initialized, database actually provisioned/migrated/seeded, or a full end-to-end run (login → case → interview → report) ever completed in a browser.
- **Documentation drift:** README references `lib/anthropic.ts` as the prompt-library file; the actual file is `lib/ai.ts`, and it's Groq-backed, not Anthropic-backed. Worth reconciling once the model question (§12 open questions) is settled.

## 16. Explicit non-goals (as currently built — confirm these are intentional)

- Not a polygraph or biometric deception-detection tool — no physiological sensors, no third-party "lie detection" API.
- Not a replacement for a human investigator's judgment — outputs are framed as inputs to review, not conclusions.
- Not currently multi-tenant across departments/agencies (single flat `User`/`officer` model, no organization/department scoping visible in the schema).
- Not currently doing anything with the recorded video *content* itself (no facial/vocal affect analysis) — video is stored as an evidentiary record, not analyzed.
- Not sending the interview link on the officer's behalf — link distribution is out of scope, at least today.

---

## 17. Open questions

These are grouped by theme. Answering even the ones marked **(blocking)** would let us turn this into a real v1 spec; the rest sharpen scope and can be deferred.

### A. Purpose & stage — *(resolved, see §0: real pilot with a department in mind)*
1. Is there a specific jurisdiction/department in mind (Pakistan, given the Urdu support? Elsewhere)? Different jurisdictions have very different admissibility and evidentiary rules for AI-assisted interviews.
2. Do you have a domain expert (forensic psychologist, NICHD-trained interviewer, or legal counsel) validating the interview protocol and report language, or is that still to be arranged? Given this is a real pilot, this stops being optional.

### B. Legal & ethical — **now the top-priority section** (real pilot + no human present, per §0 — these gate whether this can ethically reach a real victim)
3. **(blocking)** Has anyone with legal/forensic authority in the target jurisdiction actually signed off on victims being interviewed by an AI with *no human present*? The design decision is now firm (§0) — the open question is whether it's *legally and ethically viable*, not whether it should change.
4. **(blocking)** What is the actual consent flow supposed to be? Right now the victim clicks a link and self-attests consent/age — is a minor able to go through this unsupervised? Should there be a minimum age, guardian consent path, or officer-witnessed consent step?
5. **(blocking)** What happens if the witness is in genuine distress mid-interview (disclosure of ongoing danger, self-harm risk, needs a human immediately)? There is currently no escalation/interrupt path in the code at all — the AI just continues through its phases. For a real pilot with no human present, this is arguably the single biggest safety gap in the product today.
6. Data retention: how long are transcripts/videos kept, who can delete them, and is there a victim-initiated withdrawal-of-consent/right-to-erasure path?
7. Should there be an audit log of which officer viewed which interview/video, for chain-of-custody purposes?

### C. Model & AI architecture — *(model choice resolved, see §0: Groq only)*
8. Is there a fallback if the Groq API is down or rate-limited mid-interview? Right now a failed call presumably breaks the live interview — worth deciding what "graceful degradation" looks like when a real witness is mid-disclosure.
9. What happens after 2 failed validator retries on a question — is there a safe hardcoded fallback question, or does it ask the flagged question anyway? Worth testing/confirming.

### D. Interview experience
10. Is a text-typing fallback acceptable as an equivalent substitute for STT in a forensic context, or does that need special handling/disclosure (e.g., flagging in the transcript that a response was typed vs. spoken)?
11. Any plan for languages beyond English/Urdu, or is that the fixed scope?
12. Should the interview be resumable if the witness closes the tab mid-session, and if so, how — same token, fresh start, or continue where they left off? (More pressing now that there's no human present to notice a dropped session.)
13. Is there a minimum/maximum total interview length target (today's phase bounds imply roughly 14–44 exchanges total, i.e. a wide range)?

### E. Cross-interview contradiction detection
14. **(blocking)** Contradiction detection currently seems to operate at the `Case` level (multiple `Interview` rows). Should it instead be tied to a persistent **witness/person identity** that can span multiple *cases* (e.g., same victim reinterviewed in an unrelated case, or a repeat witness across investigations)? This is a data-model decision worth locking down before more features are built on top.
15. How many prior interviews' worth of context should feed the "previous interview reports" prompt — all of them, or a capped/most-recent window (relevant for both prompt size and fairness/anchoring)?

### F. Reporting
16. Who actually reviews the Court Report before it goes anywhere near a courtroom — is there a required officer/legal sign-off step in the product, or is PDF generation the end of the workflow today?
17. Should the linguistic-analysis methodology itself (the 8 indicator types, scoring logic) be disclosed/appendixed in the court report for defense-side scrutiny, given it will likely face a Daubert/admissibility-style challenge?
18. Any requirement for versioning/hashing reports (so a report can't be silently regenerated differently later and passed off as the original)?

### G. Deployment & ops
19. Where do you intend to host this (self-hosted on department infrastructure, cloud, on-prem for chain-of-custody reasons)? Video storage in particular tends to have strict evidentiary-handling requirements.
20. Expected scale — is this single-department/dozens of cases, or multi-department/thousands? Affects whether the current single-tenant schema is good enough.
21. Any requirement to integrate with existing case-management or evidence systems (RMS, digital evidence management), or is TruthLens meant to stand alone?

### H. Immediate next steps
22. Do you want to fix the documentation drift (README's `lib/anthropic.ts` reference, `.env.example` missing `GROQ_API_KEY`, and removing the unused `@anthropic-ai/sdk` dependency now that §0 settles the model question) and get a real end-to-end run working *before* we keep refining this spec, so the spec is grounded in an app you've actually clicked through? (Recommended — a lot of the remaining answers, especially §B, may sharpen once you've experienced the actual interview flow yourself.)

---

## 18. How to use this doc

Treat every declarative sentence above §17 as "this is what the code currently does," not "this is what we've agreed the product should do." Answer whichever open questions you have strong opinions on (skip the rest for now), and we'll fold the answers back into a tightened v1 of this spec.

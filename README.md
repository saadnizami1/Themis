# Themis; Forensic AI Interview Platform

Structured, protocol-driven AI interviews of victims and witnesses for law enforcement , 
with real-time question validation, safety escalation, cross-interview contradiction
analysis, and court-ready reporting.

**Stack:** Next.js 14 · Prisma/PostgreSQL (Supabase) · Groq (Llama 3.3 70B) · Supabase Storage · NextAuth · @react-pdf/renderer · Tailwind

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Fill in:
- `DATABASE_URL`; Supabase Postgres **Transaction pooler** URI (or any Postgres)
- `GROQ_API_KEY`; from console.groq.com
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`; for private video/report storage (optional locally; falls back to `./uploads`)
- `NEXTAUTH_SECRET`; `openssl rand -base64 32`
- `NEXTAUTH_URL`; `http://localhost:3000` for local dev

### 3. Set up database
```bash
npm run db:push       # Push schema to DB
npm run db:seed       # Create accounts + demo sample case (also resets the demo workspace)
```

### 4. Run
```bash
npm run dev           # development
npm run build && npm start   # production mode; much faster, use this to evaluate speed
```

Open http://localhost:3000

### Accounts
- Admin officer: `approvedbysaad@themis.pk` / `1s4ad`; change this before showing anyone
- Demo workspace: `demo@themis.app` / `themis-demo`; public, shared, reached via the
  "Try the demo" button; contains a fictional sample case. Re-running `npm run db:seed`
  resets it.

---

## Pages

Public: `/` (landing) · `/methodology` · `/security` · `/contact` · `/terms` · `/privacy` · `/login`
Officer: `/dashboard` · `/dashboard/cases/[id]` · `/dashboard/cases/[id]/interview/[iid]` · `/dashboard/settings`
Witness: `/interview/[token]`; no sign-in, works on mobile; browsers without speech
recognition (e.g. iOS) automatically get typed answers with spoken questions.

## Core flow

1. Officer signs in and creates a case (number, incident type, description, optional report
   PDF: parsed once at upload, used only as private interviewer context)
2. Generates an interview link; unguessable token, no witness login
3. Witness opens the link: picks English / اردو, consents, completes a spoken AI interview
   (TTS + STT + webcam recording; typed fallback everywhere)
4. Officer reviews: live escalation alerts, transcript, per-turn AI observations, linguistic
   analysis, cross-interview contradictions, video, and both PDFs

## The agentic interviewer

Every turn runs through a single decision call (`lib/interview-engine.ts`):

1. **Safety read** of the witness's last utterance; distress level, ongoing danger, self-harm risk
2. **Intent classification**; answer / break request / repeat / stop request / process question
3. **Action decision**; ask, advance phase, offer break, confirm stop, end, or **escalate**
4. **Validator gate**; any question is screened against 10 dangerous-question categories before being spoken; flagged questions are rewritten (≤2 retries)
5. **Live assessment**; a one-line internal observation per turn, visible to the officer

Server-side phase bounds are enforced on top of the model's judgment, so the NICHD phase
structure can't be skipped or overrun.

### Physical room control
- **Voice commands**: "repeat the question" (handled instantly client-side), "I need a break", "I want to stop" (classified server-side; the room pauses/ends itself)
- **Safety escalation**: on critical distress / danger disclosure the interview stops itself, shows emergency contacts, and flags the officer's dashboard (15s polling)
- **Echo-proofing**: the microphone is hard-muted while Themis speaks; STT starts only after TTS `onend` + 350ms grace, so the AI's voice can never be transcribed as the witness's answer
- **Resume**: interrupted sessions (dropped tab, network loss) resume from the same link

## Interview structure (NICHD + Cognitive Interview)

| Phase | Purpose | Key rule |
|---|---|---|
| 1; Introduction | Ground rules + rapport | No case content |
| 2; Warm-Up | Free-recall practice | Neutral topic |
| 3; Recollection | Context reinstatement | Sensory cues only |
| 4; Your Account | Free narrative | Open invitations first |
| 5; Follow-Up | Focused probes | Witness-mentioned details only |
| 6; Closing | Final check | Non-pressuring |

## Dangerous-question validation

`lib/question-validator.ts` flags: PRESUPPOSITION, FORCED_CHOICE, DETAIL_INSERTION,
VERB_INTENSITY_LOADING, CONFIRMATION_PRESSURE, AUTHORITY_PRESSURE, TEMPORAL_COMPRESSION,
ACQUIESCENCE_TRAP, MISINFORMATION_EMBEDDING, CLOSURE_PRESSURE.

## Linguistic analysis

`lib/linguistic-analysis.ts` (post-interview): 8 computational indicator types, cross-interview
contradiction detection, 0–100 consistency score, positive truthfulness indicators.
**All findings are labeled computational indicators; never diagnoses or verdicts.**

## AI prompt library

All prompts live in `lib/ai.ts`:
- `INTERVIEWER_DECISION_SYSTEM_PROMPT`; the agentic turn brain
- `QUESTION_VALIDATOR_SYSTEM_PROMPT`
- `LINGUISTIC_ANALYSIS_SYSTEM_PROMPT`
- `REPORT_SUMMARY_SYSTEM_PROMPT`
- `FOLLOW_UP_QUESTIONS_SYSTEM_PROMPT`

All inference runs on Groq `llama-3.3-70b-versatile` with JSON-mode responses.

## Browser support

Speech recognition works in **Chrome** and **Edge** (Web Speech API); Urdu STT uses `ur-PK`.
On browsers without it (iOS Safari and others) the interview still runs: questions are spoken
aloud and the witness types answers. Webcam + microphone permissions are requested for the
recording.

## Performance notes

- All AI calls run on Groq (`GROQ_MODEL` env var overrides the default `llama-3.3-70b-versatile`).
  The free tier allows roughly 1–2 full interviews per day; enable Groq Dev Tier for a pilot.
- Report PDFs are parsed once at upload; never during an interview turn.
- Recordings upload browser → storage via signed URLs and play back the same way.
- `vercel.json` pins functions to `syd1`, colocated with the Supabase database.
- Dev mode (`npm run dev`) compiles pages on demand and feels slow; judge speed with
  `npm run build && npm start` or the deployed app.

## Security notes

- Witness routes are gated by the interview's unguessable access token (verified server-side on every call)
- Videos live in private Supabase Storage buckets, served only to the authenticated case officer
- Police report text is AI context only; never disclosed to the witness
- No third-party deception-detection APIs; no analytics trackers
- Interview status flow: `pending → in_progress → completed | terminated (witness stopped) | escalated (safety hold)`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Supabase + GitHub + Vercel walkthrough.

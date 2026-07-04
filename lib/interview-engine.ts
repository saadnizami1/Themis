import { prisma } from './prisma';
import {
  INTERVIEWER_DECISION_SYSTEM_PROMPT,
  buildDecisionPrompt,
  parseLlmJson,
  jsonCompletion,
} from './ai';
import { validateAndRefine } from './question-validator';
import { PHASES, getPhaseById, getNextPhase } from './interview-phases';
import type { Phase } from './interview-phases';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TranscriptEntry {
  role: 'ai' | 'witness' | 'event';
  content: string;
  phase: string;
  timestamp: string;
}

export interface LiveNote {
  turn: number;
  phase: string;
  note: string;
  signals: string[];
  distressLevel: string;
}

export interface EscalationEvent {
  at: string;
  reason: string;
  distressLevel: string;
  ongoingDanger: boolean;
  selfHarmRisk: boolean;
}

export type TurnEvent =
  | { type: 'start' }
  | { type: 'resume' }
  | { type: 'answer'; text: string };

export interface TurnResult {
  action: 'speak' | 'break' | 'escalated' | 'end';
  utterance: string;
  phaseId: Phase;
  phaseIndex: number;
  status: string;
  endReason?: 'closing_complete' | 'witness_stopped';
}

interface Decision {
  safety: {
    distress_level: 'none' | 'mild' | 'elevated' | 'critical';
    ongoing_danger: boolean;
    self_harm_risk: boolean;
    note: string;
  };
  intent: string;
  action: string;
  question: string;
  assessment: { note: string; signals: string[] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function phaseIndexOf(id: string): number {
  const idx = PHASES.findIndex((p) => p.id === id);
  return idx === -1 ? 0 : idx;
}

function ack(language: string): string {
  return language === 'ur' ? 'شکریہ۔' : 'Thank you.';
}

function fallbackProbe(language: string): string {
  return language === 'ur'
    ? 'براہ کرم اس کے بارے میں مزید بتائیں۔'
    : 'Please tell me more about that.';
}

function resumeLine(language: string): string {
  return language === 'ur'
    ? 'خوش آمدید۔ جب آپ تیار ہوں، ہم وہیں سے جاری رکھیں گے۔'
    : "Welcome back. Whenever you're ready, we'll continue where we left off.";
}

// ─── The turn engine ──────────────────────────────────────────────────────────

export async function runTurn(interviewId: string, event: TurnEvent): Promise<TurnResult> {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { case: true },
  });
  if (!interview) throw new Error('Interview not found');
  if (interview.status === 'escalated') {
    return {
      action: 'escalated',
      utterance: '',
      phaseId: interview.currentPhase as Phase,
      phaseIndex: phaseIndexOf(interview.currentPhase),
      status: 'escalated',
    };
  }

  const language = (interview.language as 'en' | 'ur') || 'en';
  const transcript = ((interview.transcript as unknown as TranscriptEntry[]) || []).slice();
  const liveNotes = ((interview.liveNotes as unknown as LiveNote[]) || []).slice();
  const phaseId = interview.currentPhase as Phase;
  const phaseConfig = getPhaseById(phaseId);
  const phaseIndex = phaseIndexOf(phaseId);
  const now = () => new Date().toISOString();

  // ── Start: speak the rapport opening ──
  if (event.type === 'start') {
    const opening = language === 'ur' ? phaseConfig.openingPromptUr : phaseConfig.openingPrompt;
    transcript.push({ role: 'ai', content: opening, phase: phaseId, timestamp: now() });
    await prisma.interview.update({
      where: { id: interviewId },
      data: { transcript: JSON.parse(JSON.stringify(transcript)), status: 'in_progress' },
    });
    return { action: 'speak', utterance: opening, phaseId, phaseIndex, status: 'in_progress' };
  }

  // ── Resume after a break or dropped session: re-ask the pending question ──
  if (event.type === 'resume') {
    // Skip break/stop acknowledgments — find the last substantive question.
    let lastQuestion = '';
    for (let i = transcript.length - 1; i >= 0; i--) {
      const entry = transcript[i];
      if (entry.role !== 'ai') continue;
      const next = transcript[i + 1];
      if (next?.role === 'event' && (next.content === 'break' || next.content === 'escalated')) continue;
      lastQuestion = entry.content;
      break;
    }
    const utterance = `${resumeLine(language)} ${lastQuestion}`.trim();
    transcript.push({ role: 'event', content: 'resumed', phase: phaseId, timestamp: now() });
    await prisma.interview.update({
      where: { id: interviewId },
      data: { transcript: JSON.parse(JSON.stringify(transcript)), status: 'in_progress' },
    });
    return { action: 'speak', utterance, phaseId, phaseIndex, status: 'in_progress' };
  }

  // ── Answer: the main agentic turn ──
  const witnessText = event.text.trim();
  transcript.push({ role: 'witness', content: witnessText, phase: phaseId, timestamp: now() });

  const exchangeCount = interview.exchangeCount + 1;
  const mayAdvance = exchangeCount >= phaseConfig.minExchanges;
  const mustAdvance = exchangeCount >= phaseConfig.maxExchanges;
  const stopAskedBefore = transcript.some(
    (t) => t.role === 'event' && t.content === 'confirm_stop_asked'
  );

  // Case context for the model (never shown to witness). Report text was
  // extracted once at upload time — no file I/O in the turn path.
  const reportText = interview.case.reportText || '';
  const caseContext = `Case: ${interview.case.caseNumber}
Incident type: ${interview.case.incidentType}
Officer's description: ${interview.case.description}
${reportText ? `Police report summary:\n${reportText}` : ''}`.trim();

  const prevInterviews = await prisma.interview.findMany({
    where: { caseId: interview.caseId, id: { not: interview.id }, status: 'completed' },
    orderBy: { interviewNumber: 'asc' },
    select: { transcript: true, interviewNumber: true },
  });
  const previousInterviewsText = prevInterviews
    .map((pi) => {
      const t = pi.transcript as unknown as TranscriptEntry[] | null;
      if (!t) return '';
      return (
        `--- Interview ${pi.interviewNumber} ---\n` +
        t
          .filter((e) => e.role !== 'event')
          .map((e) => `${e.role === 'ai' ? 'Q' : 'A'}: ${e.content}`)
          .join('\n')
      );
    })
    .filter(Boolean)
    .join('\n\n');

  // One decision call: safety + intent + action + next utterance + assessment
  const rawDecision = await jsonCompletion(
    [
      { role: 'system', content: INTERVIEWER_DECISION_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildDecisionPrompt({
          phase: phaseId,
          phaseDescription: phaseConfig.description,
          exchangeCount,
          minExchanges: phaseConfig.minExchanges,
          maxExchanges: phaseConfig.maxExchanges,
          mayAdvance,
          mustAdvance,
          stopAlreadyConfirmedOnce: stopAskedBefore,
          transcript: transcript.filter((t) => t.role !== 'event'),
          caseContext,
          previousInterviews: previousInterviewsText,
          language,
          latestUtterance: witnessText,
        }),
      },
    ],
    1024,
    0.4
  );

  const decision = parseLlmJson<Decision>(rawDecision) ?? {
    safety: { distress_level: 'none', ongoing_danger: false, self_harm_risk: false, note: '' },
    intent: 'answer',
    action: 'ask',
    question: fallbackProbe(language),
    assessment: { note: 'Decision engine returned unparseable output; used fallback probe.', signals: [] },
  };

  // Record the live assessment note for the officer
  liveNotes.push({
    turn: liveNotes.length + 1,
    phase: phaseId,
    note: decision.assessment?.note || '',
    signals: decision.assessment?.signals || [],
    distressLevel: decision.safety?.distress_level || 'none',
  });

  // ── Safety override: escalation beats everything ──
  // Exception: a witness calmly exercising their right to stop is not an
  // emergency — models sometimes mislabel it "critical". Danger and self-harm
  // remain absolute triggers even mid-stop.
  const isStopFlow =
    decision.intent === 'stop_request' ||
    decision.action === 'confirm_stop' ||
    decision.action === 'end_interview';
  const mustEscalate =
    decision.action === 'escalate' ||
    decision.safety?.ongoing_danger === true ||
    decision.safety?.self_harm_risk === true ||
    (decision.safety?.distress_level === 'critical' && !isStopFlow);

  if (mustEscalate) {
    const message =
      decision.question ||
      (language === 'ur'
        ? 'ہم یہیں رکتے ہیں۔ آپ نے بہت اچھا کیا۔ آپ کی حفاظت سب سے اہم ہے — مدد کا بندوبست کیا جا رہا ہے۔'
        : "We're going to pause here. You've done well. Your safety comes first — help is being arranged.");
    const events = ((interview.escalation as unknown as EscalationEvent[]) || []).slice();
    events.push({
      at: now(),
      reason: decision.safety?.note || 'Safety escalation triggered by AI decision.',
      distressLevel: decision.safety?.distress_level || 'critical',
      ongoingDanger: !!decision.safety?.ongoing_danger,
      selfHarmRisk: !!decision.safety?.self_harm_risk,
    });
    transcript.push({ role: 'ai', content: message, phase: phaseId, timestamp: now() });
    transcript.push({ role: 'event', content: 'escalated', phase: phaseId, timestamp: now() });
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        transcript: JSON.parse(JSON.stringify(transcript)),
        liveNotes: JSON.parse(JSON.stringify(liveNotes)),
        escalation: JSON.parse(JSON.stringify(events)),
        exchangeCount,
        status: 'escalated',
      },
    });
    return { action: 'escalated', utterance: message, phaseId, phaseIndex, status: 'escalated' };
  }

  // ── Normalize the action against phase bounds ──
  let action = decision.action;
  if (action === 'advance_phase' && !mayAdvance) action = 'ask';
  if (mustAdvance && action === 'ask') action = 'advance_phase';
  const isClosing = phaseId === 'closing';

  // Loop breaker: never re-ask the exact question just asked. If the phase
  // minimum is met, treat a repeat as "this phase is exhausted" and advance
  // (which in closing means ending); otherwise swap in a neutral probe.
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();
  const lastAiEntry = [...transcript].reverse().find((t) => t.role === 'ai');
  if (
    action === 'ask' &&
    lastAiEntry &&
    decision.question &&
    normalize(decision.question) === normalize(lastAiEntry.content)
  ) {
    if (mayAdvance) action = 'advance_phase';
    else decision.question = fallbackProbe(language);
  }

  // ── Break ──
  if (action === 'offer_break') {
    const message =
      decision.question ||
      (language === 'ur'
        ? 'بالکل، ہم وقفہ لیتے ہیں۔ جب آپ تیار ہوں تو جاری رکھیں گے۔'
        : "Of course — let's take a break. We'll continue whenever you're ready.");
    transcript.push({ role: 'ai', content: message, phase: phaseId, timestamp: now() });
    transcript.push({ role: 'event', content: 'break', phase: phaseId, timestamp: now() });
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        transcript: JSON.parse(JSON.stringify(transcript)),
        liveNotes: JSON.parse(JSON.stringify(liveNotes)),
        exchangeCount,
      },
    });
    return { action: 'break', utterance: message, phaseId, phaseIndex, status: 'in_progress' };
  }

  // ── Confirm stop (witness asked to end — confirm once, without pressure) ──
  if (action === 'confirm_stop') {
    const message =
      decision.question ||
      (language === 'ur'
        ? 'آپ کو کسی بھی وقت رکنے کا پورا حق ہے۔ کیا آپ ابھی ختم کرنا چاہتے ہیں، یا جاری رکھنا چاہیں گے؟'
        : 'You have every right to stop at any time. Would you like to end here, or would you prefer to continue?');
    transcript.push({ role: 'ai', content: message, phase: phaseId, timestamp: now() });
    transcript.push({ role: 'event', content: 'confirm_stop_asked', phase: phaseId, timestamp: now() });
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        transcript: JSON.parse(JSON.stringify(transcript)),
        liveNotes: JSON.parse(JSON.stringify(liveNotes)),
        exchangeCount,
      },
    });
    return { action: 'speak', utterance: message, phaseId, phaseIndex, status: 'in_progress' };
  }

  // ── End (closing complete, or stop confirmed) ──
  if (action === 'end_interview' || (mustAdvance && isClosing)) {
    const witnessStopped = stopAskedBefore && decision.intent === 'stop_request';
    const message =
      decision.question ||
      (language === 'ur'
        ? 'آپ کے وقت اور ہمت کا بہت شکریہ۔ انٹرویو مکمل ہو گیا ہے۔'
        : 'Thank you for your time and your courage. The interview is now complete.');
    transcript.push({ role: 'ai', content: message, phase: phaseId, timestamp: now() });
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        transcript: JSON.parse(JSON.stringify(transcript)),
        liveNotes: JSON.parse(JSON.stringify(liveNotes)),
        exchangeCount,
      },
    });
    return {
      action: 'end',
      utterance: message,
      phaseId,
      phaseIndex,
      status: 'in_progress',
      endReason: witnessStopped ? 'witness_stopped' : 'closing_complete',
    };
  }

  // ── Advance phase ──
  if (action === 'advance_phase') {
    const nextId = getNextPhase(phaseId);
    if (!nextId) {
      // No next phase (we're in closing) — end gracefully
      const message =
        language === 'ur'
          ? 'آپ کے وقت اور ہمت کا بہت شکریہ۔ انٹرویو مکمل ہو گیا ہے۔'
          : 'Thank you for your time and your courage. The interview is now complete.';
      transcript.push({ role: 'ai', content: message, phase: phaseId, timestamp: now() });
      await prisma.interview.update({
        where: { id: interviewId },
        data: {
          transcript: JSON.parse(JSON.stringify(transcript)),
          liveNotes: JSON.parse(JSON.stringify(liveNotes)),
          exchangeCount,
        },
      });
      return {
        action: 'end',
        utterance: message,
        phaseId,
        phaseIndex,
        status: 'in_progress',
        endReason: 'closing_complete',
      };
    }

    const nextConfig = getPhaseById(nextId);
    const transition = decision.question || ack(language);
    const opening = language === 'ur' ? nextConfig.openingPromptUr : nextConfig.openingPrompt;
    const utterance = `${transition} ${opening}`.trim();
    transcript.push({ role: 'ai', content: utterance, phase: nextId, timestamp: now() });
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        transcript: JSON.parse(JSON.stringify(transcript)),
        liveNotes: JSON.parse(JSON.stringify(liveNotes)),
        currentPhase: nextId,
        exchangeCount: 0,
      },
    });
    return {
      action: 'speak',
      utterance,
      phaseId: nextId,
      phaseIndex: phaseIndexOf(nextId),
      status: 'in_progress',
    };
  }

  // ── Ask (the normal case) — validator gate before anything is spoken ──
  let question = decision.question?.trim() || fallbackProbe(language);
  try {
    question = await validateAndRefine(
      question,
      transcript.filter((t) => t.role !== 'event')
    );
  } catch (err) {
    // Validator is defense-in-depth; its outage must not end the interview.
    console.warn('[engine] validator unavailable, using unvalidated question:', err);
  }

  transcript.push({ role: 'ai', content: question, phase: phaseId, timestamp: now() });
  await prisma.interview.update({
    where: { id: interviewId },
    data: {
      transcript: JSON.parse(JSON.stringify(transcript)),
      liveNotes: JSON.parse(JSON.stringify(liveNotes)),
      exchangeCount,
    },
  });
  return { action: 'speak', utterance: question, phaseId, phaseIndex, status: 'in_progress' };
}

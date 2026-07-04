import Groq from 'groq-sdk';

export const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Robustly parse JSON out of an LLM response (tolerates fences/preamble).
export function parseLlmJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// JSON completion with graceful degradation: strict JSON mode first; if Groq
// rejects the generation (json_validate_failed) or JSON mode itself errors,
// retry once in plain mode and let parseLlmJson salvage the object.
export async function jsonCompletion(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  maxTokens: number,
  temperature?: number
): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      ...(temperature !== undefined && { temperature }),
      response_format: { type: 'json_object' },
      messages,
    });
    return completion.choices[0]?.message?.content ?? '';
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status !== 400) throw err; // rate limits / auth / outages propagate
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      max_tokens: maxTokens,
      ...(temperature !== undefined && { temperature }),
      messages,
    });
    return completion.choices[0]?.message?.content ?? '';
  }
}

// ─── The Interviewer Decision Engine ─────────────────────────────────────────
//
// One call per turn. The model receives the full interview state and must
// return a single JSON decision: what to do next (ask / advance / break /
// escalate / end), what to say, a safety read of the witness's last utterance,
// and a one-line internal assessment for the officer's record.

export const INTERVIEWER_DECISION_SYSTEM_PROMPT = `You are Themis, a forensic AI interviewer conducting a structured investigative interview using the NICHD Protocol (Lamb et al., 2007) and the Cognitive Interview method (Fisher & Geiselman, 1992). You interview crime victims and witnesses with no human present. You are calm, patient, warm but professional, and you never rush.

YOUR ABSOLUTE RULES:
1. You may ONLY ask about details the witness has already mentioned. Never introduce new specifics (names, objects, colors, times, places) the witness has not said themselves.
2. Open-ended invitations first ("Tell me everything about...", "What happened then?"). Focused probes only after free recall on that point is exhausted.
3. One question at a time. Never compound questions.
4. Briefly acknowledge what the witness said before asking the next question ("Thank you." / "I understand."; never evaluative praise).
5. Never reference the police report or case file. That context helps you understand relevance only; it must never supply facts to the witness.
6. Never express disbelief, surprise, or approval ("Really?", "Are you sure?", "Great answer").
7. Avoid all dangerous question types: presupposition, forced choice, detail insertion, verb loading, confirmation pressure, authority pressure, temporal compression, acquiescence traps, misinformation embedding, closure pressure.
8. Match the witness's language exactly. If the interview language is Urdu, everything you say must be in simple, respectful Pakistani Urdu with no legal jargon.
9. Respect collectivist cultural context: never phrase anything so that the witness feels obligated to agree with you.
10. Only quote the witness's exact words back when inviting elaboration ("You said '...'. Tell me more about that.").
11. Never use em dashes in anything you speak. Use commas or separate sentences instead.

SAFETY MONITORING: evaluate the witness's most recent utterance every turn:
- distress_level: "none" | "mild" (upset but engaged) | "elevated" (crying, struggling to continue, asking to slow down) | "critical" (panic, dissociation, unable to continue)
- ongoing_danger: true if the witness indicates they are CURRENTLY unsafe (threats, perpetrator access, fear of returning home)
- self_harm_risk: true if any indication of self-harm or suicidal ideation
If distress is "elevated", strongly prefer action "offer_break". If distress is "critical" OR ongoing_danger OR self_harm_risk is true, you MUST choose action "escalate".
A calm, clear request to stop or take a break is NOT distress; mark distress_level "none" or "mild" and handle it with "confirm_stop" or "offer_break". Reserve "critical" for panic, dissociation, or inability to continue.

INTENT CLASSIFICATION: classify what the witness's last utterance actually was:
- "answer": a substantive response to your question
- "break_request": they want to pause ("I need a break", "can we stop for a minute", "مجھے وقفہ چاہیے")
- "repeat_request": they didn't hear/understand and want the question again
- "stop_request": they want to end the interview entirely ("I don't want to continue", "میں مزید نہیں کرنا چاہتا")
- "process_question": they asked about how this works ("who sees this?", "how long will it take?"); answer briefly and neutrally, then gently return to the current question
- "unclear": empty, garbled, or off-topic

ACTIONS you may choose:
- "ask": speak the next question or prompt (the normal case)
- "advance_phase": the current phase's purpose is fulfilled; move to the next phase. Only when the phase minimum is met and the witness's free recall in this phase is genuinely exhausted.
- "offer_break": offer a pause, warmly. Use for break_request or elevated distress.
- "escalate": STOP the interview for safety. Use for critical distress, ongoing danger, or self-harm risk. Your message must be brief, warm, and reassuring; help is being arranged.
- "confirm_stop": the witness asked to stop and has NOT yet been asked to confirm. Remind them gently that they have the right to stop at any time and ask once, without any pressure, whether they'd like to stop now or continue.
- "end_interview": the closing phase is complete, OR the witness confirmed stopping after a confirm_stop. Speak a brief, non-pressuring thank-you and closing.

PHASE DISCIPLINE:
You are told the current phase, its purpose, how many exchanges have occurred in it, and its minimum/maximum. Respect the phase's purpose strictly (e.g. never touch case substance during rapport or narrative practice). If "must_advance" is true you MUST choose "advance_phase" (or "end_interview" if in closing). If "may_advance" is false you may NOT advance.
When you choose "advance_phase", also provide in "question" a one-sentence warm transition in the witness's language (the system will speak the next phase's scripted opening after it).

OUTPUT: respond with ONLY a valid JSON object, no markdown, exactly this shape:
{
  "safety": {"distress_level": "none|mild|elevated|critical", "ongoing_danger": false, "self_harm_risk": false, "note": "one short sentence"},
  "intent": "answer|break_request|repeat_request|stop_request|process_question|unclear",
  "action": "ask|advance_phase|offer_break|escalate|confirm_stop|end_interview",
  "question": "exactly what to speak aloud to the witness, in their language",
  "assessment": {"note": "one-sentence internal observation about this response for the investigating officer (specificity, consistency, demeanor signals); never a truthfulness verdict", "signals": ["short_tag", "..."]}
}`;

export function buildDecisionPrompt({
  phase,
  phaseDescription,
  exchangeCount,
  minExchanges,
  maxExchanges,
  mayAdvance,
  mustAdvance,
  stopAlreadyConfirmedOnce,
  transcript,
  caseContext,
  previousInterviews,
  language,
  latestUtterance,
}: {
  phase: string;
  phaseDescription: string;
  exchangeCount: number;
  minExchanges: number;
  maxExchanges: number;
  mayAdvance: boolean;
  mustAdvance: boolean;
  stopAlreadyConfirmedOnce: boolean;
  transcript: Array<{ role: string; content: string }>;
  caseContext: string;
  previousInterviews: string;
  language: 'en' | 'ur';
  latestUtterance: string;
}): string {
  const transcriptText = transcript
    .slice(-40)
    .map((t) => `${t.role === 'ai' ? 'Interviewer' : t.role === 'witness' ? 'Witness' : 'System'}: ${t.content}`)
    .join('\n');

  return `Case context (do NOT share any of this with the witness):
${caseContext}

Previous interview reports for this witness (do NOT share with the witness):
${previousInterviews || 'None; this is the first interview.'}

CURRENT PHASE: ${phase}; ${phaseDescription}
Exchanges in this phase: ${exchangeCount} (minimum ${minExchanges}, maximum ${maxExchanges})
may_advance: ${mayAdvance}
must_advance: ${mustAdvance}
Witness language: ${language === 'ur' ? 'Urdu; everything you speak must be in simple Pakistani Urdu' : 'English'}
${stopAlreadyConfirmedOnce ? 'NOTE: The witness previously asked to stop and you already asked them to confirm. If this utterance confirms they want to stop, choose "end_interview". If they want to continue, continue normally.' : ''}

Transcript so far:
${transcriptText || '(none yet)'}

The witness's most recent utterance (classify intent and safety on THIS):
"${latestUtterance}"

Respond with the JSON decision object only.`;
}

// ─── Prompt: Question Validator ───────────────────────────────────────────────

export const QUESTION_VALIDATOR_SYSTEM_PROMPT = `You are a forensic interview quality controller trained on Loftus & Palmer (1974), the NICHD Protocol (Lamb et al., 2007), and Fisher & Geiselman's Cognitive Interview framework.

Evaluate whether the following question contains any of these dangerous types:

1. PRESUPPOSITION: assumes a fact not yet established by the witness
2. FORCED_CHOICE: binary options that exclude the witness's actual answer
3. DETAIL_INSERTION: introduces specific detail (person, object, color, time) not mentioned by witness
4. VERB_INTENSITY_LOADING: uses emotionally loaded verbs implying severity or intent not established
5. CONFIRMATION_PRESSURE: phrasing implies the witness should confirm something
6. AUTHORITY_PRESSURE: invokes legal consequence or urgency to coerce
7. TEMPORAL_COMPRESSION: forces a sequence before witness has offered one
8. ACQUIESCENCE_TRAP: phrased so that agreeing = confirming interviewer's version
9. MISINFORMATION_EMBEDDING: uses details from the police report as if established by witness
10. CLOSURE_PRESSURE: rushes or signals the interview is almost done

Respond ONLY as valid JSON with no markdown formatting:
{"safe":true,"flags":[],"reason":"brief explanation","suggested_rewrite":"safer version if unsafe"}`;

export function buildValidatorPrompt({
  question,
  transcript,
}: {
  question: string;
  transcript: Array<{ role: string; content: string }>;
}): string {
  const witnessStatements = transcript
    .filter((t) => t.role === 'witness')
    .map((t) => t.content)
    .join('\n');

  return `Transcript so far (what the witness has actually said):
${witnessStatements || '(No witness statements yet.)'}

Question to evaluate:
${question}`;
}

// ─── Prompt: Linguistic Analysis ──────────────────────────────────────────────

export const LINGUISTIC_ANALYSIS_SYSTEM_PROMPT = `You are a forensic linguistic analyst. Analyze this interview transcript and identify the following markers. Do NOT make moral judgments. Flag patterns only. Output structured JSON.

Analyze for:

1. HEDGING_LANGUAGE: excessive qualifiers ("I think", "maybe", "possibly", "I'm not sure but") concentrated in specific parts of the account
2. OVER_SPECIFICITY: unusual detail precision in areas where generic recall would be expected (exact time, exact color, exact words)
3. UNDER_SPECIFICITY: conspicuous vagueness in areas where detail would be natural
4. TIMELINE_INCONSISTENCY: internal contradictions in the sequence of events within this interview
5. FORMULAIC_LANGUAGE: scripted-sounding phrases repeated verbatim across different parts of the account
6. EMOTIONAL_MISMATCH: tone/emotional language inconsistent with reported events
7. SPONTANEOUS_CORRECTIONS: witness self-corrects without being prompted (positive indicator for truthfulness)
8. UNPROMPTED_DETAIL: witness volunteers peripheral details not asked about (positive indicator)

Also compare against previous interview transcripts if provided and flag:
9. CROSS_INTERVIEW_CONTRADICTION: specific factual claims that directly contradict claims from previous interviews

Respond ONLY as valid JSON with no markdown formatting:
{"linguisticFlags":[{"type":"HEDGING_LANGUAGE","severity":"low|medium|high","evidence":"exact quote","note":"brief context"}],"contradictions":[{"claim_interview_1":"...","claim_interview_2":"...","topic":"...","severity":"minor|significant|major"}],"positiveIndicators":[],"overallConsistencyScore":75,"summaryNote":"one paragraph"}

overallConsistencyScore must be an INTEGER from 0 to 100 (e.g. 75; never a decimal fraction).`;

export function buildAnalysisPrompt({
  transcript,
  previousTranscripts,
  language,
}: {
  transcript: Array<{ role: string; content: string }>;
  previousTranscripts: Array<Array<{ role: string; content: string }>>;
  language: string;
}): string {
  const transcriptText = transcript
    .map((t) => `${t.role === 'ai' ? 'Interviewer' : 'Witness'}: ${t.content}`)
    .join('\n');

  const prevText = previousTranscripts
    .map(
      (pt, i) =>
        `--- Interview ${i + 1} ---\n` +
        pt
          .map((t) => `${t.role === 'ai' ? 'Interviewer' : 'Witness'}: ${t.content}`)
          .join('\n')
    )
    .join('\n\n');

  return `Witness language: ${language}

Transcript (current interview):
${transcriptText}

Previous interviews:
${prevText || 'None; this is the first interview.'}`;
}

// ─── Prompt: Report Writing ───────────────────────────────────────────────────

export const REPORT_SUMMARY_SYSTEM_PROMPT = `You are a forensic report writer for the Themis interview platform. Produce a clean, factual, third-person summary of a witness interview. Do not editorialize. Do not make inferences beyond what the witness said. Output only the summary prose; no headings, no JSON, no preamble. 2-4 paragraphs.`;

export function buildReportSummaryPrompt({
  transcript,
  caseMetadata,
}: {
  transcript: Array<{ role: string; content: string }>;
  caseMetadata: string;
}): string {
  const transcriptText = transcript
    .map((t) => `${t.role === 'ai' ? 'Interviewer' : 'Witness'}: ${t.content}`)
    .join('\n');

  return `Case metadata: ${caseMetadata}

Interview transcript:
${transcriptText}`;
}

export const FOLLOW_UP_QUESTIONS_SYSTEM_PROMPT = `You are a forensic interview supervisor. Based on the completed interview transcript and any contradiction flags, generate 3-5 recommended follow-up questions for the next interview session. These must be open-ended, non-leading, and based only on ambiguities or gaps in the witness's own account. Respond ONLY as a valid JSON object with no markdown formatting: {"questions":["...","..."]}`;

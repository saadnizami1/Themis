import {
  LINGUISTIC_ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
  FOLLOW_UP_QUESTIONS_SYSTEM_PROMPT,
  parseLlmJson,
  jsonCompletion,
} from './ai';

export interface LinguisticFlag {
  type: string;
  severity: 'low' | 'medium' | 'high';
  evidence: string;
  note: string;
}

export interface Contradiction {
  claim_interview_1: string;
  claim_interview_2: string;
  topic: string;
  severity: 'minor' | 'significant' | 'major';
}

export interface AnalysisResult {
  linguisticFlags: LinguisticFlag[];
  contradictions: Contradiction[];
  positiveIndicators: string[];
  overallConsistencyScore: number;
  summaryNote: string;
}

export async function runLinguisticAnalysis({
  transcript,
  previousTranscripts,
  language,
}: {
  transcript: Array<{ role: string; content: string }>;
  previousTranscripts: Array<Array<{ role: string; content: string }>>;
  language: string;
}): Promise<AnalysisResult> {
  const raw = await jsonCompletion(
    [
      { role: 'system', content: LINGUISTIC_ANALYSIS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildAnalysisPrompt({ transcript, previousTranscripts, language }),
      },
    ],
    2048
  );
  const parsed = parseLlmJson<AnalysisResult>(raw);

  if (!parsed) {
    return {
      linguisticFlags: [],
      contradictions: [],
      positiveIndicators: [],
      overallConsistencyScore: 0,
      summaryNote: 'Analysis could not be completed due to a parsing error.',
    };
  }

  // Normalize: some model outputs return the score as a 0–1 fraction
  let score = Number(parsed.overallConsistencyScore) || 0;
  if (score > 0 && score <= 1) score = score * 100;
  parsed.overallConsistencyScore = Math.round(Math.min(100, Math.max(0, score)));

  return parsed;
}

export async function generateFollowUpQuestions(
  transcript: Array<{ role: string; content: string }>,
  contradictions: Contradiction[]
): Promise<string[]> {
  const transcriptText = transcript
    .map((t) => `${t.role === 'ai' ? 'Q' : 'A'}: ${t.content}`)
    .join('\n');

  const contradictionText =
    contradictions.length > 0
      ? contradictions
          .map((c) => `- Topic: ${c.topic}\n  Interview 1: ${c.claim_interview_1}\n  Interview 2: ${c.claim_interview_2}`)
          .join('\n')
      : 'No contradictions found.';

  const raw = await jsonCompletion(
    [
      { role: 'system', content: FOLLOW_UP_QUESTIONS_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Transcript:\n${transcriptText}\n\nContradictions:\n${contradictionText}`,
      },
    ],
    512
  );
  const parsed = parseLlmJson<{ questions: string[] }>(raw);
  return parsed?.questions ?? [];
}

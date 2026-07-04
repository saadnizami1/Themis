import {
  groq,
  GROQ_MODEL,
  REPORT_SUMMARY_SYSTEM_PROMPT,
  buildReportSummaryPrompt,
} from './ai';
import type { AnalysisResult } from './linguistic-analysis';

export async function generateVictimStatementSummary(
  transcript: Array<{ role: string; content: string }>,
  caseMetadata: string
): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: REPORT_SUMMARY_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildReportSummaryPrompt({ transcript, caseMetadata }),
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? '';
}

export function formatTranscriptForReport(
  transcript: Array<{ role: string; content: string; timestamp?: string }>
): string {
  return transcript
    .map((t, i) => {
      const speaker = t.role === 'ai' ? 'Interviewer' : 'Witness';
      const ts = t.timestamp ? ` [${t.timestamp}]` : '';
      return `[${i + 1}] ${speaker}${ts}:\n${t.content}`;
    })
    .join('\n\n');
}

export function formatFlagsForReport(flags: AnalysisResult['linguisticFlags']): string {
  if (!flags || flags.length === 0) return 'No linguistic flags identified.';
  return flags
    .map(
      (f) =>
        `• ${f.type} [${f.severity.toUpperCase()}]\n  Evidence: "${f.evidence}"\n  Note: ${f.note}`
    )
    .join('\n\n');
}

export function formatContradictionsForReport(
  contradictions: AnalysisResult['contradictions']
): string {
  if (!contradictions || contradictions.length === 0)
    return 'No cross-interview contradictions detected.';
  return contradictions
    .map(
      (c) =>
        `• Topic: ${c.topic} [${c.severity.toUpperCase()}]\n  Interview 1 stated: "${c.claim_interview_1}"\n  Interview 2 stated: "${c.claim_interview_2}"`
    )
    .join('\n\n');
}

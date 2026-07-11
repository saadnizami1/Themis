import { prisma } from './prisma';
import { runLinguisticAnalysis, generateFollowUpQuestions } from './linguistic-analysis';
import { generateVictimStatementSummary } from './report-generator';
import type { TranscriptEntry } from './interview-engine';

// The analysis pipeline that turns a transcript into the officer's report
// data. Shared by the normal completion path and by lazy finalization of
// expired interviews, so a session that was never concluded still yields a
// report from whatever took place.

interface InterviewForAnalysis {
  id: string;
  caseId: string;
  interviewNumber: number;
  language: string;
  status: string;
  transcript: unknown;
  case: { caseNumber: string; incidentType: string };
}

export async function analyzeAndStore(
  interview: InterviewForAnalysis,
  finalStatus: string,
  endReason?: string,
  completedAt: Date = new Date()
) {
  const transcript = (((interview.transcript as unknown as TranscriptEntry[]) || []) as TranscriptEntry[])
    .filter((e) => e.role !== 'event');

  // Previous completed interviews in the case, for cross-interview analysis.
  const prevInterviews = await prisma.interview.findMany({
    where: {
      caseId: interview.caseId,
      id: { not: interview.id },
      status: 'completed',
    },
    orderBy: { interviewNumber: 'asc' },
    select: { transcript: true, interviewNumber: true },
  });
  const previousTranscripts = prevInterviews
    .map((pi) => pi.transcript as unknown as TranscriptEntry[] | null)
    .filter((t): t is TranscriptEntry[] => t !== null)
    .map((t) => t.filter((e) => e.role !== 'event'));

  // If the AI provider is down, finalize anyway; the transcript is safe and
  // the analysis can be regenerated later.
  let analysis;
  let followUpQuestions: string[] = [];
  let statementSummary = '';
  try {
    analysis = await runLinguisticAnalysis({
      transcript,
      previousTranscripts,
      language: interview.language,
    });
    followUpQuestions = await generateFollowUpQuestions(transcript, analysis.contradictions);
    const caseMetadata = `Case ${interview.case.caseNumber}, ${interview.case.incidentType}. Interview ${interview.interviewNumber}.`;
    statementSummary = await generateVictimStatementSummary(transcript, caseMetadata);
  } catch (err) {
    console.error('[finalize] analysis pipeline failed, finalizing without it:', err);
    analysis = {
      linguisticFlags: [],
      contradictions: [],
      positiveIndicators: [],
      overallConsistencyScore: 0,
      summaryNote:
        'Automatic analysis was unavailable when this interview ended. The transcript is complete and safe.',
    };
  }

  const flagsJson = JSON.parse(JSON.stringify(analysis)) as object;
  const contradictionsJson = JSON.parse(
    JSON.stringify({ items: analysis.contradictions, followUpQuestions, statementSummary, endReason })
  ) as object;

  await prisma.interview.update({
    where: { id: interview.id },
    data: {
      status: finalStatus,
      completedAt,
      linguisticFlags: flagsJson,
      contradictions: contradictionsJson,
    },
  });

  return analysis;
}

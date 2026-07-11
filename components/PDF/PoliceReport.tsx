import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { AnalysisResult } from '@/lib/linguistic-analysis';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#111', lineHeight: 1.5 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '2px solid #b91c1c',
    paddingBottom: 10,
    marginBottom: 16,
  },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#b91c1c' },
  confidential: { fontSize: 9, color: '#b91c1c', marginTop: 2 },
  sectionHeader: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f3f4f6',
    padding: '4 6',
    marginTop: 16,
    marginBottom: 6,
  },
  body: { fontSize: 10, marginBottom: 3, lineHeight: 1.5 },
  bullet: { fontSize: 10, marginBottom: 2, marginLeft: 12 },
  contradictionRow: {
    marginBottom: 6,
    backgroundColor: '#fff7f7',
    padding: 6,
    borderLeft: '3px solid #ef4444',
  },
  followUpItem: {
    marginBottom: 4,
    padding: '4 8',
    backgroundColor: '#f0fdf4',
    borderLeft: '3px solid #22c55e',
  },
  transcriptEntry: { marginBottom: 6 },
  speaker: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#374151' },
  utterance: { fontSize: 9, marginLeft: 6, color: '#111' },
});

interface PoliceReportProps {
  interview: {
    id: string;
    interviewNumber: number;
    language: string;
    victimName?: string | null;
    victimAge?: number | null;
    status: string;
    completedAt?: Date | string | null;
    createdAt: Date | string;
    transcript?: Array<{ role: string; content: string; phase?: string; timestamp?: string }> | null;
    linguisticFlags?: AnalysisResult | null;
    escalation?: Array<{
      at: string;
      reason: string;
      distressLevel: string;
      ongoingDanger: boolean;
      selfHarmRisk: boolean;
    }> | null;
    contradictions?: {
      items?: AnalysisResult['contradictions'];
      statementSummary?: string;
      followUpQuestions?: string[];
    } | null;
  };
  caseData: {
    caseNumber: string;
    incidentType: string;
    description: string;
  };
  officerName: string;
}

export function PoliceReport({ interview, caseData, officerName }: PoliceReportProps) {
  const transcript =
    (interview.transcript as Array<{ role: string; content: string; phase?: string; timestamp?: string }>) || [];
  const analysis = interview.linguisticFlags as AnalysisResult | null;
  const contraData = interview.contradictions as {
    items?: AnalysisResult['contradictions'];
    statementSummary?: string;
    followUpQuestions?: string[];
  } | null;
  const contradictions = contraData?.items || [];
  const followUp = contraData?.followUpQuestions || [];

  const witnessStatements = transcript.filter((e) => e.role === 'witness');
  const durationMs = interview.completedAt && interview.createdAt
    ? new Date(interview.completedAt).getTime() - new Date(interview.createdAt).getTime()
    : null;
  const durationMin = durationMs ? Math.round(durationMs / 60000) : null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>THEMIS, INTERNAL POLICE REPORT</Text>
            <Text style={styles.confidential}>CONFIDENTIAL, NOT FOR COURT SUBMISSION</Text>
          </View>
          <View>
            <Text style={styles.body}>Case: {caseData.caseNumber}</Text>
            <Text style={styles.body}>Interview: #{interview.interviewNumber}</Text>
            <Text style={styles.body}>Officer: {officerName}</Text>
          </View>
        </View>

        {/* Case Summary */}
        <Text style={styles.sectionHeader}>1. Case Summary</Text>
        <Text style={styles.body}>Incident Type: {caseData.incidentType}</Text>
        <Text style={styles.body}>Officer Description: {caseData.description}</Text>

        {/* Interview Status */}
        <Text style={styles.sectionHeader}>2. Interview Status</Text>
        <Text style={styles.body}>
          Status:{' '}
          {{
            completed: 'Completed in full',
            terminated: 'Ended early at the witness request',
            escalated: 'Paused by safety escalation',
            expired: 'Link expired before completion (partial record)',
            in_progress: 'In progress',
            pending: 'Pending',
          }[interview.status] || interview.status}
        </Text>
        <Text style={styles.body}>Language: {interview.language === 'ur' ? 'Urdu' : 'English'}</Text>
        <Text style={styles.body}>
          Duration: {durationMin !== null ? `${durationMin} minutes` : 'N/A'}
        </Text>
        <Text style={styles.body}>Total exchanges: {witnessStatements.length}</Text>

        {/* Safety escalation record */}
        {interview.escalation && interview.escalation.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>SAFETY ESCALATION RECORD</Text>
            {interview.escalation.map((e, i) => (
              <View key={i} style={styles.contradictionRow}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                  {new Date(e.at).toLocaleString()}, distress: {e.distressLevel}
                  {e.ongoingDanger ? ', ONGOING DANGER REPORTED' : ''}
                  {e.selfHarmRisk ? ', SELF-HARM RISK' : ''}
                </Text>
                <Text style={styles.body}>{e.reason}</Text>
              </View>
            ))}
            <Text style={[styles.body, { color: '#b91c1c' }]}>
              The AI paused this interview for the witness&apos;s safety. Follow departmental
              safeguarding procedure and contact the witness directly.
            </Text>
          </>
        )}

        {/* Key Facts */}
        <Text style={styles.sectionHeader}>3. Key Facts Mentioned by Witness</Text>
        {witnessStatements.slice(0, 12).map((s, i) => (
          <Text key={i} style={styles.bullet}>• {s.content.trim()}</Text>
        ))}
        {witnessStatements.length > 12 && (
          <Text style={[styles.body, { color: '#555' }]}>
            ({witnessStatements.length - 12} additional responses, see full transcript)
          </Text>
        )}

        {/* Contradictions */}
        <Text style={styles.sectionHeader}>4. Contradiction Flags</Text>
        {contradictions.length > 0 ? (
          contradictions.map((c, i) => (
            <View key={i} style={styles.contradictionRow}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                {c.topic} [{c.severity.toUpperCase()}]
              </Text>
              <Text style={styles.body}>Interview 1: &quot;{c.claim_interview_1}&quot;</Text>
              <Text style={styles.body}>Interview 2: &quot;{c.claim_interview_2}&quot;</Text>
            </View>
          ))
        ) : (
          <Text style={styles.body}>No contradictions detected in this interview.</Text>
        )}

        {/* Linguistic Flags Summary */}
        {analysis && analysis.linguisticFlags.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>5. Linguistic Indicator Summary</Text>
            {analysis.linguisticFlags.map((f, i) => (
              <Text key={i} style={styles.bullet}>
                • {f.type.replace(/_/g, ' ')} [{f.severity}]: {f.evidence.slice(0, 80)}{f.evidence.length > 80 ? '...' : ''}
              </Text>
            ))}
            <Text style={[styles.body, { color: '#555', fontStyle: 'italic', marginTop: 4 }]}>
              Consistency score: {analysis.overallConsistencyScore}/100
            </Text>
          </>
        )}

        {/* Recommended Follow-Up Questions */}
        {followUp.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>
              {analysis && analysis.linguisticFlags.length > 0 ? '6' : '5'}. Recommended Follow-Up Questions
            </Text>
            {followUp.map((q, i) => (
              <View key={i} style={styles.followUpItem}>
                <Text style={styles.body}>{i + 1}. {q}</Text>
              </View>
            ))}
          </>
        )}

        {/* Raw Transcript */}
        <Text style={styles.sectionHeader}>
          {(followUp.length > 0 ? (analysis && analysis.linguisticFlags.length > 0 ? 7 : 6) : (analysis && analysis.linguisticFlags.length > 0 ? 6 : 5))}. Raw Transcript
        </Text>
        {transcript.map((entry, i) => (
          <View key={i} style={styles.transcriptEntry}>
            <Text style={styles.speaker}>
              [{entry.role === 'ai' ? 'Q' : 'A'}]
              {entry.timestamp ? ` ${new Date(entry.timestamp).toLocaleTimeString()}` : ''}:
            </Text>
            <Text style={styles.utterance}>{entry.content}</Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}

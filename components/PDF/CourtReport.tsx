import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import type { AnalysisResult } from '@/lib/linguistic-analysis';

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1a1a1a',
    lineHeight: 1.5,
  },
  cover: {
    marginBottom: 32,
    borderBottom: '2px solid #1e3a5f',
    paddingBottom: 16,
  },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#1e3a5f', marginBottom: 8 },
  subtitle: { fontSize: 11, color: '#444', marginBottom: 4 },
  sectionHeader: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1e3a5f',
    marginTop: 20,
    marginBottom: 6,
    borderBottom: '1px solid #ccc',
    paddingBottom: 4,
  },
  body: { fontSize: 10, marginBottom: 4, lineHeight: 1.6 },
  flagRow: {
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
    padding: 6,
    borderLeft: '3px solid #d97706',
  },
  contradictionRow: {
    marginBottom: 8,
    backgroundColor: '#fff5f5',
    padding: 6,
    borderLeft: '3px solid #dc2626',
  },
  positiveRow: {
    marginBottom: 4,
    color: '#15803d',
  },
  disclaimer: {
    marginTop: 32,
    padding: 12,
    backgroundColor: '#f0f0f0',
    fontSize: 9,
    color: '#555',
    lineHeight: 1.5,
  },
  transcriptEntry: {
    marginBottom: 8,
  },
  speaker: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  utterance: { fontSize: 10, marginLeft: 8, lineHeight: 1.5 },
  badge: {
    padding: '2 6',
    borderRadius: 3,
    fontSize: 8,
    marginLeft: 4,
  },
});

interface CourtReportProps {
  interview: {
    id: string;
    interviewNumber: number;
    language: string;
    victimName?: string | null;
    victimAge?: number | null;
    completedAt?: Date | string | null;
    transcript?: Array<{ role: string; content: string; phase?: string; timestamp?: string }> | null;
    linguisticFlags?: AnalysisResult | null;
    contradictions?: {
      items?: AnalysisResult['contradictions'];
      statementSummary?: string;
    } | null;
  };
  caseData: {
    caseNumber: string;
    incidentType: string;
  };
  officerName: string;
  totalInterviews: number;
}

export function CourtReport({ interview, caseData, officerName, totalInterviews }: CourtReportProps) {
  const transcript =
    (interview.transcript as Array<{ role: string; content: string; timestamp?: string }>) || [];
  const analysis = interview.linguisticFlags as AnalysisResult | null;
  const contraData = interview.contradictions as {
    items?: AnalysisResult['contradictions'];
    statementSummary?: string;
  } | null;
  const contradictions = contraData?.items || [];
  const statementSummary = contraData?.statementSummary || '';

  const completedDate = interview.completedAt
    ? new Date(interview.completedAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cover */}
        <View style={styles.cover}>
          <Text style={styles.title}>THEMIS — FORENSIC INTERVIEW REPORT</Text>
          <Text style={styles.subtitle}>FOR COURT USE — CONFIDENTIAL</Text>
          <Text style={styles.body}>Case Number: {caseData.caseNumber}</Text>
          <Text style={styles.body}>Incident Type: {caseData.incidentType}</Text>
          <Text style={styles.body}>
            Interview: {interview.interviewNumber} of {totalInterviews}
          </Text>
          <Text style={styles.body}>Interview Date: {completedDate}</Text>
          <Text style={styles.body}>Reviewing Officer: {officerName}</Text>
          <Text style={styles.body}>
            Witness: {interview.victimName || 'Not provided'}{interview.victimAge ? `, Age ${interview.victimAge}` : ''}
          </Text>
          <Text style={styles.body}>Interview Language: {interview.language === 'ur' ? 'Urdu' : 'English'}</Text>
          <Text style={styles.body}>Interview Reference: {interview.id}</Text>
        </View>

        {/* Methodology */}
        <Text style={styles.sectionHeader}>1. Interview Methodology</Text>
        <Text style={styles.body}>
          This interview was conducted using the NICHD Protocol (Lamb et al., 2007) and the Cognitive Interview
          framework (Fisher & Geiselman, 1992). The interview was administered by an AI system (Themis) via
          text-to-speech question delivery and speech-to-text response capture. No human interviewer was present
          during the questioning phase. Every AI-generated question was screened, prior to being spoken, by an
          independent validation model against ten categories of suggestive questioning derived from the
          eyewitness-suggestibility literature (Loftus & Palmer, 1974). The structured protocol ensures
          open-ended, non-leading questioning with phased progression from rapport-building through substantive
          free recall to clarification.
        </Text>

        {/* Statement Summary */}
        <Text style={styles.sectionHeader}>2. Witness Statement Summary</Text>
        <Text style={styles.body}>{statementSummary || 'Summary not available.'}</Text>

        {/* Linguistic Assessment */}
        <Text style={styles.sectionHeader}>3. Linguistic Consistency Assessment</Text>
        <Text style={[styles.body, { color: '#555', fontStyle: 'italic' }]}>
          Note: The following are computational indicators derived from linguistic pattern analysis.
          They are not clinical diagnoses and must be reviewed by a qualified forensic professional.
        </Text>

        {analysis?.overallConsistencyScore !== undefined && (
          <Text style={[styles.body, { marginTop: 6 }]}>
            Overall Consistency Score: {analysis.overallConsistencyScore}/100
          </Text>
        )}

        {analysis?.positiveIndicators && analysis.positiveIndicators.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.body, { fontFamily: 'Helvetica-Bold' }]}>Positive Indicators:</Text>
            {analysis.positiveIndicators.map((pi, i) => (
              <Text key={i} style={styles.positiveRow}>+ {pi.replace(/_/g, ' ')}</Text>
            ))}
          </View>
        )}

        {analysis?.linguisticFlags && analysis.linguisticFlags.length > 0 ? (
          analysis.linguisticFlags.map((flag, i) => (
            <View key={i} style={styles.flagRow}>
              <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                {flag.type.replace(/_/g, ' ')} — {flag.severity.toUpperCase()}
              </Text>
              <Text style={styles.body}>Evidence: &quot;{flag.evidence}&quot;</Text>
              <Text style={styles.body}>Note: {flag.note}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.body}>No significant linguistic flags identified.</Text>
        )}

        {/* Contradictions */}
        {contradictions.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>4. Cross-Interview Contradictions</Text>
            {contradictions.map((c, i) => (
              <View key={i} style={styles.contradictionRow}>
                <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9 }}>
                  {c.topic} — {c.severity.toUpperCase()}
                </Text>
                <Text style={styles.body}>Interview 1 stated: &quot;{c.claim_interview_1}&quot;</Text>
                <Text style={styles.body}>Interview 2 stated: &quot;{c.claim_interview_2}&quot;</Text>
              </View>
            ))}
          </>
        )}

        {/* Transcript */}
        <Text style={styles.sectionHeader}>{contradictions.length > 0 ? '5' : '4'}. Full Interview Transcript</Text>
        {transcript.map((entry, i) => (
          <View key={i} style={styles.transcriptEntry}>
            <Text style={styles.speaker}>
              {entry.role === 'ai' ? 'INTERVIEWER' : 'WITNESS'}
              {entry.timestamp ? `  [${new Date(entry.timestamp).toLocaleTimeString()}]` : ''}:
            </Text>
            <Text style={styles.utterance}>{entry.content}</Text>
          </View>
        ))}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 4 }}>DISCLAIMER</Text>
          <Text>
            This report was generated by Themis, an AI-assisted forensic interview system. All linguistic
            analysis findings are computational indicators only and are not clinical diagnoses of deception or
            truthfulness. This report must be reviewed by a qualified forensic professional before use in legal
            proceedings. AI-generated content is subject to error and should not be treated as definitive evidence.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

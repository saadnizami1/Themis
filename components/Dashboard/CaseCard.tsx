import Link from 'next/link';
import ContradictionBadge from './ContradictionBadge';

interface Interview {
  id: string;
  status: string;
  interviewNumber: number;
  createdAt: string;
  contradictions: unknown;
}

interface CaseCardProps {
  id: string;
  caseNumber: string;
  incidentType: string;
  createdAt: string;
  interviews: Interview[];
}

function countContradictions(interviews: Interview[]): number {
  let total = 0;
  for (const iv of interviews) {
    const cd = iv.contradictions as { items?: unknown[] } | null;
    if (cd?.items && cd.items.length > 0) total += cd.items.length;
  }
  return total;
}

export default function CaseCard({
  id,
  caseNumber,
  incidentType,
  createdAt,
  interviews,
}: CaseCardProps) {
  const completed = interviews.filter((iv) => iv.status === 'completed').length;
  const total = interviews.length;
  const contradictionCount = countContradictions(interviews);
  const hasEscalation = interviews.some((iv) => iv.status === 'escalated');
  const inProgress = interviews.some((iv) => iv.status === 'in_progress');

  return (
    <Link href={`/dashboard/cases/${id}`} className="block">
      <div
        className={`bg-white border rounded-xl p-5 transition-colors ${
          hasEscalation ? 'border-red-300' : 'border-line hover:border-faint'
        }`}
      >
        <div className="flex items-start justify-between mb-3 gap-3">
          <div className="min-w-0">
            <p className="text-xs text-faint font-mono">{caseNumber}</p>
            <h3 className="text-ink font-medium mt-0.5 truncate">{incidentType}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {hasEscalation && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                Escalated
              </span>
            )}
            <ContradictionBadge count={contradictionCount} />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted flex-wrap">
          <span>
            {total} interview{total !== 1 ? 's' : ''}
          </span>
          <span>{completed} completed</span>
          {inProgress && <span className="text-amber-700 font-medium">live now</span>}
          <span className="ml-auto text-faint">{new Date(createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}

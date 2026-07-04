const styles: Record<string, string> = {
  pending: 'bg-surface text-muted border-line',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
  completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  terminated: 'bg-surface text-muted border-line',
  escalated: 'bg-red-50 text-red-800 border-red-200',
};

const labels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  terminated: 'Ended early',
  escalated: 'Escalated',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || styles.pending
      }`}
    >
      {status === 'escalated' && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
      )}
      {status === 'in_progress' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
      )}
      {labels[status] || status}
    </span>
  );
}

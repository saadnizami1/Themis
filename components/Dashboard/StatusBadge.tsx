const styles: Record<string, { dot: string; text: string; pulse?: boolean }> = {
  pending: { dot: 'bg-faint', text: 'text-muted' },
  in_progress: { dot: 'bg-amber-500', text: 'text-amber-800', pulse: true },
  completed: { dot: 'bg-accent', text: 'text-ink' },
  terminated: { dot: 'bg-faint', text: 'text-muted' },
  escalated: { dot: 'bg-red-600', text: 'text-red-700', pulse: true },
  expired: { dot: 'bg-faint', text: 'text-faint' },
};

const labels: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  terminated: 'Ended early',
  escalated: 'Escalated',
  expired: 'Expired',
};

export default function StatusBadge({ status }: { status: string }) {
  const s = styles[status] || styles.pending;
  return (
    <span
      className={`inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
      {labels[status] || status}
    </span>
  );
}

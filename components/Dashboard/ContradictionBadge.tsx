interface ContradictionBadgeProps {
  count: number;
}

export default function ContradictionBadge({ count }: ContradictionBadgeProps) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
      {count} contradiction{count > 1 ? 's' : ''}
    </span>
  );
}

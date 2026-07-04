interface ContradictionBadgeProps {
  count: number;
}

export default function ContradictionBadge({ count }: ContradictionBadgeProps) {
  if (count === 0) return null;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200">
      {count} contradiction{count > 1 ? 's' : ''}
    </span>
  );
}

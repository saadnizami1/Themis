'use client';

import type { Lang } from '@/lib/translations';
import { t } from '@/lib/translations';
import { PHASES } from '@/lib/interview-phases';

const phaseKeys = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'phase6'] as const;

interface PhaseIndicatorProps {
  currentPhaseIndex: number;
  lang: Lang;
}

export default function PhaseIndicator({ currentPhaseIndex, lang }: PhaseIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-1">
        {PHASES.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-colors duration-500 ${
              i < currentPhaseIndex
                ? 'bg-accent'
                : i === currentPhaseIndex
                ? 'bg-ink'
                : 'bg-line'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs text-faint mt-1.5 ${lang === 'ur' ? 'font-urdu text-right' : ''}`}>
        {t(lang, 'phase')} {currentPhaseIndex + 1} {t(lang, 'of')} {PHASES.length} ·{' '}
        {t(lang, phaseKeys[Math.min(currentPhaseIndex, 5)])}
      </p>
    </div>
  );
}

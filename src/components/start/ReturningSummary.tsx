import { useTheme } from '../../context/ThemeContext';
import { JungleButton } from '../JungleButton';

interface ReturningSummaryProps {
  playerName: string;
  score: number | null;
  recommendedLabel: string;
  recommendedReason: string;
  ctaLabel: string;
  onStart: () => void;
}

export const ReturningSummary = ({
  playerName,
  score,
  recommendedLabel,
  recommendedReason,
  ctaLabel,
  onStart,
}: ReturningSummaryProps) => {
  const { theme } = useTheme();

  return (
    <section
      aria-label="Your GameSpeed"
      data-testid="returning-summary"
      className="rounded-3xl p-4 sm:p-6 backdrop-blur-md"
      style={{
        backgroundColor: 'rgba(6, 12, 18, 0.82)',
        border: `1px solid ${theme.targetColor}55`,
        boxShadow: '0 20px 52px rgba(0, 0, 0, 0.4)',
      }}
    >
      <h1 className="text-sm font-semibold" style={{ color: theme.textColor, opacity: 0.8 }}>
        Welcome back, {playerName}
      </h1>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: theme.textColor, opacity: 0.65 }}>
            GameSpeed Score
          </p>
          <p
            className="font-display mt-1 text-6xl font-black leading-none tabular-nums"
            style={{ color: theme.targetColor }}
            data-testid="returning-score"
          >
            {score ?? '—'}
          </p>
        </div>
        <div className="sm:max-w-sm sm:text-right">
          <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: theme.textColor, opacity: 0.65 }}>
            Recommended session
          </p>
          <p className="mt-1 text-lg font-bold" style={{ color: theme.textColor }}>
            {recommendedLabel}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: theme.textColor, opacity: 0.7 }}>
            {recommendedReason}
          </p>
        </div>
      </div>
      <JungleButton onClick={onStart} className="mt-4 w-full min-h-[52px] px-6 text-base font-bold">
        {ctaLabel}
      </JungleButton>
    </section>
  );
};

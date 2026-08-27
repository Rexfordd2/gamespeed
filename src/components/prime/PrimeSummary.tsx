import { PrimeSummaryMetrics } from '../../types/prime';
import { useTheme } from '../../context/ThemeContext';
import { JungleBackground } from '../JungleBackground';
import { JungleButton } from '../JungleButton';

interface PrimeSummaryProps {
  protocolName: string;
  recipeIdentity?: string;
  summary: PrimeSummaryMetrics;
  onDone: () => void;
}

const MetricCard = ({
  label,
  value,
  textColor,
}: {
  label: string;
  value: string;
  textColor: string;
}) => (
  <div className="rounded-2xl px-3 py-3" style={{ backgroundColor: 'rgba(2, 8, 12, 0.72)' }}>
    <p className="text-[10px] uppercase tracking-[0.14em] opacity-65" style={{ color: textColor }}>
      {label}
    </p>
    <p className="mt-1 text-xl font-extrabold tabular-nums" style={{ color: textColor }}>
      {value}
    </p>
  </div>
);

export const PrimeSummary = ({ protocolName, recipeIdentity, summary, onDone }: PrimeSummaryProps) => {
  const { theme } = useTheme();

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <JungleBackground />
      <main className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col justify-center gap-4 py-4">
        <section
          className="rounded-3xl p-5 sm:p-6"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.92)',
            border: `1px solid ${theme.targetColor}66`,
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: theme.targetColor }}>
            {protocolName}
          </p>
          {recipeIdentity && (
            <p className="mt-1 text-[11px] font-mono opacity-70" style={{ color: theme.textColor }}>
              {recipeIdentity}
            </p>
          )}
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: theme.textColor }}>
            YOU&apos;RE PRIMED
          </h1>
          <p className="mt-2 text-sm" style={{ color: theme.textColor, opacity: 0.78 }}>
            Numbers below come from this session only. No invented readiness claims.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <MetricCard
              label="Duration"
              value={`${summary.totalDurationSeconds}s`}
              textColor={theme.textColor}
            />
            <MetricCard
              label="Steps complete"
              value={`${summary.stepsCompleted}`}
              textColor={theme.textColor}
            />
            {summary.averageAccuracyPct !== null && (
              <MetricCard
                label="Accuracy"
                value={`${summary.averageAccuracyPct}%`}
                textColor={theme.targetColor}
              />
            )}
            {summary.averageReactionMs !== null && (
              <MetricCard
                label="Avg reaction"
                value={`${summary.averageReactionMs} ms`}
                textColor={theme.textColor}
              />
            )}
            {summary.trackingAccuracyPct !== null && (
              <MetricCard
                label="Tracking"
                value={`${summary.trackingAccuracyPct}%`}
                textColor={theme.textColor}
              />
            )}
            {summary.consistencyPct !== null && (
              <MetricCard
                label="Consistency"
                value={`${summary.consistencyPct}%`}
                textColor={theme.textColor}
              />
            )}
            {summary.physicalCue && (
              <MetricCard
                label="Movement cues"
                value={`${summary.physicalCue.presentedCueCount}/${summary.physicalCue.cueCount}`}
                textColor={theme.textColor}
              />
            )}
            {summary.physicalCue && (
              <MetricCard
                label="Cue interval"
                value={`${summary.physicalCue.cueIntervalMs} ms`}
                textColor={theme.textColor}
              />
            )}
          </div>

          {summary.strongestArea && (
            <p className="mt-4 text-sm" style={{ color: theme.textColor, opacity: 0.86 }}>
              Strongest area: {summary.strongestArea.label} ({summary.strongestArea.accuracyPct}%)
            </p>
          )}
          {summary.areaToRevisit && (
            <p className="mt-1 text-sm" style={{ color: theme.textColor, opacity: 0.86 }}>
              Area to revisit: {summary.areaToRevisit.label} ({summary.areaToRevisit.accuracyPct}%)
            </p>
          )}
          {summary.vsPrevious?.accuracyDeltaPct !== null && summary.vsPrevious?.accuracyDeltaPct !== undefined && (
            <p className="mt-3 text-xs" style={{ color: theme.textColor, opacity: 0.7 }}>
              vs your last Prime: {summary.vsPrevious.accuracyDeltaPct > 0 ? '+' : ''}
              {summary.vsPrevious.accuracyDeltaPct} accuracy pts
            </p>
          )}
          {summary.physicalCue && (
            <p className="mt-3 text-xs" style={{ color: theme.textColor, opacity: 0.7 }}>
              {summary.physicalCue.athleteConfirmed
                ? 'Athlete confirmed the movement set. No movement-quality score was recorded.'
                : 'Movement cues were shown. No movement-quality score was recorded.'}
            </p>
          )}
          {summary.stepsSkipped > 0 && (
            <p className="mt-2 text-xs" style={{ color: theme.textColor, opacity: 0.62 }}>
              {summary.stepsSkipped} step{summary.stepsSkipped === 1 ? '' : 's'} skipped
            </p>
          )}

          <JungleButton onClick={onDone} className="mt-6 w-full min-h-14 px-5 py-3 text-lg font-extrabold">
            Done
          </JungleButton>
        </section>
      </main>
    </div>
  );
};

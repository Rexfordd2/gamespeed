import { useTheme } from '../context/ThemeContext';
import { AthleteEvolution, formatTrendValue } from '../utils/athleteEvolution';
import { RAINFOREST_TIERS } from '../config/athleteEvolution';

interface PersonalEvolutionPanelProps {
  evolution: AthleteEvolution;
  compact?: boolean;
}

export const PersonalEvolutionPanel = ({ evolution, compact = false }: PersonalEvolutionPanelProps) => {
  const { theme } = useTheme();
  const cardStyle = {
    backgroundColor: 'rgba(6, 12, 18, 0.76)',
    border: `1px solid ${theme.targetColor}44`,
  };
  const earned = evolution.achievements.filter(item => item.earned);

  return (
    <section aria-label="Personal evolution" className="space-y-4">
      <div className="rounded-2xl p-4" style={cardStyle}>
        <p className="text-[10px] uppercase tracking-[0.16em] opacity-65" style={{ color: theme.textColor }}>
          Rainforest path
        </p>
        <h2 className="mt-1 text-2xl font-extrabold" style={{ color: theme.targetColor }}>
          {evolution.path.current.label}
        </h2>
        <p className="mt-1 text-xs" style={{ color: theme.textColor, opacity: 0.72 }}>
          {evolution.path.progressLabel}
        </p>
        <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Path tiers">
          {RAINFOREST_TIERS.map(tier => {
            const isCurrent = tier.id === evolution.path.current.id;
            return (
              <li
                key={tier.id}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  color: isCurrent ? theme.targetColor : theme.textColor,
                  backgroundColor: isCurrent ? `${theme.targetColor}22` : 'rgba(2, 8, 12, 0.7)',
                  border: `1px solid ${isCurrent ? `${theme.targetColor}99` : `${theme.textColor}28`}`,
                  opacity: isCurrent ? 1 : 0.7,
                }}
              >
                {tier.label}
              </li>
            );
          })}
        </ol>
        <p className="mt-3 text-[11px]" style={{ color: theme.textColor, opacity: 0.62 }}>
          {evolution.path.completedPrimes} completed Prime
          {evolution.path.completedPrimes === 1 ? '' : 's'} · path from training, not XP
        </p>
      </div>

      {!compact && (
        <div className="rounded-2xl p-4" style={cardStyle}>
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-65" style={{ color: theme.textColor }}>
            Versus your baseline
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {evolution.trends.map(trend => (
              <div key={trend.id} className="rounded-xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)' }}>
                <p className="text-xs font-semibold" style={{ color: theme.textColor }}>
                  {trend.label}
                </p>
                <p className="mt-1 text-lg font-black tabular-nums" style={{ color: trend.ready ? theme.targetColor : theme.textColor }}>
                  {formatTrendValue(trend.latest, trend.unit)}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed" style={{ color: theme.textColor, opacity: 0.7 }}>
                  {trend.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!compact && (
        <div className="rounded-2xl p-4" style={cardStyle}>
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-65" style={{ color: theme.textColor }}>
            Instinct mastery
          </p>
          <div className="mt-3 space-y-2">
            {evolution.instincts.map(instinct => (
              <div key={instinct.id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
                    {instinct.experienceName}
                  </p>
                  <p className="text-[11px] opacity-70" style={{ color: theme.textColor }}>
                    {instinct.rounds} completed session{instinct.rounds === 1 ? '' : 's'}
                  </p>
                </div>
                <p className="text-xs font-semibold capitalize" style={{ color: instinct.status === 'trained' ? '#4ade80' : theme.textColor }}>
                  {instinct.status}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl p-4" style={cardStyle}>
        <p className="text-[10px] uppercase tracking-[0.16em] opacity-65" style={{ color: theme.textColor }}>
          Achievements
        </p>
        <p className="mt-1 text-sm" style={{ color: theme.textColor, opacity: 0.78 }}>
          {evolution.earnedCount}/{evolution.achievements.length} earned from completed training
        </p>
        <div className="mt-3 space-y-2.5">
          {(compact ? earned : evolution.achievements).map(item => (
            <div key={item.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
                  {item.title}
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: theme.textColor, opacity: 0.68 }}>
                  {compact ? item.detail : item.description}
                </p>
              </div>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: item.earned ? '#4ade80' : '#facc15' }}
              >
                {item.earned ? 'Earned' : 'Open'}
              </p>
            </div>
          ))}
          {compact && earned.length === 0 && (
            <p className="text-xs" style={{ color: theme.textColor, opacity: 0.68 }}>
              Complete Prime and cognitive instincts to earn marks. Nothing is awarded for opening the app.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

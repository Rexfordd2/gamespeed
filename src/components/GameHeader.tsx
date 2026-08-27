import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

interface GameHeaderProps {
  score: number;
  streak: number;
  timeLeft: number;
  totalTime: number;
  modeName: string;
  abilityLabel?: string;
  onPause: () => void;
  onMainMenu: () => void;
  isPaused: boolean;
  reducedMotion?: boolean;
  labels?: {
    score?: string;
    streak?: string;
  };
}

const IconPause = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
    <rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
  </svg>
);

const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 2.5v11l9-5.5L4 2.5Z" fill="currentColor" />
  </svg>
);

const IconExit = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 3h6v2H5v6h4v2H3V3Z" fill="currentColor" />
    <path d="M8 5.5 12.5 8 8 10.5V9h-3V7h3V5.5Z" fill="currentColor" />
  </svg>
);

export const GameHeader = ({
  score,
  streak,
  timeLeft,
  totalTime,
  modeName,
  abilityLabel,
  onPause,
  onMainMenu,
  isPaused,
  reducedMotion = false,
  labels,
}: GameHeaderProps) => {
  const { theme } = useTheme();
  const timerPct = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));
  const timerColor =
    timerPct > 50 ? theme.targetColor : timerPct > 25 ? '#E8A43A' : '#EF4444';
  const isUrgent = timerPct <= 25;

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 top-0 z-50 px-3 sm:px-4"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div
        className="hud-instrument pointer-events-auto mx-auto mt-2 flex w-full max-w-5xl items-center gap-2 rounded-2xl px-2.5 py-2 sm:mt-3 sm:gap-4 sm:px-4 sm:py-3"
        style={{
          borderColor: `${theme.targetColor}4d`,
          boxShadow: '0 14px 35px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex min-w-[64px] flex-col items-start sm:min-w-[72px]">
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-65 sm:text-xs"
              style={{ color: theme.textColor }}
            >
              {labels?.score ?? 'Score'}
            </span>
            <motion.span
              key={score}
              initial={reducedMotion ? false : { scale: 1.2, color: theme.targetColor }}
              animate={reducedMotion ? { color: theme.textColor } : { scale: 1, color: theme.textColor }}
              transition={{ duration: reducedMotion ? 0 : 0.25 }}
              className="text-lg font-extrabold leading-none tabular-nums sm:text-2xl"
            >
              {score}
            </motion.span>
          </div>

          <div
            className="rounded-lg px-2 py-1 sm:px-2.5"
            style={{
              border: `1px solid ${theme.targetColor}66`,
              backgroundColor: `${theme.targetColor}1f`,
            }}
            aria-live="polite"
            aria-label={`Current streak ${streak}`}
          >
            <span
              className="block text-[9px] font-semibold uppercase tracking-[0.16em] opacity-75 sm:text-[10px]"
              style={{ color: theme.textColor }}
            >
              {labels?.streak ?? 'Streak'}
            </span>
            <motion.span
              key={streak}
              initial={reducedMotion ? false : { y: -5, opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.15 }}
              className="block text-sm font-bold leading-none tabular-nums sm:text-base"
              style={{ color: streak >= 5 ? '#E8A43A' : theme.textColor }}
            >
              {streak}
            </motion.span>
          </div>
        </div>

        <div className="mx-0.5 flex flex-1 flex-col items-center overflow-hidden px-0.5 sm:mx-2 sm:px-4">
          <span
            className="max-w-full truncate font-display text-[11px] font-semibold uppercase tracking-[0.14em] sm:text-sm"
            style={{ color: theme.textColor }}
          >
            {modeName}
          </span>
          {abilityLabel && (
            <span className="text-[9px] uppercase tracking-[0.14em] opacity-55" style={{ color: theme.targetColor }}>
              {abilityLabel}
            </span>
          )}
          <motion.span
            animate={isUrgent && !reducedMotion ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: reducedMotion ? 0 : 0.5, repeat: reducedMotion ? 0 : Infinity }}
            className="mt-0.5 text-base font-bold leading-none tabular-nums sm:text-2xl"
            style={{ color: isUrgent ? '#EF4444' : theme.textColor }}
            aria-live="polite"
          >
            {Math.ceil(timeLeft)}s
          </motion.span>
          <span className="sr-only">{Math.ceil(timeLeft)} seconds remaining</span>
        </div>

        <div className="flex min-w-[94px] items-center justify-end gap-1.5 sm:min-w-[116px] sm:gap-2">
          <button
            type="button"
            onClick={onMainMenu}
            aria-label="Return to main menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2"
            style={{
              border: `1px solid ${theme.textColor}5f`,
              color: theme.textColor,
              backgroundColor: 'rgba(0,0,0,0.24)',
            }}
          >
            <IconExit />
          </button>
          <button
            type="button"
            onClick={onPause}
            aria-label={isPaused ? 'Resume game' : 'Pause game'}
            aria-pressed={isPaused}
            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2"
            style={{
              backgroundColor: `${theme.targetColor}22`,
              border: `1px solid ${theme.targetColor}`,
              color: theme.targetColor,
            }}
          >
            {isPaused ? <IconPlay /> : <IconPause />}
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none mx-auto mt-2 h-1 w-full max-w-5xl overflow-hidden rounded-full"
        style={{ backgroundColor: 'rgba(234,233,223,0.16)' }}
      >
        <motion.div
          className="h-full"
          animate={{ width: `${timerPct}%`, backgroundColor: timerColor }}
          transition={{ duration: 0.4, ease: 'linear' }}
        />
      </div>
    </div>
  );
};

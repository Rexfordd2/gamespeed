import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';

interface GameHeaderProps {
  score: number;
  streak: number;
  timeLeft: number;
  totalTime: number;
  modeName: string;
  onPause: () => void;
  onMainMenu: () => void;
  isPaused: boolean;
}

export const GameHeader = ({
  score,
  streak,
  timeLeft,
  totalTime,
  modeName,
  onPause,
  onMainMenu,
  isPaused,
}: GameHeaderProps) => {
  const { theme } = useTheme();
  const timerPct = Math.max(0, Math.min(100, (timeLeft / totalTime) * 100));

  // Timer bar color: green → yellow → red
  const timerColor =
    timerPct > 50 ? theme.targetColor : timerPct > 25 ? '#facc15' : '#ef4444';

  const isUrgent = timerPct <= 25;

  return (
    <div
      className="absolute top-0 left-0 right-0 z-50 px-3 sm:px-4 pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div
        className="pointer-events-auto mx-auto mt-2 flex w-full max-w-5xl items-center gap-2 rounded-2xl border px-3 py-2.5 sm:mt-3 sm:gap-4 sm:px-4 sm:py-3"
        style={{
          backgroundColor: 'rgba(5, 12, 10, 0.7)',
          borderColor: `${theme.targetColor}4d`,
          boxShadow: '0 14px 35px rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-start min-w-[72px]">
            <span
              className="text-[10px] sm:text-xs font-semibold tracking-[0.18em] uppercase opacity-65"
              style={{ color: theme.textColor }}
            >
              Score
            </span>
            <motion.span
              key={score}
              initial={{ scale: 1.2, color: theme.targetColor }}
              animate={{ scale: 1, color: theme.textColor }}
              transition={{ duration: 0.25 }}
              className="text-xl sm:text-2xl font-extrabold leading-none tabular-nums"
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
              className="block text-[9px] sm:text-[10px] font-semibold tracking-[0.16em] uppercase opacity-75"
              style={{ color: theme.textColor }}
            >
              Streak
            </span>
            <motion.span
              key={streak}
              initial={{ y: -5, opacity: 0.5 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="block text-sm sm:text-base leading-none font-bold tabular-nums"
              style={{ color: streak >= 5 ? '#facc15' : theme.textColor }}
            >
              {streak}
            </motion.span>
          </div>
        </div>

        <div className="mx-1 sm:mx-2 flex flex-1 flex-col items-center overflow-hidden px-1 sm:px-4">
          <span
            className="truncate max-w-full text-[10px] sm:text-xs font-semibold tracking-[0.18em] uppercase opacity-65"
            style={{ color: theme.textColor }}
          >
            {modeName}
          </span>
          <motion.span
            animate={isUrgent ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-lg sm:text-2xl font-bold tabular-nums leading-none mt-0.5"
            style={{ color: isUrgent ? '#ef4444' : theme.textColor }}
            aria-live="polite"
          >
            {Math.ceil(timeLeft)}s
          </motion.span>
          <span className="sr-only">{Math.ceil(timeLeft)} seconds remaining</span>
        </div>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2 min-w-[90px] sm:min-w-[116px]">
          <button
            type="button"
            onClick={onMainMenu}
            aria-label="Return to main menu"
            className="flex items-center justify-center rounded-lg font-bold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2"
            style={{
              width: '36px',
              height: '36px',
              border: `1px solid ${theme.textColor}5f`,
              color: theme.textColor,
              backgroundColor: 'rgba(0,0,0,0.24)',
              fontSize: '15px',
              lineHeight: 1,
            }}
          >
            ⏏
          </button>
          <button
            type="button"
            onClick={onPause}
            aria-label={isPaused ? 'Resume game' : 'Pause game'}
            aria-pressed={isPaused}
            className="flex items-center justify-center rounded-lg font-bold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2"
            style={{
              width: '36px',
              height: '36px',
              backgroundColor: `${theme.targetColor}22`,
              border: `1px solid ${theme.targetColor}`,
              color: theme.targetColor,
              fontSize: '15px',
              lineHeight: 1,
            }}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        </div>
      </div>

      <div
        className="pointer-events-none mx-auto mt-2 h-1 w-full max-w-5xl overflow-hidden rounded-full"
        style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
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

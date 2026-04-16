import { useTheme } from '../context/ThemeContext';
import { JungleButton } from './JungleButton';
import { JungleBackground } from './JungleBackground';
import { GameResult } from '../types/game';
import { motion } from 'framer-motion';

interface EndScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

type Tier = { label: string; color: string; emoji: string };

function getTier(accuracy: number): Tier {
  if (accuracy >= 90) return { label: 'Elite Focus', color: '#4ade80', emoji: '🏆' };
  if (accuracy >= 75) return { label: 'Razor Fast', color: '#a3e635', emoji: '⚡' };
  if (accuracy >= 55) return { label: 'On Track', color: '#facc15', emoji: '🎯' };
  return { label: 'Keep Going', color: '#fb923c', emoji: '💪' };
}

export const EndScreen = ({ result, onPlayAgain, onMainMenu }: EndScreenProps) => {
  const { theme } = useTheme();
  const totalAttempts = result.score + result.misses;
  const accuracy = totalAttempts > 0 ? Math.round((result.score / totalAttempts) * 100) : 0;
  const tier = getTier(accuracy);

  const stats = [
    { label: 'Hits', value: result.score, color: theme.targetColor },
    { label: 'Misses', value: result.misses, color: '#f87171' },
    { label: 'Accuracy', value: `${accuracy}%`, color: tier.color },
    { label: 'Best Streak', value: result.bestStreak, color: '#38bdf8' },
  ];

  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: '100dvh', backgroundColor: theme.backgroundColor }}
    >
      <JungleBackground />

      <div className="relative z-10 flex flex-col items-center w-full max-w-lg mx-auto px-4 sm:px-6 py-7 sm:py-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
          className="flex flex-col items-center mb-5 sm:mb-6"
        >
          <span className="text-5xl sm:text-6xl mb-2" role="img" aria-label={tier.label}>
            {tier.emoji}
          </span>
          <span
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center"
            style={{ color: tier.color, textShadow: `0 0 24px ${tier.color}66` }}
          >
            {tier.label}
          </span>
          <span
            className="text-sm font-semibold tracking-widest uppercase mt-2 opacity-70"
            style={{ color: theme.textColor }}
          >
            {result.modeName}
          </span>
        </motion.div>

        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="w-full rounded-3xl p-5 sm:p-6 mb-7"
          style={{
            background:
              'radial-gradient(circle at top, rgba(255,255,255,0.16), rgba(0,0,0,0.55) 70%)',
            border: `1px solid ${theme.targetColor}55`,
            boxShadow: `0 16px 40px ${theme.targetColor}33`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex flex-col items-center mb-6">
            <span
              className="text-xs font-semibold tracking-widest uppercase opacity-70"
              style={{ color: theme.textColor }}
            >
              Final Score
            </span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.3 }}
              className="text-6xl sm:text-7xl leading-none font-black tabular-nums mt-3"
              style={{
                color: theme.targetColor,
                textShadow: `0 0 30px ${theme.targetColor}88`,
              }}
            >
              {result.score}
            </motion.span>
            <span className="mt-2 text-sm opacity-80" style={{ color: theme.textColor }}>
              {totalAttempts > 0
                ? `${result.score} / ${totalAttempts} targets landed`
                : 'No attempts recorded this round'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                className="rounded-2xl px-3.5 sm:px-4 py-3 flex flex-col"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.36)',
                  border: `1px solid ${s.color}44`,
                }}
              >
                <span
                  className="text-xs font-semibold tracking-widest uppercase opacity-65"
                  style={{ color: theme.textColor }}
                >
                  {s.label}
                </span>
                <span className="text-[1.65rem] sm:text-3xl font-bold tabular-nums mt-1" style={{ color: s.color }}>
                  {s.value}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-3 w-full"
        >
          <JungleButton onClick={onPlayAgain} className="w-full py-4 text-lg font-bold uppercase">
            Replay
          </JungleButton>
          <button
            onClick={onMainMenu}
            className="ui-secondary-button w-full py-3"
            style={{
              color: theme.textColor,
              borderColor: `${theme.textColor}40`,
            }}
          >
            Main Menu
          </button>
        </motion.div>
      </div>
    </div>
  );
};

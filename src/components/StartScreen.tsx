import { useTheme } from '../context/ThemeContext';
import { GameModeSelector } from './GameModeSelector';
import { JungleBackground } from './JungleBackground';
import { GameModeType } from '../types/game';
import { motion } from 'framer-motion';

interface StartScreenProps {
  onStart: (mode: GameModeType) => void;
  onViewStats: () => void;
}

export const StartScreen = ({ onStart, onViewStats }: StartScreenProps) => {
  const { theme } = useTheme();

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <JungleBackground />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(163,230,53,0.14), transparent 45%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.12), transparent 50%), linear-gradient(180deg, rgba(3,8,12,0.68), rgba(2,8,10,0.9))',
        }}
      />

      <motion.div
        className="relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-6xl flex-col justify-center py-4 sm:py-6"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: 'easeOut' }}
      >
        <div className="text-center mb-6 sm:mb-8">
          <span
            className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase mb-3 sm:mb-4"
            style={{
              color: theme.targetColor,
              backgroundColor: `${theme.targetColor}1c`,
              border: `1px solid ${theme.targetColor}66`,
            }}
          >
            Performance Lab
          </span>

          <h1
            className="text-[2.1rem] sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[0.95]"
            style={{
              color: theme.textColor,
              textShadow: `0 8px 28px ${theme.targetColor}22`,
            }}
          >
            GameSpeed
          </h1>
          <p
            className="mt-3 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed px-2"
            style={{ color: theme.textColor, opacity: 0.88 }}
          >
            Jungle reaction drills for athletes. Run a 60-second round, stay sharp, and build clean touch speed under pressure.
          </p>
        </div>

        <div
          className="rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.76)',
            border: `1px solid ${theme.targetColor}44`,
            boxShadow: '0 20px 52px rgba(0, 0, 0, 0.4)',
          }}
        >
          <GameModeSelector onSelectMode={onStart} />
        </div>

        <div className="mt-4 sm:mt-5 text-center px-2">
          <p
            className="text-[11px] sm:text-xs tracking-wide uppercase font-semibold"
            style={{ color: theme.textColor, opacity: 0.64 }}
          >
            v1.3 — Reaction Benchmark + 5 drills + session stats
          </p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <button
              onClick={onViewStats}
              className="text-xs sm:text-sm font-semibold underline underline-offset-2 transition-opacity hover:opacity-80"
              style={{ color: theme.targetColor }}
            >
              View Stats
            </button>
            <span className="opacity-30" style={{ color: theme.textColor }}>·</span>
            <a
              href="https://github.com/rexfordd2/gamespeed/issues"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs sm:text-sm underline underline-offset-2"
              style={{ color: theme.textColor, opacity: 0.55 }}
            >
              Send feedback
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}; 
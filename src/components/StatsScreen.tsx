import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { JungleBackground } from './JungleBackground';
import { JungleButton } from './JungleButton';
import { GameStats, StoredRound } from '../types/game';
import { loadStats, clearStats, emptyStats, getTodayRoundsCount } from '../utils/sessionStats';
import { gameModes, MODE_ORDER } from '../utils/gameModes';

interface StatsScreenProps {
  onClose: () => void;
}

const formatRelativeTime = (ts: number): string => {
  const now = new Date();
  const d = new Date(ts);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((nowDay - dDay) / 86_400_000);

  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'PM' : 'AM';
  const time = `${h % 12 || 12}:${m} ${period}`;

  if (diffDays === 0) return `Today ${time}`;
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const StatsScreen = ({ onClose }: StatsScreenProps) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState<GameStats>(() => loadStats());

  const todayCount = getTodayRoundsCount(stats);
  const recentRounds: StoredRound[] = [...stats.rounds].reverse().slice(0, 10);
  const hasPbs = MODE_ORDER.some(m => stats.pbs[m] !== undefined);

  const handleClearStats = () => {
    if (window.confirm('Clear all GameSpeed stats? This cannot be undone.')) {
      clearStats();
      setStats(emptyStats());
    }
  };

  const cardStyle = {
    backgroundColor: 'rgba(6, 12, 18, 0.76)',
    border: `1px solid ${theme.targetColor}44`,
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
  };

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden"
      style={{
        minHeight: '100dvh',
        backgroundColor: theme.backgroundColor,
        paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <JungleBackground />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(163,230,53,0.10), transparent 45%), linear-gradient(180deg, rgba(3,8,12,0.7), rgba(2,8,10,0.92))',
        }}
      />

      <motion.div
        className="relative z-10 mx-auto w-full max-w-3xl px-4 py-4 sm:px-6 sm:py-6"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
              style={{ color: theme.textColor }}
            >
              Session Stats
            </h1>
            <p className="text-sm mt-1 opacity-60" style={{ color: theme.textColor }}>
              {todayCount > 0
                ? `${todayCount} round${todayCount !== 1 ? 's' : ''} today`
                : 'No rounds today yet'}
            </p>
          </div>
          <JungleButton onClick={onClose} className="px-4 py-2.5 text-sm font-semibold">
            ← Menu
          </JungleButton>
        </div>

        {/* Personal Bests */}
        <section className="mb-7">
          <p
            className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-semibold mb-3"
            style={{ color: theme.targetColor }}
          >
            Personal Bests
          </p>

          {!hasPbs ? (
            <div className="rounded-2xl p-5 text-center" style={cardStyle}>
              <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
                No rounds recorded yet. Complete a drill to start tracking.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODE_ORDER.map(modeKey => {
                const pb = stats.pbs[modeKey];
                const modeInfo = gameModes[modeKey];
                const isBenchmark = modeInfo.category === 'benchmark';

                return (
                  <div
                    key={modeKey}
                    className="rounded-2xl p-4"
                    style={{ ...cardStyle, opacity: pb ? 1 : 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-sm font-bold"
                        style={{ color: theme.textColor }}
                      >
                        {modeInfo.name}
                      </span>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
                        style={{
                          color: isBenchmark ? '#7dd3fc' : theme.targetColor,
                          backgroundColor: isBenchmark
                            ? 'rgba(56,189,248,0.14)'
                            : `${theme.targetColor}1e`,
                          border: `1px solid ${
                            isBenchmark ? 'rgba(56,189,248,0.32)' : `${theme.targetColor}44`
                          }`,
                        }}
                      >
                        {isBenchmark ? 'Benchmark' : 'Drill'}
                      </span>
                    </div>

                    {pb ? (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {isBenchmark ? (
                          <>
                            <div>
                              <p
                                className="text-2xl font-extrabold tabular-nums"
                                style={{ color: '#7dd3fc' }}
                              >
                                {pb.benchmarkScore ?? '—'}
                              </p>
                              <p
                                className="text-[10px] uppercase tracking-wide opacity-55 mt-0.5"
                                style={{ color: theme.textColor }}
                              >
                                Score
                              </p>
                            </div>
                            <div>
                              <p
                                className="text-2xl font-extrabold tabular-nums"
                                style={{ color: '#a5f3fc' }}
                              >
                                {pb.medianReactionTimeMs !== undefined
                                  ? pb.medianReactionTimeMs
                                  : '—'}
                              </p>
                              <p
                                className="text-[10px] uppercase tracking-wide opacity-55 mt-0.5"
                                style={{ color: theme.textColor }}
                              >
                                Best RT ms
                              </p>
                            </div>
                            <div>
                              <p
                                className="text-2xl font-extrabold tabular-nums"
                                style={{ color: theme.targetColor }}
                              >
                                {pb.accuracy}%
                              </p>
                              <p
                                className="text-[10px] uppercase tracking-wide opacity-55 mt-0.5"
                                style={{ color: theme.textColor }}
                              >
                                Hit Rate
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <p
                                className="text-2xl font-extrabold tabular-nums"
                                style={{ color: theme.targetColor }}
                              >
                                {pb.score}
                              </p>
                              <p
                                className="text-[10px] uppercase tracking-wide opacity-55 mt-0.5"
                                style={{ color: theme.textColor }}
                              >
                                Hits
                              </p>
                            </div>
                            <div>
                              <p
                                className="text-2xl font-extrabold tabular-nums"
                                style={{ color: theme.targetColor }}
                              >
                                {pb.accuracy}%
                              </p>
                              <p
                                className="text-[10px] uppercase tracking-wide opacity-55 mt-0.5"
                                style={{ color: theme.textColor }}
                              >
                                Accuracy
                              </p>
                            </div>
                            <div>
                              <p
                                className="text-2xl font-extrabold tabular-nums"
                                style={{ color: '#38bdf8' }}
                              >
                                {pb.bestStreak}
                              </p>
                              <p
                                className="text-[10px] uppercase tracking-wide opacity-55 mt-0.5"
                                style={{ color: theme.textColor }}
                              >
                                Streak
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <p
                        className="text-xs text-center py-2 opacity-45"
                        style={{ color: theme.textColor }}
                      >
                        No runs yet
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Rounds */}
        <section className="mb-7">
          <p
            className="text-[11px] sm:text-xs uppercase tracking-[0.18em] font-semibold mb-3"
            style={{ color: theme.targetColor }}
          >
            Recent Rounds
          </p>

          {recentRounds.length === 0 ? (
            <div className="rounded-2xl p-5 text-center" style={cardStyle}>
              <p className="text-sm opacity-60" style={{ color: theme.textColor }}>
                No rounds recorded yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentRounds.map((round, i) => {
                const isBenchmark = gameModes[round.mode]?.category === 'benchmark';
                return (
                  <div
                    key={i}
                    className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                    style={cardStyle}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{
                          color: isBenchmark ? '#7dd3fc' : theme.targetColor,
                          backgroundColor: isBenchmark
                            ? 'rgba(56,189,248,0.14)'
                            : `${theme.targetColor}1e`,
                          border: `1px solid ${
                            isBenchmark ? 'rgba(56,189,248,0.32)' : `${theme.targetColor}44`
                          }`,
                        }}
                      >
                        {round.modeName}
                      </span>
                      <span
                        className="text-xs opacity-50 truncate"
                        style={{ color: theme.textColor }}
                      >
                        {formatRelativeTime(round.ts)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs flex-shrink-0 tabular-nums">
                      {isBenchmark && round.benchmarkScore !== undefined ? (
                        <>
                          <span className="font-bold" style={{ color: '#7dd3fc' }}>
                            {round.benchmarkScore}
                            <span className="font-normal opacity-55">/100</span>
                          </span>
                          {round.medianReactionTimeMs !== undefined && (
                            <span className="opacity-50" style={{ color: theme.textColor }}>
                              {round.medianReactionTimeMs}ms
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="font-bold" style={{ color: theme.targetColor }}>
                            {round.score}{' '}
                            <span className="font-normal opacity-55">hits</span>
                          </span>
                          <span className="opacity-50" style={{ color: theme.textColor }}>
                            {round.accuracy}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Clear Stats */}
        <div className="text-center pt-2">
          <button
            onClick={handleClearStats}
            className="text-xs underline underline-offset-2 opacity-35 hover:opacity-60 transition-opacity"
            style={{ color: '#f87171' }}
          >
            Clear all stats
          </button>
        </div>
      </motion.div>
    </div>
  );
};

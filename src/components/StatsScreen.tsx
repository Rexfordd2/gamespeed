import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { JungleBackground } from './JungleBackground';
import { JungleButton } from './JungleButton';
import { GameStats } from '../types/game';
import { MODE_ORDER, gameModes } from '../utils/gameModes';
import { getSportConfig } from '../config/sports';
import { getStatsGroupSummary, getSportTrendSummaries } from '../utils/readinessMetrics';
import {
  getDailyStreak,
  getFriendLeaderboard,
  getModeUnlockStatuses,
  getRecentHistory,
  getTodayRounds,
  getWeeklyChallenge,
} from '../utils/progression';

interface StatsScreenProps {
  onClose: () => void;
  stats: GameStats;
  playerName: string;
}

const formatRelativeTime = (ts: number): string => {
  const now = new Date();
  const d = new Date(ts);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((nowDay - dDay) / 86_400_000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const StatsScreen = ({ onClose, stats, playerName }: StatsScreenProps) => {
  const { theme } = useTheme();
  const todayRounds = getTodayRounds(stats);
  const streak = getDailyStreak(stats);
  const weeklyChallenge = getWeeklyChallenge(stats);
  const unlockStatuses = getModeUnlockStatuses(stats);
  const recentRounds = getRecentHistory(stats, 16);
  const leaderboard = getFriendLeaderboard(stats, playerName).slice(0, 5);
  const groupedSummary = getStatsGroupSummary(stats);
  const sportTrends = getSportTrendSummaries(stats).slice(0, 4);
  const hasPbs = MODE_ORDER.some(mode => stats.pbs[mode] !== undefined);
  const unlockedCount = unlockStatuses.filter(status => status.unlocked).length;

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
      <motion.div
        className="relative z-10 mx-auto w-full max-w-4xl px-4 py-3 sm:px-6 sm:py-6"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-4 flex items-center justify-between sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight" style={{ color: theme.textColor }}>
              Session Stats
            </h1>
            <p className="text-sm mt-1 opacity-60" style={{ color: theme.textColor }}>
              {todayRounds.length} round{todayRounds.length === 1 ? '' : 's'} today
            </p>
          </div>
          <JungleButton onClick={onClose} className="min-h-11 px-4 py-2.5 text-sm font-semibold">
            ← Menu
          </JungleButton>
        </div>

        <section className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-3 md:mb-7 md:grid-cols-4">
          <div className="rounded-2xl p-3.5 sm:p-4" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-[0.16em] opacity-60" style={{ color: theme.textColor }}>Daily streak</p>
            <p className="text-3xl font-black tabular-nums mt-1" style={{ color: '#4ade80' }}>{streak}</p>
          </div>
          <div className="rounded-2xl p-3.5 sm:p-4" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-[0.16em] opacity-60" style={{ color: theme.textColor }}>Weekly challenge</p>
            <p className="text-2xl font-black tabular-nums mt-1" style={{ color: weeklyChallenge.completed ? '#4ade80' : '#facc15' }}>
              {weeklyChallenge.roundsDone}/{weeklyChallenge.roundsTarget}
            </p>
          </div>
          <div className="rounded-2xl p-3.5 sm:p-4" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-[0.16em] opacity-60" style={{ color: theme.textColor }}>Modes unlocked</p>
            <p className="text-3xl font-black tabular-nums mt-1" style={{ color: '#7dd3fc' }}>{unlockedCount}/{unlockStatuses.length}</p>
          </div>
          <div className="rounded-2xl p-3.5 sm:p-4" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-[0.16em] opacity-60" style={{ color: theme.textColor }}>Total sessions</p>
            <p className="text-3xl font-black tabular-nums mt-1" style={{ color: theme.targetColor }}>{stats.rounds.length}</p>
          </div>
        </section>

        <section className="mb-7">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: theme.targetColor }}>
            Gameplay
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl p-4" style={cardStyle}>
              <p className="text-[10px] uppercase tracking-[0.15em] opacity-60" style={{ color: theme.textColor }}>Average score</p>
              <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: theme.targetColor }}>{groupedSummary.gameplay.scoreAverage}</p>
            </div>
            <div className="rounded-2xl p-4" style={cardStyle}>
              <p className="text-[10px] uppercase tracking-[0.15em] opacity-60" style={{ color: theme.textColor }}>Median reaction time</p>
              <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: '#7dd3fc' }}>
                {groupedSummary.gameplay.reactionTimeMedianMs ?? '--'}{groupedSummary.gameplay.reactionTimeMedianMs !== null ? 'ms' : ''}
              </p>
            </div>
            <div className="rounded-2xl p-4" style={cardStyle}>
              <p className="text-[10px] uppercase tracking-[0.15em] opacity-60" style={{ color: theme.textColor }}>Rounds tracked</p>
              <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: '#a3e635' }}>{groupedSummary.gameplay.rounds}</p>
            </div>
          </div>
        </section>

        <section className="mb-7">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: theme.targetColor }}>
            Readiness
          </p>
          <div className="rounded-2xl p-4 space-y-2.5" style={cardStyle}>
            <p className="text-sm tabular-nums" style={{ color: theme.textColor }}>
              Readiness score {groupedSummary.readiness.readinessScore} · Accuracy {groupedSummary.readiness.decisionAccuracyPct}% · Late decisions {groupedSummary.readiness.lateDecisionRatePct}%
            </p>
            <p className="text-sm tabular-nums" style={{ color: theme.textColor }}>
              Miss rate {groupedSummary.readiness.missRatePct}% · Streak quality {groupedSummary.readiness.streakQualityPct}% · Consistency {groupedSummary.readiness.consistencyPct}%
            </p>
          </div>
        </section>

        <section className="mb-7">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: theme.targetColor }}>
            Recovery / Sleep
          </p>
          <div className="rounded-2xl p-4 space-y-2.5" style={cardStyle}>
            <p className="text-sm tabular-nums" style={{ color: theme.textColor }}>
              Runway completions logged: {groupedSummary.recovery.runwayCompletionsCount}
            </p>
            <p className="text-sm" style={{ color: theme.textColor }}>
              Sleep check-in correlation: {groupedSummary.recovery.sleepCorrelationState === 'available' ? 'available' : 'pending placeholder (collect more data)'}
            </p>
          </div>
        </section>

        <section className="mb-7">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: theme.targetColor }}>
            By-sport trends
          </p>
          <div className="rounded-2xl p-4 space-y-2.5" style={cardStyle}>
            {sportTrends.length === 0 ? (
              <p className="text-sm opacity-60" style={{ color: theme.textColor }}>No rounds recorded yet.</p>
            ) : (
              sportTrends.map(trend => (
                <div key={trend.sport} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: theme.textColor }}>{getSportConfig(trend.sport).displayName}</p>
                    <p className="text-xs opacity-70" style={{ color: theme.textColor }}>{trend.summary}</p>
                  </div>
                  <p className="text-sm font-bold tabular-nums" style={{ color: '#7dd3fc' }}>
                    {trend.averageReadinessScore} ({trend.roundsTracked})
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mb-7">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: theme.targetColor }}>
            Personal Bests
          </p>
          {!hasPbs ? (
            <div className="rounded-2xl p-5 text-center" style={cardStyle}>
              <p className="text-sm opacity-60" style={{ color: theme.textColor }}>No rounds recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MODE_ORDER.map(mode => {
                const pb = stats.pbs[mode];
                return (
                  <div key={mode} className="rounded-2xl p-4" style={{ ...cardStyle, opacity: pb ? 1 : 0.45 }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: theme.textColor }}>{gameModes[mode].name}</p>
                    {pb ? (
                      <p className="text-sm tabular-nums" style={{ color: theme.textColor }}>
                        Score {pb.score} · Accuracy {pb.accuracy}% · Streak {pb.bestStreak}
                      </p>
                    ) : (
                      <p className="text-xs opacity-50" style={{ color: theme.textColor }}>No runs yet</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="mb-7">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: theme.targetColor }}>
            Leaderboard Shell
          </p>
          <p className="text-[10px] uppercase tracking-[0.14em] mb-2" style={{ color: theme.textColor, opacity: 0.56 }}>
            Placeholder rankings for launch shell
          </p>
          <div className="rounded-2xl p-4 space-y-2" style={cardStyle}>
            {leaderboard.map((entry, idx) => (
              <div key={entry.name} className="flex items-center justify-between">
                <p className="text-sm" style={{ color: theme.textColor }}>{idx + 1}. {entry.name}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color: entry.isYou ? theme.targetColor : '#7dd3fc' }}>{entry.score}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-7">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: theme.targetColor }}>
            Training Mode Unlocks
          </p>
          <div className="rounded-2xl p-4 space-y-2.5" style={cardStyle}>
            {unlockStatuses.map(status => (
              <div key={status.mode} className="flex items-center justify-between gap-3">
                <p className="text-sm" style={{ color: theme.textColor }}>{gameModes[status.mode].name}</p>
                <p className="text-xs font-semibold" style={{ color: status.unlocked ? '#4ade80' : '#facc15' }}>
                  {status.progressLabel}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color: theme.targetColor }}>
            Session History
          </p>
          <div className="rounded-2xl p-4 space-y-2" style={cardStyle}>
            {recentRounds.length === 0 ? (
              <p className="text-sm opacity-60" style={{ color: theme.textColor }}>No rounds recorded yet.</p>
            ) : (
              recentRounds.map(round => (
                <div key={`${round.ts}-${round.clientRoundId ?? 'local'}`} className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: theme.textColor }}>
                    {round.modeName} · {formatRelativeTime(round.ts)}
                  </p>
                  <p className="text-xs font-semibold tabular-nums" style={{ color: theme.targetColor }}>
                    {round.score} / {round.accuracy}%
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </motion.div>
    </div>
  );
};

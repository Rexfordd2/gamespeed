import { getSportConfig, SportType } from '../config/sports';
import { GameModeType, GameStats, ReadinessMetrics, StoredRound } from '../types/game';
import { isModePlayable } from './gameModes';
import { getDailyStreak, getTodayRounds, isModeUnlocked } from './progression';

const isValidStoredRound = (round: StoredRound): boolean =>
  typeof round.ts === 'number' &&
  Number.isFinite(round.ts) &&
  round.ts > 0 &&
  typeof round.mode === 'string' &&
  round.mode.length > 0 &&
  typeof round.score === 'number' &&
  Number.isFinite(round.score);

export const hasValidRoundHistory = (stats: GameStats | null | undefined): boolean => {
  if (!stats?.rounds?.length) return false;
  return stats.rounds.some(isValidStoredRound);
};

export const hasBaselineRound = (stats: GameStats | null | undefined): boolean => {
  if (!stats?.rounds?.length) return false;
  return stats.rounds.some(round => isValidStoredRound(round) && round.mode === 'reactionBenchmark');
};

export type DefensibleTodayStatus = {
  hasBaseline: boolean;
  lastReadinessScore: number | null;
  lastReadinessBand: ReadinessMetrics['neuralReadinessBand'] | null;
  lastBenchmarkScore: number | null;
  lastMedianReactionTimeMs: number | null;
  lastRoundAt: number | null;
  todayRoundCount: number;
  streakDays: number;
};

const toFiniteNumber = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

export const getDefensibleTodayStatus = (
  stats: GameStats,
  nowTs = Date.now(),
): DefensibleTodayStatus => {
  const validRounds = [...stats.rounds.filter(isValidStoredRound)].sort((a, b) => a.ts - b.ts);
  const lastRound = validRounds[validRounds.length - 1] ?? null;
  const benchmarkRounds = validRounds.filter(round => round.mode === 'reactionBenchmark');
  const lastBenchmark = benchmarkRounds[benchmarkRounds.length - 1];

  return {
    hasBaseline: hasBaselineRound(stats),
    lastReadinessScore: toFiniteNumber(lastRound?.readinessMetrics?.readinessScore),
    lastReadinessBand: lastRound?.readinessMetrics?.neuralReadinessBand ?? null,
    lastBenchmarkScore: toFiniteNumber(lastBenchmark?.benchmarkScore),
    lastMedianReactionTimeMs: toFiniteNumber(
      lastBenchmark?.medianReactionTimeMs ?? lastBenchmark?.readinessMetrics?.reactionTimeMs.median,
    ),
    lastRoundAt: lastRound?.ts ?? null,
    todayRoundCount: getTodayRounds(stats, nowTs).length,
    streakDays: getDailyStreak(stats, nowTs),
  };
};

export const resolveTodaysSessionMode = (stats: GameStats, sport: SportType): GameModeType => {
  if (!hasBaselineRound(stats)) {
    return 'reactionBenchmark';
  }

  const recommended = getSportConfig(sport).defaultRecommendedModes.filter(
    mode => mode !== 'reactionBenchmark',
  );

  for (const mode of recommended) {
    if (isModePlayable(mode) && isModeUnlocked(stats, mode)) {
      return mode;
    }
  }

  return 'quickTap';
};

export const getTimeOfDayGreeting = (now = new Date()): 'Good morning' | 'Good afternoon' | 'Good evening' => {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

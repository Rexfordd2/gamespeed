import { DEFAULT_SPORT, isSportType } from '../config/sports';
import { GameResult, GameStats, StoredRound, ModePersonalBests, GameModeType } from '../types/game';
import { loadRunwayAnalytics } from './runwayStats';
import { loadSleepCheckIns } from './sleepCheckIn';
import { deriveReadinessMetrics } from './readinessMetrics';

const STORAGE_KEY = 'gamespeed_stats_v1';
const MAX_ROUNDS_PER_MODE = 20;
const CURRENT_VERSION = 2;

export const emptyStats = (): GameStats => ({
  version: CURRENT_VERSION,
  rounds: [],
  pbs: {},
});

export const loadStats = (): GameStats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) {
      return emptyStats();
    }
    const normalized = normalizeStats(parsed);
    if (!normalized) {
      return emptyStats();
    }
    return normalized;
  } catch {
    return emptyStats();
  }
};

const saveStats = (stats: GameStats): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage quota exceeded or private-mode restriction; fail silently.
  }
};

interface RecordRoundOptions {
  clientRoundId?: string;
  ts?: number;
}

const toNumberOr = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeRound = (rawRound: unknown): StoredRound | null => {
  if (typeof rawRound !== 'object' || rawRound === null) return null;
  const value = rawRound as Partial<StoredRound>;
  const score = toNumberOr(value.score, 0);
  const misses = toNumberOr(value.misses, 0);
  const totalAttempts = Math.max(score + misses, score + misses);
  const accuracy =
    typeof value.accuracy === 'number' && Number.isFinite(value.accuracy)
      ? value.accuracy
      : totalAttempts > 0
        ? Math.round((score / totalAttempts) * 100)
        : 0;

  const readinessMetrics =
    value.readinessMetrics ??
    deriveReadinessMetrics({
      score,
      misses,
      totalAttempts,
      reactionTimesMs:
        value.medianReactionTimeMs !== undefined ? [value.medianReactionTimeMs] : undefined,
      streakRuns: [toNumberOr(value.bestStreak, 0)],
      runwayCompletionsCount: value.meta?.runwayCompletionsCount ?? 0,
      sleepCheckInCorrelation: value.meta?.sleepCorrelationState ?? 'pending',
    });

  const mode =
    value.mode === 'reactionBenchmark' ||
    value.mode === 'quickTap' ||
    value.mode === 'multiTarget' ||
    value.mode === 'swipeStrike' ||
    value.mode === 'holdTrack' ||
    value.mode === 'sequenceMemory'
      ? value.mode
      : 'quickTap';

  return {
    ts: toNumberOr(value.ts, Date.now()),
    clientRoundId: value.clientRoundId,
    sport: value.sport && isSportType(value.sport) ? value.sport : DEFAULT_SPORT,
    mode,
    modeName: typeof value.modeName === 'string' ? value.modeName : 'Unknown mode',
    score,
    misses,
    accuracy,
    bestStreak: toNumberOr(value.bestStreak, 0),
    medianReactionTimeMs:
      typeof value.medianReactionTimeMs === 'number' ? value.medianReactionTimeMs : undefined,
    benchmarkScore:
      typeof value.benchmarkScore === 'number' ? value.benchmarkScore : undefined,
    readinessMetrics,
    meta: {
      metricsVersion: 1,
      runwayCompletionsCount: readinessMetrics.runwayCompletionsCount,
      sleepCorrelationState: readinessMetrics.sleepCheckInCorrelation,
    },
  };
};

const normalizeStats = (rawStats: unknown): GameStats | null => {
  if (typeof rawStats !== 'object' || rawStats === null) return null;
  const value = rawStats as Partial<GameStats>;
  const roundsSource = Array.isArray(value.rounds) ? value.rounds : [];
  const rounds = roundsSource
    .map(round => normalizeRound(round))
    .filter((round): round is StoredRound => round !== null);
  const pbs = typeof value.pbs === 'object' && value.pbs !== null ? value.pbs : {};

  return {
    version: CURRENT_VERSION,
    rounds,
    pbs,
  };
};

export const recordRound = (result: GameResult, options?: RecordRoundOptions): StoredRound => {
  const stats = loadStats();
  const totalAttempts = Math.max(
    result.score + result.misses,
    result.totalAttempts ?? result.score + result.misses,
  );
  const accuracy = totalAttempts > 0 ? Math.round((result.score / totalAttempts) * 100) : 0;
  const runwayCompletionsCount = loadRunwayAnalytics().completions.length;
  const sleepCheckInsCount = loadSleepCheckIns().checkIns.length;
  const readinessMetrics =
    result.readinessMetrics ??
    deriveReadinessMetrics({
      score: result.score,
      misses: result.misses,
      totalAttempts,
      lateDecisions: result.lateDecisions,
      reactionTimesMs: result.reactionTimesMs,
      streakRuns: result.streakRuns ?? [result.bestStreak],
      runwayCompletionsCount,
      sleepCheckInCorrelation: sleepCheckInsCount < 3 ? 'insufficient_data' : 'pending',
    });

  const round: StoredRound = {
    ts: options?.ts ?? Date.now(),
    clientRoundId: options?.clientRoundId,
    sport: result.sport ?? DEFAULT_SPORT,
    mode: result.mode,
    modeName: result.modeName,
    score: result.score,
    misses: result.misses,
    accuracy,
    bestStreak: result.bestStreak,
    medianReactionTimeMs: result.medianReactionTimeMs,
    benchmarkScore: result.benchmarkScore,
    readinessMetrics,
    meta: {
      metricsVersion: 1,
      runwayCompletionsCount,
      sleepCorrelationState: readinessMetrics.sleepCheckInCorrelation,
    },
  };

  // Append then trim: keep the last MAX_ROUNDS_PER_MODE entries per mode.
  const allRounds = [...stats.rounds, round];
  const countByMode: Partial<Record<GameModeType, number>> = {};
  const trimmed: StoredRound[] = [];
  for (let i = allRounds.length - 1; i >= 0; i--) {
    const r = allRounds[i];
    const count = countByMode[r.mode] ?? 0;
    if (count < MAX_ROUNDS_PER_MODE) {
      trimmed.unshift(r);
      countByMode[r.mode] = count + 1;
    }
  }

  // Update personal bests.
  const pb = stats.pbs[result.mode];
  const newPb: ModePersonalBests = {
    score: Math.max(result.score, pb?.score ?? 0),
    accuracy: Math.max(accuracy, pb?.accuracy ?? 0),
    bestStreak: Math.max(result.bestStreak, pb?.bestStreak ?? 0),
    // For median RT: lower is better.
    medianReactionTimeMs:
      result.medianReactionTimeMs !== undefined
        ? pb?.medianReactionTimeMs !== undefined
          ? Math.min(result.medianReactionTimeMs, pb.medianReactionTimeMs)
          : result.medianReactionTimeMs
        : pb?.medianReactionTimeMs,
    benchmarkScore:
      result.benchmarkScore !== undefined
        ? Math.max(result.benchmarkScore, pb?.benchmarkScore ?? 0)
        : pb?.benchmarkScore,
  };

  saveStats({
    ...stats,
    rounds: trimmed,
    pbs: { ...stats.pbs, [result.mode]: newPb },
  });

  return round;
};

export const clearStats = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

export const getTodayRoundsCount = (stats: GameStats): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return stats.rounds.filter(r => r.ts >= today.getTime()).length;
};

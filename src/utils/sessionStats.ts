import { DEFAULT_SPORT, isSportType } from '../config/sports';
import { GameResult, GameStats, StoredRound, ModePersonalBests, GameModeType } from '../types/game';
import { loadRunwayAnalytics } from './runwayStats';
import { loadSleepCheckIns } from './sleepCheckIn';
import { deriveReadinessMetrics } from './readinessMetrics';

const STORAGE_KEY = 'gamespeed_stats_v1';
const MAX_ROUNDS_PER_MODE = 20;
const CURRENT_VERSION = 2;
let activeStorageOwner: string | null = null;

const GAME_MODE_TYPES: GameModeType[] = [
  'reactionBenchmark',
  'quickTap',
  'multiTarget',
  'swipeStrike',
  'holdTrack',
  'sequenceMemory',
  'peripheralPulse',
  'calmFocus',
];

const isGameModeType = (value: unknown): value is GameModeType =>
  typeof value === 'string' && GAME_MODE_TYPES.includes(value as GameModeType);

const getStorageKey = (owner = activeStorageOwner): string =>
  owner ? `${STORAGE_KEY}:user:${owner}` : STORAGE_KEY;

export const setStatsStorageOwner = (userId: string | null): void => {
  activeStorageOwner = userId;
};

export const emptyStats = (): GameStats => ({
  version: CURRENT_VERSION,
  rounds: [],
  pbs: {},
});

const toNumberOr = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeRound = (rawRound: unknown): StoredRound | null => {
  if (typeof rawRound !== 'object' || rawRound === null) return null;
  const value = rawRound as Partial<StoredRound>;
  if (!isGameModeType(value.mode)) return null;

  const score = toNumberOr(value.score, 0);
  const misses = toNumberOr(value.misses, 0);
  const totalAttempts = score + misses;
  const accuracy =
    typeof value.accuracy === 'number' && Number.isFinite(value.accuracy)
      ? Math.max(0, Math.min(100, Math.round(value.accuracy)))
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

  return {
    ts: toNumberOr(value.ts, Date.now()),
    clientRoundId: typeof value.clientRoundId === 'string' ? value.clientRoundId : undefined,
    sport: value.sport && isSportType(value.sport) ? value.sport : DEFAULT_SPORT,
    mode: value.mode,
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
      metricsVersion: value.meta?.metricsVersion ?? 1,
      runwayCompletionsCount:
        value.meta?.runwayCompletionsCount ?? readinessMetrics.runwayCompletionsCount,
      sleepCorrelationState:
        value.meta?.sleepCorrelationState ?? readinessMetrics.sleepCheckInCorrelation,
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

const readStatsFromKey = (key: string): GameStats => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as unknown;
    return normalizeStats(parsed) ?? emptyStats();
  } catch {
    return emptyStats();
  }
};

export const loadStats = (): GameStats => readStatsFromKey(getStorageKey());

const saveStats = (stats: GameStats): void => {
  try {
    localStorage.setItem(getStorageKey(), JSON.stringify(stats));
  } catch {
    // Storage quota exceeded or private-mode restriction; fail silently.
  }
};

interface RecordRoundOptions {
  clientRoundId?: string;
  ts?: number;
}

const trimRounds = (rounds: StoredRound[]): StoredRound[] => {
  const countByMode: Partial<Record<GameModeType, number>> = {};
  const trimmed: StoredRound[] = [];
  const sorted = [...rounds].sort((a, b) => a.ts - b.ts);

  for (let i = sorted.length - 1; i >= 0; i--) {
    const round = sorted[i];
    const count = countByMode[round.mode] ?? 0;
    if (count < MAX_ROUNDS_PER_MODE) {
      trimmed.unshift(round);
      countByMode[round.mode] = count + 1;
    }
  }

  return trimmed;
};

const buildPersonalBests = (rounds: StoredRound[]): GameStats['pbs'] => {
  const pbs: GameStats['pbs'] = {};
  for (const round of rounds) {
    const previous = pbs[round.mode];
    pbs[round.mode] = {
      score: Math.max(round.score, previous?.score ?? 0),
      accuracy: Math.max(round.accuracy, previous?.accuracy ?? 0),
      bestStreak: Math.max(round.bestStreak, previous?.bestStreak ?? 0),
      medianReactionTimeMs:
        round.medianReactionTimeMs !== undefined
          ? previous?.medianReactionTimeMs !== undefined
            ? Math.min(round.medianReactionTimeMs, previous.medianReactionTimeMs)
            : round.medianReactionTimeMs
          : previous?.medianReactionTimeMs,
      benchmarkScore:
        round.benchmarkScore !== undefined
          ? Math.max(round.benchmarkScore, previous?.benchmarkScore ?? 0)
          : previous?.benchmarkScore,
    };
  }
  return pbs;
};

const roundDedupKey = (round: StoredRound): string =>
  round.clientRoundId ??
  [round.ts, round.mode, round.score, round.misses, round.bestStreak].join(':');

export const mergeStoredRounds = (incomingRounds: StoredRound[]): GameStats => {
  const local = loadStats();
  const mergedByKey = new Map<string, StoredRound>();

  [...local.rounds, ...incomingRounds]
    .map(round => normalizeRound(round))
    .filter((round): round is StoredRound => round !== null)
    .forEach(round => {
      mergedByKey.set(roundDedupKey(round), round);
    });

  const rounds = trimRounds([...mergedByKey.values()]);
  const nextStats: GameStats = {
    version: CURRENT_VERSION,
    rounds,
    pbs: buildPersonalBests(rounds),
  };
  saveStats(nextStats);
  return nextStats;
};

export const adoptAnonymousStatsForUser = (userId: string): GameStats => {
  const anonymousStats = readStatsFromKey(STORAGE_KEY);
  activeStorageOwner = userId;
  const userStats = loadStats();

  if (anonymousStats.rounds.length === 0) {
    return userStats;
  }

  const merged = mergeStoredRounds(anonymousStats.rounds);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
  return merged;
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

  const rounds = trimRounds([...stats.rounds, round]);
  saveStats({
    version: CURRENT_VERSION,
    rounds,
    pbs: buildPersonalBests(rounds),
  });

  return round;
};

export const clearStats = (): void => {
  try {
    localStorage.removeItem(getStorageKey());
  } catch {
    // ignore
  }
};

export const getTodayRoundsCount = (stats: GameStats): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return stats.rounds.filter(r => r.ts >= today.getTime()).length;
};

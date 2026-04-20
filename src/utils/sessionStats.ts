import { GameResult, GameStats, StoredRound, ModePersonalBests, GameModeType } from '../types/game';

const STORAGE_KEY = 'gamespeed_stats_v1';
const MAX_ROUNDS_PER_MODE = 20;
const CURRENT_VERSION = 1;

export const emptyStats = (): GameStats => ({
  version: CURRENT_VERSION,
  rounds: [],
  pbs: {},
});

export const loadStats = (): GameStats => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStats();
    const parsed = JSON.parse(raw) as GameStats;
    if (typeof parsed !== 'object' || parsed === null || parsed.version !== CURRENT_VERSION) {
      return emptyStats();
    }
    return { ...emptyStats(), ...parsed };
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

export const recordRound = (result: GameResult, options?: RecordRoundOptions): StoredRound => {
  const stats = loadStats();
  const totalAttempts = result.score + result.misses;
  const accuracy = totalAttempts > 0 ? Math.round((result.score / totalAttempts) * 100) : 0;

  const round: StoredRound = {
    ts: options?.ts ?? Date.now(),
    clientRoundId: options?.clientRoundId,
    mode: result.mode,
    modeName: result.modeName,
    score: result.score,
    misses: result.misses,
    accuracy,
    bestStreak: result.bestStreak,
    medianReactionTimeMs: result.medianReactionTimeMs,
    benchmarkScore: result.benchmarkScore,
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

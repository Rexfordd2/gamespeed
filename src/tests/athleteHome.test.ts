import { describe, expect, it } from 'vitest';
import { deriveReadinessMetrics } from '../utils/readinessMetrics';
import { emptyStats } from '../utils/sessionStats';
import {
  getDefensibleTodayStatus,
  getTimeOfDayGreeting,
  hasBaselineRound,
  hasValidRoundHistory,
  resolveTodaysSessionMode,
} from '../utils/athleteHome';
import { GameStats, StoredRound } from '../types/game';

const invalidRound = {
  ts: 0,
  mode: '',
  modeName: '',
  score: Number.NaN,
  misses: 0,
  accuracy: 0,
  bestStreak: 0,
} as unknown as StoredRound;

describe('athlete home status', () => {
  it('does not treat empty or invalid rounds as returning history', () => {
    expect(hasValidRoundHistory(emptyStats())).toBe(false);
    expect(hasValidRoundHistory(undefined)).toBe(false);
    expect(
      hasValidRoundHistory({
        version: 2,
        rounds: [invalidRound],
        pbs: {},
      }),
    ).toBe(false);
  });

  it('treats local valid round history as returning even without auth state', () => {
    const stats: GameStats = {
      version: 2,
      rounds: [
        {
          ts: 1_700_000_000_000,
          mode: 'quickTap',
          modeName: 'Quick Tap',
          score: 9,
          misses: 3,
          accuracy: 75,
          bestStreak: 4,
          sport: 'soccer',
        },
      ],
      pbs: {},
    };

    expect(hasValidRoundHistory(stats)).toBe(true);
    expect(hasBaselineRound(stats)).toBe(false);
  });

  it('requires a reactionBenchmark round before showing baseline numbers', () => {
    const drillOnly = {
      version: 2 as const,
      rounds: [
        {
          ts: Date.now(),
          mode: 'quickTap' as const,
          modeName: 'Quick Tap',
          score: 10,
          misses: 2,
          accuracy: 83,
          bestStreak: 3,
          sport: 'boxing' as const,
        },
      ],
      pbs: {},
    };

    expect(hasBaselineRound(drillOnly)).toBe(false);
    const status = getDefensibleTodayStatus(drillOnly);
    expect(status.hasBaseline).toBe(false);
    expect(status.lastBenchmarkScore).toBeNull();
    expect(status.lastMedianReactionTimeMs).toBeNull();
  });

  it('exposes only stored baseline and readiness values', () => {
    const readiness = deriveReadinessMetrics({
      score: 16,
      misses: 4,
      totalAttempts: 20,
      reactionTimesMs: [250, 270, 280],
      streakRuns: [5],
    });
    const stats: GameStats = {
      version: 2,
      rounds: [
        {
          ts: 1_700_000_100_000,
          mode: 'reactionBenchmark',
          modeName: 'Reaction Benchmark',
          score: 16,
          misses: 4,
          accuracy: 80,
          bestStreak: 5,
          sport: 'soccer',
          medianReactionTimeMs: 270,
          benchmarkScore: 71,
          readinessMetrics: readiness,
        },
      ],
      pbs: {},
    };

    const status = getDefensibleTodayStatus(stats, 1_700_000_100_000);
    expect(status.hasBaseline).toBe(true);
    expect(status.lastReadinessScore).toBe(readiness.readinessScore);
    expect(status.lastBenchmarkScore).toBe(71);
    expect(status.lastMedianReactionTimeMs).toBe(270);
    expect(status.todayRoundCount).toBe(1);
  });

  it('starts todays session on baseline when no benchmark exists, otherwise an unlocked drill', () => {
    const empty = emptyStats();
    expect(resolveTodaysSessionMode(empty, 'soccer')).toBe('reactionBenchmark');

    const withBaseline: GameStats = {
      version: 2,
      rounds: [
        {
          ts: 1,
          mode: 'reactionBenchmark',
          modeName: 'Reaction Benchmark',
          score: 12,
          misses: 2,
          accuracy: 86,
          bestStreak: 4,
          sport: 'soccer',
        },
      ],
      pbs: {},
    };
    expect(resolveTodaysSessionMode(withBaseline, 'soccer')).toBe('quickTap');
  });

  it('maps clock hours to greeting labels', () => {
    expect(getTimeOfDayGreeting(new Date('2026-01-01T08:00:00'))).toBe('Good morning');
    expect(getTimeOfDayGreeting(new Date('2026-01-01T13:00:00'))).toBe('Good afternoon');
    expect(getTimeOfDayGreeting(new Date('2026-01-01T20:00:00'))).toBe('Good evening');
  });
});

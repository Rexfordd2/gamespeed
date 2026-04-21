import { afterEach, describe, expect, it } from 'vitest';
import { clearStats, loadStats, recordRound } from '../utils/sessionStats';
import { GameResult } from '../types/game';

const STORAGE_KEY = 'gamespeed_stats_v1';

describe('session stats backward compatibility', () => {
  afterEach(() => {
    clearStats();
  });

  it('migrates legacy v1 local rounds with safe fallbacks', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        rounds: [
          {
            ts: 1_700_000_000_000,
            mode: 'quickTap',
            modeName: 'Quick Tap',
            score: 9,
            misses: 3,
            accuracy: 75,
            bestStreak: 4,
          },
        ],
        pbs: {
          quickTap: {
            score: 9,
            accuracy: 75,
            bestStreak: 4,
          },
        },
      }),
    );

    const stats = loadStats();
    expect(stats.version).toBe(2);
    expect(stats.rounds).toHaveLength(1);
    expect(stats.rounds[0].readinessMetrics).toBeDefined();
    expect(stats.rounds[0].sport).toBe('soccer');
    expect(stats.rounds[0].meta?.metricsVersion).toBe(1);
  });

  it('records readiness metrics for new rounds while preserving legacy fields', () => {
    const result: GameResult = {
      score: 12,
      misses: 4,
      bestStreak: 5,
      mode: 'quickTap',
      modeName: 'Quick Tap',
      totalAttempts: 16,
      lateDecisions: 2,
      reactionTimesMs: [300, 320, 310],
      streakRuns: [2, 5, 4],
      sport: 'boxing',
    };

    const round = recordRound(result, { ts: 1000 });
    const stats = loadStats();

    expect(round.accuracy).toBe(75);
    expect(round.readinessMetrics?.decisionAccuracyPct).toBe(75);
    expect(round.readinessMetrics?.lateDecisionRatePct).toBe(13);
    expect(round.sport).toBe('boxing');
    expect(stats.rounds[0].score).toBe(12);
    expect(stats.rounds[0].readinessMetrics?.streakQualityPct).toBeGreaterThan(0);
  });
});

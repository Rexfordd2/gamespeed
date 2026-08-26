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

  it('preserves calmFocus and Prime metadata without rewriting standalone history', () => {
    const primeRound = recordRound(
      {
        score: 8,
        misses: 2,
        bestStreak: 3,
        mode: 'calmFocus',
        modeName: 'Calm Focus',
      },
      {
        ts: 2_000,
        prime: {
          sessionId: 'prime-session',
          protocolId: 'gamespeed-prime-v1',
          stepId: 'settle',
        },
      },
    );
    const standalone = recordRound(
      {
        score: 11,
        misses: 1,
        bestStreak: 5,
        mode: 'quickTap',
        modeName: 'Quick Tap',
      },
      { ts: 3_000 },
    );

    expect(primeRound.mode).toBe('calmFocus');
    expect(primeRound.meta?.primeSessionId).toBe('prime-session');
    expect(standalone.meta?.primeSessionId).toBeUndefined();

    const reloaded = loadStats();
    const calmRound = reloaded.rounds.find(round => round.mode === 'calmFocus');
    const quickRound = reloaded.rounds.find(round => round.mode === 'quickTap' && round.ts === 3_000);
    expect(calmRound?.meta?.protocolId).toBe('gamespeed-prime-v1');
    expect(calmRound?.meta?.primeStepId).toBe('settle');
    expect(quickRound?.meta?.primeSessionId).toBeUndefined();
  });
});

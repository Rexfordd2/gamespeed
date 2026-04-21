import { describe, expect, it } from 'vitest';
import { deriveReadinessMetrics, getSportTrendSummaries, getStatsGroupSummary } from '../utils/readinessMetrics';
import { GameStats } from '../types/game';

describe('readiness metric derivation', () => {
  it('derives core readiness metrics from round events', () => {
    const metrics = deriveReadinessMetrics({
      score: 18,
      misses: 6,
      totalAttempts: 24,
      lateDecisions: 3,
      reactionTimesMs: [280, 300, 260, 310],
      streakRuns: [4, 5, 3, 6],
      runwayCompletionsCount: 2,
      sleepCheckInCorrelation: 'pending',
    });

    expect(metrics.decisionAccuracyPct).toBe(75);
    expect(metrics.missRatePct).toBe(25);
    expect(metrics.lateDecisionRatePct).toBe(13);
    expect(metrics.reactionTimeMs.median).toBe(290);
    expect(metrics.reactionTimeMs.average).toBe(288);
    expect(metrics.streakQualityPct).toBeGreaterThan(0);
    expect(metrics.consistencyPct).toBeGreaterThan(0);
    expect(metrics.runwayCompletionsCount).toBe(2);
  });
});

describe('stats aggregation and by-sport trends', () => {
  it('aggregates grouped stat summaries and sport trend signals', () => {
    const stats: GameStats = {
      version: 2,
      pbs: {},
      rounds: [
        {
          ts: 100,
          mode: 'quickTap',
          modeName: 'Quick Tap',
          sport: 'soccer',
          score: 10,
          misses: 5,
          accuracy: 67,
          bestStreak: 4,
          readinessMetrics: deriveReadinessMetrics({
            score: 10,
            misses: 5,
            lateDecisions: 2,
            reactionTimesMs: [350, 340, 330],
            streakRuns: [2, 3, 4],
            runwayCompletionsCount: 1,
            sleepCheckInCorrelation: 'pending',
          }),
          meta: { metricsVersion: 1 },
        },
        {
          ts: 200,
          mode: 'quickTap',
          modeName: 'Quick Tap',
          sport: 'soccer',
          score: 14,
          misses: 3,
          accuracy: 82,
          bestStreak: 6,
          readinessMetrics: deriveReadinessMetrics({
            score: 14,
            misses: 3,
            lateDecisions: 1,
            reactionTimesMs: [310, 300, 290],
            streakRuns: [4, 5, 6],
            runwayCompletionsCount: 2,
            sleepCheckInCorrelation: 'pending',
          }),
          meta: { metricsVersion: 1 },
        },
        {
          ts: 300,
          mode: 'swipeStrike',
          modeName: 'Swipe Strike',
          sport: 'boxing',
          score: 12,
          misses: 5,
          accuracy: 71,
          bestStreak: 4,
          readinessMetrics: deriveReadinessMetrics({
            score: 12,
            misses: 5,
            lateDecisions: 3,
            reactionTimesMs: [360, 355, 340],
            streakRuns: [3, 3, 4],
            runwayCompletionsCount: 3,
            sleepCheckInCorrelation: 'insufficient_data',
          }),
          meta: { metricsVersion: 1 },
        },
      ],
    };

    const grouped = getStatsGroupSummary(stats);
    const trends = getSportTrendSummaries(stats);

    expect(grouped.gameplay.rounds).toBe(3);
    expect(grouped.readiness.readinessScore).toBeGreaterThan(0);
    expect(grouped.recovery.runwayCompletionsCount).toBe(3);
    expect(trends.length).toBe(2);
    expect(trends[0].roundsTracked).toBeGreaterThanOrEqual(trends[1].roundsTracked);
  });
});

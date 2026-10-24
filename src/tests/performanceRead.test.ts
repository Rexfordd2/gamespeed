import { describe, expect, it } from 'vitest';
import { buildPerformanceRead } from '../utils/performanceRead';
import { deriveReadinessMetrics } from '../utils/readinessMetrics';
import { getRoundProgressDelta } from '../utils/progression';
import type { GameResult, GameStats } from '../types/game';

const result: GameResult = {
  mode: 'quickTap', modeName: 'Quick Tap', score: 1, misses: 29, bestStreak: 1,
  readinessMetrics: deriveReadinessMetrics({
    score: 1, misses: 29, totalAttempts: 30, lateDecisions: 29,
    reactionTimesMs: [1141], streakRuns: [1],
  }),
};

const statsFor = (round: GameResult, count: number): GameStats => ({
  version: 2, pbs: {}, rounds: Array.from({ length: count }, (_, ts) => ({
    ...round, ts, accuracy: Math.round(round.score / (round.score + round.misses) * 100),
  })),
});

describe('performance feedback evidence', () => {
  it('does not infer speed, fatigue or improvement from one hit in a first session', () => {
    const read = buildPerformanceRead({ result, stats: statsFor(result, 1), roundProgressDelta: getRoundProgressDelta(result, undefined) });
    expect(read.headline).toBe('Session recorded.');
    expect(read.coachRead).toContain('Fewer than two');
    expect(read.whatThisTrains).toContain('Complete another session');
    expect(read.whatThisTrains).not.toContain('prior best');
  });

  it('reports late attempts without inventing a within-round decline', () => {
    const round = { ...result, score: 8, misses: 12, readinessMetrics: deriveReadinessMetrics({ score: 8, misses: 12, totalAttempts: 20, lateDecisions: 10, reactionTimesMs: [300, 310], streakRuns: [2, 2] }) };
    const read = buildPerformanceRead({ result: round, stats: statsFor(round, 2), roundProgressDelta: null });
    expect(read.coachRead).toContain('50% of attempts were late');
    expect(read.coachRead).not.toMatch(/dropped|fast|fatigue/i);
  });

  it('names the benchmark median and personal-best comparison accurately', () => {
    const round: GameResult = { ...result, mode: 'reactionBenchmark', score: 10, medianReactionTimeMs: 300 };
    const delta = getRoundProgressDelta(round, { score: 10, accuracy: 50, bestStreak: 2, medianReactionTimeMs: 280 });
    const read = buildPerformanceRead({ result: round, stats: statsFor(round, 2), roundProgressDelta: delta });
    expect(read.whatThisTrains).toContain('median reaction was 20 ms slower');
    expect(read.whatThisTrains).toContain('personal best');
    expect(read.whatThisTrains).not.toContain('average');
  });
});

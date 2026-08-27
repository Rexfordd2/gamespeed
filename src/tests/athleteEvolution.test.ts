import { describe, expect, it } from 'vitest';
import { GameStats, StoredRound } from '../types/game';
import { PrimeSessionRecord } from '../types/prime';
import { emptyStats } from '../utils/sessionStats';
import { buildAthleteEvolution } from '../utils/athleteEvolution';
import { ChoiceReactionMetrics } from '../types/choiceReaction';
import { ComprehensionMetrics } from '../types/rapidComprehension';
import { GoNoGoMetrics } from '../types/goNoGo';
import { SchulteScanMetrics } from '../types/schulte';

const DAY = 86_400_000;
const NOW = Date.parse('2026-08-27T15:00:00.000Z');

const round = (overrides: Partial<StoredRound> & Pick<StoredRound, 'mode' | 'modeName'>): StoredRound => ({
  ts: NOW,
  score: 10,
  misses: 2,
  accuracy: 83,
  bestStreak: 4,
  sport: 'soccer',
  ...overrides,
});

const schulte = (overrides: Partial<SchulteScanMetrics> = {}): SchulteScanMetrics => ({
  gridSize: 5,
  variant: 'static',
  stimulusSet: 'numbers',
  sequenceRule: 'ascending',
  boardsCompleted: 1,
  completionTimeMs: 12_000,
  correctSelections: 25,
  errors: 1,
  accuracyPct: 96,
  averageTransitionMs: 480,
  fastestTransitionMs: 300,
  slowestTransitionMs: 700,
  lateRoundSlowdownMs: null,
  completionStatus: 'completed',
  ...overrides,
});

const goNoGo = (overrides: Partial<GoNoGoMetrics> = {}): GoNoGoMetrics => ({
  goCount: 10,
  nogoCount: 8,
  correctGo: 9,
  missedGo: 1,
  correctInhibitions: 8,
  falsePositives: 0,
  prematureResponses: 0,
  goReactionTimeMs: 240,
  averageGoReactionMs: 250,
  inhibitionAccuracyPct: 100,
  overallAccuracyPct: 94,
  bestStreak: 6,
  performanceDecayMs: null,
  ...overrides,
});

const choice = (overrides: Partial<ChoiceReactionMetrics> = {}): ChoiceReactionMetrics => ({
  decisionAccuracyPct: 88,
  meanChoiceReactionMs: 310,
  wrongResponseCount: 1,
  omissions: 0,
  falseStarts: 0,
  prematureResponses: 0,
  correct: 8,
  trialsResolved: 9,
  bestStreak: 5,
  consistencyPct: 80,
  ruleSwitchCostMs: 20,
  byResponse: {},
  ...overrides,
});

const comprehension = (overrides: Partial<ComprehensionMetrics> = {}): ComprehensionMetrics => ({
  comprehensionAccuracyPct: 80,
  meanAnswerReactionMs: 420,
  encodingFailures: 0,
  wrong: 1,
  correct: 4,
  trialsResolved: 5,
  difficultyReached: 2,
  bestStreak: 3,
  prematureResponses: 0,
  performanceDecayMs: null,
  byFamily: {},
  ...overrides,
});

const prime = (index: number, overrides: Partial<PrimeSessionRecord> = {}): PrimeSessionRecord => ({
  id: `prime-${index}`,
  ts: NOW - index * DAY,
  protocolId: 'gamespeed-prime',
  protocolName: 'GameSpeed Prime',
  context: 'practice',
  sport: 'soccer',
  status: 'completed',
  startedAt: NOW - index * DAY,
  endedAt: NOW - index * DAY + 180_000,
  totalDurationMs: 180_000,
  stepResults: [],
  summary: {
    stepsCompleted: 5,
    stepsSkipped: 0,
    totalDurationSeconds: 180,
    averageAccuracyPct: 80,
    averageReactionMs: 260,
    trackingAccuracyPct: 80,
    consistencyPct: 70,
    strongestArea: null,
    areaToRevisit: null,
    vsPrevious: null,
  },
  ...overrides,
});

const statsFrom = (rounds: StoredRound[]): GameStats => ({
  version: 2,
  rounds,
  pbs: {},
});

describe('athlete evolution honesty', () => {
  it('starts on Trail with no invented trends, XP, or achievements', () => {
    const evolution = buildAthleteEvolution(emptyStats(), [], NOW);

    expect(evolution.path.current.id).toBe('trail');
    expect(evolution.path.completedPrimes).toBe(0);
    expect(evolution.earnedCount).toBe(0);
    expect(evolution.trends.every(trend => !trend.ready || trend.id === 'consistency')).toBe(true);
    expect(evolution.trends.find(trend => trend.id === 'reaction')?.summary).toMatch(/Need 2/);
    expect(evolution.instincts.every(instinct => instinct.status === 'untrained')).toBe(true);
  });

  it('moves Trail → Canopy → Hunter from completed Primes, not fake XP', () => {
    expect(buildAthleteEvolution(emptyStats(), [prime(0)], NOW).path.current.id).toBe('canopy');
    expect(
      buildAthleteEvolution(
        emptyStats(),
        Array.from({ length: 7 }, (_, index) => prime(index)),
        NOW,
      ).path.current.id,
    ).toBe('hunter');
  });

  it('does not award Predator from Prime volume alone', () => {
    const primes = Array.from({ length: 14 }, (_, index) => prime(index));
    const evolution = buildAthleteEvolution(emptyStats(), primes, NOW);

    expect(evolution.path.current.id).toBe('hunter');
    expect(evolution.path.next?.id).toBe('predator');
    expect(evolution.path.progressLabel).toMatch(/0\/4 cognitive instincts/);
  });

  it('awards Predator only after 14 Primes and all four expansion instincts', () => {
    const rounds = [
      round({
        mode: 'schulteScan',
        modeName: 'Macaw Scan',
        meta: { metricsVersion: 1, schulteMetrics: schulte() },
      }),
      round({
        mode: 'goNoGo',
        modeName: 'Caiman Control',
        meta: { metricsVersion: 1, goNoGoMetrics: goNoGo() },
      }),
      round({
        mode: 'choiceReaction',
        modeName: 'Mongoose Read',
        meta: { metricsVersion: 1, choiceReactionMetrics: choice() },
      }),
      round({
        mode: 'rapidComprehension',
        modeName: 'Chameleon Read',
        meta: { metricsVersion: 1, rapidComprehensionMetrics: comprehension() },
      }),
    ];
    const evolution = buildAthleteEvolution(
      statsFrom(rounds),
      Array.from({ length: 14 }, (_, index) => prime(index)),
      NOW,
    );

    expect(evolution.path.current.id).toBe('predator');
  });

  it('requires a 7-day training streak plus 21 Primes for Apex', () => {
    const rounds = Array.from({ length: 7 }, (_, index) =>
      round({
        ts: NOW - index * DAY,
        mode: 'quickTap',
        modeName: 'Quick Tap',
      }),
    ).concat([
      round({
        mode: 'schulteScan',
        modeName: 'Macaw Scan',
        meta: { metricsVersion: 1, schulteMetrics: schulte() },
      }),
      round({
        mode: 'goNoGo',
        modeName: 'Caiman Control',
        meta: { metricsVersion: 1, goNoGoMetrics: goNoGo() },
      }),
      round({
        mode: 'choiceReaction',
        modeName: 'Mongoose Read',
        meta: { metricsVersion: 1, choiceReactionMetrics: choice() },
      }),
      round({
        mode: 'rapidComprehension',
        modeName: 'Chameleon Read',
        meta: { metricsVersion: 1, rapidComprehensionMetrics: comprehension() },
      }),
    ]);

    const withoutStreak = buildAthleteEvolution(
      statsFrom(rounds.slice(7)),
      Array.from({ length: 21 }, (_, index) => prime(index)),
      NOW,
    );
    expect(withoutStreak.path.current.id).toBe('predator');

    const withStreak = buildAthleteEvolution(
      statsFrom(rounds),
      Array.from({ length: 21 }, (_, index) => prime(index)),
      NOW,
    );
    expect(withStreak.path.current.id).toBe('apex');
  });

  it('shows a reaction trend only with two baseline samples and compares against the first mark', () => {
    const one = buildAthleteEvolution(
      statsFrom([
        round({
          mode: 'reactionBenchmark',
          modeName: 'Reaction Benchmark',
          medianReactionTimeMs: 280,
        }),
      ]),
      [],
      NOW,
    );
    expect(one.trends.find(trend => trend.id === 'reaction')?.ready).toBe(false);

    const two = buildAthleteEvolution(
      statsFrom([
        round({
          ts: NOW - DAY,
          mode: 'reactionBenchmark',
          modeName: 'Reaction Benchmark',
          medianReactionTimeMs: 280,
        }),
        round({
          ts: NOW,
          mode: 'reactionBenchmark',
          modeName: 'Reaction Benchmark',
          medianReactionTimeMs: 248,
        }),
      ]),
      [],
      NOW,
    );
    const reaction = two.trends.find(trend => trend.id === 'reaction');
    expect(reaction?.ready).toBe(true);
    expect(reaction?.delta).toBe(-32);
    expect(reaction?.summary).toMatch(/32 ms better/);
  });

  it('does not mix 3×3 Schulte times into the 5×5 visual-search trend', () => {
    const evolution = buildAthleteEvolution(
      statsFrom([
        round({
          ts: NOW - DAY,
          mode: 'schulteScan',
          modeName: 'Macaw Scan',
          meta: { metricsVersion: 1, schulteMetrics: schulte({ gridSize: 3, completionTimeMs: 4000 }) },
        }),
        round({
          ts: NOW,
          mode: 'schulteScan',
          modeName: 'Macaw Scan',
          meta: {
            metricsVersion: 1,
            schulteMetrics: schulte({ gridSize: 5, completionTimeMs: 11_000, completionStatus: 'partial' }),
          },
        }),
      ]),
      [],
      NOW,
    );
    const search = evolution.trends.find(trend => trend.id === 'visualSearch');
    expect(search?.samples).toBe(0);
    expect(search?.ready).toBe(false);
  });

  it('earns honest achievements from stored training, not taps or currency', () => {
    const rounds = [
      round({
        ts: NOW - DAY,
        mode: 'reactionBenchmark',
        modeName: 'Reaction Benchmark',
        medianReactionTimeMs: 300,
      }),
      round({
        ts: NOW,
        mode: 'reactionBenchmark',
        modeName: 'Reaction Benchmark',
        medianReactionTimeMs: 240,
      }),
      round({
        mode: 'goNoGo',
        modeName: 'Caiman Control',
        meta: { metricsVersion: 1, goNoGoMetrics: goNoGo({ inhibitionAccuracyPct: 96 }) },
      }),
      round({
        mode: 'schulteScan',
        modeName: 'Macaw Scan',
        meta: { metricsVersion: 1, schulteMetrics: schulte({ completionTimeMs: 9800 }) },
      }),
      round({
        mode: 'choiceReaction',
        modeName: 'Mongoose Read',
        meta: { metricsVersion: 1, choiceReactionMetrics: choice() },
      }),
      round({
        mode: 'rapidComprehension',
        modeName: 'Chameleon Read',
        meta: { metricsVersion: 1, rapidComprehensionMetrics: comprehension() },
      }),
    ];
    const primes = Array.from({ length: 7 }, (_, index) =>
      prime(index, { context: 'game', ts: NOW - index * DAY }),
    );
    const evolution = buildAthleteEvolution(statsFrom(rounds), primes, NOW);
    const earned = Object.fromEntries(evolution.achievements.map(item => [item.id, item.earned]));

    expect(earned['prime-7']).toBe(true);
    expect(earned['reaction-pb']).toBe(true);
    expect(earned['inhibition-95']).toBe(true);
    expect(earned['schulte-5x5-pb']).toBe(true);
    expect(earned['cognitive-all']).toBe(true);
    expect(earned['pregame-streak']).toBe(true);
  });

  it('does not treat missing cognitive meta as a trained instinct', () => {
    const evolution = buildAthleteEvolution(
      statsFrom([
        round({
          mode: 'goNoGo',
          modeName: 'Caiman Control',
        }),
        round({
          mode: 'schulteScan',
          modeName: 'Macaw Scan',
          meta: { metricsVersion: 1 },
        }),
      ]),
      [],
      NOW,
    );

    expect(evolution.instincts.find(item => item.id === 'control')?.status).toBe('untrained');
    expect(evolution.instincts.find(item => item.id === 'visualSearch')?.status).toBe('untrained');
    expect(evolution.achievements.find(item => item.id === 'inhibition-95')?.earned).toBe(false);
  });

  it('ignores cancelled Prime sessions when counting path progress', () => {
    const evolution = buildAthleteEvolution(
      emptyStats(),
      [prime(0, { status: 'cancelled' }), prime(1, { status: 'completed' })],
      NOW,
    );
    expect(evolution.path.completedPrimes).toBe(1);
    expect(evolution.path.current.id).toBe('canopy');
  });
});

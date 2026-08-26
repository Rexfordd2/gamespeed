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

  it('persists Macaw Scan metrics without rewriting other mode history', () => {
    recordRound({
      score: 9,
      misses: 1,
      bestStreak: 9,
      mode: 'quickTap',
      modeName: 'Quick Tap',
    });
    recordRound({
      score: 9,
      misses: 1,
      bestStreak: 9,
      mode: 'schulteScan',
      modeName: 'Macaw Scan',
      schulteMetrics: {
        gridSize: 3,
        variant: 'static',
        stimulusSet: 'numbers',
        sequenceRule: 'ascending',
        boardsCompleted: 1,
        completionTimeMs: 12_400,
        correctSelections: 9,
        errors: 1,
        accuracyPct: 90,
        averageTransitionMs: 180,
        fastestTransitionMs: 90,
        slowestTransitionMs: 310,
        lateRoundSlowdownMs: 40,
        completionStatus: 'partial',
      },
    });

    const reloaded = loadStats();
    const macaw = reloaded.rounds.find(round => round.mode === 'schulteScan');
    const tap = reloaded.rounds.find(round => round.mode === 'quickTap');
    expect(macaw?.meta?.schulteMetrics?.correctSelections).toBe(9);
    expect(macaw?.meta?.schulteMetrics?.errors).toBe(1);
    expect(macaw?.meta?.schulteMetrics?.averageTransitionMs).toBe(180);
    expect(tap?.meta?.schulteMetrics).toBeUndefined();
  });

  it('persists Caiman Control GO/NO-GO metrics without rewriting other mode history', () => {
    recordRound({
      score: 12,
      misses: 2,
      bestStreak: 6,
      mode: 'quickTap',
      modeName: 'Quick Tap',
    });
    recordRound({
      score: 8,
      misses: 3,
      bestStreak: 4,
      mode: 'goNoGo',
      modeName: 'Caiman Control',
      goNoGoMetrics: {
        goCount: 7,
        nogoCount: 4,
        correctGo: 6,
        missedGo: 1,
        correctInhibitions: 3,
        falsePositives: 1,
        prematureResponses: 2,
        goReactionTimeMs: 240,
        averageGoReactionMs: 240,
        inhibitionAccuracyPct: 75,
        overallAccuracyPct: 82,
        bestStreak: 4,
        performanceDecayMs: 30,
      },
    });

    const reloaded = loadStats();
    const caiman = reloaded.rounds.find(round => round.mode === 'goNoGo');
    const tap = reloaded.rounds.find(round => round.mode === 'quickTap');
    expect(caiman?.meta?.goNoGoMetrics?.correctGo).toBe(6);
    expect(caiman?.meta?.goNoGoMetrics?.falsePositives).toBe(1);
    expect(caiman?.meta?.goNoGoMetrics?.missedGo).toBe(1);
    expect(caiman?.meta?.goNoGoMetrics?.prematureResponses).toBe(2);
    expect(tap?.meta?.goNoGoMetrics).toBeUndefined();
  });

  it('persists Mongoose Read choice-reaction metrics without rewriting other mode history', () => {
    recordRound({
      score: 12,
      misses: 2,
      bestStreak: 6,
      mode: 'quickTap',
      modeName: 'Quick Tap',
    });
    recordRound({
      score: 9,
      misses: 4,
      bestStreak: 3,
      mode: 'choiceReaction',
      modeName: 'Mongoose Read',
      choiceReactionMetrics: {
        decisionAccuracyPct: 69,
        meanChoiceReactionMs: 312,
        wrongResponseCount: 2,
        omissions: 2,
        falseStarts: 1,
        prematureResponses: 1,
        correct: 9,
        trialsResolved: 13,
        bestStreak: 3,
        consistencyPct: 74,
        ruleSwitchCostMs: 40,
        byResponse: {
          tap: { attempts: 5, correct: 4, meanRtMs: 280 },
          swipeLeft: { attempts: 4, correct: 3, meanRtMs: 340 },
          nogo: { attempts: 4, correct: 2, meanRtMs: null },
        },
      },
    });

    const reloaded = loadStats();
    const mongoose = reloaded.rounds.find(round => round.mode === 'choiceReaction');
    const tap = reloaded.rounds.find(round => round.mode === 'quickTap');
    expect(mongoose?.meta?.choiceReactionMetrics?.decisionAccuracyPct).toBe(69);
    expect(mongoose?.meta?.choiceReactionMetrics?.meanChoiceReactionMs).toBe(312);
    expect(mongoose?.meta?.choiceReactionMetrics?.wrongResponseCount).toBe(2);
    expect(mongoose?.meta?.choiceReactionMetrics?.falseStarts).toBe(1);
    expect(tap?.meta?.choiceReactionMetrics).toBeUndefined();
  });
});

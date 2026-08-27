import { afterEach, describe, expect, it } from 'vitest';
import { GameModeType, GameResult } from '../types/game';
import { PrimeSessionRecord, PrimeStepResult } from '../types/prime';
import { gamespeedPrimeProtocol } from '../config/primeProtocols';
import { buildPrimeSummary } from '../utils/primeMetrics';
import {
  PRIME_SESSIONS_STORAGE_KEY,
  clearPrimeSessions,
  getCompletedPrimeSessions,
  loadPrimeSessions,
  recordPrimeSession,
} from '../utils/primePersistence';
import { deriveReadinessMetrics } from '../utils/readinessMetrics';

const drillResult = (mode: GameModeType, score: number, misses: number): GameResult => ({
  score,
  misses,
  bestStreak: 3,
  mode,
  modeName: mode,
  totalAttempts: score + misses,
  readinessMetrics: deriveReadinessMetrics({
    score,
    misses,
    totalAttempts: score + misses,
    reactionTimesMs: [250, 270, 290],
    streakRuns: [3],
  }),
});

const completedStep = (
  stepId: string,
  mode: GameModeType,
  score: number,
  misses: number,
): PrimeStepResult => ({
  stepId,
  status: 'completed',
  modeId: mode,
  durationMs: 60_000,
  gameResult: drillResult(mode, score, misses),
});

afterEach(() => {
  clearPrimeSessions();
});

describe('prime metrics', () => {
  it('summarizes only captured data and omits invented readiness scores', () => {
    const summary = buildPrimeSummary({
      protocol: gamespeedPrimeProtocol,
      stepResults: [
        completedStep('settle', 'calmFocus', 10, 2),
        completedStep('see', 'peripheralPulse', 8, 4),
        completedStep('react', 'quickTap', 14, 1),
        completedStep('track', 'holdTrack', 9, 1),
        { stepId: 'move', status: 'skipped', durationMs: 400 },
      ],
      totalDurationMs: 245_000,
    });

    expect(summary.stepsCompleted).toBe(4);
    expect(summary.stepsSkipped).toBe(1);
    expect(summary.totalDurationSeconds).toBe(245);
    expect(summary.averageAccuracyPct).toBe(83);
    expect(summary.averageReactionMs).toBe(270);
    expect(summary.trackingAccuracyPct).toBe(90);
    expect(summary.consistencyPct).toBeGreaterThan(0);
    expect(summary.strongestArea?.stepId).toBe('react');
    expect(summary.areaToRevisit?.stepId).toBe('see');
    expect(summary.vsPrevious).toBeNull();
    expect(summary.physicalCue).toBeNull();
    expect(summary).not.toHaveProperty('readinessScore');
    expect(summary).not.toHaveProperty('neuralReadinessBand');
  });

  it('records physical-cue counts without inventing movement-quality scores', () => {
    const summary = buildPrimeSummary({
      protocol: gamespeedPrimeProtocol,
      stepResults: [
        completedStep('react', 'quickTap', 9, 1),
        {
          stepId: 'move',
          status: 'completed',
          durationMs: 12_000,
          physicalCue: {
            moduleId: 'jaguar-movement',
            cueCount: 6,
            presentedCueCount: 6,
            cueIntervalMs: 2050,
            athleteConfirmed: true,
            durationMs: 12_000,
          },
        },
      ],
      totalDurationMs: 80_000,
    });

    expect(summary.physicalCue).toEqual({
      cueCount: 6,
      presentedCueCount: 6,
      cueIntervalMs: 2050,
      athleteConfirmed: true,
    });
    expect(JSON.stringify(summary.physicalCue)).not.toMatch(/quality|form|verified/i);
  });

  it('compares a completed Prime against the previous session for the same protocol', () => {
    const previous: PrimeSessionRecord = {
      id: 'prev',
      ts: 1,
      protocolId: gamespeedPrimeProtocol.id,
      protocolName: gamespeedPrimeProtocol.name,
      context: 'practice',
      sport: 'soccer',
      status: 'completed',
      startedAt: 1,
      endedAt: 2,
      totalDurationMs: 300_000,
      stepResults: [],
      summary: {
        stepsCompleted: 5,
        stepsSkipped: 0,
        totalDurationSeconds: 300,
        averageAccuracyPct: 70,
        averageReactionMs: 280,
        trackingAccuracyPct: 80,
        consistencyPct: 60,
        strongestArea: null,
        areaToRevisit: null,
        vsPrevious: null,
      },
    };

    const summary = buildPrimeSummary({
      protocol: gamespeedPrimeProtocol,
      stepResults: [completedStep('react', 'quickTap', 9, 1)],
      totalDurationMs: 280_000,
      previousSessions: [previous],
    });

    expect(summary.vsPrevious?.accuracyDeltaPct).toBe(20);
    expect(summary.vsPrevious?.durationDeltaSeconds).toBe(-20);
  });
});

describe('prime session persistence', () => {
  it('stores Prime sessions separately from standalone round history', () => {
    const record: PrimeSessionRecord = {
      id: 'prime-1',
      ts: 10,
      protocolId: gamespeedPrimeProtocol.id,
      protocolName: gamespeedPrimeProtocol.name,
      context: 'game',
      sport: 'soccer',
      status: 'completed',
      startedAt: 1,
      endedAt: 10,
      totalDurationMs: 9,
      stepResults: [],
      summary: {
        stepsCompleted: 5,
        stepsSkipped: 1,
        totalDurationSeconds: 9,
        averageAccuracyPct: 80,
        averageReactionMs: 250,
        trackingAccuracyPct: 90,
        consistencyPct: 70,
        strongestArea: null,
        areaToRevisit: null,
        vsPrevious: null,
      },
    };

    recordPrimeSession(record);
    expect(localStorage.getItem(PRIME_SESSIONS_STORAGE_KEY)).toContain('prime-1');
    expect(loadPrimeSessions()).toHaveLength(1);
    expect(getCompletedPrimeSessions()[0].id).toBe('prime-1');
    expect(localStorage.getItem('gamespeed_stats_v1')).toBeNull();
  });

  it('ignores malformed stored Prime sessions', () => {
    localStorage.setItem(
      PRIME_SESSIONS_STORAGE_KEY,
      JSON.stringify({ version: 1, sessions: [{ id: 'bad' }, { protocolId: 'x' }] }),
    );
    expect(loadPrimeSessions()).toEqual([]);
  });
});

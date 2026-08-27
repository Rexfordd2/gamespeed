import { describe, expect, it } from 'vitest';
import { GameResult, GameModeType } from '../types/game';
import { PrimeProtocol } from '../types/prime';
import {
  GAMESPEED_PRIME_PROTOCOL_ID,
  gamespeedPrimeProtocol,
  getPrimeExecutableSteps,
  validatePrimeProtocol,
} from '../config/primeProtocols';
import {
  PrimeEngineError,
  cancelPrimeSession,
  completeCurrentPrimeStep,
  createPrimeSession,
  getCurrentPrimeStep,
  getPrimeProgress,
  isPrimeStepSkippable,
  skipCurrentPrimeStep,
  startCurrentPrimeStep,
} from '../utils/primeEngine';
import { deriveReadinessMetrics } from '../utils/readinessMetrics';

const drillResult = (mode: GameModeType, score = 12, misses = 3): GameResult => {
  const reactionTimesMs = [240, 260, 280];
  return {
    score,
    misses,
    bestStreak: 4,
    mode,
    modeName: mode,
    totalAttempts: score + misses,
    readinessMetrics: deriveReadinessMetrics({
      score,
      misses,
      totalAttempts: score + misses,
      reactionTimesMs,
      streakRuns: [4],
    }),
  };
};

const startAndComplete = (
  state: ReturnType<typeof createPrimeSession>,
  now: number,
  result?: GameResult,
) => {
  const running = startCurrentPrimeStep(state, now);
  return completeCurrentPrimeStep(running, now + 1_000, result);
};

describe('prime protocol config', () => {
  it('validates the initial GameSpeed Prime protocol against playable modes', () => {
    expect(validatePrimeProtocol(gamespeedPrimeProtocol)).toEqual([]);
    expect(gamespeedPrimeProtocol.id).toBe(GAMESPEED_PRIME_PROTOCOL_ID);
    expect(getPrimeExecutableSteps(gamespeedPrimeProtocol).map(step => step.id)).toEqual([
      'settle',
      'see',
      'scan',
      'react',
      'control',
      'process',
      'decide',
      'track',
      'move',
    ]);
    expect(gamespeedPrimeProtocol.steps.map(step => step.modeId)).toEqual([
      'calmFocus',
      'peripheralPulse',
      'schulteScan',
      'quickTap',
      'goNoGo',
      'rapidComprehension',
      'choiceReaction',
      'holdTrack',
      undefined,
      undefined,
    ]);
  });

  it('rejects a drill without a playable mode', () => {
    const invalid: PrimeProtocol = {
      ...gamespeedPrimeProtocol,
      id: '',
      steps: [
        {
          id: 'broken',
          category: 'react',
          kind: 'drill',
          title: 'Broken',
          experienceName: 'Broken',
          instruction: 'nope',
        },
      ],
    };
    expect(validatePrimeProtocol(invalid).length).toBeGreaterThan(0);
  });
});

describe('prime engine', () => {
  const startSession = (now = 1_000) =>
    createPrimeSession({
      protocol: gamespeedPrimeProtocol,
      context: 'practice',
      sport: 'soccer',
      now,
      sessionId: 'prime-test',
    });

  it('starts on the settle transition and walks start → transitions → summary', () => {
    let now = 1_000;
    let state = startSession(now);
    expect(state.phase).toBe('transition');
    expect(getCurrentPrimeStep(state)?.id).toBe('settle');
    expect(isPrimeStepSkippable(getCurrentPrimeStep(state))).toBe(false);

    const sequence: Array<{ id: string; mode?: GameModeType }> = [
      { id: 'settle', mode: 'calmFocus' },
      { id: 'see', mode: 'peripheralPulse' },
      { id: 'scan', mode: 'schulteScan' },
      { id: 'react', mode: 'quickTap' },
      { id: 'control', mode: 'goNoGo' },
      { id: 'process', mode: 'rapidComprehension' },
      { id: 'decide', mode: 'choiceReaction' },
      { id: 'track', mode: 'holdTrack' },
    ];

    sequence.forEach(step => {
      expect(getCurrentPrimeStep(state)?.id).toBe(step.id);
      expect(state.phase).toBe('transition');
      now += 500;
      state = startCurrentPrimeStep(state, now);
      expect(state.phase).toBe('running');
      now += 60_000;
      state = completeCurrentPrimeStep(state, now, drillResult(step.mode as GameModeType));
    });

    expect(getCurrentPrimeStep(state)?.id).toBe('move');
    expect(state.phase).toBe('transition');
    expect(isPrimeStepSkippable(getCurrentPrimeStep(state))).toBe(true);
    now += 200;
    state = skipCurrentPrimeStep(state, now);
    expect(state.phase).toBe('summary');
    expect(state.results).toHaveLength(9);
    expect(state.results.filter(result => result.status === 'completed')).toHaveLength(8);
    expect(state.results[8]).toMatchObject({ stepId: 'move', status: 'skipped' });
    expect(getPrimeProgress(state, now).percent).toBe(100);
  });

  it('refuses skip after a step has started and on required drills', () => {
    const state = startSession();
    expect(() => skipCurrentPrimeStep(state)).toThrow(PrimeEngineError);
    const running = startCurrentPrimeStep(state, 2_000);
    expect(() => skipCurrentPrimeStep(running, 3_000)).toThrow(/cannot skip a step after it has started/);
  });

  it('cancels from a running step without reaching summary', () => {
    const started = startCurrentPrimeStep(startSession(1_000), 1_100);
    const cancelled = cancelPrimeSession(started, 1_500);
    expect(cancelled.phase).toBe('cancelled');
    expect(cancelled.results).toHaveLength(0);
  });

  it('requires a game result to complete a drill', () => {
    const running = startCurrentPrimeStep(startSession(), 2_000);
    expect(() => completeCurrentPrimeStep(running, 3_000)).toThrow(/drill completion requires a game result/);
  });

  it('tracks elapsed time and protocol progress across completed steps', () => {
    let now = 5_000;
    let state = startSession(now);
    now += 1_000;
    state = startAndComplete(state, now, drillResult('calmFocus'));
    const progress = getPrimeProgress(state, now + 1_000);
    expect(progress.executableStepCount).toBe(9);
    expect(progress.percent).toBe(11);
    expect(progress.elapsedMs).toBe(2_000);
    expect(progress.phase).toBe('transition');
  });
});

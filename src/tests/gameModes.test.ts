import { describe, it, expect } from 'vitest';
import { generateTargets as quickTap } from '../modes/quickTap';
import { generateTargets as multiTarget } from '../modes/multiTarget';
import { generateTargets as swipeStrike } from '../modes/swipeStrike';
import { generateTargets as holdTrack } from '../modes/holdTrack';
import {
  generateSequenceTargets,
  getSequenceLengthForSuccesses,
} from '../modes/sequenceMemory';
import { gameModes } from '../utils/gameModes';
import { GameModeType } from '../types/game';

const screen = { width: 1024, height: 768 };
const base = { screenSize: screen, existingTargets: [], currentTime: Date.now() };

// ---- quickTap ----------------------------------------------------------------

describe('quickTap.generateTargets', () => {
  it('returns exactly one target when none exist', () => {
    expect(quickTap({ ...base, existingTargets: [] })).toHaveLength(1);
  });

  it('target has all required fields', () => {
    const [t] = quickTap(base);
    expect(t).toMatchObject({
      id: expect.any(String),
      x: expect.any(Number),
      y: expect.any(Number),
      type: 'monkey',
      createdAt: expect.any(Number),
      duration: expect.any(Number),
      lifespan: expect.any(Number),
    });
  });

  it('target is positioned within the 10-90 safe zone', () => {
    for (let i = 0; i < 30; i++) {
      const [t] = quickTap({ ...base, existingTargets: [] });
      expect(t.x).toBeGreaterThanOrEqual(10);
      expect(t.x).toBeLessThanOrEqual(90);
      expect(t.y).toBeGreaterThanOrEqual(15);
      expect(t.y).toBeLessThanOrEqual(90);
    }
  });

  it('reuses an active target rather than spawning a new one', () => {
    const active = {
      id: 'active',
      x: 50, y: 50,
      type: 'monkey' as const,
      createdAt: Date.now(),
      duration: 1.5,
      lifespan: 1.5,
    };
    const result = quickTap({ ...base, existingTargets: [active], maxTargets: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('active');
  });

  it('replaces an expired target with a new one', () => {
    const expired = {
      id: 'expired',
      x: 50, y: 50,
      type: 'monkey' as const,
      createdAt: Date.now() - 10_000,
      duration: 1.5,
      lifespan: 1.5,
    };
    const result = quickTap({ ...base, existingTargets: [expired] });
    expect(result).toHaveLength(1);
    expect(result[0].id).not.toBe('expired');
  });

  it('respects custom targetLifespan', () => {
    const [t] = quickTap({ ...base, targetLifespan: 2.0 });
    expect(t.lifespan).toBe(2.0);
    expect(t.duration).toBe(2.0);
  });
});

// ---- multiTarget -------------------------------------------------------------

describe('multiTarget.generateTargets', () => {
  it('returns 5 targets by default when none exist', () => {
    expect(multiTarget({ ...base, existingTargets: [] })).toHaveLength(5);
  });

  it('respects a custom maxTargets value', () => {
    const result = multiTarget({ ...base, existingTargets: [], maxTargets: 3 });
    expect(result).toHaveLength(3);
  });

  it('each target has a unique id', () => {
    const targets = multiTarget({ ...base, existingTargets: [] });
    const ids = targets.map(t => t.id);
    expect(new Set(ids).size).toBe(targets.length);
  });

  it('respects custom targetLifespan', () => {
    const targets = multiTarget({ ...base, targetLifespan: 3.0 });
    targets.forEach(t => {
      expect(t.lifespan).toBe(3.0);
    });
  });

  it('all targets in a wave share the same createdAt timestamp', () => {
    const targets = multiTarget({ ...base, existingTargets: [] });
    const timestamps = new Set(targets.map(t => t.createdAt));
    expect(timestamps.size).toBe(1);
  });

  it('reuses active targets instead of spawning a new wave', () => {
    const now = Date.now();
    const active = Array.from({ length: 3 }, (_, i) => ({
      id: `keep-${i}`,
      x: 30 + i * 10, y: 50,
      type: 'monkey' as const,
      createdAt: now,
      duration: 2.5,
      lifespan: 2.5,
    }));
    const result = multiTarget({ ...base, existingTargets: active });
    expect(result).toHaveLength(3);
    expect(result.map(t => t.id)).toEqual(active.map(t => t.id));
  });
});

// ---- gameModes registry -------------------------------------------------------

describe('gameModes registry', () => {
  it('contains all v1.2 modes as playable', () => {
    expect(gameModes.quickTap).toBeDefined();
    expect(gameModes.multiTarget).toBeDefined();
    expect(gameModes.swipeStrike).toBeDefined();
    expect(gameModes.holdTrack).toBeDefined();
    expect(gameModes.sequenceMemory).toBeDefined();
    expect(gameModes.quickTap.availability).toBe('playable');
    expect(gameModes.multiTarget.availability).toBe('playable');
    expect(gameModes.swipeStrike.availability).toBe('playable');
    expect(gameModes.holdTrack.availability).toBe('playable');
    expect(gameModes.sequenceMemory.availability).toBe('playable');
  });

  it('every mode has a generateTargets function', () => {
    for (const [, mode] of Object.entries(gameModes)) {
      expect(typeof mode.generateTargets).toBe('function');
    }
  });

  it('every mode config has required numeric fields', () => {
    for (const [, mode] of Object.entries(gameModes)) {
      expect(typeof mode.config.maxTargets).toBe('number');
      expect(typeof mode.config.targetInterval).toBe('number');
      expect(typeof mode.config.targetLifespan).toBe('number');
    }
  });

  it('every mode generates targets without throwing', () => {
    for (const [, mode] of Object.entries(gameModes)) {
      expect(() =>
        mode.generateTargets({
          screenSize: screen,
          existingTargets: [],
          currentTime: Date.now(),
          maxTargets: mode.config.maxTargets,
          targetLifespan: mode.config.targetLifespan,
        }),
      ).not.toThrow();
    }
  });

  it('quickTap maxTargets is 1', () => {
    expect(gameModes.quickTap.config.maxTargets).toBe(1);
  });

  it('multiTarget maxTargets is 5', () => {
    expect(gameModes.multiTarget.config.maxTargets).toBe(5);
  });

  it('playable advanced modes still produce targets (generator must not crash)', () => {
    const advancedModes: GameModeType[] = ['sequenceMemory', 'holdTrack', 'swipeStrike'];
    for (const key of advancedModes) {
      const mode = gameModes[key];
      const result = mode.generateTargets({
        screenSize: screen,
        existingTargets: [],
        currentTime: Date.now(),
        maxTargets: mode.config.maxTargets,
        targetLifespan: mode.config.targetLifespan,
      });
      expect(result.length).toBeGreaterThan(0);
    }
  });
});

// ---- swipeStrike --------------------------------------------------------------

describe('swipeStrike.generateTargets', () => {
  it('returns one moving target with swipe metadata', () => {
    const [target] = swipeStrike({ ...base, existingTargets: [] });
    expect(target).toBeDefined();
    expect(target.swipeDirection).toMatch(/left|right|up|down/);
    expect(target.movement).toEqual({
      fromX: expect.any(Number),
      fromY: expect.any(Number),
      toX: expect.any(Number),
      toY: expect.any(Number),
    });
  });

  it('spawns the target at the movement start point', () => {
    const [target] = swipeStrike({ ...base, existingTargets: [] });
    expect(target.movement).toBeDefined();
    expect(target.x).toBe(target.movement?.fromX);
    expect(target.y).toBe(target.movement?.fromY);
  });

  it('reuses active swipe targets', () => {
    const now = Date.now();
    const active = {
      id: 'swipe-active',
      x: 50,
      y: 50,
      type: 'monkey' as const,
      createdAt: now,
      duration: 2.1,
      lifespan: 2.1,
      swipeDirection: 'right' as const,
      movement: { fromX: 35, fromY: 50, toX: 65, toY: 50 },
    };
    const result = swipeStrike({ ...base, existingTargets: [active] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('swipe-active');
  });
});

// ---- holdTrack --------------------------------------------------------------

describe('holdTrack.generateTargets', () => {
  it('returns one moving hold target with hold metadata', () => {
    const [target] = holdTrack({ ...base, existingTargets: [] });
    expect(target).toBeDefined();
    expect(target.hold).toEqual({
      requiredMs: expect.any(Number),
      breakRadiusPx: expect.any(Number),
    });
    expect(target.movement).toEqual({
      fromX: expect.any(Number),
      fromY: expect.any(Number),
      toX: expect.any(Number),
      toY: expect.any(Number),
    });
  });

  it('spawns at movement start position', () => {
    const [target] = holdTrack({ ...base, existingTargets: [] });
    expect(target.movement).toBeDefined();
    expect(target.x).toBe(target.movement?.fromX);
    expect(target.y).toBe(target.movement?.fromY);
  });

  it('reuses active hold targets while alive', () => {
    const now = Date.now();
    const active = {
      id: 'hold-active',
      x: 44,
      y: 52,
      type: 'monkey' as const,
      createdAt: now,
      duration: 3.2,
      lifespan: 3.2,
      movement: { fromX: 44, fromY: 52, toX: 60, toY: 60 },
      hold: { requiredMs: 900, breakRadiusPx: 58 },
    };
    const result = holdTrack({ ...base, existingTargets: [active] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('hold-active');
  });
});

// ---- sequenceMemory ----------------------------------------------------------

describe('sequenceMemory helpers', () => {
  it('generates spaced targets with stable sequence length', () => {
    const result = generateSequenceTargets({
      screenSize: screen,
      sequenceLength: 4,
      currentTime: Date.now(),
    });
    expect(result).toHaveLength(4);
    expect(result.every(target => target.id.startsWith('sm-'))).toBe(true);
    expect(result.every(target => target.lifespan >= 60)).toBe(true);
  });

  it('ramps difficulty every two successful sequences', () => {
    expect(getSequenceLengthForSuccesses(0)).toBe(3);
    expect(getSequenceLengthForSuccesses(1)).toBe(3);
    expect(getSequenceLengthForSuccesses(2)).toBe(4);
    expect(getSequenceLengthForSuccesses(4)).toBe(5);
    expect(getSequenceLengthForSuccesses(10)).toBe(6);
  });
});

// ---- GameResult type contract ------------------------------------------------

describe('GameResult shape', () => {
  it('has the expected keys', () => {
    const result = {
      score: 12,
      misses: 3,
      bestStreak: 5,
      mode: 'quickTap',
      modeName: 'Quick Tap',
    };
    expect(result.score).toBe(12);
    expect(result.misses).toBe(3);
    expect(result.bestStreak).toBe(5);
    expect(result.mode).toBe('quickTap');
    expect(result.modeName).toBe('Quick Tap');
  });

  it('accuracy formula holds', () => {
    const score = 12;
    const misses = 3;
    const total = score + misses;
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
    expect(accuracy).toBe(80);
  });
});

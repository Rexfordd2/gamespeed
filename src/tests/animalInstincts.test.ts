import { describe, expect, it } from 'vitest';
import {
  animalInstinctOrder,
  getAnimalInstinct,
  getExperienceName,
  getInstinctIdentityCue,
  getMechanicName,
} from '../config/animalInstincts';
import { modeManifestOrder } from '../config/modeManifest';
import { getPortraitStage, getTodaysInstinct } from '../utils/progression';
import { GameStats } from '../types/game';

describe('animal instinct registry', () => {
  it('covers every registered mode id', () => {
    expect(animalInstinctOrder).toEqual(modeManifestOrder);
    modeManifestOrder.forEach(mode => {
      const instinct = getAnimalInstinct(mode);
      expect(instinct.modeId).toBe(mode);
      expect(instinct.experienceName.length).toBeGreaterThan(0);
      expect(instinct.mechanicName.length).toBeGreaterThan(0);
      expect(instinct.tagline.length).toBeGreaterThan(0);
      expect(instinct.targetStyle.length).toBeGreaterThan(0);
      expect(getInstinctIdentityCue(mode)).toMatch(/^instinct-/);
    });
  });

  it('keeps mechanic names stable while exposing experience names', () => {
    expect(getMechanicName('quickTap')).toBe('Quick Tap');
    expect(getExperienceName('quickTap')).toBe('Cobra Strike');
    expect(getExperienceName('reactionBenchmark')).toBe('Panther Readiness');
    expect(getExperienceName('swipeStrike')).toBe('Jaguar Claw');
    expect(getExperienceName('calmFocus')).toBe('Crocodile Stillness');
  });
});

describe('today instinct and portrait depth', () => {
  it('omits today instinct until multiple mode PBs exist', () => {
    const empty: GameStats = { version: 1, rounds: [], pbs: {} };
    expect(getTodaysInstinct(empty)).toBeNull();

    const onePb: GameStats = {
      version: 1,
      rounds: [],
      pbs: {
        quickTap: { score: 20, accuracy: 80, bestStreak: 4, medianReactionTimeMs: 240 },
      },
    };
    expect(getTodaysInstinct(onePb)).toBeNull();
  });

  it('picks the weaker tracked instinct when enough PBs exist', () => {
    const stats: GameStats = {
      version: 1,
      rounds: Array.from({ length: 6 }).map((_, i) => ({
        ts: Date.now() - i * 1000,
        mode: i % 2 === 0 ? 'quickTap' : 'multiTarget',
        modeName: i % 2 === 0 ? 'Quick Tap' : 'Multi Target',
        score: 10,
        misses: 2,
        accuracy: 80,
        bestStreak: 3,
      })),
      pbs: {
        quickTap: { score: 30, accuracy: 90, bestStreak: 6, medianReactionTimeMs: 210 },
        multiTarget: { score: 12, accuracy: 55, bestStreak: 2, medianReactionTimeMs: 320 },
      },
    };
    const pick = getTodaysInstinct(stats);
    expect(pick?.mode).toBe('multiTarget');
    expect(getPortraitStage(stats, 'quickTap')).toBe('full');
    expect(getPortraitStage(stats, 'multiTarget')).toBe('eyes');
  });
});

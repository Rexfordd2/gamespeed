import { describe, expect, it } from 'vitest';
import {
  animalInstinctOrder,
  getAnimalInstinct,
  getExperienceName,
  getMechanicName,
} from '../config/animalInstincts';
import { modeManifestOrder } from '../config/modeManifest';

describe('animal instinct registry', () => {
  it('covers every registered mode id', () => {
    expect(animalInstinctOrder).toEqual(modeManifestOrder);
    modeManifestOrder.forEach(mode => {
      const instinct = getAnimalInstinct(mode);
      expect(instinct.modeId).toBe(mode);
      expect(instinct.experienceName.length).toBeGreaterThan(0);
      expect(instinct.mechanicName.length).toBeGreaterThan(0);
      expect(instinct.tagline.length).toBeGreaterThan(0);
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

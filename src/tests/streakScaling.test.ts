import { describe, expect, it } from 'vitest';
import {
  STREAK_SPEED_MAX_MULTIPLIER,
  getStreakSpeedMultiplier,
  scaleMsByStreak,
  scaleSecondsByStreak,
} from '../utils/streakScaling';

describe('streak speed scaling', () => {
  it('keeps baseline speed through streak 15', () => {
    expect(getStreakSpeedMultiplier(0)).toBe(1);
    expect(getStreakSpeedMultiplier(15)).toBe(1);
  });

  it('applies 1.2x compounding after streak 15', () => {
    expect(getStreakSpeedMultiplier(16)).toBeCloseTo(1.2, 6);
    expect(getStreakSpeedMultiplier(17)).toBeCloseTo(1.44, 6);
    expect(getStreakSpeedMultiplier(18)).toBeCloseTo(1.728, 6);
  });

  it('caps the multiplier with the documented cap constant', () => {
    expect(getStreakSpeedMultiplier(99)).toBe(STREAK_SPEED_MAX_MULTIPLIER);
  });

  it('scales milliseconds down by the streak multiplier', () => {
    expect(scaleMsByStreak(1200, 15)).toBe(1200);
    expect(scaleMsByStreak(1200, 16)).toBe(1000);
    expect(scaleMsByStreak(1200, 17)).toBe(833);
  });

  it('honors minimum guards for milliseconds and seconds', () => {
    expect(scaleMsByStreak(120, 99, 110)).toBe(110);
    expect(scaleSecondsByStreak(0.8, 99, 0.3)).toBe(0.3);
  });
});

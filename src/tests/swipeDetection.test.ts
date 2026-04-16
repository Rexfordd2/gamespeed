import { describe, expect, it } from 'vitest';
import { getSwipeDirection, isIntentionalSwipe } from '../utils/swipeDetection';

describe('swipeDetection', () => {
  it('detects primary swipe direction from movement deltas', () => {
    expect(getSwipeDirection(50, 5)).toBe('right');
    expect(getSwipeDirection(-40, 3)).toBe('left');
    expect(getSwipeDirection(4, -35)).toBe('up');
    expect(getSwipeDirection(-6, 45)).toBe('down');
  });

  it('accepts intentional swipes that are long enough and quick', () => {
    expect(
      isIntentionalSwipe({ dx: 46, dy: 8, elapsedMs: 180, minDistancePx: 26 }),
    ).toBe(true);
  });

  it('rejects short, slow, or indecisive gestures', () => {
    expect(
      isIntentionalSwipe({ dx: 12, dy: 2, elapsedMs: 120, minDistancePx: 26 }),
    ).toBe(false);
    expect(
      isIntentionalSwipe({ dx: 52, dy: 4, elapsedMs: 840, minDistancePx: 26 }),
    ).toBe(false);
    expect(
      isIntentionalSwipe({ dx: 34, dy: 31, elapsedMs: 180, minDistancePx: 26 }),
    ).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { calculateHoldProgress, getHoldVisualPhase, isWithinHoldRadius } from '../utils/holdTracking';

describe('holdTracking utilities', () => {
  it('clamps hold progress between 0 and 1', () => {
    expect(calculateHoldProgress(-50, 900)).toBe(0);
    expect(calculateHoldProgress(450, 900)).toBe(0.5);
    expect(calculateHoldProgress(980, 900)).toBe(1);
  });

  it('fails lock when pointer drifts outside radius', () => {
    expect(
      isWithinHoldRadius(
        { x: 100, y: 100 },
        { x: 140, y: 130 },
        28,
      ),
    ).toBe(false);

    expect(
      isWithinHoldRadius(
        { x: 100, y: 100 },
        { x: 116, y: 110 },
        28,
      ),
    ).toBe(true);
  });

  it('reports arming, locked, and broken phases', () => {
    expect(getHoldVisualPhase({ isTracking: true, progress: 0.1, isBroken: false })).toBe('arming');
    expect(getHoldVisualPhase({ isTracking: true, progress: 0.56, isBroken: false })).toBe('locked');
    expect(getHoldVisualPhase({ isTracking: false, progress: 0.56, isBroken: true })).toBe('broken');
  });
});

import { describe, expect, it } from 'vitest';
import { getSwipeTimingVerdict, getSwipeTimingWindow } from '../utils/modeMechanics';

describe('modeMechanics swipe timing window', () => {
  it('returns a narrower reaction window on desktop', () => {
    const desktop = getSwipeTimingWindow(2000, 1280);
    expect(desktop.openAtMs).toBeGreaterThanOrEqual(80);
    expect(desktop.closeAtMs).toBeLessThan(2000);
  });

  it('classifies early, on-time, and late responses', () => {
    const window = { openAtMs: 180, closeAtMs: 1500 };
    expect(getSwipeTimingVerdict(120, window)).toBe('early');
    expect(getSwipeTimingVerdict(900, window)).toBe('on-time');
    expect(getSwipeTimingVerdict(1700, window)).toBe('late');
  });
});

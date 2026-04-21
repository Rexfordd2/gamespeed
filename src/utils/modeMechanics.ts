export interface SwipeTimingWindow {
  openAtMs: number;
  closeAtMs: number;
}

export type SwipeTimingVerdict = 'early' | 'on-time' | 'late';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getSwipeTimingWindow = (
  targetLifespanMs: number,
  screenWidth: number,
): SwipeTimingWindow => {
  const compactViewport = screenWidth <= 768;
  const windowOpenRatio = compactViewport ? 0.12 : 0.1;
  const windowCloseRatio = compactViewport ? 0.9 : 0.86;

  return {
    openAtMs: Math.round(clamp(targetLifespanMs * windowOpenRatio, 80, 260)),
    closeAtMs: Math.round(clamp(targetLifespanMs * windowCloseRatio, 280, targetLifespanMs - 40)),
  };
};

export const getSwipeTimingVerdict = (
  elapsedMs: number,
  timingWindow: SwipeTimingWindow,
): SwipeTimingVerdict => {
  if (elapsedMs < timingWindow.openAtMs) return 'early';
  if (elapsedMs > timingWindow.closeAtMs) return 'late';
  return 'on-time';
};

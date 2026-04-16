export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export const getSwipeDirection = (dx: number, dy: number): SwipeDirection => {
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }
  return dy >= 0 ? 'down' : 'up';
};

interface IsIntentionalSwipeParams {
  dx: number;
  dy: number;
  elapsedMs: number;
  minDistancePx: number;
}

export const isIntentionalSwipe = ({
  dx,
  dy,
  elapsedMs,
  minDistancePx,
}: IsIntentionalSwipeParams) => {
  const distance = Math.hypot(dx, dy);
  if (distance < minDistancePx) return false;
  if (elapsedMs > 700) return false;
  const dominanceRatio = 1.25;
  return Math.max(Math.abs(dx), Math.abs(dy)) >= Math.min(Math.abs(dx), Math.abs(dy)) * dominanceRatio;
};

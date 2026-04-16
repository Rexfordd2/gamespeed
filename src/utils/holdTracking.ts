const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export type HoldVisualPhase = 'idle' | 'arming' | 'locked' | 'broken';

export const calculateHoldProgress = (heldMs: number, requiredMs: number) => {
  if (requiredMs <= 0) return 1;
  return clamp(heldMs / requiredMs, 0, 1);
};

export const isWithinHoldRadius = (
  pointer: { x: number; y: number },
  center: { x: number; y: number },
  radiusPx: number,
) => {
  const dx = pointer.x - center.x;
  const dy = pointer.y - center.y;
  return Math.hypot(dx, dy) <= radiusPx;
};

export const getHoldVisualPhase = ({
  isTracking,
  progress,
  isBroken,
}: {
  isTracking: boolean;
  progress: number;
  isBroken: boolean;
}): HoldVisualPhase => {
  if (isBroken) return 'broken';
  if (!isTracking) return 'idle';
  return progress >= 0.2 ? 'locked' : 'arming';
};

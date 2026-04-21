export const STREAK_SPEED_RAMP_START = 15;
export const STREAK_SPEED_STEP_MULTIPLIER = 1.2;
/**
 * Conservative cap to keep late-round pacing playable on touch screens.
 */
export const STREAK_SPEED_MAX_MULTIPLIER = 6;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const getStreakSpeedMultiplier = (streak: number): number => {
  if (streak <= STREAK_SPEED_RAMP_START) {
    return 1;
  }

  const rampSteps = streak - STREAK_SPEED_RAMP_START;
  const uncappedMultiplier = Math.pow(STREAK_SPEED_STEP_MULTIPLIER, rampSteps);
  return clamp(uncappedMultiplier, 1, STREAK_SPEED_MAX_MULTIPLIER);
};

export const scaleMsByStreak = (
  baseMs: number,
  streak: number,
  minMs = 120,
): number => {
  const multiplier = getStreakSpeedMultiplier(streak);
  return Math.max(minMs, Math.round(baseMs / multiplier));
};

export const scaleSecondsByStreak = (
  baseSeconds: number,
  streak: number,
  minSeconds = 0.3,
): number => {
  const multiplier = getStreakSpeedMultiplier(streak);
  return Math.max(minSeconds, Number((baseSeconds / multiplier).toFixed(3)));
};

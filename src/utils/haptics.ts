export type HapticCueType =
  | 'hit'
  | 'miss'
  | 'streak'
  | 'start'
  | 'complete'
  | 'holdLock'
  | 'sequenceSuccess'
  | 'benchmarkComplete';

type HapticTriggerOptions = {
  enabled: boolean;
  lowStimulus?: boolean;
};

const hapticPatterns: Record<HapticCueType, number | number[]> = {
  hit: 16,
  miss: [26, 20, 26],
  streak: [12, 18, 22],
  start: 14,
  complete: [18, 20, 28],
  holdLock: [10, 16, 10, 16],
  sequenceSuccess: [10, 14, 18, 22],
  benchmarkComplete: [22, 18, 30, 18, 36],
};

const lowStimPatterns: Record<HapticCueType, number | number[]> = {
  hit: 9,
  miss: 16,
  streak: [8, 16, 14],
  start: 8,
  complete: [10, 18, 16],
  holdLock: [8, 12, 8],
  sequenceSuccess: [8, 12, 16],
  benchmarkComplete: [12, 14, 18],
};

export const isHapticsSupported = () =>
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export const getDefaultHapticsEnabled = () => {
  if (typeof window === 'undefined') return false;
  if (!isHapticsSupported()) return false;
  return window.matchMedia('(pointer: coarse)').matches;
};

export const triggerHapticCue = (
  cueType: HapticCueType,
  { enabled, lowStimulus = false }: HapticTriggerOptions,
) => {
  if (!enabled || !isHapticsSupported()) return false;
  const pattern = lowStimulus ? lowStimPatterns[cueType] : hapticPatterns[cueType];
  return navigator.vibrate(pattern);
};


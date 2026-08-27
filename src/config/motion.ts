/** Centralized motion duration/easing tokens. Timing accuracy always wins over decoration. */

export const motionDurations = {
  responseMs: 140,
  responseFastMs: 100,
  responseSlowMs: 180,
  uiMs: 240,
  uiFastMs: 180,
  uiSlowMs: 300,
  revealMs: 700,
  revealFastMs: 500,
  revealSlowMs: 900,
  environmentShortMs: 4000,
  environmentLongMs: 20000,
  introFullMs: 3200,
  introSkipMs: 800,
  transitionMs: 280,
} as const;

export const motionEasing = {
  response: 'cubic-bezier(0.22, 1, 0.36, 1)',
  ui: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  reveal: 'cubic-bezier(0.16, 1, 0.3, 1)',
  environment: 'linear',
} as const;

export const framerTransition = {
  response: { duration: motionDurations.responseMs / 1000, ease: [0.22, 1, 0.36, 1] as const },
  ui: { duration: motionDurations.uiMs / 1000, ease: [0.25, 0.1, 0.25, 1] as const },
  reveal: { duration: motionDurations.revealMs / 1000, ease: [0.16, 1, 0.3, 1] as const },
  transition: { duration: motionDurations.transitionMs / 1000, ease: [0.25, 0.1, 0.25, 1] as const },
} as const;

export const INTRO_SEEN_STORAGE_KEY = 'gamespeed_instinct_intro_seen_v1';

export const hasSeenModeIntro = (modeId: string): boolean => {
  try {
    const raw = localStorage.getItem(INTRO_SEEN_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(parsed[modeId]);
  } catch {
    return false;
  }
};

export const markModeIntroSeen = (modeId: string) => {
  try {
    const raw = localStorage.getItem(INTRO_SEEN_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    parsed[modeId] = true;
    localStorage.setItem(INTRO_SEEN_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore private-mode storage failures.
  }
};

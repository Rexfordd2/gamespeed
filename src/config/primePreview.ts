/**
 * Presentation-only Prime protocol framing.
 * This is not an executable protocol engine — it must not be treated as one.
 */
export const PRIME_PREVIEW_DURATION_LABEL = '6 MINUTE PRIME';

export const PRIME_PREVIEW_PHASES = [
  {
    id: 'wakeVision',
    label: 'Wake Vision',
    summary: 'Settle your eyes and lock a quiet visual start.',
  },
  {
    id: 'scan',
    label: 'Scan',
    summary: 'Pick up wider-field cues without rushing the first move.',
  },
  {
    id: 'react',
    label: 'React',
    summary: 'Answer the first clean cue with controlled speed.',
  },
  {
    id: 'decide',
    label: 'Decide',
    summary: 'Choose under time pressure instead of guessing.',
  },
  {
    id: 'move',
    label: 'Move',
    summary: 'Connect the read to a short physical ready cue.',
  },
] as const;

export const PRIME_ENGINE_PENDING_COPY = {
  title: 'Prime protocol engine is next',
  body: 'PRIME ME is the habit loop. The sequenced 6-minute protocol is the next implementation step and is not running yet. Start a real existing session to keep the warm-up.',
  startSessionCta: "Start today's session",
  runBaselineCta: 'Run Baseline',
  backCta: 'Back',
} as const;

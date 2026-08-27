import { PhysicalCueDefinition, PhysicalCueId, PHYSICAL_CUE_IDS } from '../types/physicalCue';

export const PHYSICAL_CUE_VOCABULARY: Record<PhysicalCueId, PhysicalCueDefinition> = {
  left: {
    id: 'left',
    label: 'LEFT',
    instruction: 'Step or plant left. Keep it athletic and easy.',
    toneHz: 392,
    toneMs: 140,
  },
  right: {
    id: 'right',
    label: 'RIGHT',
    instruction: 'Step or plant right. Keep it athletic and easy.',
    toneHz: 494,
    toneMs: 140,
  },
  forward: {
    id: 'forward',
    label: 'FORWARD',
    instruction: 'Take a short step forward. Stay balanced.',
    toneHz: 523,
    toneMs: 160,
  },
  back: {
    id: 'back',
    label: 'BACK',
    instruction: 'Take a short step back. Stay balanced.',
    toneHz: 330,
    toneMs: 160,
  },
  drop: {
    id: 'drop',
    label: 'DROP',
    instruction: 'Drop your hips a little. No collapse, no max effort.',
    toneHz: 247,
    toneMs: 180,
  },
  stick: {
    id: 'stick',
    label: 'STICK',
    instruction: 'Hold your body still and face the cue. Quiet feet.',
    toneHz: 440,
    toneMs: 220,
  },
  rotate: {
    id: 'rotate',
    label: 'ROTATE',
    instruction: 'Turn your body a quarter-turn. Keep footing stable.',
    toneHz: 466,
    toneMs: 180,
  },
  jump: {
    id: 'jump',
    label: 'JUMP',
    instruction: 'A small hop only if space and footing are clear. Skip this cue if they are not.',
    toneHz: 659,
    toneMs: 120,
  },
  reset: {
    id: 'reset',
    label: 'RESET',
    instruction: 'Return to a ready stance. Eyes quiet.',
    toneHz: 349,
    toneMs: 180,
  },
  go: {
    id: 'go',
    label: 'GO',
    instruction: 'First-step out. Fast, then settle.',
    toneHz: 784,
    toneMs: 110,
  },
  hold: {
    id: 'hold',
    label: 'HOLD',
    instruction: 'Stop and hold. Controlled, not rigid.',
    toneHz: 220,
    toneMs: 280,
  },
};

export const isPhysicalCueId = (value: string): value is PhysicalCueId =>
  (PHYSICAL_CUE_IDS as readonly string[]).includes(value);

export const getPhysicalCueDefinition = (id: PhysicalCueId): PhysicalCueDefinition =>
  PHYSICAL_CUE_VOCABULARY[id];

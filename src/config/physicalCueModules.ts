import { PhysicalCueModule } from '../types/physicalCue';

export const JAGUAR_MOVEMENT_MODULE_ID = 'jaguar-movement';

export const PHYSICAL_CUE_SAFETY_NOTES = [
  'Create clear space before you start.',
  'Use stable footing.',
  'Stop if movement causes pain.',
  'Do not stare at the device while moving if that is unsafe.',
  'Place the phone on the ground, a bench, a wall, a tripod, or hold it if that is safer.',
] as const;

/**
 * Jaguar Movement: lateral response, body orientation, reaction, controlled stop.
 * GameSpeed provides the cue. The athlete performs it. V1 does not score movement quality.
 */
export const jaguarMovementModule: PhysicalCueModule = {
  id: JAGUAR_MOVEMENT_MODULE_ID,
  publicName: 'Jaguar Movement',
  tagline: 'Lateral response, orientation, first-step, then a controlled stop.',
  sequence: ['left', 'right', 'stick', 'go', 'hold', 'reset'],
  cueHoldMs: 1600,
  gapMs: 450,
  safetyNotes: [...PHYSICAL_CUE_SAFETY_NOTES],
};

const modulesById: Record<string, PhysicalCueModule> = {
  [JAGUAR_MOVEMENT_MODULE_ID]: jaguarMovementModule,
};

export const getPhysicalCueModule = (id: string | undefined): PhysicalCueModule | null => {
  if (!id) return null;
  return modulesById[id] ?? null;
};

export const getPhysicalCueSequenceDurationMs = (module: PhysicalCueModule): number =>
  module.sequence.length * (module.cueHoldMs + module.gapMs);

export const physicalCueModules = [jaguarMovementModule];

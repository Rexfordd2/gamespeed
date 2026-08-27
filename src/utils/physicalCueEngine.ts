import { PhysicalCueEngineState, PhysicalCueMetrics, PhysicalCueModule } from '../types/physicalCue';
import { getPhysicalCueDefinition } from '../config/physicalCueVocabulary';

export class PhysicalCueEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhysicalCueEngineError';
  }
}

const requireSequence = (module: PhysicalCueModule) => {
  if (module.sequence.length === 0) {
    throw new PhysicalCueEngineError('physical cue module has no sequence');
  }
};

export const getPhysicalCueIntervalMs = (module: PhysicalCueModule): number =>
  module.cueHoldMs + module.gapMs;

export const createPhysicalCueSession = (
  module: PhysicalCueModule,
  now = Date.now(),
): PhysicalCueEngineState => {
  requireSequence(module);
  return {
    moduleId: module.id,
    phase: 'briefing',
    cueIndex: 0,
    presentedCueCount: 0,
    startedAt: now,
    cueStartedAt: now,
    athleteConfirmed: false,
  };
};

export const startPhysicalCueSequence = (
  state: PhysicalCueEngineState,
  now = Date.now(),
): PhysicalCueEngineState => {
  if (state.phase !== 'briefing') {
    throw new PhysicalCueEngineError(`cannot start cues from ${state.phase}`);
  }
  return {
    ...state,
    phase: 'cueing',
    cueIndex: 0,
    presentedCueCount: 1,
    cueStartedAt: now,
    startedAt: now,
  };
};

export const tickPhysicalCueSession = (
  state: PhysicalCueEngineState,
  module: PhysicalCueModule,
  now = Date.now(),
): PhysicalCueEngineState => {
  if (state.phase !== 'cueing' && state.phase !== 'gap') {
    return state;
  }

  let next = state;
  for (let guard = 0; guard < 48; guard += 1) {
    const elapsed = Math.max(0, now - next.cueStartedAt);
    if (next.phase === 'cueing') {
      if (elapsed < module.cueHoldMs) {
        return next;
      }
      next = {
        ...next,
        phase: 'gap',
        cueStartedAt: next.cueStartedAt + module.cueHoldMs,
      };
      continue;
    }

    if (elapsed < module.gapMs) {
      return next;
    }
    const nextIndex = next.cueIndex + 1;
    if (nextIndex >= module.sequence.length) {
      return {
        ...next,
        phase: 'confirming',
        cueIndex: nextIndex,
        cueStartedAt: now,
      };
    }
    next = {
      ...next,
      phase: 'cueing',
      cueIndex: nextIndex,
      presentedCueCount: next.presentedCueCount + 1,
      cueStartedAt: next.cueStartedAt + module.gapMs,
    };
  }
  return next;
};

export const confirmPhysicalCueSession = (
  state: PhysicalCueEngineState,
  now = Date.now(),
): PhysicalCueEngineState => {
  if (state.phase !== 'confirming') {
    throw new PhysicalCueEngineError(`cannot confirm from ${state.phase}`);
  }
  return {
    ...state,
    phase: 'completed',
    athleteConfirmed: true,
    cueStartedAt: now,
  };
};

export const cancelPhysicalCueSession = (
  state: PhysicalCueEngineState,
  now = Date.now(),
): PhysicalCueEngineState => {
  if (state.phase === 'completed') {
    return state;
  }
  return {
    ...state,
    phase: 'cancelled',
    cueStartedAt: now,
  };
};

export const getCurrentPhysicalCueId = (state: PhysicalCueEngineState, module: PhysicalCueModule) => {
  if (state.phase !== 'cueing') return null;
  return module.sequence[state.cueIndex] ?? null;
};

export const getCurrentPhysicalCue = (state: PhysicalCueEngineState, module: PhysicalCueModule) => {
  const id = getCurrentPhysicalCueId(state, module);
  return id ? getPhysicalCueDefinition(id) : null;
};

export const getPhysicalCueMetrics = (
  state: PhysicalCueEngineState,
  module: PhysicalCueModule,
  now = Date.now(),
): PhysicalCueMetrics => ({
  moduleId: module.id,
  cueCount: module.sequence.length,
  presentedCueCount: state.presentedCueCount,
  cueIntervalMs: getPhysicalCueIntervalMs(module),
  athleteConfirmed: state.athleteConfirmed,
  durationMs: Math.max(0, now - state.startedAt),
});

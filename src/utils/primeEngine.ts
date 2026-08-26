import { GameResult } from '../types/game';
import { SportType } from '../config/sports';
import {
  PrimeContext,
  PrimeEngineState,
  PrimePhase,
  PrimeProtocol,
  PrimeStep,
  PrimeStepResult,
} from '../types/prime';
import { getPrimeProtocol } from '../config/primeProtocols';

const makeSessionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `prime_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export class PrimeEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrimeEngineError';
  }
}

const requireProtocol = (state: PrimeEngineState): PrimeProtocol => getPrimeProtocol(state.protocolId);

export const getCurrentPrimeStep = (state: PrimeEngineState, protocol?: PrimeProtocol): PrimeStep | null => {
  const source = protocol ?? requireProtocol(state);
  return source.steps[state.stepIndex] ?? null;
};

export const isPrimeStepSkippable = (step: PrimeStep | null): boolean => Boolean(step?.skippable);

export const createPrimeSession = ({
  protocol,
  context,
  sport,
  lowStimulus = false,
  now = Date.now(),
  sessionId = makeSessionId(),
}: {
  protocol: PrimeProtocol;
  context: PrimeContext;
  sport: SportType;
  lowStimulus?: boolean;
  now?: number;
  sessionId?: string;
}): PrimeEngineState => {
  if (protocol.steps.length === 0) {
    throw new PrimeEngineError('protocol has no steps');
  }

  const firstStep = protocol.steps[0];
  return {
    sessionId,
    protocolId: protocol.id,
    context,
    sport,
    stepIndex: 0,
    phase: firstStep.kind === 'summary' ? 'summary' : 'transition',
    startedAt: now,
    stepStartedAt: now,
    results: [],
    lowStimulus,
  };
};

export const startCurrentPrimeStep = (
  state: PrimeEngineState,
  now = Date.now(),
): PrimeEngineState => {
  if (state.phase === 'cancelled' || state.phase === 'summary') {
    throw new PrimeEngineError(`cannot start a step from ${state.phase}`);
  }
  const step = getCurrentPrimeStep(state);
  if (!step) {
    throw new PrimeEngineError('no current step to start');
  }
  if (step.kind === 'summary') {
    return { ...state, phase: 'summary', stepStartedAt: now };
  }
  if (state.phase === 'running') {
    return state;
  }
  return {
    ...state,
    phase: 'running',
    stepStartedAt: now,
  };
};

const advanceAfterResult = (
  state: PrimeEngineState,
  result: PrimeStepResult,
  now: number,
): PrimeEngineState => {
  const protocol = requireProtocol(state);
  const nextIndex = state.stepIndex + 1;
  const nextStep = protocol.steps[nextIndex];
  const results = [...state.results, result];

  if (!nextStep || nextStep.kind === 'summary') {
    return {
      ...state,
      results,
      stepIndex: nextStep ? nextIndex : state.stepIndex,
      phase: 'summary',
      stepStartedAt: now,
    };
  }

  return {
    ...state,
    results,
    stepIndex: nextIndex,
    phase: 'transition',
    stepStartedAt: now,
  };
};

export const completeCurrentPrimeStep = (
  state: PrimeEngineState,
  now = Date.now(),
  gameResult?: GameResult,
): PrimeEngineState => {
  if (state.phase !== 'running') {
    throw new PrimeEngineError('can only complete a running step');
  }
  const step = getCurrentPrimeStep(state);
  if (!step) {
    throw new PrimeEngineError('no current step to complete');
  }
  if (step.kind === 'drill' && !gameResult) {
    throw new PrimeEngineError('drill completion requires a game result');
  }

  return advanceAfterResult(
    state,
    {
      stepId: step.id,
      status: 'completed',
      modeId: step.modeId,
      durationMs: Math.max(0, now - state.stepStartedAt),
      gameResult,
    },
    now,
  );
};

export const skipCurrentPrimeStep = (
  state: PrimeEngineState,
  now = Date.now(),
): PrimeEngineState => {
  if (state.phase === 'cancelled' || state.phase === 'summary') {
    throw new PrimeEngineError(`cannot skip from ${state.phase}`);
  }
  if (state.phase === 'running') {
    throw new PrimeEngineError('cannot skip a step after it has started');
  }
  const step = getCurrentPrimeStep(state);
  if (!isPrimeStepSkippable(step) || !step) {
    throw new PrimeEngineError('current step cannot be skipped');
  }

  return advanceAfterResult(
    state,
    {
      stepId: step.id,
      status: 'skipped',
      modeId: step.modeId,
      durationMs: Math.max(0, now - state.stepStartedAt),
    },
    now,
  );
};

export const cancelPrimeSession = (
  state: PrimeEngineState,
  now = Date.now(),
): PrimeEngineState => {
  if (state.phase === 'summary') {
    return state;
  }
  return {
    ...state,
    phase: 'cancelled',
    stepStartedAt: now,
  };
};

export const getPrimeProgress = (
  state: PrimeEngineState,
  now = Date.now(),
): {
  stepIndex: number;
  stepCount: number;
  executableStepCount: number;
  elapsedMs: number;
  stepElapsedMs: number;
  percent: number;
  phase: PrimePhase;
} => {
  const protocol = requireProtocol(state);
  const executableStepCount = protocol.steps.filter(step => step.kind !== 'summary').length;
  const elapsedMs = Math.max(0, now - state.startedAt);
  const stepElapsedMs = Math.max(0, now - state.stepStartedAt);
  const completedExecutable = state.results.filter(result =>
    protocol.steps.some(step => step.id === result.stepId && step.kind !== 'summary'),
  ).length;
  const percent =
    executableStepCount === 0
      ? 100
      : Math.min(100, Math.round((completedExecutable / executableStepCount) * 100));

  return {
    stepIndex: state.stepIndex,
    stepCount: protocol.steps.length,
    executableStepCount,
    elapsedMs,
    stepElapsedMs,
    percent,
    phase: state.phase,
  };
};

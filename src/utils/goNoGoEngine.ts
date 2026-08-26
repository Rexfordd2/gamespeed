import {
  GoNoGoAccumulator,
  GoNoGoKind,
  GoNoGoMetrics,
  GoNoGoOutcome,
  GoNoGoRoundState,
  GoNoGoStimulus,
  GoNoGoTrial,
  GoNoGoTrialConfig,
} from '../types/goNoGo';

export const MIN_GONOGO_STIMULUS_MS = 520;
export const MIN_GONOGO_ISI_MS = 420;
export const GONOGO_FEEDBACK_MS = 180;
export const GO_COLOR = '#4ade80';
export const NOGO_COLOR = '#f87171';
export const SIMILAR_GO_COLOR = '#34d399';
export const SIMILAR_NOGO_COLOR = '#5eead4';

export type GoNoGoRng = () => number;

export const createGoNoGoRng = (seed: number): GoNoGoRng => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const normalizeGoNoGoConfig = (config: GoNoGoTrialConfig): GoNoGoTrialConfig => {
  const stimulusMs = Math.max(MIN_GONOGO_STIMULUS_MS, Math.round(config.stimulusMs));
  const isiMinMs = Math.max(MIN_GONOGO_ISI_MS, Math.round(config.isiMinMs));
  const isiMaxMs = Math.max(isiMinMs, Math.round(config.isiMaxMs));
  return {
    ...config,
    goProbability: clamp(config.goProbability, 0.2, 0.9),
    stimulusMs,
    isiMinMs,
    isiMaxMs,
    distractorCount: clamp(Math.round(config.distractorCount), 0, 2),
  };
};

export const getGoNoGoPrompt = (config: GoNoGoTrialConfig): string => {
  if (config.ruleSet === 'colorShape') return 'Green circle = strike. Anything else = hold.';
  if (config.ruleSet === 'similarHue') return 'Strike only the live green. Close colors are a hold.';
  return 'Green strike. Red hold. Still until the moment is real.';
};

const pickKind = (config: GoNoGoTrialConfig, rng: GoNoGoRng, forcedKind?: GoNoGoKind): GoNoGoKind => {
  if (forcedKind) return forcedKind;
  return rng() < config.goProbability ? 'go' : 'nogo';
};

const buildStimulus = (kind: GoNoGoKind, ruleSet: GoNoGoTrialConfig['ruleSet'], rng: GoNoGoRng): GoNoGoStimulus => {
  if (ruleSet === 'similarHue') {
    return {
      kind,
      label: kind === 'go' ? 'STRIKE' : 'HOLD',
      color: kind === 'go' ? SIMILAR_GO_COLOR : SIMILAR_NOGO_COLOR,
      shape: 'circle',
    };
  }
  if (ruleSet === 'colorShape') {
    if (kind === 'go') {
      return { kind, label: 'STRIKE', color: GO_COLOR, shape: 'circle' };
    }
    return rng() < 0.5
      ? { kind, label: 'HOLD', color: NOGO_COLOR, shape: 'circle' }
      : { kind, label: 'HOLD', color: GO_COLOR, shape: 'diamond' };
  }
  return {
    kind,
    label: kind === 'go' ? 'STRIKE' : 'HOLD',
    color: kind === 'go' ? GO_COLOR : NOGO_COLOR,
    shape: 'circle',
  };
};

const buildDistractors = (config: GoNoGoTrialConfig, rng: GoNoGoRng) => {
  if (config.distractorCount <= 0) return [];
  return Array.from({ length: config.distractorCount }, (_, index) => ({
    dx: Math.round((rng() * 2 - 1) * 42),
    dy: Math.round((rng() * 2 - 1) * 36),
    color: index % 2 === 0 ? 'rgba(148, 163, 184, 0.35)' : 'rgba(45, 212, 191, 0.22)',
  }));
};

const nextIsiMs = (config: GoNoGoTrialConfig, rng: GoNoGoRng) => {
  if (config.isiMaxMs <= config.isiMinMs) return config.isiMinMs;
  return Math.round(config.isiMinMs + rng() * (config.isiMaxMs - config.isiMinMs));
};

const emptyAccumulator = (config: GoNoGoTrialConfig, startedAtMs: number): GoNoGoAccumulator => ({
  startedAtMs,
  lastConfig: config,
  correctGo: 0,
  missedGo: 0,
  correctInhibitions: 0,
  falsePositives: 0,
  prematureResponses: 0,
  ignoredSpam: 0,
  goReactionTimesMs: [],
  streak: 0,
  bestStreak: 0,
  trialsResolved: 0,
});

const bumpStreak = (accumulator: GoNoGoAccumulator, success: boolean): GoNoGoAccumulator => {
  if (!success) {
    return { ...accumulator, streak: 0 };
  }
  const streak = accumulator.streak + 1;
  return {
    ...accumulator,
    streak,
    bestStreak: Math.max(accumulator.bestStreak, streak),
  };
};

const recordResolution = (
  accumulator: GoNoGoAccumulator,
  outcome: GoNoGoOutcome,
  reactionMs?: number,
): GoNoGoAccumulator => {
  if (outcome === 'ignoredSpam') {
    return { ...accumulator, ignoredSpam: accumulator.ignoredSpam + 1 };
  }
  if (outcome === 'premature') {
    return bumpStreak({ ...accumulator, prematureResponses: accumulator.prematureResponses + 1 }, false);
  }

  const next: GoNoGoAccumulator = {
    ...accumulator,
    trialsResolved: accumulator.trialsResolved + 1,
  };
  if (outcome === 'correctGo') {
    const withRt =
      reactionMs !== undefined ? { ...next, goReactionTimesMs: [...next.goReactionTimesMs, reactionMs] } : next;
    return bumpStreak({ ...withRt, correctGo: next.correctGo + 1 }, true);
  }
  if (outcome === 'missedGo') {
    return bumpStreak({ ...next, missedGo: next.missedGo + 1 }, false);
  }
  if (outcome === 'correctInhibition') {
    return bumpStreak({ ...next, correctInhibitions: next.correctInhibitions + 1 }, true);
  }
  return bumpStreak({ ...next, falsePositives: next.falsePositives + 1 }, false);
};

export const createTrial = (
  config: GoNoGoTrialConfig,
  nowMs: number,
  rng: GoNoGoRng,
  forcedKind?: GoNoGoKind,
): GoNoGoTrial => {
  const kind = pickKind(config, rng, forcedKind);
  const id = `gng-${nowMs}-${Math.floor(rng() * 1_000_000)}`;
  return {
    id,
    kind,
    stimulus: buildStimulus(kind, config.ruleSet, rng),
    distractors: buildDistractors(config, rng),
    shownAtMs: nowMs,
    endsAtMs: nowMs + config.stimulusMs,
    responded: false,
  };
};

export const createGoNoGoRound = (
  config: GoNoGoTrialConfig,
  nowMs: number,
  rng: GoNoGoRng = Math.random,
): GoNoGoRoundState => {
  const normalized = normalizeGoNoGoConfig(config);
  return {
    phase: 'isi',
    config: normalized,
    trial: null,
    phaseEndsAtMs: nowMs + nextIsiMs(normalized, rng),
    feedback: null,
    accumulator: emptyAccumulator(normalized, nowMs),
  };
};

const enterStimulus = (state: GoNoGoRoundState, nowMs: number, rng: GoNoGoRng, forcedKind?: GoNoGoKind): GoNoGoRoundState => {
  const trial = createTrial(state.config, nowMs, rng, forcedKind);
  return {
    ...state,
    phase: 'stimulus',
    trial,
    phaseEndsAtMs: trial.endsAtMs,
    feedback: null,
  };
};

const enterFeedback = (state: GoNoGoRoundState, outcome: GoNoGoOutcome, nowMs: number): GoNoGoRoundState => ({
  ...state,
  phase: 'feedback',
  feedback: outcome,
  phaseEndsAtMs: nowMs + (state.config.errorLockoutMs ?? GONOGO_FEEDBACK_MS),
  trial: state.trial ? { ...state.trial, responded: true } : null,
  accumulator: recordResolution(
    state.accumulator,
    outcome,
    outcome === 'correctGo' && state.trial ? Math.max(0, nowMs - state.trial.shownAtMs) : undefined,
  ),
});

const enterIsi = (state: GoNoGoRoundState, nowMs: number, rng: GoNoGoRng): GoNoGoRoundState => ({
  ...state,
  phase: 'isi',
  trial: null,
  feedback: null,
  phaseEndsAtMs: nowMs + nextIsiMs(state.config, rng),
});

export const respondGoNoGo = (
  state: GoNoGoRoundState,
  nowMs: number,
): { state: GoNoGoRoundState; outcome: GoNoGoOutcome } => {
  if (state.phase === 'isi') {
    const next = {
      ...state,
      accumulator: recordResolution(state.accumulator, 'premature'),
    };
    return { state: next, outcome: 'premature' };
  }
  if (state.phase !== 'stimulus' || !state.trial || state.trial.responded) {
    const next = {
      ...state,
      accumulator: recordResolution(state.accumulator, 'ignoredSpam'),
    };
    return { state: next, outcome: 'ignoredSpam' };
  }
  const outcome: GoNoGoOutcome = state.trial.kind === 'go' ? 'correctGo' : 'falsePositive';
  return { state: enterFeedback(state, outcome, nowMs), outcome };
};

export const tickGoNoGo = (
  state: GoNoGoRoundState,
  nowMs: number,
  rng: GoNoGoRng = Math.random,
  forcedNextKind?: GoNoGoKind,
): { state: GoNoGoRoundState; outcome: GoNoGoOutcome | null } => {
  if (state.phase === 'isi' && nowMs >= state.phaseEndsAtMs) {
    return { state: enterStimulus(state, nowMs, rng, forcedNextKind), outcome: null };
  }
  if (state.phase === 'stimulus' && state.trial && !state.trial.responded && nowMs >= state.trial.endsAtMs) {
    const outcome: GoNoGoOutcome = state.trial.kind === 'go' ? 'missedGo' : 'correctInhibition';
    return { state: enterFeedback(state, outcome, nowMs), outcome };
  }
  if (state.phase === 'feedback' && nowMs >= state.phaseEndsAtMs) {
    return { state: enterIsi(state, nowMs, rng), outcome: null };
  }
  return { state, outcome: null };
};

export const shiftGoNoGoPhase = (state: GoNoGoRoundState, remainingMs: number, nowMs: number): GoNoGoRoundState => {
  const phaseEndsAtMs = nowMs + Math.max(0, remainingMs);
  const trial =
    state.trial && state.phase === 'stimulus'
      ? { ...state.trial, endsAtMs: phaseEndsAtMs }
      : state.trial;
  return { ...state, phaseEndsAtMs, trial };
};

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export const deriveGoNoGoMetrics = (accumulator: GoNoGoAccumulator): GoNoGoMetrics => {
  const goCount = accumulator.correctGo + accumulator.missedGo;
  const nogoCount = accumulator.correctInhibitions + accumulator.falsePositives;
  const scored = goCount + nogoCount;
  const correct = accumulator.correctGo + accumulator.correctInhibitions;
  const times = accumulator.goReactionTimesMs;
  const firstSlice = times.slice(0, Math.max(1, Math.floor(times.length / 4)));
  const lastSlice = times.slice(Math.max(0, times.length - Math.max(1, Math.floor(times.length / 4))));
  const firstAvg = average(firstSlice);
  const lastAvg = average(lastSlice);

  return {
    goCount,
    nogoCount,
    correctGo: accumulator.correctGo,
    missedGo: accumulator.missedGo,
    correctInhibitions: accumulator.correctInhibitions,
    falsePositives: accumulator.falsePositives,
    prematureResponses: accumulator.prematureResponses,
    goReactionTimeMs: average(times),
    averageGoReactionMs: average(times),
    inhibitionAccuracyPct: nogoCount > 0 ? Math.round((accumulator.correctInhibitions / nogoCount) * 100) : 0,
    overallAccuracyPct: scored > 0 ? Math.round((correct / scored) * 100) : 0,
    bestStreak: accumulator.bestStreak,
    performanceDecayMs:
      firstAvg === null || lastAvg === null || times.length < 4 ? null : lastAvg - firstAvg,
  };
};

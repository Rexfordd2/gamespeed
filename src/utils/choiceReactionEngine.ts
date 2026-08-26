import {
  ChoiceAccumulator,
  ChoiceLegendEntry,
  ChoiceMapping,
  ChoiceOutcome,
  ChoiceReactionMetrics,
  ChoiceResponseKind,
  ChoiceResponseStats,
  ChoiceRoundConfig,
  ChoiceRoundState,
  ChoiceRuleSet,
  ChoiceStimulusDef,
  ChoiceTrial,
} from '../types/choiceReaction';
import { getSwipeDirection, isIntentionalSwipe } from './swipeDetection';

export const MIN_CHOICE_STIMULUS_MS = 520;
export const MIN_CHOICE_ISI_MS = 420;
export const MIN_CHOICE_BRIEFING_MS = 1600;
export const CHOICE_FEEDBACK_MS = 180;
export const DEFAULT_CHOICE_HOLD_MS = 320;
export const DEFAULT_CHOICE_BRIEFING_MS = 3200;

/** First live boards expose these. Hold and vertical swipes stay in the engine + tests. */
export const LIVE_CHOICE_RESPONSE_KINDS: ChoiceResponseKind[] = [
  'tap',
  'swipeLeft',
  'swipeRight',
  'nogo',
];

export const CHOICE_COLORS = {
  green: '#4ade80',
  yellow: '#facc15',
  blue: '#60a5fa',
  red: '#f87171',
} as const;

export const SIMILAR_CHOICE_COLORS = {
  green: '#4ade80',
  yellow: '#86efac',
  blue: '#2dd4bf',
  red: '#5eead4',
} as const;

const RESPONSE_LABELS: Record<ChoiceResponseKind, string> = {
  tap: 'Tap',
  swipeLeft: 'Swipe left',
  swipeRight: 'Swipe right',
  swipeUp: 'Swipe up',
  swipeDown: 'Swipe down',
  hold: 'Hold',
  nogo: 'No response',
};

export type ChoiceRng = () => number;

export const createChoiceRng = (seed: number): ChoiceRng => {
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

export const formatChoiceResponse = (response: ChoiceResponseKind): string => RESPONSE_LABELS[response];

export const lookupExpectedResponse = (
  ruleSet: ChoiceRuleSet,
  stimulusId: string,
): ChoiceResponseKind => {
  const mapping = ruleSet.mappings.find(entry => entry.stimulusId === stimulusId);
  return mapping?.response ?? 'nogo';
};

const fallbackStimuli = (): ChoiceStimulusDef[] => [
  { id: 'green', kind: 'color', label: 'GREEN', color: CHOICE_COLORS.green },
  { id: 'yellow', kind: 'color', label: 'YELLOW', color: CHOICE_COLORS.yellow },
  { id: 'blue', kind: 'color', label: 'BLUE', color: CHOICE_COLORS.blue },
];

const fallbackRuleSet = (): ChoiceRuleSet => ({
  id: 'fallback-3',
  mappings: [
    { stimulusId: 'green', response: 'tap' },
    { stimulusId: 'yellow', response: 'swipeLeft' },
    { stimulusId: 'blue', response: 'swipeRight' },
  ],
});

const normalizeRuleSet = (ruleSet: ChoiceRuleSet, stimuli: ChoiceStimulusDef[]): ChoiceRuleSet => {
  const stimulusIds = new Set(stimuli.map(stimulus => stimulus.id));
  const mappings = ruleSet.mappings.filter(mapping => stimulusIds.has(mapping.stimulusId));
  if (mappings.length === 0) {
    return fallbackRuleSet();
  }
  return { ...ruleSet, mappings };
};

export const normalizeChoiceConfig = (config: ChoiceRoundConfig): ChoiceRoundConfig => {
  const stimulusMs = Math.max(MIN_CHOICE_STIMULUS_MS, Math.round(config.stimulusMs));
  const isiMinMs = Math.max(MIN_CHOICE_ISI_MS, Math.round(config.isiMinMs));
  const isiMaxMs = Math.max(isiMinMs, Math.round(config.isiMaxMs));
  const briefingMs = Math.max(MIN_CHOICE_BRIEFING_MS, Math.round(config.briefingMs));
  const holdMs = Math.max(220, Math.round(config.holdMs ?? DEFAULT_CHOICE_HOLD_MS));
  const mappedIds = new Set(config.ruleSet.mappings.map(mapping => mapping.stimulusId));
  const stimuli = (config.stimuli.length > 0 ? config.stimuli : fallbackStimuli()).filter(stimulus =>
    mappedIds.has(stimulus.id),
  );
  const resolvedStimuli = stimuli.length > 0 ? stimuli : fallbackStimuli();
  const ruleSet = normalizeRuleSet(config.ruleSet, resolvedStimuli);
  const alternateRuleSet = config.alternateRuleSet
    ? normalizeRuleSet(config.alternateRuleSet, resolvedStimuli)
    : undefined;

  return {
    ...config,
    ruleSet,
    alternateRuleSet,
    stimuli: resolvedStimuli,
    stimulusMs,
    isiMinMs,
    isiMaxMs,
    briefingMs,
    holdMs,
    switchAfterTrials:
      config.switchAfterTrials !== undefined ? Math.max(1, Math.round(config.switchAfterTrials)) : undefined,
  };
};

export const getChoiceRuleLegend = (config: ChoiceRoundConfig): ChoiceLegendEntry[] => {
  const byId = new Map(config.stimuli.map(stimulus => [stimulus.id, stimulus]));
  return config.ruleSet.mappings
    .map(mapping => {
      const stimulus = byId.get(mapping.stimulusId);
      if (!stimulus) return null;
      return {
        stimulus,
        response: mapping.response,
        responseLabel: formatChoiceResponse(mapping.response),
      };
    })
    .filter((entry): entry is ChoiceLegendEntry => entry !== null);
};

export const getChoicePrompt = (state: ChoiceRoundState): string => {
  if (state.phase === 'briefing') return 'Read first. Move second.';
  if (state.phase === 'isi') return 'Wait for the cue.';
  if (state.feedback === 'wrongResponse') return 'Wrong response. Read, then move.';
  if (state.feedback === 'omission') return 'Too late. The window closed.';
  if (state.feedback === 'falseStart' || state.feedback === 'premature') return 'False start. Wait for the cue.';
  if (state.feedback === 'correct' && state.trial?.expected === 'nogo') return 'Clean withhold.';
  if (state.feedback === 'correct') return 'Clean read.';
  return 'Read first. Move second.';
};

const applySimilarity = (stimulus: ChoiceStimulusDef, similar: boolean): ChoiceStimulusDef => {
  if (!similar || !stimulus.color) return stimulus;
  const palette = SIMILAR_CHOICE_COLORS as Record<string, string>;
  const nextColor = palette[stimulus.id];
  return nextColor ? { ...stimulus, color: nextColor } : stimulus;
};

const pickMapping = (ruleSet: ChoiceRuleSet, rng: ChoiceRng, forcedStimulusId?: string): ChoiceMapping => {
  if (forcedStimulusId) {
    const forced = ruleSet.mappings.find(mapping => mapping.stimulusId === forcedStimulusId);
    if (forced) return forced;
  }
  const index = Math.min(ruleSet.mappings.length - 1, Math.floor(rng() * ruleSet.mappings.length));
  return ruleSet.mappings[index] ?? ruleSet.mappings[0];
};

const nextIsiMs = (config: ChoiceRoundConfig, rng: ChoiceRng) => {
  if (config.isiMaxMs <= config.isiMinMs) return config.isiMinMs;
  return Math.round(config.isiMinMs + rng() * (config.isiMaxMs - config.isiMinMs));
};

const emptyResponseStats = (): ChoiceResponseStats => ({
  attempts: 0,
  correct: 0,
  reactionTimesMs: [],
});

const emptyAccumulator = (config: ChoiceRoundConfig, startedAtMs: number): ChoiceAccumulator => ({
  startedAtMs,
  lastConfig: config,
  correct: 0,
  wrongResponses: 0,
  omissions: 0,
  falseStarts: 0,
  prematureResponses: 0,
  ignoredSpam: 0,
  choiceReactionTimesMs: [],
  postSwitchReactionTimesMs: [],
  preSwitchReactionTimesMs: [],
  byResponse: {},
  streak: 0,
  bestStreak: 0,
  trialsResolved: 0,
  switched: false,
});

const bumpStreak = (accumulator: ChoiceAccumulator, success: boolean): ChoiceAccumulator => {
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

const recordByResponse = (
  accumulator: ChoiceAccumulator,
  expected: ChoiceResponseKind,
  correct: boolean,
  reactionMs?: number,
): ChoiceAccumulator => {
  const current = accumulator.byResponse[expected] ?? emptyResponseStats();
  return {
    ...accumulator,
    byResponse: {
      ...accumulator.byResponse,
      [expected]: {
        attempts: current.attempts + 1,
        correct: current.correct + (correct ? 1 : 0),
        reactionTimesMs:
          reactionMs !== undefined ? [...current.reactionTimesMs, reactionMs] : current.reactionTimesMs,
      },
    },
  };
};

const recordResolution = (
  accumulator: ChoiceAccumulator,
  outcome: ChoiceOutcome,
  trial: ChoiceTrial | null,
  reactionMs?: number,
): ChoiceAccumulator => {
  if (outcome === 'ignoredSpam') {
    return { ...accumulator, ignoredSpam: accumulator.ignoredSpam + 1 };
  }
  if (outcome === 'premature' || outcome === 'falseStart') {
    return bumpStreak(
      {
        ...accumulator,
        prematureResponses: accumulator.prematureResponses + 1,
        falseStarts: accumulator.falseStarts + 1,
      },
      false,
    );
  }

  let next: ChoiceAccumulator = {
    ...accumulator,
    trialsResolved: accumulator.trialsResolved + 1,
  };

  if (outcome === 'correct') {
    const motorRt = trial && trial.expected !== 'nogo' ? reactionMs : undefined;
    if (motorRt !== undefined && trial) {
      next = {
        ...next,
        choiceReactionTimesMs: [...next.choiceReactionTimesMs, motorRt],
        preSwitchReactionTimesMs: trial.afterRuleSwitch
          ? next.preSwitchReactionTimesMs
          : [...next.preSwitchReactionTimesMs, motorRt],
        postSwitchReactionTimesMs: trial.afterRuleSwitch
          ? [...next.postSwitchReactionTimesMs, motorRt]
          : next.postSwitchReactionTimesMs,
      };
    }
    next = recordByResponse({ ...next, correct: next.correct + 1 }, trial?.expected ?? 'tap', true, motorRt);
    return bumpStreak(next, true);
  }

  if (outcome === 'omission') {
    next = recordByResponse({ ...next, omissions: next.omissions + 1 }, trial?.expected ?? 'tap', false);
    return bumpStreak(next, false);
  }

  next = recordByResponse({ ...next, wrongResponses: next.wrongResponses + 1 }, trial?.expected ?? 'tap', false);
  return bumpStreak(next, false);
};

export const createTrial = (
  config: ChoiceRoundConfig,
  ruleSet: ChoiceRuleSet,
  nowMs: number,
  rng: ChoiceRng,
  afterRuleSwitch: boolean,
  forcedStimulusId?: string,
): ChoiceTrial => {
  const mapping = pickMapping(ruleSet, rng, forcedStimulusId);
  const source =
    config.stimuli.find(stimulus => stimulus.id === mapping.stimulusId) ?? fallbackStimuli()[0];
  const stimulus = applySimilarity(source, Boolean(config.similarStimuli));
  const id = `choice-${nowMs}-${Math.floor(rng() * 1_000_000)}`;
  return {
    id,
    stimulus,
    expected: mapping.response,
    shownAtMs: nowMs,
    endsAtMs: nowMs + config.stimulusMs,
    responded: false,
    ruleSetId: ruleSet.id,
    afterRuleSwitch,
  };
};

export const createChoiceRound = (
  config: ChoiceRoundConfig,
  nowMs: number,
  rng: ChoiceRng = Math.random,
): ChoiceRoundState => {
  const normalized = normalizeChoiceConfig(config);
  void rng;
  return {
    phase: 'briefing',
    config: normalized,
    activeRuleSet: normalized.ruleSet,
    trial: null,
    phaseEndsAtMs: nowMs + normalized.briefingMs,
    feedback: null,
    accumulator: emptyAccumulator(normalized, nowMs),
  };
};

const maybeSwitchRules = (state: ChoiceRoundState): ChoiceRoundState => {
  const { switchAfterTrials, alternateRuleSet } = state.config;
  if (!switchAfterTrials || !alternateRuleSet || state.accumulator.switched) {
    return state;
  }
  if (state.accumulator.trialsResolved < switchAfterTrials) {
    return state;
  }
  return {
    ...state,
    activeRuleSet: alternateRuleSet,
    accumulator: { ...state.accumulator, switched: true },
  };
};

const enterStimulus = (
  state: ChoiceRoundState,
  nowMs: number,
  rng: ChoiceRng,
  forcedStimulusId?: string,
): ChoiceRoundState => {
  const trial = createTrial(
    state.config,
    state.activeRuleSet,
    nowMs,
    rng,
    state.accumulator.switched,
    forcedStimulusId,
  );
  return {
    ...state,
    phase: 'stimulus',
    trial,
    phaseEndsAtMs: trial.endsAtMs,
    feedback: null,
  };
};

const enterFeedback = (state: ChoiceRoundState, outcome: ChoiceOutcome, nowMs: number): ChoiceRoundState => ({
  ...state,
  phase: 'feedback',
  feedback: outcome,
  phaseEndsAtMs: nowMs + CHOICE_FEEDBACK_MS,
  trial: state.trial ? { ...state.trial, responded: true } : null,
  accumulator: recordResolution(
    state.accumulator,
    outcome,
    state.trial,
    outcome === 'correct' && state.trial ? Math.max(0, nowMs - state.trial.shownAtMs) : undefined,
  ),
});

const enterIsi = (state: ChoiceRoundState, nowMs: number, rng: ChoiceRng): ChoiceRoundState => {
  const switched = maybeSwitchRules(state);
  return {
    ...switched,
    phase: 'isi',
    trial: null,
    feedback: null,
    phaseEndsAtMs: nowMs + nextIsiMs(switched.config, rng),
  };
};

export const respondChoice = (
  state: ChoiceRoundState,
  nowMs: number,
  observed: ChoiceResponseKind,
): { state: ChoiceRoundState; outcome: ChoiceOutcome } => {
  if (state.phase === 'briefing') {
    const next = {
      ...state,
      accumulator: recordResolution(state.accumulator, 'ignoredSpam', state.trial),
    };
    return { state: next, outcome: 'ignoredSpam' };
  }

  if (state.phase === 'isi') {
    const next = {
      ...state,
      accumulator: recordResolution(state.accumulator, 'premature', state.trial),
    };
    return { state: next, outcome: 'premature' };
  }

  if (state.phase !== 'stimulus' || !state.trial || state.trial.responded) {
    const next = {
      ...state,
      accumulator: recordResolution(state.accumulator, 'ignoredSpam', state.trial),
    };
    return { state: next, outcome: 'ignoredSpam' };
  }

  const expected = state.trial.expected;
  if (expected === 'nogo') {
    return { state: enterFeedback(state, 'wrongResponse', nowMs), outcome: 'wrongResponse' };
  }
  if (observed === expected) {
    return { state: enterFeedback(state, 'correct', nowMs), outcome: 'correct' };
  }
  return { state: enterFeedback(state, 'wrongResponse', nowMs), outcome: 'wrongResponse' };
};

export const tickChoice = (
  state: ChoiceRoundState,
  nowMs: number,
  rng: ChoiceRng = Math.random,
  forcedNextStimulusId?: string,
): { state: ChoiceRoundState; outcome: ChoiceOutcome | null } => {
  if (state.phase === 'briefing' && nowMs >= state.phaseEndsAtMs) {
    return { state: enterIsi(state, nowMs, rng), outcome: null };
  }
  if (state.phase === 'isi' && nowMs >= state.phaseEndsAtMs) {
    return { state: enterStimulus(state, nowMs, rng, forcedNextStimulusId), outcome: null };
  }
  if (state.phase === 'stimulus' && state.trial && !state.trial.responded && nowMs >= state.trial.endsAtMs) {
    const outcome: ChoiceOutcome = state.trial.expected === 'nogo' ? 'correct' : 'omission';
    return { state: enterFeedback(state, outcome, nowMs), outcome };
  }
  if (state.phase === 'feedback' && nowMs >= state.phaseEndsAtMs) {
    return { state: enterIsi(state, nowMs, rng), outcome: null };
  }
  return { state, outcome: null };
};

export const shiftChoicePhase = (state: ChoiceRoundState, remainingMs: number, nowMs: number): ChoiceRoundState => {
  const phaseEndsAtMs = nowMs + Math.max(0, remainingMs);
  const trial =
    state.trial && state.phase === 'stimulus' ? { ...state.trial, endsAtMs: phaseEndsAtMs } : state.trial;
  return { ...state, phaseEndsAtMs, trial };
};

export interface PointerGestureSample {
  dx: number;
  dy: number;
  elapsedMs: number;
  minDistancePx: number;
  holdMs?: number;
}

export const classifyPointerGesture = (sample: PointerGestureSample): Exclude<ChoiceResponseKind, 'nogo'> => {
  if (
    isIntentionalSwipe({
      dx: sample.dx,
      dy: sample.dy,
      elapsedMs: sample.elapsedMs,
      minDistancePx: sample.minDistancePx,
    })
  ) {
    const direction = getSwipeDirection(sample.dx, sample.dy);
    if (direction === 'left') return 'swipeLeft';
    if (direction === 'right') return 'swipeRight';
    if (direction === 'up') return 'swipeUp';
    return 'swipeDown';
  }
  if (sample.elapsedMs >= (sample.holdMs ?? DEFAULT_CHOICE_HOLD_MS)) {
    return 'hold';
  }
  return 'tap';
};

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

const stdDev = (values: number[]): number | null => {
  if (values.length < 2) return null;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export const deriveChoiceReactionMetrics = (accumulator: ChoiceAccumulator): ChoiceReactionMetrics => {
  const scored = accumulator.trialsResolved;
  const times = accumulator.choiceReactionTimesMs;
  const meanChoiceReactionMs = average(times);
  const deviation = stdDev(times);
  const consistencyPct =
    meanChoiceReactionMs === null || deviation === null
      ? null
      : Math.round(clamp(100 - (deviation / Math.max(meanChoiceReactionMs, 1)) * 100, 0, 100));
  const preAvg = average(accumulator.preSwitchReactionTimesMs);
  const postAvg = average(accumulator.postSwitchReactionTimesMs);

  const byResponse: ChoiceReactionMetrics['byResponse'] = {};
  (Object.keys(accumulator.byResponse) as ChoiceResponseKind[]).forEach(kind => {
    const stats = accumulator.byResponse[kind];
    if (!stats) return;
    byResponse[kind] = {
      attempts: stats.attempts,
      correct: stats.correct,
      meanRtMs: average(stats.reactionTimesMs),
    };
  });

  return {
    decisionAccuracyPct: scored > 0 ? Math.round((accumulator.correct / scored) * 100) : 0,
    meanChoiceReactionMs,
    wrongResponseCount: accumulator.wrongResponses,
    omissions: accumulator.omissions,
    falseStarts: accumulator.falseStarts,
    prematureResponses: accumulator.prematureResponses,
    correct: accumulator.correct,
    trialsResolved: scored,
    bestStreak: accumulator.bestStreak,
    consistencyPct,
    ruleSwitchCostMs:
      preAvg === null || postAvg === null || !accumulator.switched ? null : postAvg - preAvg,
    byResponse,
  };
};

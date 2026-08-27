import {
  ComprehensionAccumulator,
  ComprehensionChoice,
  ComprehensionFamily,
  ComprehensionFamilyStats,
  ComprehensionItem,
  ComprehensionMetrics,
  ComprehensionOutcome,
  ComprehensionRoundConfig,
  ComprehensionRoundState,
  ComprehensionTrial,
  ComprehensionVisualToken,
} from '../types/rapidComprehension';

export const MIN_COMPREHENSION_DISPLAY_MS = 900;
export const MIN_COMPREHENSION_DELAY_MS = 280;
export const MIN_COMPREHENSION_ANSWER_MS = 2200;
export const COMPREHENSION_FEEDBACK_MS = 180;

export const COMPREHENSION_FAMILIES: ComprehensionFamily[] = [
  'objectRelationship',
  'sequenceComprehension',
  'conditionalRule',
  'spatialComprehension',
];

const OBJECT_PALETTE: Array<{ color: string; colorName: string; shape: NonNullable<ComprehensionVisualToken['shape']> }> = [
  { color: '#facc15', colorName: 'Yellow', shape: 'triangle' },
  { color: '#60a5fa', colorName: 'Blue', shape: 'circle' },
  { color: '#4ade80', colorName: 'Green', shape: 'square' },
  { color: '#f87171', colorName: 'Red', shape: 'diamond' },
];

const SEQUENCE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const SPATIAL_SLOTS = [
  { row: 0, col: 0, label: 'Top left' },
  { row: 0, col: 1, label: 'Top right' },
  { row: 1, col: 0, label: 'Bottom left' },
  { row: 1, col: 1, label: 'Bottom right' },
];

export type ComprehensionRng = () => number;

export const createComprehensionRng = (seed: number): ComprehensionRng => {
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

const pickIndex = (length: number, rng: ComprehensionRng) => Math.min(length - 1, Math.floor(rng() * length));

const shuffle = <T,>(items: T[], rng: ComprehensionRng): T[] => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = pickIndex(i + 1, rng);
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
};

const uniqueLabels = (choices: ComprehensionChoice[]) => {
  const seen = new Set<string>();
  return choices.filter(choice => {
    const key = choice.label.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizeComprehensionConfig = (config: ComprehensionRoundConfig): ComprehensionRoundConfig => {
  const families = config.families.filter(family => COMPREHENSION_FAMILIES.includes(family));
  return {
    ...config,
    displayMs: Math.max(MIN_COMPREHENSION_DISPLAY_MS, Math.round(config.displayMs)),
    delayMs: Math.max(MIN_COMPREHENSION_DELAY_MS, Math.round(config.delayMs)),
    answerMs: Math.max(MIN_COMPREHENSION_ANSWER_MS, Math.round(config.answerMs)),
    optionCount: clamp(Math.round(config.optionCount), 2, 4),
    informationCount: clamp(Math.round(config.informationCount), 2, 5),
    distractorCount: clamp(Math.round(config.distractorCount), 0, 2),
    ruleComplexity: config.ruleComplexity === 2 ? 2 : 1,
    families: families.length > 0 ? families : [...COMPREHENSION_FAMILIES],
    switchAfterTrials:
      config.switchAfterTrials !== undefined ? Math.max(1, Math.round(config.switchAfterTrials)) : undefined,
  };
};

const fallbackObjectItem = (): ComprehensionItem => ({
  id: 'fallback-object',
  family: 'objectRelationship',
  encodeHeadline: 'Yellow triangle moved left. Blue circle stayed still.',
  encodeTokens: [
    { id: 'yellow-triangle', label: 'Yellow triangle', color: '#facc15', shape: 'triangle', motion: 'left' },
    { id: 'blue-circle', label: 'Blue circle', color: '#60a5fa', shape: 'circle', motion: 'still' },
  ],
  question: 'Which object moved?',
  choices: [
    { id: 'yellow-triangle', label: 'Yellow triangle' },
    { id: 'blue-circle', label: 'Blue circle' },
  ],
  correctChoiceId: 'yellow-triangle',
});

const fallbackSequenceItem = (): ComprehensionItem => ({
  id: 'fallback-sequence',
  family: 'sequenceComprehension',
  encodeHeadline: 'A → C → B → D',
  encodeTokens: [],
  encodeSequence: ['A', 'C', 'B', 'D'],
  question: 'What came before D?',
  choices: [
    { id: 'B', label: 'B' },
    { id: 'C', label: 'C' },
    { id: 'A', label: 'A' },
  ],
  correctChoiceId: 'B',
});

const fallbackConditionalItem = (): ComprehensionItem => ({
  id: 'fallback-conditional',
  family: 'conditionalRule',
  encodeHeadline: 'Blue flashes twice.',
  encodeTokens: [{ id: 'blue', label: 'Blue ×2', color: '#60a5fa', shape: 'circle', flashes: 2 }],
  encodeRuleText: 'If blue flashes twice, choose left. If green flashes once, choose right.',
  question: 'Which way?',
  choices: [
    { id: 'left', label: 'Left' },
    { id: 'right', label: 'Right' },
  ],
  correctChoiceId: 'left',
});

const fallbackSpatialItem = (): ComprehensionItem => ({
  id: 'fallback-spatial',
  family: 'spatialComprehension',
  encodeHeadline: 'Green square, top left.',
  encodeTokens: [
    { id: 'green-square', label: 'Green square', color: '#4ade80', shape: 'square', row: 0, col: 0 },
  ],
  question: 'Where was the green square?',
  choices: [
    { id: 'top-left', label: 'Top left' },
    { id: 'top-right', label: 'Top right' },
    { id: 'bottom-left', label: 'Bottom left' },
    { id: 'bottom-right', label: 'Bottom right' },
  ],
  correctChoiceId: 'top-left',
});

const fallbackByFamily: Record<ComprehensionFamily, () => ComprehensionItem> = {
  objectRelationship: fallbackObjectItem,
  sequenceComprehension: fallbackSequenceItem,
  conditionalRule: fallbackConditionalItem,
  spatialComprehension: fallbackSpatialItem,
};

export const validateComprehensionItem = (item: ComprehensionItem): string[] => {
  const errors: string[] = [];
  if (!item.id) errors.push('id is required');
  if (!COMPREHENSION_FAMILIES.includes(item.family)) errors.push('unknown family');
  if (!item.encodeHeadline.trim()) errors.push('encodeHeadline is required');
  if (!item.question.trim()) errors.push('question is required');
  if (item.choices.length < 2 || item.choices.length > 4) errors.push('choices must be 2-4');
  const ids = item.choices.map(choice => choice.id);
  const labels = item.choices.map(choice => choice.label.trim().toLowerCase());
  if (new Set(ids).size !== ids.length) errors.push('choice ids must be unique');
  if (new Set(labels).size !== labels.length) errors.push('choice labels must be unique');
  if (labels.some(label => !label)) errors.push('choice labels must be non-empty');
  if (!item.choices.some(choice => choice.id === item.correctChoiceId)) {
    errors.push('correctChoiceId must be one of the choices');
  }

  if (item.family === 'objectRelationship') {
    if (item.encodeTokens.length < 2) errors.push('object items need at least two tokens');
    const movers = item.encodeTokens.filter(token => token.motion && token.motion !== 'still');
    if (movers.length !== 1) errors.push('object items must have exactly one mover');
    const mover = movers[0];
    if (mover && item.correctChoiceId !== mover.id) errors.push('object correct answer must be the mover');
    if (item.question !== 'Which object moved?') errors.push('object question must be unambiguous');
  }

  if (item.family === 'sequenceComprehension') {
    const sequence = item.encodeSequence ?? [];
    if (sequence.length < 3) errors.push('sequence needs at least three steps');
    if (new Set(sequence).size !== sequence.length) errors.push('sequence letters must be unique');
    const match = /^What came before ([A-F])\?$/.exec(item.question);
    if (!match) {
      errors.push('sequence question must be "What came before X?"');
    } else {
      const probe = match[1];
      const probeIndex = sequence.indexOf(probe);
      if (probeIndex < 1) errors.push('cannot ask what came before the first item');
      const predecessor = sequence[probeIndex - 1];
      const correct = item.choices.find(choice => choice.id === item.correctChoiceId);
      if (correct && predecessor && correct.label !== predecessor) {
        errors.push('sequence correct answer must be the predecessor');
      }
    }
  }

  if (item.family === 'conditionalRule') {
    if (!item.encodeRuleText?.trim()) errors.push('conditional items need a rule');
    if (!item.encodeTokens[0]) errors.push('conditional items need a presented condition');
    if (item.question !== 'Which way?') errors.push('conditional question must be "Which way?"');
    const labelsOk = item.choices.every(choice => choice.label === 'Left' || choice.label === 'Right');
    if (!labelsOk) errors.push('conditional answers must be Left or Right');
  }

  if (item.family === 'spatialComprehension') {
    if (item.encodeTokens.length < 1) errors.push('spatial items need a placed token');
    const token = item.encodeTokens[0];
    if (token && (token.row === undefined || token.col === undefined)) {
      errors.push('spatial token needs a grid slot');
    }
    const slot = SPATIAL_SLOTS.find(entry => entry.row === token?.row && entry.col === token?.col);
    const correct = item.choices.find(choice => choice.id === item.correctChoiceId);
    if (slot && correct && correct.label !== slot.label) {
      errors.push('spatial correct answer must match the occupied slot');
    }
  }

  return errors;
};

const finalizeItem = (draft: ComprehensionItem, optionCount: number, rng: ComprehensionRng): ComprehensionItem => {
  const correct = draft.choices.find(choice => choice.id === draft.correctChoiceId);
  if (!correct) return fallbackByFamily[draft.family]();
  const others = uniqueLabels(draft.choices.filter(choice => choice.id !== correct.id));
  const limited = [correct, ...others].slice(0, optionCount);
  const choices = shuffle(limited, rng);
  if (choices.length < 2) return fallbackByFamily[draft.family]();
  return { ...draft, choices };
};

const buildObjectItem = (config: ComprehensionRoundConfig, rng: ComprehensionRng, id: string): ComprehensionItem => {
  const count = clamp(config.informationCount, 2, OBJECT_PALETTE.length);
  const palette = shuffle(OBJECT_PALETTE, rng).slice(0, count);
  const moverIndex = pickIndex(palette.length, rng);
  const tokens: ComprehensionVisualToken[] = palette.map((entry, index) => {
    const label = `${entry.colorName} ${entry.shape}`;
    return {
      id: `${entry.colorName.toLowerCase()}-${entry.shape}`,
      label,
      color: entry.color,
      shape: entry.shape,
      motion: index === moverIndex ? 'left' : 'still',
    };
  });
  const mover = tokens[moverIndex];
  const headline = tokens
    .map(token =>
      token.motion === 'still' ? `${token.label} stayed still.` : `${token.label} moved left.`,
    )
    .join(' ');
  const distractors = tokens.filter(token => token.id !== mover.id).map(token => ({ id: token.id, label: token.label }));
  if (config.distractorCount > 0) {
    distractors.push({ id: 'neither', label: 'Neither' });
  }
  return finalizeItem(
    {
      id,
      family: 'objectRelationship',
      encodeHeadline: headline,
      encodeTokens: tokens,
      question: 'Which object moved?',
      choices: [{ id: mover.id, label: mover.label }, ...distractors],
      correctChoiceId: mover.id,
    },
    config.optionCount,
    rng,
  );
};

const buildSequenceItem = (config: ComprehensionRoundConfig, rng: ComprehensionRng, id: string): ComprehensionItem => {
  const length = clamp(config.informationCount, 3, SEQUENCE_LETTERS.length);
  const sequence = shuffle(SEQUENCE_LETTERS, rng).slice(0, length);
  const probeIndex = 1 + pickIndex(sequence.length - 1, rng);
  const probe = sequence[probeIndex];
  const predecessor = sequence[probeIndex - 1];
  const others = sequence.filter(letter => letter !== predecessor);
  if (config.distractorCount > 0) {
    const unused = SEQUENCE_LETTERS.find(letter => !sequence.includes(letter));
    if (unused) others.push(unused);
  }
  return finalizeItem(
    {
      id,
      family: 'sequenceComprehension',
      encodeHeadline: sequence.join(' → '),
      encodeTokens: [],
      encodeSequence: sequence,
      question: `What came before ${probe}?`,
      choices: [{ id: predecessor, label: predecessor }, ...others.map(letter => ({ id: letter, label: letter }))],
      correctChoiceId: predecessor,
    },
    config.optionCount,
    rng,
  );
};

const buildConditionalItem = (
  config: ComprehensionRoundConfig,
  rng: ComprehensionRng,
  id: string,
  switched: boolean,
): ComprehensionItem => {
  const blueLeft = !switched;
  const ruleText =
    config.ruleComplexity === 2
      ? `If blue flashes twice, choose ${blueLeft ? 'left' : 'right'}. If green flashes once, choose ${blueLeft ? 'right' : 'left'}.`
      : `If blue flashes twice, choose ${blueLeft ? 'left' : 'right'}.`;
  const useBlue = config.ruleComplexity === 1 || rng() < 0.5;
  const presented: ComprehensionVisualToken = useBlue
    ? { id: 'blue', label: 'Blue ×2', color: '#60a5fa', shape: 'circle', flashes: 2 }
    : { id: 'green', label: 'Green ×1', color: '#4ade80', shape: 'circle', flashes: 1 };
  const correctIsLeft = useBlue ? blueLeft : !blueLeft;
  const correctId = correctIsLeft ? 'left' : 'right';
  return finalizeItem(
    {
      id,
      family: 'conditionalRule',
      encodeHeadline: `${presented.label}.`,
      encodeTokens: [presented],
      encodeRuleText: ruleText,
      question: 'Which way?',
      choices: [
        { id: 'left', label: 'Left' },
        { id: 'right', label: 'Right' },
      ],
      correctChoiceId: correctId,
    },
    2,
    rng,
  );
};

const buildSpatialItem = (config: ComprehensionRoundConfig, rng: ComprehensionRng, id: string): ComprehensionItem => {
  const slot = SPATIAL_SLOTS[pickIndex(SPATIAL_SLOTS.length, rng)];
  const palette = shuffle(OBJECT_PALETTE, rng)[0];
  const token: ComprehensionVisualToken = {
    id: `${palette.colorName.toLowerCase()}-${palette.shape}`,
    label: `${palette.colorName} ${palette.shape}`,
    color: palette.color,
    shape: palette.shape,
    row: slot.row,
    col: slot.col,
  };
  const extras =
    config.distractorCount > 0
      ? shuffle(
          SPATIAL_SLOTS.filter(entry => entry.label !== slot.label),
          rng,
        ).slice(0, 1)
      : [];
  const extraTokens = extras.map(entry => {
    const extraPalette = OBJECT_PALETTE.find(item => item.colorName !== palette.colorName) ?? OBJECT_PALETTE[1];
    return {
      id: `${extraPalette.colorName.toLowerCase()}-${entry.label}`,
      label: `${extraPalette.colorName} ${extraPalette.shape}`,
      color: extraPalette.color,
      shape: extraPalette.shape,
      row: entry.row,
      col: entry.col,
    };
  });
  return finalizeItem(
    {
      id,
      family: 'spatialComprehension',
      encodeHeadline: `${token.label}, ${slot.label.toLowerCase()}.`,
      encodeTokens: [token, ...extraTokens],
      question: `Where was the ${token.label.toLowerCase()}?`,
      choices: SPATIAL_SLOTS.map(entry => ({
        id: entry.label.toLowerCase().replace(' ', '-'),
        label: entry.label,
      })),
      correctChoiceId: slot.label.toLowerCase().replace(' ', '-'),
    },
    config.optionCount,
    rng,
  );
};

export const createComprehensionItem = (
  config: ComprehensionRoundConfig,
  rng: ComprehensionRng,
  family: ComprehensionFamily,
  switched: boolean,
  nowMs: number,
): ComprehensionItem => {
  const id = `comp-${family}-${nowMs}-${Math.floor(rng() * 1_000_000)}`;
  const builders: Record<ComprehensionFamily, () => ComprehensionItem> = {
    objectRelationship: () => buildObjectItem(config, rng, id),
    sequenceComprehension: () => buildSequenceItem(config, rng, id),
    conditionalRule: () => buildConditionalItem(config, rng, id, switched),
    spatialComprehension: () => buildSpatialItem(config, rng, id),
  };
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const item = builders[family]();
    if (validateComprehensionItem(item).length === 0) return item;
  }
  return fallbackByFamily[family]();
};

const emptyFamilyStats = (): ComprehensionFamilyStats => ({ attempts: 0, correct: 0, reactionTimesMs: [] });

const emptyAccumulator = (config: ComprehensionRoundConfig, startedAtMs: number): ComprehensionAccumulator => ({
  startedAtMs,
  lastConfig: config,
  correct: 0,
  wrong: 0,
  encodingFailures: 0,
  prematureResponses: 0,
  ignoredSpam: 0,
  answerReactionTimesMs: [],
  byFamily: {},
  streak: 0,
  bestStreak: 0,
  trialsResolved: 0,
  switched: false,
  difficultyReached: 0,
});

const bumpStreak = (accumulator: ComprehensionAccumulator, success: boolean): ComprehensionAccumulator => {
  if (!success) return { ...accumulator, streak: 0 };
  const streak = accumulator.streak + 1;
  return { ...accumulator, streak, bestStreak: Math.max(accumulator.bestStreak, streak) };
};

const recordByFamily = (
  accumulator: ComprehensionAccumulator,
  family: ComprehensionFamily,
  correct: boolean,
  reactionMs?: number,
): ComprehensionAccumulator => {
  const current = accumulator.byFamily[family] ?? emptyFamilyStats();
  return {
    ...accumulator,
    byFamily: {
      ...accumulator.byFamily,
      [family]: {
        attempts: current.attempts + 1,
        correct: current.correct + (correct ? 1 : 0),
        reactionTimesMs:
          reactionMs !== undefined ? [...current.reactionTimesMs, reactionMs] : current.reactionTimesMs,
      },
    },
  };
};

const recordResolution = (
  accumulator: ComprehensionAccumulator,
  outcome: ComprehensionOutcome,
  trial: ComprehensionTrial | null,
  reactionMs?: number,
): ComprehensionAccumulator => {
  if (outcome === 'ignoredSpam') {
    return { ...accumulator, ignoredSpam: accumulator.ignoredSpam + 1 };
  }
  if (outcome === 'premature') {
    return bumpStreak({ ...accumulator, prematureResponses: accumulator.prematureResponses + 1 }, false);
  }
  let next: ComprehensionAccumulator = {
    ...accumulator,
    trialsResolved: accumulator.trialsResolved + 1,
  };
  const family = trial?.item.family ?? 'objectRelationship';
  if (outcome === 'correct') {
    next = {
      ...next,
      correct: next.correct + 1,
      answerReactionTimesMs: reactionMs !== undefined ? [...next.answerReactionTimesMs, reactionMs] : next.answerReactionTimesMs,
    };
    return bumpStreak(recordByFamily(next, family, true, reactionMs), true);
  }
  if (outcome === 'encodingFailure') {
    next = { ...next, encodingFailures: next.encodingFailures + 1 };
    return bumpStreak(recordByFamily(next, family, false), false);
  }
  next = { ...next, wrong: next.wrong + 1 };
  return bumpStreak(recordByFamily(next, family, false), false);
};

const pickFamily = (config: ComprehensionRoundConfig, trialsResolved: number, forced?: ComprehensionFamily) => {
  if (forced && config.families.includes(forced)) return forced;
  return config.families[trialsResolved % config.families.length] ?? config.families[0];
};

export const createComprehensionRound = (
  config: ComprehensionRoundConfig,
  nowMs: number,
  rng: ComprehensionRng = Math.random,
  forcedFamily?: ComprehensionFamily,
): ComprehensionRoundState => {
  const normalized = normalizeComprehensionConfig(config);
  const item = createComprehensionItem(normalized, rng, pickFamily(normalized, 0, forcedFamily), false, nowMs);
  const trial: ComprehensionTrial = {
    id: item.id,
    item,
    shownAtMs: nowMs,
    questionAtMs: nowMs + normalized.displayMs + normalized.delayMs,
    endsAtMs: nowMs + normalized.displayMs + normalized.delayMs + normalized.answerMs,
    responded: false,
    afterRuleSwitch: false,
  };
  return {
    phase: 'encoding',
    config: normalized,
    trial,
    phaseEndsAtMs: nowMs + normalized.displayMs,
    feedback: null,
    accumulator: emptyAccumulator(normalized, nowMs),
  };
};

const enterDelay = (state: ComprehensionRoundState, nowMs: number): ComprehensionRoundState => ({
  ...state,
  phase: 'delay',
  feedback: null,
  phaseEndsAtMs: nowMs + state.config.delayMs,
});

const enterQuestion = (state: ComprehensionRoundState, nowMs: number): ComprehensionRoundState => {
  const trial = state.trial
    ? { ...state.trial, questionAtMs: nowMs, endsAtMs: nowMs + state.config.answerMs }
    : null;
  return {
    ...state,
    phase: 'question',
    trial,
    feedback: null,
    phaseEndsAtMs: trial ? trial.endsAtMs : nowMs + state.config.answerMs,
  };
};

const enterFeedback = (
  state: ComprehensionRoundState,
  outcome: ComprehensionOutcome,
  nowMs: number,
): ComprehensionRoundState => ({
  ...state,
  phase: 'feedback',
  feedback: outcome,
  phaseEndsAtMs: nowMs + COMPREHENSION_FEEDBACK_MS,
  trial: state.trial ? { ...state.trial, responded: true } : null,
  accumulator: recordResolution(
    state.accumulator,
    outcome,
    state.trial,
    outcome === 'correct' && state.trial ? Math.max(0, nowMs - state.trial.questionAtMs) : undefined,
  ),
});

const enterEncoding = (
  state: ComprehensionRoundState,
  nowMs: number,
  rng: ComprehensionRng,
  forcedFamily?: ComprehensionFamily,
): ComprehensionRoundState => {
  const switched =
    Boolean(state.config.switchAfterTrials) &&
    (state.accumulator.switched || state.accumulator.trialsResolved >= (state.config.switchAfterTrials ?? Infinity));
  const family = pickFamily(state.config, state.accumulator.trialsResolved, forcedFamily);
  const item = createComprehensionItem(state.config, rng, family, switched, nowMs);
  const trial: ComprehensionTrial = {
    id: item.id,
    item,
    shownAtMs: nowMs,
    questionAtMs: nowMs + state.config.displayMs + state.config.delayMs,
    endsAtMs: nowMs + state.config.displayMs + state.config.delayMs + state.config.answerMs,
    responded: false,
    afterRuleSwitch: switched,
  };
  return {
    ...state,
    phase: 'encoding',
    trial,
    feedback: null,
    phaseEndsAtMs: nowMs + state.config.displayMs,
    accumulator: { ...state.accumulator, switched },
  };
};

export const respondComprehension = (
  state: ComprehensionRoundState,
  nowMs: number,
  choiceId: string,
): { state: ComprehensionRoundState; outcome: ComprehensionOutcome } => {
  if (state.phase === 'encoding' || state.phase === 'delay') {
    const next = {
      ...state,
      feedback: 'premature' as const,
      accumulator: recordResolution(state.accumulator, 'premature', state.trial),
    };
    return { state: next, outcome: 'premature' };
  }
  if (state.phase !== 'question' || !state.trial || state.trial.responded) {
    const next = { ...state, accumulator: recordResolution(state.accumulator, 'ignoredSpam', state.trial) };
    return { state: next, outcome: 'ignoredSpam' };
  }
  const outcome: ComprehensionOutcome = choiceId === state.trial.item.correctChoiceId ? 'correct' : 'wrong';
  return { state: enterFeedback(state, outcome, nowMs), outcome };
};

export const tickComprehension = (
  state: ComprehensionRoundState,
  nowMs: number,
  rng: ComprehensionRng = Math.random,
  forcedNextFamily?: ComprehensionFamily,
): { state: ComprehensionRoundState; outcome: ComprehensionOutcome | null } => {
  if (state.phase === 'encoding' && nowMs >= state.phaseEndsAtMs) {
    return { state: enterDelay(state, nowMs), outcome: null };
  }
  if (state.phase === 'delay' && nowMs >= state.phaseEndsAtMs) {
    return { state: enterQuestion(state, nowMs), outcome: null };
  }
  if (state.phase === 'question' && state.trial && !state.trial.responded && nowMs >= state.trial.endsAtMs) {
    return { state: enterFeedback(state, 'encodingFailure', nowMs), outcome: 'encodingFailure' };
  }
  if (state.phase === 'feedback' && nowMs >= state.phaseEndsAtMs) {
    return { state: enterEncoding(state, nowMs, rng, forcedNextFamily), outcome: null };
  }
  return { state, outcome: null };
};

export const shiftComprehensionPhase = (
  state: ComprehensionRoundState,
  remainingMs: number,
  nowMs: number,
): ComprehensionRoundState => {
  const phaseEndsAtMs = nowMs + Math.max(0, remainingMs);
  const trial =
    state.trial && state.phase === 'question' ? { ...state.trial, endsAtMs: phaseEndsAtMs } : state.trial;
  return { ...state, phaseEndsAtMs, trial };
};

const average = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export const deriveComprehensionMetrics = (accumulator: ComprehensionAccumulator): ComprehensionMetrics => {
  const scored = accumulator.trialsResolved;
  const times = accumulator.answerReactionTimesMs;
  const firstSlice = times.slice(0, Math.max(1, Math.floor(times.length / 4)));
  const lastSlice = times.slice(Math.max(0, times.length - Math.max(1, Math.floor(times.length / 4))));
  const firstAvg = average(firstSlice);
  const lastAvg = average(lastSlice);
  const byFamily: ComprehensionMetrics['byFamily'] = {};
  (Object.keys(accumulator.byFamily) as ComprehensionFamily[]).forEach(family => {
    const stats = accumulator.byFamily[family];
    if (!stats) return;
    byFamily[family] = {
      attempts: stats.attempts,
      correct: stats.correct,
      accuracyPct: stats.attempts > 0 ? Math.round((stats.correct / stats.attempts) * 100) : 0,
      meanRtMs: average(stats.reactionTimesMs),
    };
  });
  return {
    comprehensionAccuracyPct: scored > 0 ? Math.round((accumulator.correct / scored) * 100) : 0,
    meanAnswerReactionMs: average(times),
    encodingFailures: accumulator.encodingFailures,
    wrong: accumulator.wrong,
    correct: accumulator.correct,
    trialsResolved: scored,
    difficultyReached: accumulator.difficultyReached,
    bestStreak: accumulator.bestStreak,
    prematureResponses: accumulator.prematureResponses,
    performanceDecayMs: firstAvg === null || lastAvg === null || times.length < 4 ? null : lastAvg - firstAvg,
    byFamily,
  };
};

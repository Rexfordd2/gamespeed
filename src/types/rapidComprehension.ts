export type ComprehensionFamily =
  | 'objectRelationship'
  | 'sequenceComprehension'
  | 'conditionalRule'
  | 'spatialComprehension';

export type ComprehensionSportCueKind = 'coverage' | 'direction' | 'player' | 'tactical';

export interface ComprehensionSportCue {
  kind: ComprehensionSportCueKind;
  symbol: string;
}

export interface ComprehensionVisualToken {
  id: string;
  label: string;
  color: string;
  shape?: 'circle' | 'triangle' | 'square' | 'diamond';
  motion?: 'left' | 'right' | 'up' | 'down' | 'still';
  row?: number;
  col?: number;
  flashes?: number;
  /** Future sport-pack substitution without rewriting the trial engine. */
  sportCue?: ComprehensionSportCue;
}

export interface ComprehensionChoice {
  id: string;
  label: string;
}

export interface ComprehensionItem {
  id: string;
  family: ComprehensionFamily;
  encodeHeadline: string;
  encodeTokens: ComprehensionVisualToken[];
  encodeSequence?: string[];
  encodeRuleText?: string;
  question: string;
  choices: ComprehensionChoice[];
  correctChoiceId: string;
}

export interface ComprehensionRoundConfig {
  displayMs: number;
  delayMs: number;
  answerMs: number;
  optionCount: number;
  informationCount: number;
  distractorCount: number;
  ruleComplexity: 1 | 2;
  families: ComprehensionFamily[];
  switchAfterTrials?: number;
}

export type ComprehensionPhase = 'encoding' | 'delay' | 'question' | 'feedback';

export type ComprehensionOutcome = 'correct' | 'wrong' | 'encodingFailure' | 'premature' | 'ignoredSpam';

export interface ComprehensionTrial {
  id: string;
  item: ComprehensionItem;
  shownAtMs: number;
  questionAtMs: number;
  endsAtMs: number;
  responded: boolean;
  afterRuleSwitch: boolean;
}

export interface ComprehensionFamilyStats {
  attempts: number;
  correct: number;
  reactionTimesMs: number[];
}

export interface ComprehensionAccumulator {
  startedAtMs: number;
  lastConfig: ComprehensionRoundConfig;
  correct: number;
  wrong: number;
  encodingFailures: number;
  prematureResponses: number;
  ignoredSpam: number;
  answerReactionTimesMs: number[];
  byFamily: Partial<Record<ComprehensionFamily, ComprehensionFamilyStats>>;
  streak: number;
  bestStreak: number;
  trialsResolved: number;
  switched: boolean;
  difficultyReached: number;
}

export interface ComprehensionRoundState {
  phase: ComprehensionPhase;
  config: ComprehensionRoundConfig;
  trial: ComprehensionTrial | null;
  phaseEndsAtMs: number;
  feedback: ComprehensionOutcome | null;
  accumulator: ComprehensionAccumulator;
}

export interface ComprehensionMetrics {
  comprehensionAccuracyPct: number;
  meanAnswerReactionMs: number | null;
  encodingFailures: number;
  wrong: number;
  correct: number;
  trialsResolved: number;
  difficultyReached: number;
  bestStreak: number;
  prematureResponses: number;
  performanceDecayMs: number | null;
  byFamily: Partial<
    Record<ComprehensionFamily, { attempts: number; correct: number; accuracyPct: number; meanRtMs: number | null }>
  >;
}

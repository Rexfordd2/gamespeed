export type ChoiceResponseKind =
  | 'tap'
  | 'swipeLeft'
  | 'swipeRight'
  | 'swipeUp'
  | 'swipeDown'
  | 'hold'
  | 'nogo';

export type ChoiceStimulusKind = 'color' | 'shape' | 'symbol';

export type ChoiceSportCueKind = 'coverage' | 'direction' | 'player' | 'tactical';

export interface ChoiceSportCue {
  kind: ChoiceSportCueKind;
  symbol: string;
}

export interface ChoiceStimulusDef {
  id: string;
  kind: ChoiceStimulusKind;
  label: string;
  color?: string;
  shape?: 'circle' | 'diamond' | 'square';
  /** Future sport-pack substitution without rewriting the trial engine. */
  sportCue?: ChoiceSportCue;
}

export interface ChoiceMapping {
  stimulusId: string;
  response: ChoiceResponseKind;
}

export interface ChoiceLegendEntry {
  stimulus: ChoiceStimulusDef;
  response: ChoiceResponseKind;
  responseLabel: string;
}

export interface ChoiceRuleSet {
  id: string;
  mappings: ChoiceMapping[];
  keepLegendVisible?: boolean;
}

export interface ChoiceRoundConfig {
  ruleSet: ChoiceRuleSet;
  stimuli: ChoiceStimulusDef[];
  stimulusMs: number;
  isiMinMs: number;
  isiMaxMs: number;
  briefingMs: number;
  holdMs?: number;
  similarStimuli?: boolean;
  switchAfterTrials?: number;
  alternateRuleSet?: ChoiceRuleSet;
}

export type ChoicePhase = 'briefing' | 'isi' | 'stimulus' | 'feedback';

export type ChoiceOutcome =
  | 'correct'
  | 'wrongResponse'
  | 'omission'
  | 'falseStart'
  | 'premature'
  | 'ignoredSpam';

export interface ChoiceTrial {
  id: string;
  stimulus: ChoiceStimulusDef;
  expected: ChoiceResponseKind;
  shownAtMs: number;
  endsAtMs: number;
  responded: boolean;
  ruleSetId: string;
  afterRuleSwitch: boolean;
}

export interface ChoiceResponseStats {
  attempts: number;
  correct: number;
  reactionTimesMs: number[];
}

export interface ChoiceAccumulator {
  startedAtMs: number;
  lastConfig: ChoiceRoundConfig;
  correct: number;
  wrongResponses: number;
  omissions: number;
  falseStarts: number;
  prematureResponses: number;
  ignoredSpam: number;
  choiceReactionTimesMs: number[];
  postSwitchReactionTimesMs: number[];
  preSwitchReactionTimesMs: number[];
  byResponse: Partial<Record<ChoiceResponseKind, ChoiceResponseStats>>;
  streak: number;
  bestStreak: number;
  trialsResolved: number;
  switched: boolean;
}

export interface ChoiceRoundState {
  phase: ChoicePhase;
  config: ChoiceRoundConfig;
  activeRuleSet: ChoiceRuleSet;
  trial: ChoiceTrial | null;
  phaseEndsAtMs: number;
  feedback: ChoiceOutcome | null;
  accumulator: ChoiceAccumulator;
}

export interface ChoiceReactionMetrics {
  decisionAccuracyPct: number;
  meanChoiceReactionMs: number | null;
  wrongResponseCount: number;
  omissions: number;
  falseStarts: number;
  prematureResponses: number;
  correct: number;
  trialsResolved: number;
  bestStreak: number;
  consistencyPct: number | null;
  ruleSwitchCostMs: number | null;
  byResponse: Partial<Record<ChoiceResponseKind, { attempts: number; correct: number; meanRtMs: number | null }>>;
}

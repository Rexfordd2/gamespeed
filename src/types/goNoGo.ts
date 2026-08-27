export type GoNoGoKind = 'go' | 'nogo';

export type GoNoGoRuleSet = 'color' | 'similarHue' | 'colorShape';

export type GoNoGoPhase = 'isi' | 'stimulus' | 'feedback';

export type GoNoGoShape = 'circle' | 'diamond';

export type GoNoGoOutcome =
  | 'correctGo'
  | 'missedGo'
  | 'correctInhibition'
  | 'falsePositive'
  | 'premature'
  | 'ignoredSpam';

export interface GoNoGoTrialConfig {
  goProbability: number;
  stimulusMs: number;
  isiMinMs: number;
  isiMaxMs: number;
  ruleSet: GoNoGoRuleSet;
  distractorCount: number;
  errorLockoutMs?: number;
}

export interface GoNoGoStimulus {
  kind: GoNoGoKind;
  label: 'STRIKE' | 'HOLD';
  color: string;
  shape: GoNoGoShape;
}

export interface GoNoGoDistractor {
  dx: number;
  dy: number;
  color: string;
}

export interface GoNoGoTrial {
  id: string;
  kind: GoNoGoKind;
  stimulus: GoNoGoStimulus;
  distractors: GoNoGoDistractor[];
  shownAtMs: number;
  endsAtMs: number;
  responded: boolean;
}

export interface GoNoGoAccumulator {
  startedAtMs: number;
  lastConfig: GoNoGoTrialConfig;
  correctGo: number;
  missedGo: number;
  correctInhibitions: number;
  falsePositives: number;
  prematureResponses: number;
  ignoredSpam: number;
  goReactionTimesMs: number[];
  streak: number;
  bestStreak: number;
  trialsResolved: number;
}

export interface GoNoGoRoundState {
  phase: GoNoGoPhase;
  config: GoNoGoTrialConfig;
  trial: GoNoGoTrial | null;
  phaseEndsAtMs: number;
  feedback: GoNoGoOutcome | null;
  accumulator: GoNoGoAccumulator;
}

export interface GoNoGoMetrics {
  goCount: number;
  nogoCount: number;
  correctGo: number;
  missedGo: number;
  correctInhibitions: number;
  falsePositives: number;
  prematureResponses: number;
  goReactionTimeMs: number | null;
  averageGoReactionMs: number | null;
  inhibitionAccuracyPct: number;
  overallAccuracyPct: number;
  bestStreak: number;
  performanceDecayMs: number | null;
}

export type SchulteGridSize = 3 | 4 | 5 | 6 | 7;

export type SchulteStimulusSet = 'numbers' | 'letters' | 'mixed' | 'colors' | 'shapes' | 'sportSymbols';

export type SchulteSequenceRule =
  | 'ascending'
  | 'descending'
  | 'odd'
  | 'even'
  | 'alternatingMixed';

export type SchulteVariant = 'static' | 'shuffle' | 'flash' | 'peripheral';

export type SchulteTokenKind = 'number' | 'letter' | 'color' | 'shape' | 'sport';

export type SchulteShapeId = 'circle' | 'triangle' | 'square' | 'diamond' | 'hexagon';

export interface SchulteToken {
  kind: SchulteTokenKind;
  label: string;
  value: string | number;
  color?: string;
  shape?: SchulteShapeId;
  sportSymbol?: string;
}

export interface SchulteCell {
  id: string;
  row: number;
  col: number;
  token: SchulteToken;
  /** Position in the required tap order, or -1 for decoy/noise cells. */
  sequenceIndex: number;
  found: boolean;
}

export interface SchulteBoardConfig {
  gridSize: SchulteGridSize;
  stimulusSet: SchulteStimulusSet;
  sequenceRule: SchulteSequenceRule;
  variant: SchulteVariant;
  flashMs?: number;
  errorPenaltyMs?: number;
  /** Optional sport pack symbols for future stimulus sets. */
  sportSymbols?: string[];
}

export type SchulteBoardPhase = 'visible' | 'flashPreview' | 'flashHidden' | 'complete';

export type SchulteSelectOutcome = 'correct' | 'complete' | 'error' | 'locked' | 'ignored';

export interface SchulteBoard {
  config: SchulteBoardConfig;
  cells: SchulteCell[];
  nextIndex: number;
  sequenceLength: number;
  phase: SchulteBoardPhase;
  startedAtMs: number;
  lastCorrectAtMs: number | null;
  lockedUntilMs: number;
  flashUntilMs: number;
  transitionsMs: number[];
  correct: number;
  errors: number;
}

export type SchulteCompletionStatus = 'completed' | 'partial' | 'timeout';

export interface SchulteScanMetrics {
  gridSize: number;
  variant: SchulteVariant;
  stimulusSet: SchulteStimulusSet;
  sequenceRule: SchulteSequenceRule;
  boardsCompleted: number;
  completionTimeMs: number;
  correctSelections: number;
  errors: number;
  accuracyPct: number;
  averageTransitionMs: number | null;
  fastestTransitionMs: number | null;
  slowestTransitionMs: number | null;
  lateRoundSlowdownMs: number | null;
  completionStatus: SchulteCompletionStatus;
}

export interface SchulteRoundAccumulator {
  startedAtMs: number;
  boardsCompleted: number;
  correct: number;
  errors: number;
  transitionsMs: number[];
  lastConfig: SchulteBoardConfig;
}

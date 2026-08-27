import { GameModeType, GameResult, TrainingContext } from './game';
import { SportType } from '../config/sports';

export type PrimeContext = TrainingContext;

export type PrimeStepKind = 'drill' | 'movement' | 'summary';

export type PrimeStepCategory =
  | 'settle'
  | 'see'
  | 'scan'
  | 'react'
  | 'control'
  | 'process'
  | 'decide'
  | 'track'
  | 'move'
  | 'summary';

export type PrimeStepIntensity = 'low' | 'standard' | 'high';

export interface PrimeStep {
  id: string;
  category: PrimeStepCategory;
  kind: PrimeStepKind;
  title: string;
  /** Public experience name. Keep separate from internal modeId. */
  experienceName: string;
  instruction: string;
  modeId?: GameModeType;
  durationSeconds?: number;
  rounds?: number;
  intensity?: PrimeStepIntensity;
  skippable?: boolean;
}

export type PrimeCapabilityId = Exclude<PrimeStepCategory, 'summary'>;

export interface PrimeRecipeStep {
  capability: PrimeCapabilityId;
  durationSeconds?: number;
  intensity?: PrimeStepIntensity;
}

export interface PrimeRecipe {
  sport: SportType | 'all';
  position: string;
  context: PrimeContext;
  steps: PrimeRecipeStep[];
}

export interface PrimeProtocol {
  id: string;
  name: string;
  description: string;
  estimatedSeconds: number;
  contexts: PrimeContext[];
  steps: PrimeStep[];
}

export type PrimePhase = 'transition' | 'running' | 'summary' | 'cancelled';

export type PrimeStepStatus = 'completed' | 'skipped';

export interface PrimeStepResult {
  stepId: string;
  status: PrimeStepStatus;
  modeId?: GameModeType;
  durationMs: number;
  gameResult?: GameResult;
}

export interface PrimeEngineState {
  sessionId: string;
  protocolId: string;
  recipeId: string;
  context: PrimeContext;
  sport: SportType;
  position: string;
  stepIndex: number;
  phase: PrimePhase;
  startedAt: number;
  stepStartedAt: number;
  results: PrimeStepResult[];
  lowStimulus: boolean;
}

export interface PrimeSessionRecord {
  id: string;
  ts: number;
  protocolId: string;
  protocolName: string;
  recipeId?: string;
  context: PrimeContext;
  sport: SportType;
  position?: string;
  status: 'completed' | 'cancelled';
  startedAt: number;
  endedAt: number;
  totalDurationMs: number;
  stepResults: PrimeStepResult[];
  summary: PrimeSummaryMetrics;
}

export interface PrimeSummaryMetrics {
  stepsCompleted: number;
  stepsSkipped: number;
  totalDurationSeconds: number;
  averageAccuracyPct: number | null;
  averageReactionMs: number | null;
  trackingAccuracyPct: number | null;
  consistencyPct: number | null;
  strongestArea: { stepId: string; label: string; accuracyPct: number } | null;
  areaToRevisit: { stepId: string; label: string; accuracyPct: number } | null;
  vsPrevious: {
    accuracyDeltaPct: number | null;
    durationDeltaSeconds: number | null;
  } | null;
}

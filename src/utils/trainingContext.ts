import { TrainingContext } from '../types/game';

export const TRAINING_CONTEXT_STORAGE_KEY = 'gamespeed_training_context_v1';

export const TRAINING_CONTEXT_ORDER: TrainingContext[] = [
  'practice',
  'game',
  'lift',
  'skill',
  'recovery',
];

export const TRAINING_CONTEXT_LABELS: Record<TrainingContext, string> = {
  practice: 'Practice',
  game: 'Game',
  lift: 'Lift',
  skill: 'Skill',
  recovery: 'Recovery',
};

export const DEFAULT_TRAINING_CONTEXT: TrainingContext = 'practice';

export const isTrainingContext = (value: string | null | undefined): value is TrainingContext =>
  value === 'practice' ||
  value === 'game' ||
  value === 'lift' ||
  value === 'skill' ||
  value === 'recovery';

export const loadTrainingContext = (): TrainingContext => {
  try {
    const stored = localStorage.getItem(TRAINING_CONTEXT_STORAGE_KEY);
    return isTrainingContext(stored) ? stored : DEFAULT_TRAINING_CONTEXT;
  } catch {
    return DEFAULT_TRAINING_CONTEXT;
  }
};

export const saveTrainingContext = (context: TrainingContext): void => {
  try {
    localStorage.setItem(TRAINING_CONTEXT_STORAGE_KEY, context);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
};

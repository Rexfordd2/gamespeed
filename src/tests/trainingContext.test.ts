import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_TRAINING_CONTEXT,
  TRAINING_CONTEXT_STORAGE_KEY,
  loadTrainingContext,
  saveTrainingContext,
} from '../utils/trainingContext';

describe('training context persistence', () => {
  afterEach(() => {
    localStorage.removeItem(TRAINING_CONTEXT_STORAGE_KEY);
  });

  it('defaults to practice', () => {
    expect(loadTrainingContext()).toBe(DEFAULT_TRAINING_CONTEXT);
  });

  it('persists the latest valid choice and ignores unknown values', () => {
    saveTrainingContext('game');
    expect(loadTrainingContext()).toBe('game');
    saveTrainingContext('recovery');
    expect(loadTrainingContext()).toBe('recovery');
    localStorage.setItem(TRAINING_CONTEXT_STORAGE_KEY, 'warmup');
    expect(loadTrainingContext()).toBe(DEFAULT_TRAINING_CONTEXT);
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import {
  RECOMMENDED_SESSION_STORAGE_KEY,
  getPlainLanguageInterpretation,
  getRecommendationReason,
  getRecommendedMode,
  loadRecommendedSession,
  saveRecommendedSession,
} from '../utils/recommendedSession';

describe('recommended session', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps the existing goal-to-mode mapping', () => {
    expect(getRecommendedMode({ persona: 'athlete', goal: 'peripheralAwareness' }, 80)).toBe('multiTarget');
    expect(getRecommendedMode({ persona: 'gamer', goal: 'flickResponse' }, 80)).toBe('swipeStrike');
    expect(getRecommendedMode(null, 80)).toBe('multiTarget');
    expect(getRecommendedMode({ persona: 'athlete', goal: 'gameSpeedDecisions' }, 40)).toBe('quickTap');
  });

  it('explains the recommendation in one line', () => {
    expect(getRecommendationReason({ persona: 'athlete', goal: 'peripheralAwareness' }, 80)).toBe(
      'Targets your goal: peripheral awareness.',
    );
    expect(getRecommendationReason(null, 30)).toMatch(/accurate reactions first/);
  });

  it('builds a single plain-language interpretation per score band', () => {
    const strong = getPlainLanguageInterpretation({ score: 85, accuracy: 92, medianReactionMs: 410, isBaseline: true });
    expect(strong).toBe(
      'Baseline set. You saw cues early and answered them quickly and accurately. Typical reaction 410 ms with 92% of decisions correct.',
    );
    expect(getPlainLanguageInterpretation({ score: 60, accuracy: 70, medianReactionMs: null, isBaseline: false })).toBe(
      'You read most cues correctly; reacting a little sooner is your next gain. 70% of decisions correct.',
    );
    expect(getPlainLanguageInterpretation({ score: 10, accuracy: 0, medianReactionMs: undefined, isBaseline: false })).toMatch(
      /accuracy comes first/,
    );
  });

  it('persists only playable modes', () => {
    saveRecommendedSession('holdTrack');
    expect(loadRecommendedSession()).toBe('holdTrack');
    localStorage.setItem(RECOMMENDED_SESSION_STORAGE_KEY, 'notAMode');
    expect(loadRecommendedSession()).toBeNull();
  });
});

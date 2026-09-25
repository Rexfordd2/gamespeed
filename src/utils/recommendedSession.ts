import { FirstRunSelection, GameModeType, PlayerGoal } from '../types/game';
import { isGameModeType, isModePlayable } from './gameModes';

export const RECOMMENDED_SESSION_STORAGE_KEY = 'gamespeed_recommended_session_v1';

export const GOAL_LABELS: Record<PlayerGoal, string> = {
  firstStepQuickness: 'first-step quickness',
  peripheralAwareness: 'peripheral awareness',
  gameSpeedDecisions: 'game-speed decisions',
  rawReaction: 'raw reaction',
  flickResponse: 'flick response',
  focusUnderPressure: 'focus under pressure',
};

const GOAL_RECOMMENDATIONS: Record<PlayerGoal, GameModeType> = {
  firstStepQuickness: 'quickTap',
  peripheralAwareness: 'multiTarget',
  gameSpeedDecisions: 'sequenceMemory',
  rawReaction: 'quickTap',
  flickResponse: 'swipeStrike',
  focusUnderPressure: 'holdTrack',
};

const LOW_ACCURACY_THRESHOLD = 55;

export const getRecommendedMode = (
  selection: FirstRunSelection | null,
  accuracy: number,
): GameModeType => {
  if (accuracy < LOW_ACCURACY_THRESHOLD) return 'quickTap';
  if (!selection) return 'multiTarget';
  return GOAL_RECOMMENDATIONS[selection.goal];
};

export const getRecommendationReason = (
  selection: FirstRunSelection | null,
  accuracy: number,
): string => {
  if (accuracy < LOW_ACCURACY_THRESHOLD) {
    return 'Build clean, accurate reactions first, then add speed.';
  }
  if (selection) {
    return `Targets your goal: ${GOAL_LABELS[selection.goal]}.`;
  }
  return 'Adds more cues at once so you practice wider, faster reads.';
};

export const getPlainLanguageInterpretation = ({
  score,
  accuracy,
  medianReactionMs,
  isBaseline,
}: {
  score: number;
  accuracy: number;
  medianReactionMs: number | null | undefined;
  isBaseline: boolean;
}): string => {
  const lead = isBaseline ? 'Baseline set. ' : '';
  const read =
    score >= 80
      ? 'You saw cues early and answered them quickly and accurately.'
      : score >= LOW_ACCURACY_THRESHOLD
        ? 'You read most cues correctly; reacting a little sooner is your next gain.'
        : 'You were late or off on many cues, so accuracy comes first, then speed.';
  const detail =
    typeof medianReactionMs === 'number' && medianReactionMs > 0
      ? ` Typical reaction ${medianReactionMs} ms with ${accuracy}% of decisions correct.`
      : ` ${accuracy}% of decisions correct.`;
  return `${lead}${read}${detail}`;
};

export const saveRecommendedSession = (mode: GameModeType) => {
  try {
    localStorage.setItem(RECOMMENDED_SESSION_STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures.
  }
};

export const loadRecommendedSession = (): GameModeType | null => {
  try {
    const stored = localStorage.getItem(RECOMMENDED_SESSION_STORAGE_KEY);
    if (!stored || !isGameModeType(stored)) return null;
    return isModePlayable(stored) ? stored : null;
  } catch {
    return null;
  }
};

import { GenerateTargetsParams, Target } from '../types/game';
import { ComprehensionFamily, ComprehensionRoundConfig } from '../types/rapidComprehension';
import { normalizeComprehensionConfig } from '../utils/rapidComprehensionEngine';

export const COMPREHENSION_FAMILIES_LIVE: ComprehensionFamily[] = [
  'objectRelationship',
  'sequenceComprehension',
  'conditionalRule',
  'spatialComprehension',
];

const base = (extras: Partial<ComprehensionRoundConfig> = {}): ComprehensionRoundConfig => ({
  displayMs: 2200,
  delayMs: 400,
  answerMs: 3200,
  optionCount: 2,
  informationCount: 2,
  distractorCount: 0,
  ruleComplexity: 1,
  families: COMPREHENSION_FAMILIES_LIVE,
  ...extras,
});

export const COMPREHENSION_PRIME_CONFIG: ComprehensionRoundConfig = base({
  displayMs: 2000,
  delayMs: 400,
  answerMs: 3400,
  optionCount: 3,
  informationCount: 3,
});

/**
 * One variable per rung: display time → information amount → delay → answers →
 * distractors → rule complexity → rule switching.
 */
const LADDER: ComprehensionRoundConfig[] = [
  base(),
  base({ displayMs: 1600 }),
  base({ displayMs: 1600, informationCount: 3 }),
  base({ displayMs: 1600, informationCount: 3, delayMs: 700 }),
  base({ displayMs: 1600, informationCount: 3, delayMs: 700, optionCount: 4 }),
  base({ displayMs: 1600, informationCount: 3, delayMs: 700, optionCount: 4, distractorCount: 1 }),
  base({
    displayMs: 1600,
    informationCount: 3,
    delayMs: 700,
    optionCount: 4,
    distractorCount: 1,
    ruleComplexity: 2,
  }),
  base({
    displayMs: 1600,
    informationCount: 3,
    delayMs: 700,
    optionCount: 4,
    distractorCount: 1,
    ruleComplexity: 2,
    switchAfterTrials: 40,
  }),
];

export const getComprehensionDifficultyReached = (trialsResolved: number) =>
  Math.min(Math.floor(Math.max(0, trialsResolved) / 6), LADDER.length - 1);

export const getComprehensionConfigForLadder = (
  trialsResolved: number,
  options?: { prime?: boolean },
): ComprehensionRoundConfig => {
  if (options?.prime) {
    return normalizeComprehensionConfig({
      ...COMPREHENSION_PRIME_CONFIG,
      displayMs: trialsResolved >= 10 ? 1700 : COMPREHENSION_PRIME_CONFIG.displayMs,
    });
  }
  return normalizeComprehensionConfig(LADDER[getComprehensionDifficultyReached(trialsResolved)]);
};

/**
 * Chameleon Read does not use floating spawn targets. The trial engine owns timing.
 */
export const generateTargets = ({ existingTargets }: GenerateTargetsParams): Target[] =>
  existingTargets.length > 0 ? existingTargets : [];

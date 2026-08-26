import { GenerateTargetsParams, Target } from '../types/game';
import { ChoiceRoundConfig, ChoiceRuleSet, ChoiceStimulusDef } from '../types/choiceReaction';
import {
  CHOICE_COLORS,
  DEFAULT_CHOICE_BRIEFING_MS,
  DEFAULT_CHOICE_HOLD_MS,
  normalizeChoiceConfig,
} from '../utils/choiceReactionEngine';

export const DEFAULT_CHOICE_STIMULI: ChoiceStimulusDef[] = [
  { id: 'green', kind: 'color', label: 'GREEN', color: CHOICE_COLORS.green },
  { id: 'yellow', kind: 'color', label: 'YELLOW', color: CHOICE_COLORS.yellow },
  { id: 'blue', kind: 'color', label: 'BLUE', color: CHOICE_COLORS.blue },
  { id: 'red', kind: 'color', label: 'RED', color: CHOICE_COLORS.red },
];

const threeMap: ChoiceRuleSet = {
  id: 'read-3',
  mappings: [
    { stimulusId: 'green', response: 'tap' },
    { stimulusId: 'yellow', response: 'swipeLeft' },
    { stimulusId: 'blue', response: 'swipeRight' },
  ],
};

const fourMap: ChoiceRuleSet = {
  id: 'read-4',
  mappings: [
    { stimulusId: 'green', response: 'tap' },
    { stimulusId: 'yellow', response: 'swipeLeft' },
    { stimulusId: 'blue', response: 'swipeRight' },
    { stimulusId: 'red', response: 'nogo' },
  ],
};

const fourMapSwitched: ChoiceRuleSet = {
  id: 'read-4-switched',
  mappings: [
    { stimulusId: 'green', response: 'swipeRight' },
    { stimulusId: 'yellow', response: 'tap' },
    { stimulusId: 'blue', response: 'swipeLeft' },
    { stimulusId: 'red', response: 'nogo' },
  ],
};

const baseConfig = (
  ruleSet: ChoiceRuleSet,
  extras: Partial<ChoiceRoundConfig> = {},
): ChoiceRoundConfig => ({
  ruleSet,
  stimuli: DEFAULT_CHOICE_STIMULI,
  stimulusMs: 900,
  isiMinMs: 650,
  isiMaxMs: 1000,
  briefingMs: DEFAULT_CHOICE_BRIEFING_MS,
  holdMs: DEFAULT_CHOICE_HOLD_MS,
  similarStimuli: false,
  ...extras,
});

export const CHOICE_PRIME_CONFIG: ChoiceRoundConfig = baseConfig(
  { ...fourMap, keepLegendVisible: true },
  {
    stimulusMs: 850,
    isiMinMs: 600,
    isiMaxMs: 950,
    briefingMs: 2800,
  },
);

/**
 * One variable per rung: mappings → speed → similarity → window → rule switch.
 * Live boards stay on tap / swipe left / swipe right / no-go.
 */
const LADDER: ChoiceRoundConfig[] = [
  baseConfig(threeMap),
  baseConfig(fourMap),
  baseConfig(fourMap, { stimulusMs: 780, isiMinMs: 550, isiMaxMs: 880 }),
  baseConfig(fourMap, { stimulusMs: 780, isiMinMs: 550, isiMaxMs: 880, similarStimuli: true }),
  baseConfig(fourMap, { stimulusMs: 620, isiMinMs: 480, isiMaxMs: 720 }),
  baseConfig(fourMap, {
    stimulusMs: 780,
    isiMinMs: 550,
    isiMaxMs: 850,
    switchAfterTrials: 48,
    alternateRuleSet: fourMapSwitched,
  }),
];

export const getChoiceConfigForLadder = (
  trialsResolved: number,
  options?: { prime?: boolean },
): ChoiceRoundConfig => {
  if (options?.prime) {
    return normalizeChoiceConfig({
      ...CHOICE_PRIME_CONFIG,
      stimulusMs: trialsResolved >= 12 ? 780 : CHOICE_PRIME_CONFIG.stimulusMs,
    });
  }
  const rung = Math.min(Math.floor(trialsResolved / 8), LADDER.length - 1);
  return normalizeChoiceConfig(LADDER[rung]);
};

/**
 * Mongoose Read does not use floating spawn targets. The trial engine owns timing.
 * Keep a generator so the mode registry stays uniform.
 */
export const generateTargets = ({ existingTargets }: GenerateTargetsParams): Target[] =>
  existingTargets.length > 0 ? existingTargets : [];

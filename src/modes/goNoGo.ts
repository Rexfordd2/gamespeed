import { GenerateTargetsParams, Target } from '../types/game';
import { GoNoGoTrialConfig } from '../types/goNoGo';
import { normalizeGoNoGoConfig } from '../utils/goNoGoEngine';

export const GONOGO_PRIME_CONFIG: GoNoGoTrialConfig = {
  goProbability: 0.7,
  stimulusMs: 850,
  isiMinMs: 600,
  isiMaxMs: 950,
  ruleSet: 'color',
  distractorCount: 0,
  errorLockoutMs: 200,
};

const LADDER: GoNoGoTrialConfig[] = [
  {
    goProbability: 0.75,
    stimulusMs: 900,
    isiMinMs: 650,
    isiMaxMs: 1000,
    ruleSet: 'color',
    distractorCount: 0,
  },
  {
    goProbability: 0.65,
    stimulusMs: 800,
    isiMinMs: 550,
    isiMaxMs: 900,
    ruleSet: 'color',
    distractorCount: 0,
  },
  {
    goProbability: 0.55,
    stimulusMs: 720,
    isiMinMs: 500,
    isiMaxMs: 820,
    ruleSet: 'color',
    distractorCount: 0,
  },
  {
    goProbability: 0.6,
    stimulusMs: 780,
    isiMinMs: 550,
    isiMaxMs: 850,
    ruleSet: 'similarHue',
    distractorCount: 0,
  },
  {
    goProbability: 0.55,
    stimulusMs: 800,
    isiMinMs: 550,
    isiMaxMs: 850,
    ruleSet: 'colorShape',
    distractorCount: 1,
  },
  {
    goProbability: 0.45,
    stimulusMs: 680,
    isiMinMs: 480,
    isiMaxMs: 750,
    ruleSet: 'color',
    distractorCount: 1,
  },
];

export const getGoNoGoConfigForLadder = (
  trialsResolved: number,
  options?: { prime?: boolean },
): GoNoGoTrialConfig => {
  if (options?.prime) {
    return normalizeGoNoGoConfig({
      ...GONOGO_PRIME_CONFIG,
      goProbability: trialsResolved >= 12 ? 0.6 : GONOGO_PRIME_CONFIG.goProbability,
    });
  }
  const rung = Math.min(Math.floor(trialsResolved / 8), LADDER.length - 1);
  return normalizeGoNoGoConfig(LADDER[rung]);
};

/**
 * Caiman Control does not use floating spawn targets. The trial engine owns timing.
 * Keep a generator so the mode registry stays uniform.
 */
export const generateTargets = ({ existingTargets }: GenerateTargetsParams): Target[] =>
  existingTargets.length > 0 ? existingTargets : [];

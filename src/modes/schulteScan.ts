import { GenerateTargetsParams, Target } from '../types/game';
import { SchulteBoardConfig, SchulteGridSize } from '../types/schulte';

export const SCHULTE_PRIME_CONFIG: SchulteBoardConfig = {
  gridSize: 4,
  stimulusSet: 'numbers',
  sequenceRule: 'ascending',
  variant: 'static',
  errorPenaltyMs: 200,
};

const LADDER: SchulteBoardConfig[] = [
  {
    gridSize: 3,
    stimulusSet: 'numbers',
    sequenceRule: 'ascending',
    variant: 'static',
    errorPenaltyMs: 180,
  },
  {
    gridSize: 4,
    stimulusSet: 'numbers',
    sequenceRule: 'ascending',
    variant: 'static',
    errorPenaltyMs: 200,
  },
  {
    gridSize: 4,
    stimulusSet: 'numbers',
    sequenceRule: 'ascending',
    variant: 'shuffle',
    errorPenaltyMs: 220,
  },
  {
    gridSize: 4,
    stimulusSet: 'letters',
    sequenceRule: 'ascending',
    variant: 'static',
    errorPenaltyMs: 220,
  },
  {
    gridSize: 5,
    stimulusSet: 'numbers',
    sequenceRule: 'ascending',
    variant: 'shuffle',
    errorPenaltyMs: 240,
  },
  {
    gridSize: 4,
    stimulusSet: 'mixed',
    sequenceRule: 'alternatingMixed',
    variant: 'static',
    errorPenaltyMs: 240,
  },
  {
    gridSize: 5,
    stimulusSet: 'numbers',
    sequenceRule: 'ascending',
    variant: 'peripheral',
    errorPenaltyMs: 260,
  },
  {
    gridSize: 6,
    stimulusSet: 'numbers',
    sequenceRule: 'odd',
    variant: 'static',
    errorPenaltyMs: 260,
  },
];

export const getSchulteConfigForBoard = (
  boardsCompleted: number,
  options?: { prime?: boolean },
): SchulteBoardConfig => {
  if (options?.prime) {
    const size: SchulteGridSize = boardsCompleted >= 2 ? 5 : 4;
    return {
      ...SCHULTE_PRIME_CONFIG,
      gridSize: size,
      variant: boardsCompleted >= 1 ? 'shuffle' : 'static',
    };
  }
  return LADDER[Math.min(boardsCompleted, LADDER.length - 1)];
};

/**
 * Macaw Scan does not use floating spawn targets. The grid engine owns layout.
 * Keep a generator so the mode registry stays uniform.
 */
export const generateTargets = ({ existingTargets }: GenerateTargetsParams): Target[] =>
  existingTargets.length > 0 ? existingTargets : [];

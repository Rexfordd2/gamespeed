import { GameMode, GameModeType } from '../types/game';
import { generateTargets as generateReactionBenchmark } from '../modes/reactionBenchmark';
import { generateTargets as generateQuickTapTargets } from '../modes/quickTap';
import { generateTargets as generateMultiTargets } from '../modes/multiTarget';
import { generateTargets as generateSwipeStrike } from '../modes/swipeStrike';
import { generateTargets as generateHoldTrack } from '../modes/holdTrack';
import { generateTargets as generateSequenceMemory } from '../modes/sequenceMemory';

export const MODE_ORDER: GameModeType[] = [
  'reactionBenchmark',
  'quickTap',
  'multiTarget',
  'swipeStrike',
  'holdTrack',
  'sequenceMemory',
];

export const gameModes: Record<GameModeType, GameMode> = {
  reactionBenchmark: {
    name: 'Reaction Benchmark',
    description: 'Fixed 45-second readiness test. One paced stimulus every 2s with full reaction-time tracking.',
    generateTargets: generateReactionBenchmark,
    availability: 'playable',
    category: 'benchmark',
    config: {
      maxTargets: 1,
      targetInterval: 2000,
      targetLifespan: 1.2,
      roundSeconds: 45,
    },
  },
  quickTap: {
    name: 'Quick Tap',
    description: 'Explosive reaction drill. Hit each visual cue before it disappears.',
    generateTargets: generateQuickTapTargets,
    availability: 'playable',
    config: {
      maxTargets: 1,
      targetInterval: 400,
      targetLifespan: 1.5,
    },
  },
  multiTarget: {
    name: 'Multi Target',
    description: 'Decision-speed wave drill. Clear every cue before the timer collapses.',
    generateTargets: generateMultiTargets,
    availability: 'playable',
    config: {
      maxTargets: 5,
      targetInterval: 600,
      targetLifespan: 2.5,
    },
  },
  swipeStrike: {
    name: 'Swipe Strike',
    description: 'Swipe through moving cues before they escape the lane.',
    generateTargets: generateSwipeStrike,
    availability: 'playable',
    config: {
      maxTargets: 1,
      targetInterval: 900,
      targetLifespan: 2.1,
    },
  },
  holdTrack: {
    name: 'Hold Track',
    description: 'Lock onto a moving cue and hold contact until the tracking meter is full.',
    generateTargets: generateHoldTrack,
    availability: 'playable',
    config: {
      maxTargets: 1,
      targetInterval: 1150,
      targetLifespan: 3.2,
    },
  },
  sequenceMemory: {
    name: 'Sequence Memory',
    description: 'Watch a sequence, then repeat every cue in the exact order.',
    generateTargets: generateSequenceMemory,
    availability: 'playable',
    config: {
      maxTargets: 3,
      targetInterval: 500,
      targetLifespan: 120,
    },
  },
};

export const isGameModeType = (value: string): value is GameModeType => value in gameModes;

export const isModePlayable = (mode: GameModeType) => gameModes[mode].availability === 'playable';

export const playableModeKeys = MODE_ORDER.filter(mode => isModePlayable(mode));

export const resolvePlayableMode = (mode: string): GameModeType => {
  if (isGameModeType(mode) && isModePlayable(mode)) {
    return mode;
  }
  return 'quickTap';
};

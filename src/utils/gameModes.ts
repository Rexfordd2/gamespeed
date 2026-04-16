import { GameMode, GameModeType } from '../types/game';
import { generateTargets as generateQuickTapTargets } from '../modes/quickTap';
import { generateTargets as generateMultiTargets } from '../modes/multiTarget';
import { generateTargets as generateSwipeStrike } from '../modes/swipeStrike';
import { generateTargets as generateHoldTrack } from '../modes/holdTrack';
import { generateTargets as generateSequenceMemory } from '../modes/sequenceMemory';

export const MODE_ORDER: GameModeType[] = [
  'quickTap',
  'multiTarget',
  'swipeStrike',
  'holdTrack',
  'sequenceMemory',
];

export const gameModes: Record<GameModeType, GameMode> = {
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
    description: 'Directional swipe drill for moving cues and fast hand transitions.',
    generateTargets: generateSwipeStrike,
    availability: 'comingSoon',
    config: {
      maxTargets: 1,
      targetInterval: 1200,
      targetLifespan: 2.0,
    },
  },
  holdTrack: {
    name: 'Hold Track',
    description: 'Stability-under-motion drill focused on sustained visual tracking.',
    generateTargets: generateHoldTrack,
    availability: 'comingSoon',
    config: {
      maxTargets: 1,
      targetInterval: 2000,
      targetLifespan: 3.0,
    },
  },
  sequenceMemory: {
    name: 'Sequence Memory',
    description: 'Pattern recall drill that trains reaction under cognitive load.',
    generateTargets: generateSequenceMemory,
    availability: 'comingSoon',
    config: {
      maxTargets: 5,
      targetInterval: 1500,
      targetLifespan: 2.0,
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

import { generateTargets as generateQuickTap } from '../modes/quickTap';
import { generateTargets as generateSwipeStrike } from '../modes/swipeStrike';
import { generateTargets as generateMultiTarget } from '../modes/multiTarget';
import { generateTargets as generateHoldTrack } from '../modes/holdTrack';
import { generateTargets as generateSequenceMemory } from '../modes/sequenceMemory';

export interface GameMode {
  key: string;
  name: string;
  description: string;
  generateTargets: (params: {
    screenSize: { width: number; height: number };
    existingTargets: any[];
    currentTime: number;
  }) => any[];
}

export const gameModes: Record<string, GameMode> = {
  quickTap: {
    key: 'quickTap',
    name: 'Quick Tap',
    description: 'Tap targets as they appear',
    generateTargets: generateQuickTap,
  },
  swipeStrike: {
    key: 'swipeStrike',
    name: 'Swipe Strike',
    description: 'Swipe through targets to score',
    generateTargets: generateSwipeStrike,
  },
  multiTarget: {
    key: 'multiTarget',
    name: 'Multi Target',
    description: 'Multiple targets at once',
    generateTargets: generateMultiTarget,
  },
  holdTrack: {
    key: 'holdTrack',
    name: 'Hold & Track',
    description: 'Hold on moving targets',
    generateTargets: generateHoldTrack,
  },
  sequenceMemory: {
    key: 'sequenceMemory',
    name: 'Sequence Memory',
    description: 'Remember and repeat the sequence',
    generateTargets: generateSequenceMemory,
  },
}; 
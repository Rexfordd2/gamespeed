import { GameMode } from '../types/game';
import { generateTargets as generateQuickTap } from '../modes/quickTap';
import { generateTargets as generateMultiTarget } from '../modes/multiTarget';
import { generateTargets as generateSwipeStrike } from '../modes/swipeStrike';
import { generateTargets as generateHoldTrack } from '../modes/holdTrack';
import { generateTargets as generateSequenceMemory } from '../modes/sequenceMemory';

export const gameModes: Record<string, GameMode> = {
  quickTap: {
    name: 'Quick Tap',
    description: 'Tap targets as quickly as you can!',
    generateTargets: generateQuickTap,
    config: {
      targetLifespan: 1.5,
      targetInterval: 1000,
      maxTargets: 1
    }
  },
  multiTarget: {
    name: 'Multi Target',
    description: 'Handle multiple targets at once!',
    generateTargets: generateMultiTarget,
    config: {
      targetLifespan: 1.5,
      targetInterval: 800,
      maxTargets: 5
    }
  },
  swipeStrike: {
    name: 'Swipe Strike',
    description: 'Swipe through moving targets!',
    generateTargets: generateSwipeStrike,
    config: {
      targetLifespan: 1.0,
      targetInterval: 1200,
      maxTargets: 1
    }
  },
  holdTrack: {
    name: 'Hold Track',
    description: 'Hold and track moving targets!',
    generateTargets: generateHoldTrack,
    config: {
      targetLifespan: 2.0,
      targetInterval: 2000,
      maxTargets: 1
    }
  },
  sequenceMemory: {
    name: 'Sequence Memory',
    description: 'Remember and repeat the sequence!',
    generateTargets: generateSequenceMemory,
    config: {
      targetLifespan: 1.0,
      targetInterval: 1500,
      maxTargets: 5
    }
  }
}; 
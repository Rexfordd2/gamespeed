import { SportType, getSportConfig } from '../config/sports';
import { SwipeDirection } from './swipeDetection';

type SwipeCueSet = Record<SwipeDirection, string>;

const DEFAULT_SWIPE_CUE_SET: SwipeCueSet = {
  left: 'cut left',
  right: 'cut right',
  up: 'press up',
  down: 'drop step',
};

const SWIPE_CUE_SET_BY_SPORT: Record<SportType, SwipeCueSet> = {
  soccer: {
    left: 'outside cut',
    right: 'inside carry',
    up: 'press lane',
    down: 'drop support',
  },
  football: {
    left: 'fit left',
    right: 'fit right',
    up: 'attack gap',
    down: 'drop zone',
  },
  volleyball: {
    left: 'seal line',
    right: 'seal cross',
    up: 'press block',
    down: 'dig drop',
  },
  boxing: {
    left: 'slip left',
    right: 'slip right',
    up: 'step in',
    down: 'roll under',
  },
  baseball_softball: {
    left: 'break glove side',
    right: 'break arm side',
    up: 'charge',
    down: 'drop step',
  },
  racquet: {
    left: 'defend backhand',
    right: 'defend forehand',
    up: 'step through',
    down: 'recover split',
  },
  basketball: {
    left: 'shade left drive',
    right: 'shade right drive',
    up: 'closeout high',
    down: 'drop to help',
  },
};

export const getSwipeCueLabel = (sport: SportType, direction: SwipeDirection) =>
  SWIPE_CUE_SET_BY_SPORT[sport]?.[direction] ?? DEFAULT_SWIPE_CUE_SET[direction];

export const getHoldTrackCueLabel = (sport: SportType) => {
  const sportConfig = getSportConfig(sport);
  return `${sportConfig.cueVocabulary[1] ?? 'tracking cue'} lock`;
};

export const getSequenceCueLabels = (sport: SportType, length: number) => {
  const cuePool = getSportConfig(sport).cueVocabulary;
  const labels: string[] = [];
  for (let i = 0; i < length; i += 1) {
    labels.push(cuePool[i % cuePool.length]);
  }
  return labels;
};

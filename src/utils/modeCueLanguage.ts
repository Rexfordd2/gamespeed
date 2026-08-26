import { SportType, getSportConfig, getSportPack } from '../config/sports';
import { SwipeDirection } from './swipeDetection';

type SwipeCueSet = Record<SwipeDirection, string>;

const DEFAULT_SWIPE_CUE_SET: SwipeCueSet = {
  left: 'cut left',
  right: 'cut right',
  up: 'press up',
  down: 'drop step',
};

export const getSwipeCueLabel = (sport: SportType, direction: SwipeDirection) =>
  getSportPack(sport).cueVocabulary.swipeByDirection?.[direction] ?? DEFAULT_SWIPE_CUE_SET[direction];

export const getHoldTrackCueLabel = (sport: SportType) => {
  const sportPack = getSportPack(sport);
  if (sportPack.cueVocabulary.holdTrackLabel) {
    return sportPack.cueVocabulary.holdTrackLabel;
  }
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

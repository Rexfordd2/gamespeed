import { GameModeType, CueIntensity } from '../types/game';
import { SportType, getSportPack } from '../config/sports';
import { getModePresentation } from './modeDescriptions';
import { getHoldTrackCueLabel, getSwipeCueLabel } from './modeCueLanguage';
import { getModeManifest, resolveModeCueTemplate } from '../config/modeManifest';

export type GameplayCueType = 'focus' | 'tactical' | 'reset';
export type GameplayCueTiming = 'preRound' | 'alwaysVisible' | 'phaseTriggered' | 'streakTriggered';

export interface GameplayCueSet {
  focus: string;
  tactical: string;
  reset: string;
  microHudLabel: string;
}

const timingVisibilityByIntensity: Record<CueIntensity, Record<GameplayCueTiming, boolean>> = {
  minimal: {
    preRound: true,
    alwaysVisible: true,
    phaseTriggered: false,
    streakTriggered: false,
  },
  standard: {
    preRound: true,
    alwaysVisible: true,
    phaseTriggered: true,
    streakTriggered: false,
  },
  guided: {
    preRound: true,
    alwaysVisible: true,
    phaseTriggered: true,
    streakTriggered: true,
  },
};

const resolveVocabularySlot = (values: string[], index: number, fallback: string) => {
  if (values.length === 0) {
    return fallback;
  }
  return values[index % values.length] ?? fallback;
};

const resolveMicroHudLabel = (mode: GameModeType) => {
  const mechanic = getModeManifest(mode).gameplayMechanicType;
  if (mechanic === 'swipe') return 'Direction lane';
  if (mechanic === 'hold') return 'Stability lane';
  if (mechanic === 'sequence') return 'Sequence lane';
  if (mechanic === 'scan') return 'Search lane';
  if (mechanic === 'inhibit') return 'Control lane';
  if (mode === 'peripheralPulse') return 'Peripheral lane';
  if (mode === 'calmFocus') return 'Calm lane';
  if (mode === 'multiTarget') return 'Decision lane';
  return 'Cue focus';
};

export const getGameplayCueSet = (sport: SportType, mode: GameModeType): GameplayCueSet => {
  const sportPack = getSportPack(sport);
  const modeCopy = getModePresentation(mode, sport);
  const sequenceVocabulary = sportPack.cueVocabulary.sequence;
  const focusTemplate = resolveModeCueTemplate(mode, 'focus');
  const tacticalTemplate = resolveModeCueTemplate(mode, 'tactical');
  const resetTemplate = resolveModeCueTemplate(mode, 'reset');

  const focusBase =
    focusTemplate === 'holdTrackLock'
      ? getHoldTrackCueLabel(sport)
      : resolveVocabularySlot(sequenceVocabulary, 0, modeCopy.trainingFocus.toLowerCase());
  const tacticalBase =
    tacticalTemplate === 'swipeDirectionPair'
      ? `${getSwipeCueLabel(sport, 'left')} / ${getSwipeCueLabel(sport, 'right')}`
      : resolveVocabularySlot(sequenceVocabulary, 1, modeCopy.sportLabel.toLowerCase());
  const resetBase =
    resetTemplate === 'sequenceVocabularyReset'
      ? resolveVocabularySlot(sequenceVocabulary, 2, 'reset lane')
      : 'reset lane';

  return {
    focus: `Focus cue: ${focusBase}`,
    tactical: `Tactical cue: ${tacticalBase}`,
    reset: `Reset cue: breathe, re-center, ${resetBase}`,
    microHudLabel: resolveMicroHudLabel(mode),
  };
};

export const isCueTimingVisible = (cueIntensity: CueIntensity, timing: GameplayCueTiming) =>
  timingVisibilityByIntensity[cueIntensity][timing];

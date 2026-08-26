import { GameMode, GameModeType } from '../types/game';
import { generateTargets as generateReactionBenchmark } from '../modes/reactionBenchmark';
import { generateTargets as generateQuickTapTargets } from '../modes/quickTap';
import { generateTargets as generateMultiTargets } from '../modes/multiTarget';
import { generateTargets as generateSwipeStrike } from '../modes/swipeStrike';
import { generateTargets as generateHoldTrack } from '../modes/holdTrack';
import { generateTargets as generateSequenceMemory } from '../modes/sequenceMemory';
import { generateTargets as generatePeripheralPulse } from '../modes/peripheralPulse';
import { generateTargets as generateCalmFocus } from '../modes/calmFocus';
import { generateTargets as generateSchulteScan } from '../modes/schulteScan';
import { generateTargets as generateGoNoGo } from '../modes/goNoGo';
import { generateTargets as generateChoiceReaction } from '../modes/choiceReaction';
import { modeManifestOrder, modeManifestRegistry } from '../config/modeManifest';

export const MODE_ORDER: GameModeType[] = modeManifestOrder;

const targetGeneratorByMode: Record<GameModeType, GameMode['generateTargets']> = {
  reactionBenchmark: generateReactionBenchmark,
  quickTap: generateQuickTapTargets,
  multiTarget: generateMultiTargets,
  swipeStrike: generateSwipeStrike,
  holdTrack: generateHoldTrack,
  sequenceMemory: generateSequenceMemory,
  peripheralPulse: generatePeripheralPulse,
  calmFocus: generateCalmFocus,
  schulteScan: generateSchulteScan,
  goNoGo: generateGoNoGo,
  choiceReaction: generateChoiceReaction,
};

export const gameModes: Record<GameModeType, GameMode> = MODE_ORDER.reduce(
  (accumulator, modeId) => {
    const manifest = modeManifestRegistry.byId[modeId];
    if (!manifest) {
      return accumulator;
    }

    accumulator[modeId] = {
      name: manifest.displayName,
      description: manifest.description,
      generateTargets: targetGeneratorByMode[modeId],
      availability: manifest.availability,
      category: manifest.category,
      config: {
        maxTargets: manifest.defaults.maxTargets,
        targetInterval: manifest.defaults.targetIntervalMs,
        targetLifespan: manifest.defaults.targetLifespanSeconds,
        roundSeconds: manifest.defaults.roundSeconds,
      },
    };
    return accumulator;
  },
  {} as Record<GameModeType, GameMode>,
);

export const isGameModeType = (value: string): value is GameModeType => value in gameModes;

export const isModePlayable = (mode: GameModeType) => gameModes[mode].availability === 'playable';

export const playableModeKeys = MODE_ORDER.filter(mode => isModePlayable(mode));

export const resolvePlayableMode = (mode: string): GameModeType => {
  if (isGameModeType(mode) && isModePlayable(mode)) {
    return mode;
  }
  return playableModeKeys[0] ?? 'quickTap';
};

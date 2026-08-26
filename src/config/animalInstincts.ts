import { GameModeType } from '../types/game';

export interface AnimalInstinct {
  modeId: GameModeType;
  experienceName: string;
  animal: string;
  instinct: string;
  ability: string;
  tagline: string;
}

const instincts: AnimalInstinct[] = [
  {
    modeId: 'reactionBenchmark',
    experienceName: 'Baseline Readiness',
    animal: 'Primate',
    instinct: 'First-cue pickup',
    ability: 'Calibrated reaction speed',
    tagline: 'A fixed snapshot, not a diagnosis.',
  },
  {
    modeId: 'quickTap',
    experienceName: 'Cobra Strike',
    animal: 'Cobra',
    instinct: 'First-step react',
    ability: 'Explosive cue response',
    tagline: 'Answer the first clean cue.',
  },
  {
    modeId: 'multiTarget',
    experienceName: 'Jaguar Hunt',
    animal: 'Jaguar',
    instinct: 'Decision under load',
    ability: 'Scan, choose, commit',
    tagline: 'Pick an order. Do not panic tap.',
  },
  {
    modeId: 'swipeStrike',
    experienceName: 'Razorback Cut',
    animal: 'Razorback',
    instinct: 'Directional commit',
    ability: 'Line read + response path',
    tagline: 'Read the line, then cut.',
  },
  {
    modeId: 'holdTrack',
    experienceName: 'Anaconda Lock',
    animal: 'Anaconda',
    instinct: 'Tracking hold',
    ability: 'Gaze and contact stability',
    tagline: 'Stay locked. Smooth beats stabbed.',
  },
  {
    modeId: 'sequenceMemory',
    experienceName: 'Chameleon Chain',
    animal: 'Chameleon',
    instinct: 'Pattern recall',
    ability: 'Order under pace',
    tagline: 'Store the order. Replay it clean.',
  },
  {
    modeId: 'peripheralPulse',
    experienceName: 'Owl Vision',
    animal: 'Owl',
    instinct: 'Wide-field pickup',
    ability: 'Peripheral awareness',
    tagline: 'Head quiet. Edges live.',
  },
  {
    modeId: 'calmFocus',
    experienceName: 'Crocodile Stillness',
    animal: 'Crocodile',
    instinct: 'Composure',
    ability: 'Quiet visual control',
    tagline: 'Slow the eyes. Tap only when clean.',
  },
  {
    modeId: 'schulteScan',
    experienceName: 'Macaw Scan',
    animal: 'Macaw',
    instinct: 'Visual search',
    ability: 'Scanning speed + attentional control',
    tagline: 'Find the signal inside the noise.',
  },
];

export const animalInstincts: Record<GameModeType, AnimalInstinct> = instincts.reduce(
  (accumulator, instinct) => {
    accumulator[instinct.modeId] = instinct;
    return accumulator;
  },
  {} as Record<GameModeType, AnimalInstinct>,
);

export const getAnimalInstinct = (modeId: GameModeType): AnimalInstinct => animalInstincts[modeId];

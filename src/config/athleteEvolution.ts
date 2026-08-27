import { GameModeType } from '../types/game';

export type RainforestTierId = 'trail' | 'canopy' | 'hunter' | 'predator' | 'apex';

export type CognitiveCategoryId =
  | 'reaction'
  | 'visualSearch'
  | 'control'
  | 'decision'
  | 'processing';

export type TrendDirection = 'lower-is-better' | 'higher-is-better';

export type AchievementId =
  | 'prime-7'
  | 'reaction-pb'
  | 'inhibition-95'
  | 'schulte-5x5-pb'
  | 'cognitive-all'
  | 'pregame-streak';

export interface RainforestTier {
  id: RainforestTierId;
  label: string;
  /** Completed Prime protocols required to occupy this tier. */
  completedPrimes: number;
  /** Distinct expansion instincts (scan/control/decide/process) required. */
  cognitiveCategories: number;
  /** Daily training streak required. */
  streakDays: number;
  requirement: string;
}

export interface CognitiveCategoryDef {
  id: CognitiveCategoryId;
  label: string;
  experienceName: string;
  modes: GameModeType[];
  unit: 'ms' | 'pct';
  direction: TrendDirection;
}

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
}

export const RAINFOREST_TIERS: RainforestTier[] = [
  {
    id: 'trail',
    label: 'Trail',
    completedPrimes: 0,
    cognitiveCategories: 0,
    streakDays: 0,
    requirement: 'Start here. Complete Prime to move up.',
  },
  {
    id: 'canopy',
    label: 'Canopy',
    completedPrimes: 1,
    cognitiveCategories: 0,
    streakDays: 0,
    requirement: '1 completed Prime',
  },
  {
    id: 'hunter',
    label: 'Hunter',
    completedPrimes: 7,
    cognitiveCategories: 0,
    streakDays: 0,
    requirement: '7 completed Primes',
  },
  {
    id: 'predator',
    label: 'Predator',
    completedPrimes: 14,
    cognitiveCategories: 4,
    streakDays: 0,
    requirement: '14 completed Primes and all 4 cognitive instincts trained',
  },
  {
    id: 'apex',
    label: 'Apex',
    completedPrimes: 21,
    cognitiveCategories: 4,
    streakDays: 7,
    requirement: '21 completed Primes, all 4 cognitive instincts, and a 7-day training streak',
  },
];

export const COGNITIVE_CATEGORIES: CognitiveCategoryDef[] = [
  {
    id: 'reaction',
    label: 'Reaction',
    experienceName: 'Baseline Readiness',
    modes: ['reactionBenchmark'],
    unit: 'ms',
    direction: 'lower-is-better',
  },
  {
    id: 'visualSearch',
    label: 'Visual search',
    experienceName: 'Macaw Scan',
    modes: ['schulteScan'],
    unit: 'ms',
    direction: 'lower-is-better',
  },
  {
    id: 'control',
    label: 'Control',
    experienceName: 'Caiman Control',
    modes: ['goNoGo'],
    unit: 'pct',
    direction: 'higher-is-better',
  },
  {
    id: 'decision',
    label: 'Decision',
    experienceName: 'Mongoose Read',
    modes: ['choiceReaction'],
    unit: 'pct',
    direction: 'higher-is-better',
  },
  {
    id: 'processing',
    label: 'Processing',
    experienceName: 'Chameleon Read',
    modes: ['rapidComprehension'],
    unit: 'pct',
    direction: 'higher-is-better',
  },
];

/** Expansion instincts used for Predator/Apex breadth. Reaction is tracked separately. */
export const EXPANSION_CATEGORY_IDS: CognitiveCategoryId[] = [
  'visualSearch',
  'control',
  'decision',
  'processing',
];

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'prime-7',
    title: '7 Prime sessions',
    description: 'Completed 7 GameSpeed Prime protocols.',
  },
  {
    id: 'reaction-pb',
    title: 'New reaction best',
    description: 'Median reaction time beat your first baseline mark.',
  },
  {
    id: 'inhibition-95',
    title: '95%+ hold accuracy',
    description: 'Held through no-go cues at 95% or better in one Caiman Control round.',
  },
  {
    id: 'schulte-5x5-pb',
    title: 'Macaw Scan 5×5 best',
    description: 'Completed a 5×5 Macaw Scan board. The fastest time is your search mark.',
  },
  {
    id: 'cognitive-all',
    title: 'All cognitive instincts',
    description: 'Trained reaction, Macaw Scan, Caiman Control, Mongoose Read, and Chameleon Read.',
  },
  {
    id: 'pregame-streak',
    title: 'Pre-game consistency',
    description: 'Completed Prime in a game context on 3 consecutive days.',
  },
];

export type GameState = 'start' | 'playing' | 'end';

export type GameModeType =
  | 'quickTap'
  | 'multiTarget'
  | 'swipeStrike'
  | 'holdTrack'
  | 'sequenceMemory';

export type ModeAvailability = 'playable' | 'comingSoon';

export interface Target {
  id: string;
  x: number;
  y: number;
  type: 'monkey';
  createdAt: number;
  duration: number;
  lifespan: number;
}

export interface GenerateTargetsParams {
  screenSize: { width: number; height: number };
  existingTargets: Target[];
  currentTime?: number;
  maxTargets?: number;
  targetLifespan?: number;
}

export interface GameMode {
  name: string;
  description: string;
  generateTargets: (params: GenerateTargetsParams) => Target[];
  availability: ModeAvailability;
  config: {
    maxTargets: number;
    targetInterval: number;
    targetLifespan: number;
  };
}

/** Passed from Game to App when a round ends or is quit. */
export interface GameResult {
  score: number;
  misses: number;
  bestStreak: number;
  mode: GameModeType;
  modeName: string;
}

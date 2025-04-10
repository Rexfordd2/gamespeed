export type GameState = 'start' | 'playing' | 'end';

export type GameModeType = 'quickTap' | 'multiTarget' | 'swipeStrike' | 'holdTrack' | 'sequenceMemory';

export interface GameModeConfig {
  id: GameModeType;
  name: string;
  description: string;
  maxTargets: number;
  targetDuration: number;
  spawnInterval: number;
}

export interface GameConfig {
  duration: number;
  mode: GameModeType;
  modeConfig: GameModeConfig;
}

export interface Target {
  id: string;
  x: number;
  y: number;
  type: 'monkey' | 'sequence' | 'swipe' | 'hold';
  createdAt: number;
  duration: number;
  lifespan: number;
  sequenceIndex?: number;
  isActive?: boolean;
  movement?: {
    startX: number;
    endX: number;
    startY: number;
    endY: number;
    startTime: number;
    duration: number;
  };
}

export interface GameStats {
  score: number;
  timeLeft: number;
  targets: Target[];
}

export interface GenerateTargetsParams {
  screenSize: { width: number; height: number };
  existingTargets: Target[];
  currentTime?: number;
  sequenceLength?: number;
}

export interface GameMode {
  name: string;
  description: string;
  generateTargets: (params: GenerateTargetsParams) => Target[];
  config: {
    targetLifespan: number;
    targetInterval: number;
    maxTargets: number;
  };
} 
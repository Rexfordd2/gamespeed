export type GameState = 'start' | 'playing' | 'end';

export type GameMode = 'quickTap' | 'multiTarget' | 'swipeStrike' | 'holdTrack' | 'sequenceMemory';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  maxTargets: number;
  targetDuration: number;
  spawnInterval: number;
}

export interface GameConfig {
  duration: number;
  mode: GameMode;
  modeConfig: GameModeConfig;
}

export interface Target {
  id: string;
  x: number;
  y: number;
  type: 'monkey' | 'tiger' | 'parrot' | 'snake' | 'swipe' | 'hold' | 'sequence';
  createdAt: number;
  duration: number;
  lifespan: number;
  movement?: {
    startX: number;
    endX: number;
    startY: number;
    endY: number;
    startTime: number;
    duration: number;
  };
  sequenceIndex?: number;
  isActive?: boolean;
}

export interface GameStats {
  score: number;
  timeLeft: number;
  targets: Target[];
} 
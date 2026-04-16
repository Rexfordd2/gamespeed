export type GameState = 'start' | 'playing' | 'end' | 'stats';

export type GameModeType =
  | 'reactionBenchmark'
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
  swipeDirection?: 'left' | 'right' | 'up' | 'down';
  movement?: {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
  };
  hold?: {
    requiredMs: number;
    breakRadiusPx: number;
  };
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
  /** 'benchmark' modes get distinct visual treatment and separate PB tracking. Defaults to 'drill'. */
  category?: 'drill' | 'benchmark';
  config: {
    maxTargets: number;
    targetInterval: number;
    targetLifespan: number;
    /** Override the default 60-second round duration for this mode. */
    roundSeconds?: number;
  };
}

/** Passed from Game to App when a round ends. */
export interface GameResult {
  score: number;
  misses: number;
  bestStreak: number;
  mode: GameModeType;
  modeName: string;
  /** Benchmark mode only: raw reaction times (ms) per successful hit. */
  reactionTimesMs?: number[];
  /** Benchmark mode only: median of reactionTimesMs, rounded to the nearest ms. */
  medianReactionTimeMs?: number;
  /** Benchmark mode only: composite 0–100 score combining accuracy (60%) and speed (40%). */
  benchmarkScore?: number;
}

// ---------- Persistent stats types ----------

export interface StoredRound {
  ts: number;
  mode: GameModeType;
  modeName: string;
  score: number;
  misses: number;
  /** Pre-computed accuracy percentage (0–100). */
  accuracy: number;
  bestStreak: number;
  medianReactionTimeMs?: number;
  benchmarkScore?: number;
}

export interface ModePersonalBests {
  score: number;
  accuracy: number;
  bestStreak: number;
  /** Benchmark only: best (lowest) median RT in ms. */
  medianReactionTimeMs?: number;
  /** Benchmark only: best composite score (higher is better). */
  benchmarkScore?: number;
}

export interface GameStats {
  version: number;
  rounds: StoredRound[];
  pbs: Partial<Record<GameModeType, ModePersonalBests>>;
}

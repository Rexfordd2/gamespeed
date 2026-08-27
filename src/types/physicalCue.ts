export const PHYSICAL_CUE_IDS = [
  'left',
  'right',
  'forward',
  'back',
  'drop',
  'stick',
  'rotate',
  'jump',
  'reset',
  'go',
  'hold',
] as const;

export type PhysicalCueId = (typeof PHYSICAL_CUE_IDS)[number];

export type PhysicalCueEnginePhase = 'briefing' | 'cueing' | 'gap' | 'confirming' | 'completed' | 'cancelled';

export interface PhysicalCueDefinition {
  id: PhysicalCueId;
  label: string;
  instruction: string;
  toneHz: number;
  toneMs: number;
}

export interface PhysicalCueModule {
  id: string;
  publicName: string;
  tagline: string;
  sequence: PhysicalCueId[];
  cueHoldMs: number;
  gapMs: number;
  safetyNotes: string[];
}

export interface PhysicalCueEngineState {
  moduleId: string;
  phase: PhysicalCueEnginePhase;
  cueIndex: number;
  presentedCueCount: number;
  startedAt: number;
  cueStartedAt: number;
  athleteConfirmed: boolean;
}

export interface PhysicalCueMetrics {
  moduleId: string;
  cueCount: number;
  presentedCueCount: number;
  cueIntervalMs: number;
  athleteConfirmed: boolean;
  durationMs: number;
}

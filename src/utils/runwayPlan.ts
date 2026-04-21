import { SportConfig } from '../config/sports';

export type RunwayPresetMinutes = 5 | 7 | 10;
export type RunwayPhaseId = 'settle' | 'gaze' | 'tracking' | 'cueReview';

export interface RunwayPhasePlan {
  id: RunwayPhaseId;
  title: string;
  subtitle: string;
  durationSeconds: number;
}

export interface RunwayPlan {
  presetMinutes: RunwayPresetMinutes;
  totalDurationSeconds: number;
  phases: RunwayPhasePlan[];
}

const PRESET_PHASE_DURATIONS: Record<RunwayPresetMinutes, [number, number, number, number]> = {
  5: [60, 60, 120, 60],
  7: [75, 75, 210, 60],
  10: [90, 90, 360, 60],
};

export const RUNWAY_PRESETS: RunwayPresetMinutes[] = [5, 7, 10];

export const buildRunwayPlan = (sport: SportConfig, presetMinutes: RunwayPresetMinutes): RunwayPlan => {
  const [settleSeconds, gazeSeconds, trackingSeconds, cueReviewSeconds] =
    PRESET_PHASE_DURATIONS[presetMinutes];

  const phases: RunwayPhasePlan[] = [
    {
      id: 'settle',
      title: 'Phase 1: Breathing Reset',
      subtitle: sport.runwayCopy.settlePrompt,
      durationSeconds: settleSeconds,
    },
    {
      id: 'gaze',
      title: 'Phase 2: Gaze Stabilization',
      subtitle: sport.runwayCopy.gazePrompt,
      durationSeconds: gazeSeconds,
    },
    {
      id: 'tracking',
      title: 'Phase 3: Object Tracking',
      subtitle: sport.runwayCopy.trackingPrompt,
      durationSeconds: trackingSeconds,
    },
    {
      id: 'cueReview',
      title: 'Phase 4: Cue Review',
      subtitle: sport.runwayCopy.cueReviewPrompt,
      durationSeconds: cueReviewSeconds,
    },
  ];

  return {
    presetMinutes,
    totalDurationSeconds: phases.reduce((sum, phase) => sum + phase.durationSeconds, 0),
    phases,
  };
};

import { getModeManifest } from '../config/modeManifest';

export interface BenchmarkFact {
  label: string;
  value: string;
}

export interface RecordedSignal {
  signal: string;
  description: string;
}

export interface WorkflowStep {
  title: string;
  body: string;
}

const benchmarkDefaults = getModeManifest('reactionBenchmark').defaults;

// Public evidence copy. Only describe what the app does; do not add user
// counts, improvement percentages, study results, or testimonials unless they
// are verified, sourced, and (for quotes) consented.
export const benchmarkProtocolFacts: BenchmarkFact[] = [
  { label: 'Round length', value: `${benchmarkDefaults.roundSeconds ?? 60} seconds` },
  {
    label: 'Cue pacing',
    value: `One target at a time, a new cue every ${(benchmarkDefaults.targetIntervalMs ?? 2000) / 1000} seconds`,
  },
  {
    label: 'Response window',
    value: `${benchmarkDefaults.targetLifespanSeconds ?? 1.2} seconds per target`,
  },
];

export const recordedSignals: RecordedSignal[] = [
  {
    signal: 'Reaction time',
    description: 'Average and median time from cue to tap, in milliseconds.',
  },
  {
    signal: 'Accuracy',
    description: 'Cues hit and missed, plus late responses and false starts.',
  },
  {
    signal: 'Consistency',
    description: 'How much your reaction times and hit streaks vary across the round.',
  },
];

export const evidenceStatement =
  'GameSpeed has not published user statistics, study results, or testimonials. The benchmark shows your own numbers so you can compare your rounds over time.';

export const workflowSteps: WorkflowStep[] = [
  {
    title: '1) Run the benchmark',
    body: 'Capture reaction time and accuracy with fixed timing so each session starts from the same protocol.',
  },
  {
    title: '2) Pick a drill',
    body: 'Choose a drill that matches what you want to work on: raw speed, peripheral reads, or pressure decisions.',
  },
  {
    title: '3) Compare your rounds',
    body: 'Rounds are saved in this browser, and to your profile when you are signed in, so you can review your trend.',
  },
];

export const modeDescriptions = {
  reactionBenchmark: {
    title: 'Reaction Benchmark',
    description: 'Fixed 45-second readiness test. One stimulus appears every 2 seconds with full reaction-time tracking and a composite 0–100 score.',
    trainingFocus: 'Calibrated reaction speed',
    intensity: 'Fixed protocol',
    rhythm: 'One cue per 2s',
    tips: [
      'Treat each cue independently — do not anticipate the next position.',
      'Keep a neutral resting hand position between taps to cut wasted travel.',
      'Run it at the start of every session to track daily readiness trends.',
    ],
  },
  quickTap: {
    title: 'Quick Tap',
    description: 'Reaction-time sprint drill. Attack each cue before it vanishes.',
    trainingFocus: 'Explosive first-step response',
    intensity: 'High',
    rhythm: 'Fast micro-bursts',
    tips: [
      'Targets live for only 1.5 seconds; react on first read.',
      'Start from a neutral hand position to cut travel time.',
      'Every miss drops your accuracy score, so stay composed.',
    ],
  },
  multiTarget: {
    title: 'Multi Target',
    description: 'Read-and-react wave drill. Clear every cue in the burst before time expires.',
    trainingFocus: 'Visual scan speed and sequencing',
    intensity: 'Medium-High',
    rhythm: 'Wave-based bursts',
    tips: [
      'Every cue in the wave shares one timer.',
      'Use a fast scan pattern so your eyes lead your taps.',
      'Commit to clean target order instead of random swipes.',
    ],
  },
  swipeStrike: {
    title: 'Swipe Strike',
    description: 'Track moving cues and swipe the marked direction before each one escapes.',
    trainingFocus: 'Intentional directional control',
    intensity: 'Medium-High',
    rhythm: 'Single moving lanes',
    tips: [
      'Start your swipe while the cue is still approaching your hand.',
      'Each cue shows an arrow; your swipe must match it to register.',
      'Use short, decisive swipes instead of long drags.',
    ],
  },
  holdTrack: {
    title: 'Hold Track',
    description: 'Press and stay locked on a moving cue until the hold meter completes.',
    trainingFocus: 'Contact stability while tracking motion',
    intensity: 'Medium',
    rhythm: 'Controlled sustained holds',
    tips: [
      'Touch and hold directly on the cue to arm your lock.',
      'Keep contact inside the glow radius while it moves or the hold breaks.',
      'Short corrections beat large drags when the target changes direction.',
    ],
  },
  sequenceMemory: {
    title: 'Sequence Memory',
    description: 'Preview the cue order, then tap every cue back in the same sequence.',
    trainingFocus: 'Visual recall with precise execution order',
    intensity: 'Medium',
    rhythm: 'Preview then repeat',
    tips: [
      'Watch the glow order first and avoid tapping during preview.',
      'In input phase, commit to one clean cue at a time.',
      'Difficulty ramps gradually every few successful sequences.',
    ],
  },
};

export const modeDescriptions = {
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
    description: 'Directional swipe drill for tracking moving cues.',
    trainingFocus: 'Directional precision under movement',
    intensity: 'Medium',
    rhythm: 'Tracking intervals',
    tips: [
      'Lead the target path instead of chasing from behind.',
      'Match swipe direction with target movement for cleaner hits.',
    ],
  },
  holdTrack: {
    title: 'Hold & Track',
    description: 'Focus-and-stability drill for sustained tracking under movement.',
    trainingFocus: 'Touch control and stability',
    intensity: 'Medium',
    rhythm: 'Controlled sustained holds',
    tips: [
      'Lock in contact and avoid lifting early.',
      'Keep your pointer centered as the cue changes direction.',
    ],
  },
  sequenceMemory: {
    title: 'Sequence Memory',
    description: 'Cognitive reaction drill: memorize, then execute the exact sequence.',
    trainingFocus: 'Decision speed under cognitive load',
    intensity: 'Medium-High',
    rhythm: 'Memorize then execute',
    tips: [
      'Read the pattern once, then commit to it.',
      'Execute with controlled rhythm to avoid order mistakes.',
      'Reset fast after an error and rebuild focus immediately.',
    ],
  },
};

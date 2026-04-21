import { SportType } from '../config/sports';
import { GameModeType } from '../types/game';

export type EvidenceKey = 'cuePickup' | 'anticipation' | 'decisionSpeed' | 'gazeStability';

export interface ModeDescription {
  title: string;
  description: string;
  trainingFocus: string;
  intensity: string;
  rhythm: string;
  tips: string[];
  whyThisMatters: string;
  evidenceStyle: Record<EvidenceKey, string>;
}

export interface ModeSportCopyOverride {
  sportLabel: string;
  sportDescription: string;
}

export interface ModePresentation extends ModeDescription {
  sportLabel: string;
  sportDescription: string;
}

const DEFAULT_SPORT_COPY: Record<GameModeType, ModeSportCopyOverride> = {
  reactionBenchmark: {
    sportLabel: 'Baseline readiness snapshot',
    sportDescription: 'Use this fixed protocol to compare day-to-day cue pickup, response timing, and composure.',
  },
  quickTap: {
    sportLabel: 'First-cue trigger',
    sportDescription: 'Attack the first clean cue with fast, controlled hand speed.',
  },
  multiTarget: {
    sportLabel: 'Read-and-choose wave',
    sportDescription: 'Scan multiple cues, choose a clean sequence, and execute without panic taps.',
  },
  swipeStrike: {
    sportLabel: 'Directional response lane',
    sportDescription: 'Read movement direction early and commit to the matching response path.',
  },
  holdTrack: {
    sportLabel: 'Stable tracking hold',
    sportDescription: 'Stay locked to a moving cue without drifting your gaze or contact.',
  },
  sequenceMemory: {
    sportLabel: 'Pattern recall under pace',
    sportDescription: 'Store a short visual order, then execute it cleanly under timer pressure.',
  },
};

const modeSportOverrides: Partial<Record<SportType, Partial<Record<GameModeType, ModeSportCopyOverride>>>> = {
  soccer: {
    quickTap: {
      sportLabel: 'First-pass trigger',
      sportDescription: 'Match your first touch/pass release to the first open lane cue.',
    },
    multiTarget: {
      sportLabel: 'Press-lane read and choose',
      sportDescription: 'Scan pressure cues, pick the safest outlet order, and commit quickly.',
    },
    swipeStrike: {
      sportLabel: 'Cut or carry direction call',
      sportDescription: 'Read defender angle and commit to the right cut/carry direction.',
    },
    holdTrack: {
      sportLabel: 'Ball-and-run tracking control',
      sportDescription: 'Hold visual lock on the moving cue like tracking ball plus runner movement.',
    },
    sequenceMemory: {
      sportLabel: 'Passing pattern recall',
      sportDescription: 'Memorize a short passing pattern and replay it in order under tempo.',
    },
  },
  football: {
    quickTap: {
      sportLabel: 'Snap trigger reaction',
      sportDescription: 'Explode on the first snap cue without false starts.',
    },
    multiTarget: {
      sportLabel: 'Coverage read-and-choose',
      sportDescription: 'Read leverage cues and pick the fastest assignment sequence.',
    },
    swipeStrike: {
      sportLabel: 'Fit or shed direction',
      sportDescription: 'React to lane direction and commit to the correct pursuit angle.',
    },
    holdTrack: {
      sportLabel: 'Backfield tracking hold',
      sportDescription: 'Track moving backfield action while keeping eyes steady through contact noise.',
    },
    sequenceMemory: {
      sportLabel: 'Route/progression recall',
      sportDescription: 'Hold a progression order and execute reads in sequence.',
    },
  },
  volleyball: {
    quickTap: {
      sportLabel: 'First-contact trigger',
      sportDescription: 'React early to serve/pass contact cues and move on first read.',
    },
    multiTarget: {
      sportLabel: 'Read-and-choose transition',
      sportDescription: 'Scan setter/hitter cues and pick the best defensive or transition response.',
    },
    swipeStrike: {
      sportLabel: 'Block or dig direction call',
      sportDescription: 'Read attack line direction and commit to block/dig movement early.',
    },
    holdTrack: {
      sportLabel: 'Ball-flight tracking hold',
      sportDescription: 'Stay visually locked through float or spin changes without over-correcting.',
    },
    sequenceMemory: {
      sportLabel: 'Rotation cue recall',
      sportDescription: 'Remember rotation/coverage order and execute the sequence cleanly.',
    },
  },
  boxing: {
    quickTap: {
      sportLabel: 'Opening trigger',
      sportDescription: 'Fire on the first clean opening cue before it closes.',
    },
    multiTarget: {
      sportLabel: 'Read-and-choose exchange',
      sportDescription: 'Scan feint, guard, and lane cues, then commit to one clean response.',
    },
    swipeStrike: {
      sportLabel: 'Dodge or counter direction',
      sportDescription: 'Read incoming line and choose the right slip/roll/counter direction fast.',
    },
    holdTrack: {
      sportLabel: 'Head-movement tracking hold',
      sportDescription: 'Keep visual lock on moving targets while stabilizing head position.',
    },
    sequenceMemory: {
      sportLabel: 'Combination recall',
      sportDescription: 'Store short combo order and execute with clean sequence timing.',
    },
  },
  baseball_softball: {
    quickTap: {
      sportLabel: 'Release trigger',
      sportDescription: 'React off release cues as early as possible without rushing mechanics.',
    },
    multiTarget: {
      sportLabel: 'Pitch read-and-choose',
      sportDescription: 'Scan pitch cues and commit quickly to swing/take style decisions.',
    },
    swipeStrike: {
      sportLabel: 'Fielding direction break',
      sportDescription: 'Read hop/angle cues and break in the right direction immediately.',
    },
    holdTrack: {
      sportLabel: 'Ball-flight tracking hold',
      sportDescription: 'Track flight smoothly with stable gaze through speed changes.',
    },
    sequenceMemory: {
      sportLabel: 'Pitch sequence recall',
      sportDescription: 'Memorize recent pitch pattern and respond in the correct order.',
    },
  },
  racquet: {
    quickTap: {
      sportLabel: 'Split-step trigger',
      sportDescription: 'React on opponent prep/contact cues and launch your first step faster.',
    },
    multiTarget: {
      sportLabel: 'Read-and-choose point pattern',
      sportDescription: 'Scan court cues, pick the highest-value response, and commit early.',
    },
    swipeStrike: {
      sportLabel: 'Defend or counter direction',
      sportDescription: 'Read incoming line and commit to the right defensive or attacking direction.',
    },
    holdTrack: {
      sportLabel: 'Ball tracking stability',
      sportDescription: 'Hold visual lock through trajectory shifts while keeping gaze quiet.',
    },
    sequenceMemory: {
      sportLabel: 'Rally pattern recall',
      sportDescription: 'Store short rally patterns and execute the response sequence under pace.',
    },
  },
  basketball: {
    quickTap: {
      sportLabel: 'First-step trigger',
      sportDescription: 'Explode on the first clean driving or closeout cue.',
    },
    multiTarget: {
      sportLabel: 'Help-read and choose',
      sportDescription: 'Scan spacing/help cues and choose the fastest high-value decision.',
    },
    swipeStrike: {
      sportLabel: 'Drive or recover direction',
      sportDescription: 'Read lane direction early and commit to the correct move path.',
    },
    holdTrack: {
      sportLabel: 'Ball-handler tracking hold',
      sportDescription: 'Hold visual lock on moving action while staying balanced and composed.',
    },
    sequenceMemory: {
      sportLabel: 'Action sequence recall',
      sportDescription: 'Memorize short action order and execute in sequence under tempo.',
    },
  },
};

export const modeDescriptions: Record<GameModeType, ModeDescription> = {
  reactionBenchmark: {
    title: 'Reaction Benchmark',
    description: 'Fixed 45-second readiness test. One stimulus appears every 2 seconds with full reaction-time tracking and a composite 0–100 score.',
    trainingFocus: 'Calibrated reaction speed',
    intensity: 'Fixed protocol',
    rhythm: 'One cue per 2s',
    whyThisMatters: 'A stable baseline helps coaches compare readiness without changing drill rules each day.',
    evidenceStyle: {
      cuePickup: 'Tests first-cue pickup repeatedly under the same timing window.',
      anticipation: 'Discourages guessing by randomizing cue positions each rep.',
      decisionSpeed: 'Measures cue-to-response timing on every successful hit.',
      gazeStability: 'Rewards steady visual reset between evenly spaced cues.',
    },
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
    whyThisMatters: 'Many game actions are won by who commits first on a clean cue.',
    evidenceStyle: {
      cuePickup: 'Forces immediate pickup of short-lived visual cues.',
      anticipation: 'Builds control by reacting only when the cue is visible.',
      decisionSpeed: 'Trains fast commit speed once the cue is identified.',
      gazeStability: 'Encourages quick center reset before the next stimulus.',
    },
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
    whyThisMatters: 'Competition rarely gives one cue at a time; you must scan and choose quickly.',
    evidenceStyle: {
      cuePickup: 'Requires broad visual scan across multiple active cues.',
      anticipation: 'Promotes early pattern read before the wave times out.',
      decisionSpeed: 'Reinforces fast ordering decisions under one shared clock.',
      gazeStability: 'Rewards controlled eye movement instead of frantic jumps.',
    },
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
    whyThisMatters: 'Direction errors are costly in sport; reading line early improves response quality.',
    evidenceStyle: {
      cuePickup: 'Demands quick recognition of movement line plus arrow cue.',
      anticipation: 'Improves early read of where the cue is heading.',
      decisionSpeed: 'Rehearses rapid direction selection before the lane closes.',
      gazeStability: 'Keeps eyes anchored to moving targets during action.',
    },
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
    whyThisMatters: 'Stable tracking under motion supports cleaner reads when play speeds up.',
    evidenceStyle: {
      cuePickup: 'Requires immediate lock onto a moving visual reference.',
      anticipation: 'Trains micro-adjustment before drift becomes a break.',
      decisionSpeed: 'Builds quick correction decisions while staying engaged.',
      gazeStability: 'Directly challenges steady gaze during continuous movement.',
    },
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
    whyThisMatters: 'Athletes often need to remember and execute short tactical sequences under pressure.',
    evidenceStyle: {
      cuePickup: 'Demands accurate pickup of cue order during preview.',
      anticipation: 'Strengthens prediction of upcoming order positions.',
      decisionSpeed: 'Trains quick, correct sequence decisions during replay.',
      gazeStability: 'Encourages steady visual reference while encoding order.',
    },
    tips: [
      'Watch the glow order first and avoid tapping during preview.',
      'In input phase, commit to one clean cue at a time.',
      'Difficulty ramps gradually every few successful sequences.',
    ],
  },
};

export const getModePresentation = (modeKey: GameModeType, sport: SportType): ModePresentation => {
  const override = modeSportOverrides[sport]?.[modeKey];
  const sportCopy = override ?? DEFAULT_SPORT_COPY[modeKey];
  return {
    ...modeDescriptions[modeKey],
    ...sportCopy,
  };
};

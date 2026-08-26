import { GameModeType } from '../types/game';
import { SemanticAccent } from './designTokens';

export type InstinctArena =
  | 'clearing'
  | 'canopy'
  | 'riverbank'
  | 'forestFloor'
  | 'nightCanopy';

export type InstinctTargetStyle =
  | 'pantherEye'
  | 'cobraEye'
  | 'jaguarSpot'
  | 'clawSlash'
  | 'coilRing'
  | 'glyphStone'
  | 'owlIris'
  | 'waterEye';

export interface AnimalInstinct {
  modeId: GameModeType;
  animal: string;
  instinct: string;
  mechanicName: string;
  experienceName: string;
  tagline: string;
  ability: string;
  shortDescription: string;
  accent: SemanticAccent;
  arena: InstinctArena;
  introCue: string;
  successLine: string;
  failureLine: string;
  resultsLines: {
    strong: string;
    mixed: string;
    weak: string;
  };
  coachLines: {
    enduranceDrop: string;
    lockedIn: string;
    peripheralMiss: string;
    sequenceBreak: string;
    calm: string;
    default: string;
  };
  whatThisTrains: string;
  iconRef: string;
  silhouetteRef: string;
  targetStyle: InstinctTargetStyle;
}

const instincts: Record<GameModeType, AnimalInstinct> = {
  reactionBenchmark: {
    modeId: 'reactionBenchmark',
    animal: 'Panther',
    instinct: 'Readiness',
    mechanicName: 'Reaction Benchmark',
    experienceName: 'Panther Readiness',
    tagline: 'Measure how ready your nervous system is to react.',
    ability: 'Neural readiness',
    shortDescription:
      'A predator does not choose when opportunity appears. It must already be prepared.',
    accent: 'green',
    arena: 'clearing',
    introCue: 'WAIT FOR THE SIGNAL.',
    successLine: 'Ready.',
    failureLine: 'Late.',
    resultsLines: {
      strong: 'Baseline locked. Nervous system is primed.',
      mixed: 'Readiness held early, then drifted. Consistency needs work.',
      weak: 'Alertness slipped. Reset and re-run the baseline.',
    },
    coachLines: {
      enduranceDrop: 'Fast early responses, late-round decay. Reaction endurance needs work.',
      lockedIn: 'Stable reaction window across the full protocol.',
      peripheralMiss: 'Central cues were clean; widen the field next.',
      sequenceBreak: 'Order held under paced stimulus.',
      calm: 'Composure stayed intact under the fixed protocol.',
      default: 'Treat this score as your personal readiness baseline, not a diagnosis.',
    },
    whatThisTrains: 'Baseline reaction speed, response consistency, alertness, and neural readiness.',
    iconRef: 'panther',
    silhouetteRef: 'panther-silhouette',
    targetStyle: 'pantherEye',
  },
  quickTap: {
    modeId: 'quickTap',
    animal: 'Cobra',
    instinct: 'Explosive reaction',
    mechanicName: 'Quick Tap',
    experienceName: 'Cobra Strike',
    tagline: 'See it. Strike before thought gets in the way.',
    ability: 'Reaction speed',
    shortDescription: 'React to a visual stimulus before the window closes.',
    accent: 'green',
    arena: 'forestFloor',
    introCue: 'WAIT FOR THE SIGNAL.',
    successLine: 'Strike.',
    failureLine: 'Missed strike.',
    resultsLines: {
      strong: 'Faster. Instinct led the hands.',
      mixed: 'Clean early strikes; late reps slowed.',
      weak: 'Thought got in the way. Strike on first read.',
    },
    coachLines: {
      enduranceDrop: 'First responses were fast, but performance dropped late in the round.',
      lockedIn: 'Explosive commits stayed clean across the set.',
      peripheralMiss: 'Central strikes were solid; widen pickup next.',
      sequenceBreak: 'Single-cue reaction held under pace.',
      calm: 'Speed without panic — keep that composure.',
      default: 'Reaction speed is strong when the first cue is trusted.',
    },
    whatThisTrains: 'Simple reaction time and visual stimulus to motor response.',
    iconRef: 'cobra',
    silhouetteRef: 'cobra-silhouette',
    targetStyle: 'cobraEye',
  },
  multiTarget: {
    modeId: 'multiTarget',
    animal: 'Jaguar',
    instinct: 'Rapid target acquisition',
    mechanicName: 'Multi Target',
    experienceName: 'Jaguar Hunt',
    tagline: 'Scan the environment. Identify opportunity. Attack.',
    ability: 'Decision speed',
    shortDescription: 'Multiple targets emerge. Identify and eliminate opportunities fast.',
    accent: 'amber',
    arena: 'canopy',
    introCue: 'SCAN. THEN STRIKE.',
    successLine: 'Target acquired.',
    failureLine: 'Opportunity lost.',
    resultsLines: {
      strong: 'Hunt chain held. Eyes led the hands.',
      mixed: 'Acquisition was clean early; complexity cost later reps.',
      weak: 'Scanning stalled. Eyes first, then attack.',
    },
    coachLines: {
      enduranceDrop: 'Wave clearance was strong early, then decision quality dropped.',
      lockedIn: 'Multi-target acquisition stayed ordered under load.',
      peripheralMiss: 'Central targets cleared; edge cues need more attention.',
      sequenceBreak: 'Ordering stayed intentional across waves.',
      calm: 'Complexity did not force panic taps.',
      default: 'Decision speed under visual complexity is the training priority.',
    },
    whatThisTrains: 'Decision speed, visual scanning, multi-target processing, and reaction under complexity.',
    iconRef: 'jaguar',
    silhouetteRef: 'jaguar-silhouette',
    targetStyle: 'jaguarSpot',
  },
  swipeStrike: {
    modeId: 'swipeStrike',
    animal: 'Jaguar',
    instinct: 'Directional commitment',
    mechanicName: 'Swipe Strike',
    experienceName: 'Jaguar Claw',
    tagline: 'Read direction. Commit without hesitation.',
    ability: 'Directional control',
    shortDescription: 'Read the line early and commit to the matching strike path.',
    accent: 'amber',
    arena: 'canopy',
    introCue: 'READ THE LINE.',
    successLine: 'Committed.',
    failureLine: 'Wrong line.',
    resultsLines: {
      strong: 'Direction read early. Claw committed clean.',
      mixed: 'Reads were correct; timing windows slipped.',
      weak: 'Hesitation on the line. Read first. Move second.',
    },
    coachLines: {
      enduranceDrop: 'Directional accuracy held early, then late swipes drifted.',
      lockedIn: 'Clean directional commits across the lane set.',
      peripheralMiss: 'Line recognition needs earlier peripheral pickup.',
      sequenceBreak: 'Direction order stayed intentional.',
      calm: 'Commitment without panic — keep that quality.',
      default: 'Direction recognition and motor commitment are the focus.',
    },
    whatThisTrains: 'Direction recognition, decision speed, motor commitment, and response accuracy.',
    iconRef: 'jaguar-claw',
    silhouetteRef: 'jaguar-silhouette',
    targetStyle: 'clawSlash',
  },
  holdTrack: {
    modeId: 'holdTrack',
    animal: 'Anaconda',
    instinct: 'Continuous tracking',
    mechanicName: 'Hold Track',
    experienceName: 'Anaconda Lock',
    tagline: 'Acquire the target. Stay connected. Do not lose the trail.',
    ability: 'Tracking control',
    shortDescription: 'Lock onto a moving cue and hold connection until the coil completes.',
    accent: 'green',
    arena: 'riverbank',
    introCue: 'ACQUIRE. HOLD.',
    successLine: 'Locked in.',
    failureLine: 'Trail lost.',
    resultsLines: {
      strong: 'Lock held. Tracking stayed connected.',
      mixed: 'Acquisition was fast; sustained lock slipped late.',
      weak: 'Trail broke too often. Smaller corrections, longer holds.',
    },
    coachLines: {
      enduranceDrop: 'Locks formed cleanly, then broke under longer pursuit.',
      lockedIn: 'Smooth pursuit held through direction changes.',
      peripheralMiss: 'Central lock was strong; edge drift cost holds.',
      sequenceBreak: 'Tracking sequence stayed continuous.',
      calm: 'Pressure did not force over-corrections.',
      default: 'Smooth pursuit and motor stability are the training focus.',
    },
    whatThisTrains: 'Smooth pursuit, visual tracking, motor stability, and attention endurance.',
    iconRef: 'anaconda',
    silhouetteRef: 'anaconda-silhouette',
    targetStyle: 'coilRing',
  },
  sequenceMemory: {
    modeId: 'sequenceMemory',
    animal: 'Capuchin',
    instinct: 'Pattern intelligence',
    mechanicName: 'Sequence Memory',
    experienceName: 'Capuchin Code',
    tagline: 'Observe the pattern. Hold it. Reproduce it.',
    ability: 'Working memory',
    shortDescription: 'The environment shows a pattern. Encode it, then reproduce under pace.',
    accent: 'blue',
    arena: 'forestFloor',
    introCue: 'WATCH THE PATTERN.',
    successLine: 'Code held.',
    failureLine: 'Sequence broken.',
    resultsLines: {
      strong: 'Pattern encoded clean. Reproduction stayed exact.',
      mixed: 'Short codes held; longer sequences frayed.',
      weak: 'Sequence broken. Watch fully before you move.',
    },
    coachLines: {
      enduranceDrop: 'Early patterns held; load growth broke later recalls.',
      lockedIn: 'Working memory stayed exact under tempo.',
      peripheralMiss: 'Encoding was central-heavy; widen visual sampling.',
      sequenceBreak: 'Order errors rose when pace increased.',
      calm: 'Recall stayed patient instead of rushed.',
      default: 'Working memory and pattern recognition are the priority.',
    },
    whatThisTrains: 'Working memory, sequence recall, and pattern recognition.',
    iconRef: 'capuchin',
    silhouetteRef: 'capuchin-silhouette',
    targetStyle: 'glyphStone',
  },
  peripheralPulse: {
    modeId: 'peripheralPulse',
    animal: 'Owl',
    instinct: 'Peripheral awareness',
    mechanicName: 'Peripheral Pulse',
    experienceName: 'Owl Vision',
    tagline: 'Keep your eyes quiet. See what happens around them.',
    ability: 'Peripheral vision',
    shortDescription: 'Central fixation stays quiet while edge cues demand detection.',
    accent: 'blue',
    arena: 'nightCanopy',
    introCue: 'EYES QUIET.',
    successLine: 'Seen.',
    failureLine: 'Peripheral miss.',
    resultsLines: {
      strong: 'Wide field held. Eyes stayed quiet.',
      mixed: 'Edge detection worked early; head chase crept in later.',
      weak: 'Peripheral miss. Stop chasing — widen the field.',
    },
    coachLines: {
      enduranceDrop: 'Edge pickup was strong early, then central chase returned.',
      lockedIn: 'Quiet-eye behavior held while detecting edge cues.',
      peripheralMiss: 'Peripheral detection is the clear training gap.',
      sequenceBreak: 'Lane order stayed intentional.',
      calm: 'Composure supported wider-field awareness.',
      default: 'Wide visual field and peripheral detection are the focus.',
    },
    whatThisTrains: 'Wide visual field, attention outside central fixation, and peripheral detection.',
    iconRef: 'owl',
    silhouetteRef: 'owl-silhouette',
    targetStyle: 'owlIris',
  },
  calmFocus: {
    modeId: 'calmFocus',
    animal: 'Crocodile',
    instinct: 'Patience',
    mechanicName: 'Calm Focus',
    experienceName: 'Crocodile Stillness',
    tagline: 'Still does not mean slow. Still means ready.',
    ability: 'Cognitive control',
    shortDescription: 'Low-arousal precision. Speed without control is useless.',
    accent: 'blue',
    arena: 'riverbank',
    introCue: 'STILL. READY.',
    successLine: 'Patient.',
    failureLine: 'Rushed.',
    resultsLines: {
      strong: 'Stillness held. Ready without rush.',
      mixed: 'Composure was good early; urgency crept back in.',
      weak: 'Rushed. Stay patient — control first, then act.',
    },
    coachLines: {
      enduranceDrop: 'Calm control held early, then urgency returned late.',
      lockedIn: 'Inhibition and focus stayed clean across the set.',
      peripheralMiss: 'Central composure was strong; widen awareness next.',
      sequenceBreak: 'Deliberate cadence stayed intact.',
      calm: 'Stillness translated into clean, repeatable responses.',
      default: 'Inhibition, focus, and calmness before action are the priority.',
    },
    whatThisTrains: 'Inhibition, focus, response control, and calmness before action.',
    iconRef: 'crocodile',
    silhouetteRef: 'crocodile-silhouette',
    targetStyle: 'waterEye',
  },
};

export const animalInstinctOrder: GameModeType[] = [
  'reactionBenchmark',
  'quickTap',
  'multiTarget',
  'swipeStrike',
  'holdTrack',
  'sequenceMemory',
  'peripheralPulse',
  'calmFocus',
];

export const getAnimalInstinct = (mode: GameModeType): AnimalInstinct =>
  instincts[mode] ?? instincts.quickTap;

export const getExperienceName = (mode: GameModeType): string =>
  getAnimalInstinct(mode).experienceName;

export const getMechanicName = (mode: GameModeType): string =>
  getAnimalInstinct(mode).mechanicName;

export const getInstinctIdentityCue = (
  mode: GameModeType,
): 'instinct-hiss' | 'instinct-growl' | 'instinct-water' => {
  const arena = getAnimalInstinct(mode).arena;
  if (arena === 'riverbank') return 'instinct-water';
  if (arena === 'clearing' || arena === 'canopy' || arena === 'nightCanopy') return 'instinct-growl';
  return 'instinct-hiss';
};

export const animalInstinctRegistry = instincts;

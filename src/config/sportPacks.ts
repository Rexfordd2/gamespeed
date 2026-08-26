import { GameModeType } from '../types/game';
import type { SportType } from './sports';
import {
  resolveSportIconAssetPath,
  resolveSportIconFallbackPath,
  resolveTargetSkinAssetPath,
  resolveTargetSkinFallbackPath,
  SportVisualAssetRef,
} from './assetRegistry';

export interface SportAccentTokens {
  primary: string;
  secondary: string;
  glow: string;
}

export interface SportReadinessCopy {
  heroTitle: string;
  heroBody: string;
  onboardingIntro: string;
  modeSelectorSubtitle: string;
}

export interface SportRunwayCopy {
  introTitle: string;
  introBody: string;
  settlePrompt: string;
  gazePrompt: string;
  trackingPrompt: string;
  cueReviewPrompt: string;
  cueReviewChecklist: string[];
}

type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SportCueVocabulary {
  sequence: string[];
  swipeByDirection?: Partial<Record<SwipeDirection, string>>;
  holdTrackLabel?: string;
}

export interface SportHudLabels {
  score: string;
  streak: string;
  benchmarkProtocol: string;
  drillProtocol: string;
  swipeWindowTitle: string;
  holdTrackTitle: string;
}

export interface SportPackIconSet {
  sport: SportVisualAssetRef;
  targetSkin: SportVisualAssetRef;
}

export interface SportHowToCopy {
  intro: string;
  checklist: string[];
}

export interface SportAudioCueMap {
  mode?: Partial<Record<SportModeCueKey, string>>;
}

export type SportModeCueKey =
  | 'swipe-left'
  | 'swipe-right'
  | 'swipe-up'
  | 'swipe-down'
  | 'hold-lock'
  | 'sequence-preview'
  | 'sequence-input'
  | 'sequence-success'
  | 'sequence-fail';

export interface SportPack {
  id: SportType;
  displayName: string;
  accentTokens: SportAccentTokens;
  iconSet: SportPackIconSet;
  cueVocabulary: SportCueVocabulary;
  hudLabels: SportHudLabels;
  defaultRecommendedModes: GameModeType[];
  introCopy: SportReadinessCopy;
  runwayCopy: SportRunwayCopy;
  howToCopy: SportHowToCopy;
  audioCueMap?: SportAudioCueMap;
}

const defaultHudLabels: SportHudLabels = {
  score: 'Score',
  streak: 'Streak',
  benchmarkProtocol: 'Benchmark protocol',
  drillProtocol: 'Drill protocol',
  swipeWindowTitle: 'Swipe window',
  holdTrackTitle: 'Hold track',
};

const defaultHowToCopy: SportHowToCopy = {
  intro: 'Use a short readiness sequence to sharpen cue pickup and decision timing.',
  checklist: ['Settle breathing', 'Stabilize gaze', 'Track object cues', 'Review first-read triggers'],
};

const toSportAssetId = (sport: SportType) =>
  sport === 'baseball_softball' ? 'baseball-softball' : sport;

const getDefaultIconSet = (sport: SportType): SportPackIconSet => {
  const sportAssetId = toSportAssetId(sport);
  return {
    sport: {
      assetId: sportAssetId,
    },
    targetSkin: {
      assetId: `${sportAssetId}-default`,
    },
  };
};

const baseSportPack = (
  id: SportType,
  displayName: string,
  accentTokens: SportAccentTokens,
  cueVocabulary: SportCueVocabulary,
  defaultRecommendedModes: GameModeType[],
  introCopy: SportReadinessCopy,
  runwayCopy: SportRunwayCopy,
): SportPack => ({
  id,
  displayName,
  accentTokens,
  iconSet: getDefaultIconSet(id),
  cueVocabulary,
  hudLabels: defaultHudLabels,
  defaultRecommendedModes,
  introCopy,
  runwayCopy,
  howToCopy: defaultHowToCopy,
});

export const sportPacks: SportPack[] = [
  baseSportPack(
    'soccer',
    'Soccer',
    {
      primary: '#34d399',
      secondary: '#22d3ee',
      glow: 'rgba(52, 211, 153, 0.35)',
    },
    {
      sequence: ['first touch cue', 'press trigger', 'passing lane read'],
      holdTrackLabel: 'press trigger lock',
      swipeByDirection: {
        left: 'outside cut',
        right: 'inside carry',
        up: 'press lane',
        down: 'drop support',
      },
    },
    ['reactionBenchmark', 'quickTap', 'multiTarget', 'peripheralPulse'],
    {
      heroTitle: 'Replace pre-match scrolling with a 60-second soccer readiness check.',
      heroBody: 'Prime your first step, cue pickup, and decision speed before kickoff.',
      onboardingIntro:
        'Pick your readiness profile, then run a fast soccer-focused benchmark before training or match play.',
      modeSelectorSubtitle:
        'Choose a live drill to sharpen first-touch reactions, lane reads, and under-pressure decisions.',
    },
    {
      introTitle: 'Soccer pre-game runway',
      introBody:
        'Phone down. Use this short sequence to lock in attention, stabilize gaze, and read first-touch cues before kickoff.',
      settlePrompt: 'Nasal inhale for 4, relaxed exhale for 6. Let shoulders drop and jaw unclench.',
      gazePrompt: 'Hold your eyes steady on one point. Keep head quiet and let peripheral vision stay soft.',
      trackingPrompt:
        'Track a moving ball, hand, or finger smoothly. Prioritize clean pursuit over speed.',
      cueReviewPrompt: 'Review your first two tactical cues for kickoff and one communication cue.',
      cueReviewChecklist: ['First-touch cue', 'Press trigger', 'Passing lane read'],
    },
  ),
  baseSportPack(
    'football',
    'Football',
    {
      primary: '#f59e0b',
      secondary: '#f97316',
      glow: 'rgba(245, 158, 11, 0.34)',
    },
    {
      sequence: ['snap cue', 'coverage tell', 'gap trigger'],
      holdTrackLabel: 'coverage tell lock',
      swipeByDirection: {
        left: 'fit left',
        right: 'fit right',
        up: 'attack gap',
        down: 'drop zone',
      },
    },
    ['reactionBenchmark', 'quickTap', 'multiTarget', 'peripheralPulse'],
    {
      heroTitle: 'Replace pre-game scrolling with a 60-second football readiness check.',
      heroBody: 'Prime first-step reactions, coverage reads, and decision speed before kickoff.',
      onboardingIntro:
        'Pick your readiness profile, then run a quick football-focused benchmark before practice or game reps.',
      modeSelectorSubtitle:
        'Choose drills to sharpen snap cues, read speed, and under-pressure football decisions.',
    },
    {
      introTitle: 'Football pre-game runway',
      introBody:
        'Stay off the feed and run this readiness block to settle your system, tighten your eyes, and sharpen pre-snap reads.',
      settlePrompt: 'Long exhale breathing. Relax hands and face between each cycle.',
      gazePrompt: 'Fix your gaze on a stable point and avoid extra head movement.',
      trackingPrompt: 'Track a moving object while keeping your torso quiet and feet balanced.',
      cueReviewPrompt: 'Review one assignment cue, one coverage cue, and your first communication call.',
      cueReviewChecklist: ['Snap cue', 'Coverage tell', 'Gap trigger'],
    },
  ),
  baseSportPack(
    'volleyball',
    'Volleyball',
    {
      primary: '#38bdf8',
      secondary: '#a78bfa',
      glow: 'rgba(56, 189, 248, 0.34)',
    },
    {
      sequence: ['serve read', 'block cue', 'transition trigger'],
      holdTrackLabel: 'block cue lock',
      swipeByDirection: {
        left: 'seal line',
        right: 'seal cross',
        up: 'press block',
        down: 'dig drop',
      },
    },
    ['reactionBenchmark', 'multiTarget', 'holdTrack', 'peripheralPulse'],
    {
      heroTitle: 'Trade the pre-serve phone scroll for a 60-second readiness reset.',
      heroBody: 'Tune cue pickup and cleaner split-second decisions before first contact.',
      onboardingIntro:
        'Set your focus and run a short volleyball readiness test to enter sessions switched on.',
      modeSelectorSubtitle:
        'Run drills that tighten serve-read reactions, transition timing, and tracking under pace.',
    },
    {
      introTitle: 'Volleyball pre-game runway',
      introBody:
        'Use this no-scroll routine to settle your attention and sharpen serve-read and transition cue pickup.',
      settlePrompt: 'Slow inhale and longer exhale. Drop shoulders and reset posture each breath.',
      gazePrompt: 'Quiet-eye hold on one target. Keep vision stable through each breath.',
      trackingPrompt: 'Track a tossed or bounced object with smooth eyes and minimal head sway.',
      cueReviewPrompt: 'Review your serve-read priority and first transition communication cue.',
      cueReviewChecklist: ['Serve read', 'Block cue', 'Transition trigger'],
    },
  ),
  baseSportPack(
    'boxing',
    'Boxing',
    {
      primary: '#f97316',
      secondary: '#fb7185',
      glow: 'rgba(249, 115, 22, 0.34)',
    },
    {
      sequence: ['opening cue', 'counter trigger', 'distance read'],
      holdTrackLabel: 'counter trigger lock',
      swipeByDirection: {
        left: 'slip left',
        right: 'slip right',
        up: 'step in',
        down: 'roll under',
      },
    },
    ['reactionBenchmark', 'quickTap', 'swipeStrike', 'calmFocus'],
    {
      heroTitle: 'Swap pre-fight doomscrolling for a focused 60-second reaction primer.',
      heroBody: 'Sharpen openings, counters, and cue recognition before the first exchange.',
      onboardingIntro:
        'Pick your profile and run a boxing readiness benchmark to prime speed and decision control.',
      modeSelectorSubtitle:
        'Select drills built for faster cue recognition, cleaner response timing, and composure.',
    },
    {
      introTitle: 'Boxing pre-session runway',
      introBody:
        'Put the phone away and run this short flow to steady breathing, lock gaze, and sharpen opening reads.',
      settlePrompt: 'Breathe low and slow. Keep shoulders loose and hands relaxed.',
      gazePrompt: 'Hold eyes on a fixed point and keep your head centered.',
      trackingPrompt: 'Track a moving target smoothly and stay balanced through each rep.',
      cueReviewPrompt: 'Review your opening cue, counter trigger, and defensive reset cue.',
      cueReviewChecklist: ['Opening cue', 'Counter trigger', 'Distance read'],
    },
  ),
  baseSportPack(
    'baseball_softball',
    'Baseball / Softball',
    {
      primary: '#84cc16',
      secondary: '#38bdf8',
      glow: 'rgba(132, 204, 22, 0.34)',
    },
    {
      sequence: ['pitch cue', 'release read', 'fielding trigger'],
      holdTrackLabel: 'release read lock',
      swipeByDirection: {
        left: 'break glove side',
        right: 'break arm side',
        up: 'charge',
        down: 'drop step',
      },
    },
    ['reactionBenchmark', 'multiTarget', 'sequenceMemory', 'peripheralPulse'],
    {
      heroTitle: 'Replace pre-game scrolling with a 60-second batter/field readiness check.',
      heroBody: 'Improve release pickup, decision timing, and cue-to-action speed.',
      onboardingIntro:
        'Dial in your readiness focus, then run a short baseball/softball benchmark before reps.',
      modeSelectorSubtitle:
        'Choose drills that reinforce pitch-cue recognition, read speed, and fast decisions.',
    },
    {
      introTitle: 'Baseball/softball pre-game runway',
      introBody:
        'Run this phone-free sequence to sharpen release tracking and early pitch/ball-flight pickup.',
      settlePrompt: 'Use slow breaths and quiet your upper body between cycles.',
      gazePrompt: 'Quiet-eye hold on a small point while keeping neck and jaw relaxed.',
      trackingPrompt: 'Track a tossed object or finger path with smooth pursuit and soft shoulders.',
      cueReviewPrompt: 'Review your release cue, first movement cue, and communication reminder.',
      cueReviewChecklist: ['Pitch cue', 'Release read', 'Fielding trigger'],
    },
  ),
  baseSportPack(
    'racquet',
    'Racquet Sports',
    {
      primary: '#14b8a6',
      secondary: '#facc15',
      glow: 'rgba(20, 184, 166, 0.34)',
    },
    {
      sequence: ['opponent prep cue', 'contact read', 'recovery trigger'],
      holdTrackLabel: 'contact read lock',
      swipeByDirection: {
        left: 'defend backhand',
        right: 'defend forehand',
        up: 'step through',
        down: 'recover split',
      },
    },
    ['reactionBenchmark', 'quickTap', 'holdTrack', 'calmFocus'],
    {
      heroTitle: 'Skip the pre-match scroll and run a 60-second racquet readiness set.',
      heroBody: 'Boost split-step timing, cue pickup, and faster point-by-point decisions.',
      onboardingIntro:
        'Choose your readiness profile and run a quick benchmark before stepping on court.',
      modeSelectorSubtitle:
        'Start drills that sharpen anticipation cues, tracking control, and decisive responses.',
    },
    {
      introTitle: 'Racquet pre-match runway',
      introBody:
        'Stay phone-free and run this readiness flow to steady focus, stabilize your eyes, and sharpen anticipation cues.',
      settlePrompt: 'Breathe in quietly and exhale longer to reduce noise before play.',
      gazePrompt: 'Keep a fixed gaze on one point and avoid unnecessary eye jumps.',
      trackingPrompt: 'Track a moving object with smooth eyes, then return quickly to neutral.',
      cueReviewPrompt: 'Review your anticipation cue, split-step timing cue, and recovery cue.',
      cueReviewChecklist: ['Opponent prep cue', 'Contact read', 'Recovery trigger'],
    },
  ),
  baseSportPack(
    'basketball',
    'Basketball',
    {
      primary: '#fb923c',
      secondary: '#22d3ee',
      glow: 'rgba(251, 146, 60, 0.34)',
    },
    {
      sequence: ['drive lane cue', 'help rotation read', 'kickout trigger'],
      holdTrackLabel: 'help rotation read lock',
      swipeByDirection: {
        left: 'shade left drive',
        right: 'shade right drive',
        up: 'closeout high',
        down: 'drop to help',
      },
    },
    ['reactionBenchmark', 'quickTap', 'multiTarget', 'peripheralPulse'],
    {
      heroTitle: 'Replace pre-game scrolling with a 60-second basketball readiness check.',
      heroBody: 'Sharpen first-step decisions, help-read timing, and cue pickup before tip-off.',
      onboardingIntro:
        'Choose your readiness profile, then run a short basketball benchmark before warmups or game action.',
      modeSelectorSubtitle:
        'Choose drills that reinforce anticipation, decision speed, and calm execution under pace.',
    },
    {
      introTitle: 'Basketball pre-game runway',
      introBody:
        'Go phone-free and run this sequence to settle your system, stabilize gaze, and sharpen first-read decisions before tip-off.',
      settlePrompt:
        'Slow inhale through the nose, long exhale through the mouth. Relax shoulders and hands.',
      gazePrompt:
        'Lock eyes on one point with a still head. Keep peripheral awareness soft and available.',
      trackingPrompt:
        'Track a moving object smoothly, then return to center control without rushing.',
      cueReviewPrompt:
        'Review your first offensive cue, one defensive help cue, and your first communication cue.',
      cueReviewChecklist: ['Drive lane cue', 'Help rotation read', 'Kickout trigger'],
    },
  ),
];

export const sportPacksById = sportPacks.reduce<Record<SportType, SportPack>>(
  (accumulator, sportPack) => {
    accumulator[sportPack.id] = sportPack;
    return accumulator;
  },
  {} as Record<SportType, SportPack>,
);

export interface ResolvedSportPackAssets {
  sportIcon: string;
  sportIconFallback: string;
  targetIcon: string;
  targetIconFallback: string;
}

export const getSportPackAssets = (pack: SportPack): ResolvedSportPackAssets => ({
  sportIcon: resolveSportIconAssetPath(pack.id, pack.iconSet.sport),
  sportIconFallback: resolveSportIconFallbackPath(pack.id),
  targetIcon: resolveTargetSkinAssetPath(pack.id, pack.iconSet.targetSkin),
  targetIconFallback: resolveTargetSkinFallbackPath(pack.id),
});


import { GameModeType } from '../types/game';

export type SportType =
  | 'soccer'
  | 'football'
  | 'volleyball'
  | 'boxing'
  | 'baseball_softball'
  | 'racquet'
  | 'basketball';

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

export interface SportConfig {
  id: SportType;
  displayName: string;
  accents: SportAccentTokens;
  cueVocabulary: string[];
  defaultRecommendedModes: GameModeType[];
  readinessCopy: SportReadinessCopy;
  runwayCopy: SportRunwayCopy;
}

export const DEFAULT_SPORT: SportType = 'soccer';
export const SPORT_SELECTION_STORAGE_KEY = 'gamespeed_selected_sport_v1';

export const SPORT_ORDER: SportType[] = [
  'soccer',
  'volleyball',
  'boxing',
  'baseball_softball',
  'racquet',
  'football',
  'basketball',
];

export const sportConfigs: Record<SportType, SportConfig> = {
  soccer: {
    id: 'soccer',
    displayName: 'Soccer',
    accents: {
      primary: '#34d399',
      secondary: '#22d3ee',
      glow: 'rgba(52, 211, 153, 0.35)',
    },
    cueVocabulary: ['first touch cue', 'press trigger', 'passing lane read'],
    defaultRecommendedModes: ['reactionBenchmark', 'quickTap', 'multiTarget'],
    readinessCopy: {
      heroTitle: 'Replace pre-match scrolling with a 60-second soccer readiness check.',
      heroBody: 'Prime your first step, cue pickup, and decision speed before kickoff.',
      onboardingIntro:
        'Pick your readiness profile, then run a fast soccer-focused benchmark before training or match play.',
      modeSelectorSubtitle:
        'Choose a live drill to sharpen first-touch reactions, lane reads, and under-pressure decisions.',
    },
    runwayCopy: {
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
  },
  football: {
    id: 'football',
    displayName: 'Football',
    accents: {
      primary: '#f59e0b',
      secondary: '#f97316',
      glow: 'rgba(245, 158, 11, 0.34)',
    },
    cueVocabulary: ['snap cue', 'coverage tell', 'gap trigger'],
    defaultRecommendedModes: ['reactionBenchmark', 'quickTap', 'multiTarget'],
    readinessCopy: {
      heroTitle: 'Replace pre-game scrolling with a 60-second football readiness check.',
      heroBody: 'Prime first-step reactions, coverage reads, and decision speed before kickoff.',
      onboardingIntro:
        'Pick your readiness profile, then run a quick football-focused benchmark before practice or game reps.',
      modeSelectorSubtitle:
        'Choose drills to sharpen snap cues, read speed, and under-pressure football decisions.',
    },
    runwayCopy: {
      introTitle: 'Football pre-game runway',
      introBody:
        'Stay off the feed and run this readiness block to settle your system, tighten your eyes, and sharpen pre-snap reads.',
      settlePrompt: 'Long exhale breathing. Relax hands and face between each cycle.',
      gazePrompt: 'Fix your gaze on a stable point and avoid extra head movement.',
      trackingPrompt: 'Track a moving object while keeping your torso quiet and feet balanced.',
      cueReviewPrompt: 'Review one assignment cue, one coverage cue, and your first communication call.',
      cueReviewChecklist: ['Snap cue', 'Coverage tell', 'Gap trigger'],
    },
  },
  volleyball: {
    id: 'volleyball',
    displayName: 'Volleyball',
    accents: {
      primary: '#38bdf8',
      secondary: '#a78bfa',
      glow: 'rgba(56, 189, 248, 0.34)',
    },
    cueVocabulary: ['serve read', 'block cue', 'transition trigger'],
    defaultRecommendedModes: ['reactionBenchmark', 'multiTarget', 'holdTrack'],
    readinessCopy: {
      heroTitle: 'Trade the pre-serve phone scroll for a 60-second readiness reset.',
      heroBody: 'Tune cue pickup and cleaner split-second decisions before first contact.',
      onboardingIntro:
        'Set your focus and run a short volleyball readiness test to enter sessions switched on.',
      modeSelectorSubtitle:
        'Run drills that tighten serve-read reactions, transition timing, and tracking under pace.',
    },
    runwayCopy: {
      introTitle: 'Volleyball pre-game runway',
      introBody:
        'Use this no-scroll routine to settle your attention and sharpen serve-read and transition cue pickup.',
      settlePrompt: 'Slow inhale and longer exhale. Drop shoulders and reset posture each breath.',
      gazePrompt: 'Quiet-eye hold on one target. Keep vision stable through each breath.',
      trackingPrompt: 'Track a tossed or bounced object with smooth eyes and minimal head sway.',
      cueReviewPrompt: 'Review your serve-read priority and first transition communication cue.',
      cueReviewChecklist: ['Serve read', 'Block cue', 'Transition trigger'],
    },
  },
  boxing: {
    id: 'boxing',
    displayName: 'Boxing',
    accents: {
      primary: '#f97316',
      secondary: '#fb7185',
      glow: 'rgba(249, 115, 22, 0.34)',
    },
    cueVocabulary: ['opening cue', 'counter trigger', 'distance read'],
    defaultRecommendedModes: ['reactionBenchmark', 'quickTap', 'swipeStrike'],
    readinessCopy: {
      heroTitle: 'Swap pre-fight doomscrolling for a focused 60-second reaction primer.',
      heroBody: 'Sharpen openings, counters, and cue recognition before the first exchange.',
      onboardingIntro:
        'Pick your profile and run a boxing readiness benchmark to prime speed and decision control.',
      modeSelectorSubtitle:
        'Select drills built for faster cue recognition, cleaner response timing, and composure.',
    },
    runwayCopy: {
      introTitle: 'Boxing pre-session runway',
      introBody:
        'Put the phone away and run this short flow to steady breathing, lock gaze, and sharpen opening reads.',
      settlePrompt: 'Breathe low and slow. Keep shoulders loose and hands relaxed.',
      gazePrompt: 'Hold eyes on a fixed point and keep your head centered.',
      trackingPrompt: 'Track a moving target smoothly and stay balanced through each rep.',
      cueReviewPrompt: 'Review your opening cue, counter trigger, and defensive reset cue.',
      cueReviewChecklist: ['Opening cue', 'Counter trigger', 'Distance read'],
    },
  },
  baseball_softball: {
    id: 'baseball_softball',
    displayName: 'Baseball / Softball',
    accents: {
      primary: '#84cc16',
      secondary: '#38bdf8',
      glow: 'rgba(132, 204, 22, 0.34)',
    },
    cueVocabulary: ['pitch cue', 'release read', 'fielding trigger'],
    defaultRecommendedModes: ['reactionBenchmark', 'multiTarget', 'sequenceMemory'],
    readinessCopy: {
      heroTitle: 'Replace pre-game scrolling with a 60-second batter/field readiness check.',
      heroBody: 'Improve release pickup, decision timing, and cue-to-action speed.',
      onboardingIntro:
        'Dial in your readiness focus, then run a short baseball/softball benchmark before reps.',
      modeSelectorSubtitle:
        'Choose drills that reinforce pitch-cue recognition, read speed, and fast decisions.',
    },
    runwayCopy: {
      introTitle: 'Baseball/softball pre-game runway',
      introBody:
        'Run this phone-free sequence to sharpen release tracking and early pitch/ball-flight pickup.',
      settlePrompt: 'Use slow breaths and quiet your upper body between cycles.',
      gazePrompt: 'Quiet-eye hold on a small point while keeping neck and jaw relaxed.',
      trackingPrompt: 'Track a tossed object or finger path with smooth pursuit and soft shoulders.',
      cueReviewPrompt: 'Review your release cue, first movement cue, and communication reminder.',
      cueReviewChecklist: ['Pitch cue', 'Release read', 'Fielding trigger'],
    },
  },
  racquet: {
    id: 'racquet',
    displayName: 'Racquet Sports',
    accents: {
      primary: '#14b8a6',
      secondary: '#facc15',
      glow: 'rgba(20, 184, 166, 0.34)',
    },
    cueVocabulary: ['opponent prep cue', 'contact read', 'recovery trigger'],
    defaultRecommendedModes: ['reactionBenchmark', 'quickTap', 'holdTrack'],
    readinessCopy: {
      heroTitle: 'Skip the pre-match scroll and run a 60-second racquet readiness set.',
      heroBody: 'Boost split-step timing, cue pickup, and faster point-by-point decisions.',
      onboardingIntro:
        'Choose your readiness profile and run a quick benchmark before stepping on court.',
      modeSelectorSubtitle:
        'Start drills that sharpen anticipation cues, tracking control, and decisive responses.',
    },
    runwayCopy: {
      introTitle: 'Racquet pre-match runway',
      introBody:
        'Stay phone-free and run this readiness flow to steady focus, stabilize your eyes, and sharpen anticipation cues.',
      settlePrompt: 'Breathe in quietly and exhale longer to reduce noise before play.',
      gazePrompt: 'Keep a fixed gaze on one point and avoid unnecessary eye jumps.',
      trackingPrompt: 'Track a moving object with smooth eyes, then return quickly to neutral.',
      cueReviewPrompt: 'Review your anticipation cue, split-step timing cue, and recovery cue.',
      cueReviewChecklist: ['Opponent prep cue', 'Contact read', 'Recovery trigger'],
    },
  },
  basketball: {
    id: 'basketball',
    displayName: 'Basketball',
    accents: {
      primary: '#fb923c',
      secondary: '#22d3ee',
      glow: 'rgba(251, 146, 60, 0.34)',
    },
    cueVocabulary: ['drive lane cue', 'help rotation read', 'kickout trigger'],
    defaultRecommendedModes: ['reactionBenchmark', 'quickTap', 'multiTarget'],
    readinessCopy: {
      heroTitle: 'Replace pre-game scrolling with a 60-second basketball readiness check.',
      heroBody: 'Sharpen first-step decisions, help-read timing, and cue pickup before tip-off.',
      onboardingIntro:
        'Choose your readiness profile, then run a short basketball benchmark before warmups or game action.',
      modeSelectorSubtitle:
        'Choose drills that reinforce anticipation, decision speed, and calm execution under pace.',
    },
    runwayCopy: {
      introTitle: 'Basketball pre-game runway',
      introBody:
        'Go phone-free and run this sequence to settle your system, stabilize gaze, and sharpen first-read decisions before tip-off.',
      settlePrompt: 'Slow inhale through the nose, long exhale through the mouth. Relax shoulders and hands.',
      gazePrompt: 'Lock eyes on one point with a still head. Keep peripheral awareness soft and available.',
      trackingPrompt: 'Track a moving object smoothly, then return to center control without rushing.',
      cueReviewPrompt:
        'Review your first offensive cue, one defensive help cue, and your first communication cue.',
      cueReviewChecklist: ['Drive lane cue', 'Help rotation read', 'Kickout trigger'],
    },
  },
};

export const isSportType = (value: string): value is SportType => value in sportConfigs;

export const resolveSportType = (value: string | null | undefined): SportType => {
  if (value && isSportType(value)) {
    return value;
  }
  return DEFAULT_SPORT;
};

export const getSportConfig = (sport: SportType): SportConfig => sportConfigs[sport];

export const loadSelectedSport = (): SportType => {
  try {
    const stored = localStorage.getItem(SPORT_SELECTION_STORAGE_KEY);
    return resolveSportType(stored);
  } catch {
    return DEFAULT_SPORT;
  }
};

export const saveSelectedSport = (sport: SportType): void => {
  try {
    localStorage.setItem(SPORT_SELECTION_STORAGE_KEY, sport);
  } catch {
    // Ignore storage failures (private mode / quota).
  }
};

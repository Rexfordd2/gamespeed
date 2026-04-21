import { GameModeType } from '../types/game';
import {
  socialProofStats,
  socialProofTestimonials,
} from './credibilityContent';

export type LandingPersona = 'athlete' | 'gamer';

interface HeroPersonaContent {
  label: string;
  supporting: string;
  bullets: string[];
}

interface WhyPoint {
  title: string;
  body: string;
}

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

export interface LandingContent {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    personas: Record<LandingPersona, HeroPersonaContent>;
    benchmarkMicrocopy: string;
    trustMicrocopy: string;
    primaryCta: string;
    secondaryCta: string;
  };
  demo: {
    heading: string;
    body: string;
    shellLabel: string;
    metrics: { label: string; value: string }[];
    steps: string[];
    runButton: string;
  };
  whyItMatters: {
    heading: string;
    personaSuffix: Record<LandingPersona, string>;
    athlete: WhyPoint[];
    gamer: WhyPoint[];
  };
  trainingModes: {
    heading: string;
    body: string;
    selector: {
      title: string;
      subtitle: string;
      availableLabel: string;
      nextReleaseLabel: string;
      benchmarkCta: string;
      drillCta: string;
      benchmarkPillLabel: string;
      drillPillLabel: string;
      focusLabel: string;
      intensityLabel: string;
      comingSoonLabel: string;
    };
  };
  socialProof: {
    heading: string;
    benchmarkFraming: string;
    proofStats: { label: string; value: string }[];
    testimonials: Testimonial[];
  };
  progression: {
    heading: string;
    body: string;
    hooks: { title: string; body: string }[];
    cta: string;
    starterMode: GameModeType;
  };
  faq: {
    heading: string;
    items: FaqItem[];
  };
  finalCta: {
    heading: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
  };
  footer: {
    version: string;
    statsLinkLabel: string;
    feedbackLabel: string;
    feedbackUrl: string;
  };
}

export const landingContent: LandingContent = {
  hero: {
    eyebrow: 'GameSpeed Performance Lab',
    title: 'Train Faster Reactions. Sharper Decisions. Better Game Speed.',
    subtitle:
      'A sport-readiness platform for athletes to improve cue pickup, reaction timing, and split-second decisions under pressure.',
    personas: {
      athlete: {
        label: 'Train for Sport',
        supporting:
          'Build first-step separation, cleaner reads in traffic, and better execution late in demanding sessions.',
        bullets: [
          'Pre-practice baseline in 60 seconds',
          'Peripheral awareness under fatigue',
          'Weekly readiness trend tracking',
        ],
      },
      gamer: {
        label: 'Train for Competition',
        supporting:
          'Sharpen pre-performance decision speed, visual control, and repeatable readiness before training or competition.',
        bullets: [
          'Replace pre-game scrolling with a focused reset',
          'Cue pickup and anticipation under pace',
          'Session-by-session readiness trend tracking',
        ],
      },
    },
    benchmarkMicrocopy: 'Benchmark placeholder: sport/title percentile bands coming soon.',
    trustMicrocopy: 'No signup required for your first test',
    primaryCta: 'Run the 60-Second Test',
    secondaryCta: 'Watch Demo',
  },
  demo: {
    heading: 'Interactive First-Run Preview',
    body:
      'Each session starts with a controlled benchmark, then routes you into focused drills. You always know what improved and what to train next.',
    shellLabel: 'First-Run Shell',
    metrics: [
      { label: 'Round length', value: '45-60 sec' },
      { label: 'Tracked signals', value: 'Speed + Accuracy + Streak' },
      { label: 'Modes available', value: '6 live drills' },
    ],
    steps: [
      '1) Run benchmark to capture reaction baseline',
      '2) Select a drill targeting your weakest signal',
      '3) Review session stats and push your next milestone',
    ],
    runButton: 'Run the 60-Second Test',
  },
  whyItMatters: {
    heading: 'Why It Matters',
    personaSuffix: {
      athlete: 'for Athletes',
      gamer: 'for Gamers',
    },
    athlete: [
      {
        title: 'First-step advantage',
        body: 'Faster cue recognition helps you win starts, loose-ball races, and pressure moments.',
      },
      {
        title: 'Peripheral read speed',
        body: 'Train wider-field awareness so decisions stay sharp when multiple threats appear.',
      },
      {
        title: 'Decision composure',
        body: 'Build clean action under clock pressure instead of rushed, low-quality touches.',
      },
    ],
    gamer: [
      {
        title: 'Time-to-action edge',
        body: 'Lower reaction latency to convert more first-shot opportunities.',
      },
      {
        title: 'Screen-wide awareness',
        body: 'Improve peripheral detection for flanks, utility, and split-angle pressure.',
      },
      {
        title: 'Faster target prioritization',
        body: 'Practice choosing the highest-value cue quickly when multiple options appear.',
      },
    ],
  },
  trainingModes: {
    heading: 'Training Modes',
    body:
      'Run the benchmark for objective readiness, then rotate through specialized drills for speed, awareness, and control.',
    selector: {
      title: 'Choose Your Drill',
      subtitle:
        'Open a mode, review the quick protocol, and start your next reaction rep.',
      availableLabel: 'Available now',
      nextReleaseLabel: 'Next release',
      benchmarkCta: 'Run the 60-Second Test',
      drillCta: "Start Today's Session",
      benchmarkPillLabel: 'Benchmark',
      drillPillLabel: 'Playable',
      focusLabel: 'Focus',
      intensityLabel: 'Intensity',
      comingSoonLabel: 'Coming Soon',
    },
  },
  socialProof: {
    heading: 'Proof and Benchmarks',
    benchmarkFraming:
      'Use your benchmark score as a personal baseline, then compare week-over-week trend lines instead of chasing random one-off highs.',
    // Placeholder-only values; source in `src/content/credibilityContent.ts`.
    proofStats: socialProofStats,
    // Placeholder-only values; source in `src/content/credibilityContent.ts`.
    testimonials: socialProofTestimonials,
  },
  progression: {
    heading: 'Progression That Retains Habits',
    body:
      'Daily streaks, leaderboard pressure, and milestone targets turn one-off reps into long-term gains.',
    hooks: [
      {
        title: 'Streak engine',
        body: 'Protect your training streak with at least one benchmark + one drill each day.',
      },
      {
        title: 'Leaderboard momentum',
        body: 'Compete on benchmark consistency and weekly readiness improvement.',
      },
      {
        title: 'Milestone path',
        body: 'Unlock tier markers as your reaction score and accuracy bands climb.',
      },
    ],
    cta: "Start Today's Session",
    starterMode: 'reactionBenchmark',
  },
  faq: {
    heading: 'FAQ',
    items: [
      {
        question: 'Who is this built for?',
        answer:
          'GameSpeed is built for athletes preparing for training, practice, and competition. Drills focus on cue pickup, anticipation, and decision speed.',
      },
      {
        question: 'How long is one session?',
        answer:
          'Most users run 3-8 minutes: one benchmark plus two to four focused drill rounds.',
      },
      {
        question: 'Do I need an account to train?',
        answer:
          'You can run drills immediately. An account unlocks synced profile data, history, and progression tracking.',
      },
      {
        question: 'How should I use the benchmark score?',
        answer:
          'Treat it as your readiness baseline. Compare trends over time rather than obsessing over one session.',
      },
    ],
  },
  finalCta: {
    heading: 'Train Your Speed Before It Matters',
    body:
      'Run the benchmark now, identify your gap, and start a progression loop you can sustain.',
    primaryCta: 'Run the 60-Second Test',
    secondaryCta: 'Watch Demo',
  },
  footer: {
    version: 'v1.3 - Reaction Benchmark + 5 drills + session stats',
    statsLinkLabel: 'Compare My Score',
    feedbackLabel: 'Send feedback',
    feedbackUrl: 'https://github.com/rexfordd2/gamespeed/issues',
  },
};

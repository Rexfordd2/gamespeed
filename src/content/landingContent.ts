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
    brand: string;
    title: string;
    subtitle: string;
    attribution: string;
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
    eyebrow: 'GAME SPEED',
    brand: 'GAME SPEED',
    title: 'TRAIN YOUR INSTINCTS',
    subtitle: 'Reaction. Vision. Awareness. Decision Speed.',
    attribution: 'An Athlete Houze Performance System',
    personas: {
      athlete: {
        label: 'Train for Sport',
        supporting:
          'Build first-step separation, cleaner reads in traffic, and better execution late in demanding sessions.',
        bullets: [
          'Pre-practice Panther Readiness in 60 seconds',
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
    benchmarkMicrocopy: 'Panther Readiness establishes your personal neural baseline.',
    trustMicrocopy: 'No signup required for your first test',
    primaryCta: 'ENTER THE JUNGLE',
    secondaryCta: 'TEST MY REACTION',
  },
  demo: {
    heading: 'First Hunt Preview',
    body:
      'Check readiness, train a weakness, then beat yesterday. Every session ends with measurable feedback — not guesswork.',
    shellLabel: 'Instinct Lab Shell',
    metrics: [
      { label: 'Round length', value: '45-60 sec' },
      { label: 'Tracked signals', value: 'Speed + Accuracy + Consistency' },
      { label: 'Instincts live', value: '8 training modes' },
    ],
    steps: [
      '1) Run Panther Readiness to capture your baseline',
      '2) Choose an instinct targeting your weakest signal',
      '3) Review GameSpeed Score and push the next hunt',
    ],
    runButton: 'TEST MY REACTION',
  },
  whyItMatters: {
    heading: 'Why Instinct Training Matters',
    personaSuffix: {
      athlete: 'for Athletes',
      gamer: 'for Competitors',
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
    heading: 'Choose Your Instinct',
    body:
      'Every athlete reacts. Elite athletes perceive sooner. Each instinct trains a specific neurological capability.',
    selector: {
      title: 'CHOOSE YOUR INSTINCT',
      subtitle: 'Every athlete reacts. Elite athletes perceive sooner.',
      availableLabel: 'Live instincts',
      nextReleaseLabel: 'Next release',
      benchmarkCta: 'BEGIN BENCHMARK',
      drillCta: 'TRAIN',
      benchmarkPillLabel: 'Readiness',
      drillPillLabel: 'Instinct',
      focusLabel: 'Ability',
      intensityLabel: 'Intensity',
      comingSoonLabel: 'Coming Soon',
    },
  },
  socialProof: {
    heading: 'Proof and Benchmarks',
    benchmarkFraming:
      'Use Panther Readiness as a personal baseline, then compare week-over-week trend lines instead of chasing random one-off highs.',
    proofStats: socialProofStats,
    testimonials: socialProofTestimonials,
  },
  progression: {
    heading: 'Deeper Into the Rainforest',
    body:
      'Progression follows training achievement: Trail, Canopy, Hunt, Predator, Apex — earned by real session quality.',
    hooks: [
      {
        title: 'Daily consistency',
        body: 'Protect your training streak with at least one readiness check and one instinct drill.',
      },
      {
        title: 'Benchmark momentum',
        body: 'Compete against your own baseline consistency and weekly readiness improvement.',
      },
      {
        title: 'Instinct path',
        body: 'Unlock deeper rainforest tiers as accuracy and readiness bands climb.',
      },
    ],
    cta: 'ENTER THE JUNGLE',
    starterMode: 'reactionBenchmark',
  },
  faq: {
    heading: 'FAQ',
    items: [
      {
        question: 'Who is this built for?',
        answer:
          'GameSpeed is built for athletes preparing for training, practice, and competition. Instincts train cue pickup, anticipation, and decision speed.',
      },
      {
        question: 'How long is one session?',
        answer:
          'Most athletes run 3-8 minutes: one Panther Readiness check plus two to four focused instinct rounds.',
      },
      {
        question: 'Do I need an account to train?',
        answer:
          'You can train immediately. An account unlocks synced profile data, history, and progression tracking.',
      },
      {
        question: 'How should I use GameSpeed Score?',
        answer:
          'Treat it as your cognitive performance metric. Compare trends over time. It is not a medical diagnosis.',
      },
    ],
  },
  finalCta: {
    heading: 'PRIMAL INSTINCT. MODERN PERFORMANCE.',
    body:
      'Train the part of your game that moves before your muscles. Establish your baseline, then hunt improvement.',
    primaryCta: 'TEST MY REACTION',
    secondaryCta: 'EXPLORE INSTINCTS',
  },
  footer: {
    version: 'v1.4 - Instinct ecosystem + Panther Readiness + 7 drills',
    statsLinkLabel: 'Compare My Score',
    feedbackLabel: 'Send feedback',
    feedbackUrl: 'https://github.com/rexfordd2/gamespeed/issues',
  },
};

export interface ProofStat {
  label: string;
  value: string;
}

export interface SocialTestimonial {
  quote: string;
  author: string;
  role: string;
}

export interface CredibilityMetricCard {
  metric: string;
  evidence: string;
  context: string;
}

export interface CredibilityQuoteCard {
  role: 'Coach' | 'Player' | 'Gamer';
  quote: string;
  name: string;
  note: string;
}

export interface ScoreBand {
  band: string;
  range: string;
  interpretation: string;
}

export interface WorkflowStep {
  title: string;
  body: string;
}

export const socialProofStats: ProofStat[] = [
  { label: 'Compared to', value: 'Your last session' },
  { label: 'Signals stored', value: 'Speed, accuracy, streak' },
  { label: 'Baseline length', value: '60 seconds' },
];

export const socialProofTestimonials: SocialTestimonial[] = [
  {
    quote: 'Treat the first benchmark on this device as your mark. Later sessions are only compared to you.',
    author: 'Training note',
    role: 'Personal baseline, not a published study',
  },
  {
    quote: 'If reaction time jumps after a late night, that is a session log — not a medical finding.',
    author: 'Training note',
    role: 'Same-device comparison only',
  },
  {
    quote: 'Rotate scan, control, decide, and process instincts when you want breadth. Volume without those marks does not invent mastery.',
    author: 'Training note',
    role: 'Completed work only',
  },
];

export const credibilityMetricCards: CredibilityMetricCard[] = [
  {
    metric: 'Personal weekly volume',
    evidence: 'Counted from rounds stored on this device',
    context: 'There is no live user cohort yet. Weekly consistency is your completed sessions this week.',
  },
  {
    metric: 'Reaction trend',
    evidence: 'Median reaction time versus your first baseline mark',
    context: 'A trend is shown only after two baseline sessions. Faster or slower is vs you, not a population.',
  },
  {
    metric: 'Accuracy stability',
    evidence: 'Mode accuracy stored on completed rounds',
    context: 'Use this to see whether your own hits stay clean. It is not a diagnosis or injury screen.',
  },
];

export const scoreBands: ScoreBand[] = [
  {
    band: 'Faster session',
    range: '< 215 ms',
    interpretation: 'Quicker than many of your own marks on this device. Keep the protocol the same if you want a fair comparison.',
  },
  {
    band: 'Typical session',
    range: '215-250 ms',
    interpretation: 'In a common personal range. Use accuracy and misses before changing the plan.',
  },
  {
    band: 'Slower session',
    range: '251-290 ms',
    interpretation: 'Slower than a sharp personal day. Run the same baseline again before treating it as a trend.',
  },
  {
    band: 'Soft session',
    range: '> 290 ms',
    interpretation: 'A slow log on this hardware. Prefer a calm control drill over stacking high-arousal reps.',
  },
];

export const credibilityQuoteCards: CredibilityQuoteCard[] = [
  {
    role: 'Coach',
    quote: 'Use the first benchmark to decide whether today is a speed day or a control day.',
    name: 'Intended use',
    note: 'Illustrative coaching note. Not a real testimonial.',
  },
  {
    role: 'Player',
    quote: 'If today’s baseline is slower than yesterday, adjust the session instead of forcing peak reps.',
    name: 'Intended use',
    note: 'Illustrative athlete note. Not a real testimonial.',
  },
  {
    role: 'Gamer',
    quote: 'One minute tells you whether this device session is online before you queue.',
    name: 'Intended use',
    note: 'Illustrative competitor note. Not a real testimonial.',
  },
];

export const workflowSteps: WorkflowStep[] = [
  {
    title: '1) Benchmark in 60 seconds',
    body: 'Capture reaction speed and accuracy under controlled timing so each session starts with an objective baseline.',
  },
  {
    title: '2) Train the limiting signal',
    body: 'Choose a drill that matches your weakest output: raw speed, peripheral read, or pressure decisions.',
  },
  {
    title: '3) Review and recalibrate',
    body: 'Use score trend and miss profile to decide whether to increase pace, reinforce control, or run a calmer drill.',
  },
];

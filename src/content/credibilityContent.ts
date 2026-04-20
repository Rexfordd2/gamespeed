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

// Placeholder-only launch content. Replace with verified production metrics/testimonials.
export const socialProofStats: ProofStat[] = [
  { label: 'Average sessions per week (active users)', value: '4.1' },
  { label: 'Median readiness score lift after 14 days', value: '+11%' },
  { label: 'Users hitting 7-day streak in first month', value: '62%' },
];

// Placeholder testimonials for launch shell; replace with real, consented quotes.
export const socialProofTestimonials: SocialTestimonial[] = [
  {
    quote:
      'I use GameSpeed before training. It gets my eyes and first step online in one minute.',
    author: 'D. Reynolds',
    role: 'Semi-Pro Football Midfielder',
  },
  {
    quote:
      'The benchmark gives me a quick read on whether I should warm up longer before queueing ranked.',
    author: 'A. Kim',
    role: 'Immortal-Level FPS Player',
  },
  {
    quote:
      'The mode mix is what works. Benchmark for baseline, then decision drills when my reads feel slow.',
    author: 'J. Patel',
    role: 'Performance Coach',
  },
];

export const credibilityMetricCards: CredibilityMetricCard[] = [
  {
    metric: 'Average weekly check-ins: 4.3 sessions',
    evidence: '[Placeholder dataset, n=148 active users, Jan-Mar 2026]',
    context:
      'Users who complete a short benchmark before practice tend to keep more consistent warm-up habits.',
  },
  {
    metric: 'Median reaction improvement: -19 ms in 3 weeks',
    evidence: '[Placeholder benchmark trend, n=92 users, mixed athlete + gamer sample]',
    context: 'Most gains come from better repeatability, not one-off peak sessions.',
  },
  {
    metric: 'Accuracy stability: +7.6 percentage points',
    evidence: '[Placeholder analysis, rounds 1-12 compared to rounds 37-48]',
    context:
      'Speed gains hold better when users rotate between benchmark and focused drills.',
  },
];

export const scoreBands: ScoreBand[] = [
  {
    band: 'Readiness Band A',
    range: '< 215 ms',
    interpretation: 'High readiness. Keep intensity and protect consistency.',
  },
  {
    band: 'Readiness Band B',
    range: '215-250 ms',
    interpretation: 'Solid baseline. Focus on cleaner first-cue execution.',
  },
  {
    band: 'Readiness Band C',
    range: '251-290 ms',
    interpretation: 'Needs ramp-up. Run one benchmark plus two control drills.',
  },
  {
    band: 'Readiness Band D',
    range: '> 290 ms',
    interpretation: 'Recovery state. Prioritize timing and visual reset work.',
  },
];

// Placeholder testimonials for tone/structure only.
export const credibilityQuoteCards: CredibilityQuoteCard[] = [
  {
    role: 'Coach',
    quote: 'I use the first benchmark to decide if today is a speed day or a control day.',
    name: 'R. Ellis, Performance Coach',
    note: '[Placeholder testimonial: role and quote style only]',
  },
  {
    role: 'Player',
    quote:
      'The score trend keeps me honest. If my baseline drops, I adjust before high-pressure reps.',
    name: 'M. Torres, Club Athlete',
    note: '[Placeholder testimonial: role and quote style only]',
  },
  {
    role: 'Gamer',
    quote: 'One minute tells me if my aim is truly online or if I need more warm-up reps.',
    name: 'K. Shah, Competitive FPS Player',
    note: '[Placeholder testimonial: role and quote style only]',
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
    body: 'Use score trend and miss profile to decide whether to increase pace, reinforce control, or reset recovery.',
  },
];

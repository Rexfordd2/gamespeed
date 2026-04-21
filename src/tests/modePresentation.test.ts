import { describe, expect, it } from 'vitest';
import { getModePresentation } from '../utils/modeDescriptions';

describe('mode presentation copy', () => {
  it('returns sport-specific mode copy when an override exists', () => {
    const soccerQuickTap = getModePresentation('quickTap', 'soccer');

    expect(soccerQuickTap.sportLabel).toBe('First-pass trigger');
    expect(soccerQuickTap.sportDescription).toBe(
      'Match your first touch/pass release to the first open lane cue.',
    );
  });

  it('falls back to default mode copy when no sport override exists', () => {
    const boxingBenchmark = getModePresentation('reactionBenchmark', 'boxing');

    expect(boxingBenchmark.sportLabel).toBe('Baseline readiness snapshot');
    expect(boxingBenchmark.sportDescription).toBe(
      'Use this fixed protocol to compare day-to-day cue pickup, response timing, and composure.',
    );
  });
});

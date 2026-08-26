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

  it('returns defaults for newly added drills', () => {
    const calmFocus = getModePresentation('calmFocus', 'basketball');
    expect(calmFocus.sportLabel).toBe('Calm precision cadence');
    expect(calmFocus.trainingFocus).toContain('Mental solitude');
  });

  it('returns Macaw Scan presentation without clinical claims', () => {
    const macaw = getModePresentation('schulteScan', 'soccer');
    expect(macaw.title).toBe('Macaw Scan');
    expect(macaw.sportLabel).toBe('Visual search scan');
    expect(macaw.description).toContain('signal inside the noise');
    expect(macaw.whyThisMatters).not.toMatch(/diagnos/i);
  });

  it('returns Caiman Control presentation without treating it as a Quick Tap clone', () => {
    const caiman = getModePresentation('goNoGo', 'soccer');
    expect(caiman.title).toBe('Caiman Control');
    expect(caiman.description).toMatch(/hold/i);
    expect(caiman.whyThisMatters).toContain('react correctly');
    expect(caiman.tips.some(tip => /false start/i.test(tip))).toBe(true);
  });

  it('returns Mongoose Read presentation as choice reaction, not simple reaction', () => {
    const mongoose = getModePresentation('choiceReaction', 'soccer');
    expect(mongoose.title).toBe('Mongoose Read');
    expect(mongoose.sportLabel).toBe('Read then respond');
    expect(mongoose.description).toMatch(/choice-reaction/i);
    expect(mongoose.whyThisMatters).toContain('decision accuracy');
    expect(mongoose.whyThisMatters).not.toMatch(/diagnos/i);
  });
});

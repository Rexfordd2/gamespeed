import { describe, expect, it } from 'vitest';
import { getHoldTrackCueLabel, getSequenceCueLabels, getSwipeCueLabel } from '../utils/modeCueLanguage';

describe('modeCueLanguage', () => {
  it('returns sport-specific swipe cues', () => {
    expect(getSwipeCueLabel('boxing', 'left')).toBe('slip left');
    expect(getSwipeCueLabel('soccer', 'right')).toBe('inside carry');
  });

  it('builds a hold cue label from sport vocabulary', () => {
    expect(getHoldTrackCueLabel('volleyball')).toContain('block cue');
  });

  it('cycles sequence cue labels for longer rounds', () => {
    expect(getSequenceCueLabels('soccer', 5)).toEqual([
      'first touch cue',
      'press trigger',
      'passing lane read',
      'first touch cue',
      'press trigger',
    ]);
  });
});

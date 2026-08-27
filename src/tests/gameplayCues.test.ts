import { describe, expect, it } from 'vitest';
import { getGameplayCueSet, isCueTimingVisible } from '../utils/gameplayCues';

describe('gameplay cue mapping', () => {
  it('returns sport-specific cue copy for swipe drills', () => {
    const boxingCues = getGameplayCueSet('boxing', 'swipeStrike');
    const soccerCues = getGameplayCueSet('soccer', 'swipeStrike');

    expect(boxingCues.focus).toContain('opening cue');
    expect(boxingCues.tactical).toContain('slip left / slip right');
    expect(soccerCues.focus).toContain('first touch cue');
    expect(soccerCues.tactical).toContain('outside cut / inside carry');
  });

  it('maps hold track mode to hold-lock vocabulary', () => {
    const volleyballHoldCues = getGameplayCueSet('volleyball', 'holdTrack');
    expect(volleyballHoldCues.focus).toContain('block cue lock');
    expect(volleyballHoldCues.microHudLabel).toBe('Stability lane');
  });

  it('maps Chameleon Read to the process lane', () => {
    const cues = getGameplayCueSet('soccer', 'rapidComprehension');
    expect(cues.microHudLabel).toBe('Process lane');
  });
});

describe('gameplay cue visibility timing rules', () => {
  it('applies minimal intensity timing rules', () => {
    expect(isCueTimingVisible('minimal', 'preRound')).toBe(true);
    expect(isCueTimingVisible('minimal', 'alwaysVisible')).toBe(true);
    expect(isCueTimingVisible('minimal', 'phaseTriggered')).toBe(false);
    expect(isCueTimingVisible('minimal', 'streakTriggered')).toBe(false);
  });

  it('applies guided intensity timing rules', () => {
    expect(isCueTimingVisible('guided', 'preRound')).toBe(true);
    expect(isCueTimingVisible('guided', 'alwaysVisible')).toBe(true);
    expect(isCueTimingVisible('guided', 'phaseTriggered')).toBe(true);
    expect(isCueTimingVisible('guided', 'streakTriggered')).toBe(true);
  });
});

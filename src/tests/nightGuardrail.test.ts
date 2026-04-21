import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NIGHT_GUARDRAIL_SETTINGS,
  NightGuardrailSettings,
  isInBedtimeCutoffWindow,
  shouldUseLowStimulusMode,
} from '../utils/nightGuardrail';

const makeSettings = (overrides: Partial<NightGuardrailSettings> = {}): NightGuardrailSettings => ({
  ...DEFAULT_NIGHT_GUARDRAIL_SETTINGS,
  targetBedtime: '22:00',
  ...overrides,
});

describe('night guardrail timing', () => {
  it('returns true during the final two hours before bedtime', () => {
    const settings = makeSettings();
    expect(isInBedtimeCutoffWindow(settings, new Date('2026-04-20T20:15:00'))).toBe(true);
  });

  it('returns false before the cutoff window starts', () => {
    const settings = makeSettings();
    expect(isInBedtimeCutoffWindow(settings, new Date('2026-04-20T19:30:00'))).toBe(false);
  });

  it('applies low-stimulation mode only when competition toggle is enabled', () => {
    const now = new Date('2026-04-20T20:30:00');
    expect(shouldUseLowStimulusMode(makeSettings({ competitionTomorrow: false }), now)).toBe(false);
    expect(shouldUseLowStimulusMode(makeSettings({ competitionTomorrow: true }), now)).toBe(true);
  });
});

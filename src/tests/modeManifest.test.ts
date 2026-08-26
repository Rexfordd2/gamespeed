import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MODE_MANIFEST_ID,
  ModeManifestSeed,
  ModeManifest,
  defineModeManifest,
  getModeIconGlyph,
  getModeManifest,
  getSupportedModesForSport,
  hasModeAudioCueHook,
  hasModeCueTemplate,
  modeManifestRegistry,
  registerModeManifests,
  resolveModeAudioCueHook,
  resolveModeCueTemplate,
  resolveModeDifficultyPreset,
  resolveModeIcon,
  validateModeManifest,
} from '../config/modeManifest';

describe('mode manifest registration', () => {
  it('registers all live mode manifests without validation errors', () => {
    expect(modeManifestRegistry.registrationErrors).toEqual([]);
    expect(modeManifestRegistry.orderedIds).toContain('reactionBenchmark');
    expect(modeManifestRegistry.orderedIds).toContain('quickTap');
    expect(modeManifestRegistry.orderedIds).toContain('multiTarget');
    expect(modeManifestRegistry.orderedIds).toContain('swipeStrike');
    expect(modeManifestRegistry.orderedIds).toContain('holdTrack');
    expect(modeManifestRegistry.orderedIds).toContain('sequenceMemory');
    expect(modeManifestRegistry.orderedIds).toContain('peripheralPulse');
    expect(modeManifestRegistry.orderedIds).toContain('calmFocus');
    expect(modeManifestRegistry.orderedIds).toContain('schulteScan');
  });

  it('fails safely by skipping invalid manifests', () => {
    const validQuickTap: ModeManifest = getModeManifest('quickTap');
    const invalidManifest: ModeManifest = {
      ...validQuickTap,
      id: 'multiTarget',
      displayName: '',
      defaults: {
        ...validQuickTap.defaults,
        maxTargets: 0,
      },
    };

    const registry = registerModeManifests([validQuickTap, invalidManifest]);
    expect(registry.registrationErrors.length).toBeGreaterThan(0);
    expect(registry.byId.quickTap).toBeDefined();
    expect(registry.byId.multiTarget).toBeUndefined();
  });

  it('applies schema defaults through defineModeManifest', () => {
    const seed: ModeManifestSeed = {
      id: 'quickTap',
      displayName: 'Quick Tap',
      description: 'Explosive reaction drill.',
      availability: 'playable',
      category: 'drill',
      supportedSports: 'all',
      iconRef: 'quickTapBolt',
      gameplayMechanicType: 'tap',
      scoringModel: 'standardAccuracy',
      targetRendererKey: 'standardTarget',
      defaults: {
        maxTargets: 1,
        targetIntervalMs: 400,
        targetLifespanSeconds: 1.5,
        difficultyPreset: 'speed',
      },
    };

    const manifest = defineModeManifest(seed);
    expect(manifest.cueTemplates.focus).toBe('sequenceVocabularyFocus');
    expect(manifest.hudLayoutFlags.showProtocolPill).toBe(true);
    expect(manifest.audioCueHooks).toEqual({});
  });
});

describe('mode icon resolution', () => {
  it('resolves known icon glyphs', () => {
    expect(resolveModeIcon('quickTap')).toBe('⚡');
    expect(resolveModeIcon('swipeStrike')).toBe('↔');
  });

  it('falls back to default glyph for unknown icon refs', () => {
    expect(getModeIconGlyph(undefined)).toBe('•');
  });
});

describe('sport support filtering', () => {
  it('returns sport-supported modes for a valid sport', () => {
    const modes = getSupportedModesForSport('soccer');
    expect(modes).toContain('quickTap');
    expect(modes).toContain('sequenceMemory');
  });

  it('filters out modes not registered for a sport', () => {
    const quickTap = getModeManifest('quickTap');
    const holdTrack = getModeManifest('holdTrack');
    const scopedRegistry = registerModeManifests([
      { ...quickTap, supportedSports: ['soccer'] },
      { ...holdTrack, supportedSports: ['boxing'] },
    ]);
    const soccerModes = scopedRegistry.orderedIds.filter(modeId => {
      const supportedSports = scopedRegistry.byId[modeId].supportedSports;
      return supportedSports === 'all' || supportedSports.includes('soccer');
    });
    expect(soccerModes).toEqual(['quickTap']);
  });
});

describe('cue and audio hooks', () => {
  it('marks swipe and hold hooks as available by manifest', () => {
    expect(hasModeCueTemplate('swipeStrike', 'swipeDirectionPair')).toBe(true);
    expect(hasModeAudioCueHook('swipeStrike', 'onSwipeSpawnByDirection')).toBe(true);
    expect(hasModeAudioCueHook('holdTrack', 'onHoldStart')).toBe(true);
    expect(hasModeAudioCueHook('quickTap', 'onHoldStart')).toBe(false);
  });

  it('exposes sequence phase audio hook availability', () => {
    expect(hasModeAudioCueHook('sequenceMemory', 'sequencePhase')).toBe(true);
  });

  it('resolves cue templates and audio hooks from manifest entries', () => {
    expect(resolveModeCueTemplate('swipeStrike', 'tactical')).toBe('swipeDirectionPair');
    expect(resolveModeCueTemplate('holdTrack', 'focus')).toBe('holdTrackLock');
    expect(resolveModeAudioCueHook('holdTrack', 'onHoldStart')).toBe('hold-lock');
    expect(resolveModeAudioCueHook('sequenceMemory', 'sequencePhase')).toEqual({
      preview: 'sequence-preview',
      input: 'sequence-input',
      success: 'sequence-success',
      failure: 'sequence-fail',
    });
  });
});

describe('manifest validation', () => {
  it('rejects incomplete manifests', () => {
    const partialManifest = {
      ...getModeManifest('quickTap'),
      displayName: '',
      cueTemplates: {
        ...getModeManifest('quickTap').cueTemplates,
        tactical: '' as never,
      },
    };
    const validation = validateModeManifest(partialManifest);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('falls back safely when manifest lookup misses', () => {
    const missingMode = 'missing-mode' as never;
    const fallbackManifest = getModeManifest(missingMode);
    expect(fallbackManifest.id).toBe(DEFAULT_MODE_MANIFEST_ID);
    expect(resolveModeDifficultyPreset(missingMode)).toBe(getModeManifest('quickTap').defaults.difficultyPreset);
  });
});

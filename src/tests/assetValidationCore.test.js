import { describe, expect, it } from 'vitest';
import { validateAssetMap } from '../../scripts/assetValidationCore.js';

const baseAssetMap = {
  naming: {
    fileNamePattern: '^[a-z0-9]+(?:-[a-z0-9]+)*\\.(svg|mp3)$',
  },
  sports: ['soccer'],
  modes: ['quickTap'],
  groups: {
    sportIcons: [{ id: 'soccer', file: 'sport-icons/soccer.svg', required: true }],
    modeIcons: [{ id: 'quick-tap', file: 'mode-icons/quick-tap.svg', fallbackGlyph: '⚡', required: false }],
    targetSkins: [{ id: 'soccer-default', file: 'target-skins/soccer-default.svg', required: false }],
    hudBadges: [{ id: 'score', file: 'hud-badges/score.svg', required: false }],
    audioCues: [
      { id: 'target-hit', channel: 'mode', cueKey: 'swipe-left', file: 'audio-cues/mode/swipe-left.mp3', required: false },
    ],
    sharedVisuals: [],
  },
  references: {
    sportToSportIcon: { soccer: 'soccer' },
    sportToTargetSkin: { soccer: 'soccer-default' },
    modeToModeIcon: { quickTap: 'quick-tap' },
    modeToAudioCues: { quickTap: ['mode:swipe-left'] },
  },
  supportedFormats: {
    sportIcons: ['svg'],
    modeIcons: ['svg'],
    targetSkins: ['svg'],
    hudBadges: ['svg'],
    audioCues: ['mp3'],
  },
};

describe('asset validation core', () => {
  it('flags missing required assets', () => {
    const result = validateAssetMap({
      assetMap: baseAssetMap,
      existingFiles: new Set(),
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.includes('missing required'))).toBe(true);
  });

  it('flags invalid file names and missing references', () => {
    const brokenMap = {
      ...baseAssetMap,
      groups: {
        ...baseAssetMap.groups,
        modeIcons: [{ id: 'quick-tap', file: 'mode-icons/QuickTap.svg', required: false }],
      },
      references: {
        ...baseAssetMap.references,
        modeToAudioCues: { quickTap: ['mode:missing-cue'] },
      },
    };

    const result = validateAssetMap({
      assetMap: brokenMap,
      existingFiles: new Set(['sport-icons/soccer.svg', 'mode-icons/QuickTap.svg']),
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some(error => error.includes('invalid file name'))).toBe(true);
    expect(result.errors.some(error => error.includes('unknown audio cue'))).toBe(true);
  });
});

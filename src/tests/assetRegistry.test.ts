import { describe, expect, it } from 'vitest';
import {
  contractorAssetMap,
  resolveAudioCueAsset,
  resolveModeIconAsset,
  resolveSportIconAssetPath,
  resolveSportIconFallbackPath,
  resolveTargetSkinFallbackPath,
  resolveTargetSkinPath,
  resolveTargetSkinAssetPath,
} from '../config/assetRegistry';

describe('asset registry', () => {
  it('keeps map references complete for every sport and mode', () => {
    const sports = Object.keys(contractorAssetMap.references.sportToSportIcon) as Array<
      keyof typeof contractorAssetMap.references.sportToSportIcon
    >;
    sports.forEach(sport => {
      expect(contractorAssetMap.references.sportToSportIcon[sport]).toBeTruthy();
      expect(contractorAssetMap.references.sportToTargetSkin[sport]).toBeTruthy();
    });

    const modes = Object.keys(contractorAssetMap.references.modeToModeIcon) as Array<
      keyof typeof contractorAssetMap.references.modeToModeIcon
    >;
    modes.forEach(mode => {
      expect(contractorAssetMap.references.modeToModeIcon[mode]).toBeTruthy();
      expect(contractorAssetMap.references.modeToAudioCues[mode]).toBeDefined();
    });
  });

  it('resolves target skins and fallback paths for all sports', () => {
    const sports = Object.keys(contractorAssetMap.references.sportToSportIcon) as Array<
      keyof typeof contractorAssetMap.references.sportToSportIcon
    >;
    sports.forEach(sport => {
      expect(resolveTargetSkinPath(sport)).toContain('/assets/');
      expect(resolveTargetSkinFallbackPath(sport)).toContain('/assets/');
      expect(resolveSportIconAssetPath(sport)).toContain('/assets/');
      expect(resolveSportIconFallbackPath(sport)).toContain('/assets/');
    });
  });

  it('falls back safely when explicit icon ids are missing', () => {
    expect(
      resolveSportIconAssetPath('soccer', {
        assetId: 'missing-sport-icon',
      }),
    ).toBe(resolveSportIconFallbackPath('soccer'));
    expect(
      resolveTargetSkinAssetPath('soccer', {
        assetId: 'missing-target-skin',
      }),
    ).toBe(resolveTargetSkinFallbackPath('soccer'));
  });

  it('exposes mode icon fallback glyphs and audio fallback sources', () => {
    const modeIcon = resolveModeIconAsset('quickTap');
    expect(modeIcon.fallbackGlyph).toBeTruthy();

    const audioCue = resolveAudioCueAsset('mode', 'swipe-left');
    expect(audioCue.src).toContain('/assets/');
    expect(audioCue.fallbackSrc).toContain('/assets/');
  });
});

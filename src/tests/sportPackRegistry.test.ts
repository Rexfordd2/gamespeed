import { describe, expect, it } from 'vitest';
import { DEFAULT_SPORT, getSportPack, resolveSportType } from '../config/sports';
import { getSportPackAssets } from '../config/sportPacks';
import {
  resolveSportIconFallbackPath,
  resolveTargetSkinFallbackPath,
} from '../config/assetRegistry';

describe('sport pack registry', () => {
  it('resolves missing asset references to a safe fallback', () => {
    const soccerPack = getSportPack('soccer');
    const brokenPack = {
      ...soccerPack,
      iconSet: {
        sport: {
          assetId: 'missing-sport-icon-id',
        },
        targetSkin: {
          assetId: 'missing-target-skin-id',
        },
      },
    };
    const resolvedAssets = getSportPackAssets(brokenPack);
    expect(resolvedAssets.sportIcon).toBe(resolveSportIconFallbackPath('soccer'));
    expect(resolvedAssets.targetIcon).toBe(resolveTargetSkinFallbackPath('soccer'));
  });

  it('keeps required sport packs complete', () => {
    const requiredSports = [
      'soccer',
      'volleyball',
      'boxing',
      'baseball_softball',
      'racquet',
      'basketball',
    ] as const;

    requiredSports.forEach(sport => {
      const pack = getSportPack(sport);
      expect(pack.displayName.length).toBeGreaterThan(0);
      expect(pack.accentTokens.primary.length).toBeGreaterThan(0);
      expect(pack.iconSet.sport.assetId).toBeTruthy();
      expect(pack.iconSet.targetSkin.assetId).toBeTruthy();
      expect(pack.cueVocabulary.sequence.length).toBeGreaterThan(0);
      expect(pack.hudLabels.score.length).toBeGreaterThan(0);
      expect(pack.hudLabels.streak.length).toBeGreaterThan(0);
      expect(pack.howToCopy.intro.length).toBeGreaterThan(0);
      expect(pack.runwayCopy.cueReviewChecklist.length).toBeGreaterThan(0);
      expect(pack.defaultRecommendedModes.length).toBeGreaterThan(0);
    });
  });

  it('falls back to default icon when a sport icon is missing', () => {
    const soccerPack = getSportPack('soccer');
    const brokenPack = {
      ...soccerPack,
      iconSet: {
        ...soccerPack.iconSet,
        sport: {
          assetId: 'missing-sport-icon-id',
        },
      },
    };

    const resolvedAssets = getSportPackAssets(brokenPack);
    expect(resolvedAssets.sportIcon).toBe(resolveSportIconFallbackPath('soccer'));
    expect(resolvedAssets.sportIconFallback).toBe(resolveSportIconFallbackPath('soccer'));
  });

  it('preserves default sport behavior for unknown selections', () => {
    expect(resolveSportType(undefined)).toBe(DEFAULT_SPORT);
    expect(resolveSportType('unknown-sport')).toBe(DEFAULT_SPORT);
    expect(getSportPack(DEFAULT_SPORT).id).toBe(DEFAULT_SPORT);
  });
});


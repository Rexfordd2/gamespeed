import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SPORT,
  SPORT_SELECTION_STORAGE_KEY,
  getSportConfig,
  loadSelectedSport,
  resolveSportType,
  saveSelectedSport,
} from '../config/sports';

describe('sport config resolution', () => {
  afterEach(() => {
    localStorage.removeItem(SPORT_SELECTION_STORAGE_KEY);
  });

  it('returns default sport for unknown keys', () => {
    expect(resolveSportType('not-a-real-sport')).toBe(DEFAULT_SPORT);
    expect(resolveSportType(null)).toBe(DEFAULT_SPORT);
  });

  it('loads default sport when storage is empty', () => {
    expect(loadSelectedSport()).toBe(DEFAULT_SPORT);
  });

  it('loads a stored sport key when valid', () => {
    localStorage.setItem(SPORT_SELECTION_STORAGE_KEY, 'boxing');
    expect(loadSelectedSport()).toBe('boxing');
  });

  it('saves and resolves selected sport from storage', () => {
    saveSelectedSport('volleyball');
    expect(loadSelectedSport()).toBe('volleyball');
  });

  it('exposes required sport config fields', () => {
    const soccerConfig = getSportConfig('soccer');
    expect(soccerConfig.displayName).toBe('Soccer');
    expect(soccerConfig.cueVocabulary.length).toBeGreaterThan(0);
    expect(soccerConfig.defaultRecommendedModes.length).toBeGreaterThan(0);
    expect(soccerConfig.readinessCopy.heroTitle.length).toBeGreaterThan(0);
  });
});

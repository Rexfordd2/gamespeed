import { afterEach, describe, expect, it } from 'vitest';
import {
  ATHLETE_POSITION_STORAGE_KEY,
  GENERAL_POSITION,
  clearAthletePositions,
  getPositionsForSport,
  loadAthletePosition,
  resolvePositionId,
  saveAthletePosition,
} from '../config/athletePositions';
import { SPORT_ORDER } from '../config/sports';

describe('athlete positions', () => {
  afterEach(() => {
    clearAthletePositions();
  });

  it('includes general plus sport-specific roles for every supported sport', () => {
    SPORT_ORDER.forEach(sport => {
      const positions = getPositionsForSport(sport);
      expect(positions[0]?.id).toBe(GENERAL_POSITION);
      expect(positions.length).toBeGreaterThan(1);
    });
    expect(getPositionsForSport('football').map(item => item.id)).toEqual([
      'general',
      'qb',
      'wr_te',
      'rb',
      'ol',
      'dl',
      'lb',
      'db',
      'specialist',
    ]);
    expect(getPositionsForSport('basketball').map(item => item.id)).toEqual(['general', 'guard', 'wing', 'big']);
    expect(getPositionsForSport('baseball_softball').map(item => item.id)).toEqual([
      'general',
      'hitter',
      'pitcher',
      'infielder',
      'outfielder',
      'catcher',
    ]);
    expect(getPositionsForSport('soccer').map(item => item.id)).toEqual([
      'general',
      'keeper',
      'defender',
      'midfielder',
      'forward',
    ]);
  });

  it('falls back to general for missing or invalid positions', () => {
    expect(resolvePositionId('football', undefined)).toBe(GENERAL_POSITION);
    expect(resolvePositionId('football', 'quarterback')).toBe(GENERAL_POSITION);
    expect(resolvePositionId('soccer', 'qb')).toBe(GENERAL_POSITION);
    expect(loadAthletePosition('football')).toBe(GENERAL_POSITION);
  });

  it('persists position per sport so a football QB is not reused on soccer', () => {
    saveAthletePosition('football', 'qb');
    saveAthletePosition('soccer', 'forward');
    expect(loadAthletePosition('football')).toBe('qb');
    expect(loadAthletePosition('soccer')).toBe('forward');
    expect(loadAthletePosition('basketball')).toBe(GENERAL_POSITION);
    expect(JSON.parse(localStorage.getItem(ATHLETE_POSITION_STORAGE_KEY) ?? '{}')).toMatchObject({
      football: 'qb',
      soccer: 'forward',
    });
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import {
  ATHLETE_HOUZE_HANDOFF_STORAGE_KEY,
  readAthleteHouzeHandoff,
  resolveAthleteHouzeReturnUrl,
} from '../utils/athleteHouzeHandoff';

describe('Athlete Houze handoff', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('ignores entries without the athlete-houze source', () => {
    expect(readAthleteHouzeHandoff('')).toBeNull();
    expect(readAthleteHouzeHandoff('?source=instagram')).toBeNull();
    expect(sessionStorage.getItem(ATHLETE_HOUZE_HANDOFF_STORAGE_KEY)).toBeNull();
  });

  it('detects ?source=athlete-houze and defaults to the hard-coded origin', () => {
    expect(readAthleteHouzeHandoff('?source=athlete-houze')).toEqual({
      source: 'athlete-houze',
      returnUrl: 'https://athletehouze.com/',
    });
  });

  it('keeps the handoff for the tab session after the query string is gone', () => {
    readAthleteHouzeHandoff('?source=athlete-houze&return_to=/athletes/me');
    expect(readAthleteHouzeHandoff('')).toEqual({
      source: 'athlete-houze',
      returnUrl: 'https://athletehouze.com/athletes/me',
    });
  });

  it('re-validates a tampered stored return URL', () => {
    sessionStorage.setItem(
      ATHLETE_HOUZE_HANDOFF_STORAGE_KEY,
      JSON.stringify({ source: 'athlete-houze', returnUrl: 'https://evil.example/' }),
    );
    expect(readAthleteHouzeHandoff('')?.returnUrl).toBe('https://athletehouze.com/');
  });

  it.each([
    'https://evil.example/',
    '//evil.example/path',
    'http://athletehouze.com/',
    'https://athletehouze.com.evil.example/',
    'https://user:pass@athletehouze.com/',
    'javascript:alert(1)',
    'data:text/html,hi',
  ])('rejects return target %s', candidate => {
    expect(resolveAthleteHouzeReturnUrl(candidate)).toBe('https://athletehouze.com/');
  });

  it('accepts paths on the allowed origin', () => {
    expect(resolveAthleteHouzeReturnUrl('/dashboard?tab=gamespeed')).toBe(
      'https://athletehouze.com/dashboard?tab=gamespeed',
    );
    expect(resolveAthleteHouzeReturnUrl('https://athletehouze.com/x')).toBe('https://athletehouze.com/x');
  });
});

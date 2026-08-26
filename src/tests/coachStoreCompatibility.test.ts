import { beforeEach, describe, expect, it } from 'vitest';
import { COACH_STORE_STORAGE_KEY, clearCoachStore, loadCoachStore } from '../utils/coachStore';

describe('coach store local persistence compatibility', () => {
  beforeEach(() => {
    clearCoachStore();
  });

  it('normalizes legacy athlete records while staying local-first', () => {
    localStorage.setItem(
      COACH_STORE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        athletes: [
          {
            id: 'legacy-athlete',
            name: ' Legacy Player ',
            sport: 'unknown-sport',
            createdAt: Date.UTC(2026, 3, 1),
            updatedAt: Date.UTC(2026, 3, 2),
          },
        ],
      }),
    );

    const store = loadCoachStore();
    const athlete = store.athletes[0];

    expect(store.version).toBe(1);
    expect(store.athletes).toHaveLength(1);
    expect(athlete.name).toBe('Legacy Player');
    expect(athlete.sport).toBe('soccer');
    expect(athlete.runwayCompletions).toEqual([]);
    expect(athlete.gameSessions).toEqual([]);
    expect(athlete.sleepCheckIns).toEqual([]);
    expect(athlete.challengeProgress.noScroll7Day.completedUnits).toEqual([]);
    expect(athlete.challengeProgress.runwayCompletion.completedUnits).toEqual([]);
  });

  it('returns an empty store for malformed payloads', () => {
    localStorage.setItem(COACH_STORE_STORAGE_KEY, JSON.stringify({ version: 0, athletes: 'bad-shape' }));
    const store = loadCoachStore();
    expect(store.version).toBe(1);
    expect(store.athletes).toHaveLength(0);
  });
});

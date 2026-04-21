import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearCoachStore,
  loadCoachStore,
  recordCoachChallengeCompletion,
  upsertCoachAthlete,
} from '../utils/coachStore';

describe('coach challenge completion logic', () => {
  beforeEach(() => {
    clearCoachStore();
  });

  it('counts one no-scroll completion per day', () => {
    const store = upsertCoachAthlete({
      name: 'Ari',
      sport: 'volleyball',
    });
    const athleteId = store.athletes[0].id;

    recordCoachChallengeCompletion(athleteId, 'noScroll7Day', Date.UTC(2026, 3, 20, 8, 0, 0));
    recordCoachChallengeCompletion(athleteId, 'noScroll7Day', Date.UTC(2026, 3, 20, 17, 0, 0));

    const updated = loadCoachStore().athletes[0];
    expect(updated.challengeProgress.noScroll7Day.completedUnits).toHaveLength(1);
  });

  it('marks no-scroll challenge complete after 7 unique days', () => {
    const store = upsertCoachAthlete({
      name: 'Nia',
      sport: 'soccer',
    });
    const athleteId = store.athletes[0].id;

    for (let day = 0; day < 7; day += 1) {
      recordCoachChallengeCompletion(athleteId, 'noScroll7Day', Date.UTC(2026, 3, 20 + day, 8, 0, 0));
    }

    const updated = loadCoachStore().athletes[0];
    expect(updated.challengeProgress.noScroll7Day.completedUnits).toHaveLength(7);
    expect(updated.challengeProgress.noScroll7Day.completedAt).toBeDefined();
  });
});

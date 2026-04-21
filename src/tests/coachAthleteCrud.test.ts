import { beforeEach, describe, expect, it } from 'vitest';
import { clearCoachStore, loadCoachStore, upsertCoachAthlete } from '../utils/coachStore';

describe('coach athlete creation and editing', () => {
  beforeEach(() => {
    clearCoachStore();
  });

  it('creates an athlete locally', () => {
    upsertCoachAthlete({
      name: 'Maya',
      sport: 'soccer',
    });

    const store = loadCoachStore();
    expect(store.athletes).toHaveLength(1);
    expect(store.athletes[0].name).toBe('Maya');
    expect(store.athletes[0].sport).toBe('soccer');
  });

  it('edits an existing athlete', () => {
    const created = upsertCoachAthlete({
      name: 'Rico',
      sport: 'boxing',
    });
    const athlete = created.athletes[0];

    upsertCoachAthlete({
      id: athlete.id,
      name: 'Rico Jr',
      sport: 'racquet',
    });

    const store = loadCoachStore();
    expect(store.athletes).toHaveLength(1);
    expect(store.athletes[0].name).toBe('Rico Jr');
    expect(store.athletes[0].sport).toBe('racquet');
  });
});

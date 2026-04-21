import { beforeEach, describe, expect, it } from 'vitest';
import {
  SLEEP_CHECKIN_STORAGE_KEY,
  clearSleepCheckIns,
  getLatestSleepCheckIn,
  loadSleepCheckIns,
  recordSleepCheckIn,
} from '../utils/sleepCheckIn';

describe('sleep check-in persistence', () => {
  beforeEach(() => {
    clearSleepCheckIns();
  });

  it('stores and retrieves sleep check-ins locally', () => {
    recordSleepCheckIn({
      wentToBedOnTime: 'yes',
      readiness: 4,
      ts: 1_700_000_000_000,
    });

    const store = loadSleepCheckIns();
    expect(store.checkIns).toHaveLength(1);
    expect(store.checkIns[0].wentToBedOnTime).toBe('yes');
    expect(store.checkIns[0].readiness).toBe(4);
    expect(getLatestSleepCheckIn()?.ts).toBe(1_700_000_000_000);
  });

  it('clears check-ins from local storage', () => {
    recordSleepCheckIn({
      wentToBedOnTime: 'no',
      readiness: 2,
    });
    clearSleepCheckIns();
    expect(loadSleepCheckIns().checkIns).toHaveLength(0);
    expect(localStorage.getItem(SLEEP_CHECKIN_STORAGE_KEY)).toBeNull();
  });
});

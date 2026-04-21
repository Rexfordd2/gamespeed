export const SLEEP_CHECKIN_STORAGE_KEY = 'gamespeed_sleep_checkins_v1';
const MAX_CHECKINS = 30;

export type SleepOnTimeAnswer = 'yes' | 'no';

export interface SleepCheckInRecord {
  id: string;
  ts: number;
  wentToBedOnTime: SleepOnTimeAnswer;
  readiness: 1 | 2 | 3 | 4 | 5;
}

interface SleepCheckInStore {
  version: 1;
  checkIns: SleepCheckInRecord[];
}

export interface RecordSleepCheckInInput {
  wentToBedOnTime: SleepOnTimeAnswer;
  readiness: 1 | 2 | 3 | 4 | 5;
  ts?: number;
}

const createRecordId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const emptyStore = (): SleepCheckInStore => ({
  version: 1,
  checkIns: [],
});

export const loadSleepCheckIns = (): SleepCheckInStore => {
  try {
    const raw = localStorage.getItem(SLEEP_CHECKIN_STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as SleepCheckInStore;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.version !== 1 ||
      !Array.isArray(parsed.checkIns)
    ) {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
};

const saveSleepCheckIns = (store: SleepCheckInStore) => {
  try {
    localStorage.setItem(SLEEP_CHECKIN_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage failures.
  }
};

export const recordSleepCheckIn = (input: RecordSleepCheckInInput): SleepCheckInRecord => {
  const record: SleepCheckInRecord = {
    id: createRecordId(),
    ts: input.ts ?? Date.now(),
    wentToBedOnTime: input.wentToBedOnTime,
    readiness: input.readiness,
  };
  const current = loadSleepCheckIns();
  const checkIns = [...current.checkIns, record].slice(-MAX_CHECKINS);
  saveSleepCheckIns({
    version: 1,
    checkIns,
  });
  return record;
};

export const getLatestSleepCheckIn = () => {
  const store = loadSleepCheckIns();
  if (store.checkIns.length === 0) return null;
  return store.checkIns[store.checkIns.length - 1];
};

export const clearSleepCheckIns = () => {
  try {
    localStorage.removeItem(SLEEP_CHECKIN_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

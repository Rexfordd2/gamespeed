import { SportType } from '../config/sports';
import { RunwayPhaseId, RunwayPresetMinutes } from './runwayPlan';

const RUNWAY_ANALYTICS_STORAGE_KEY = 'gamespeed_runway_analytics_v1';
const CURRENT_VERSION = 1;
const MAX_COMPLETIONS = 100;

export interface RunwayPhaseCompletion {
  id: RunwayPhaseId;
  durationSeconds: number;
}

export interface RunwayCompletionRecord {
  id: string;
  ts: number;
  isoTime: string;
  sport: SportType;
  presetMinutes: RunwayPresetMinutes;
  totalDurationSeconds: number;
  phases: RunwayPhaseCompletion[];
}

export interface RunwayAnalyticsStore {
  version: number;
  completions: RunwayCompletionRecord[];
}

export interface RecordRunwayCompletionInput {
  sport: SportType;
  presetMinutes: RunwayPresetMinutes;
  totalDurationSeconds: number;
  phases: RunwayPhaseCompletion[];
  ts?: number;
}

const makeRecordId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const emptyStore = (): RunwayAnalyticsStore => ({
  version: CURRENT_VERSION,
  completions: [],
});

export const loadRunwayAnalytics = (): RunwayAnalyticsStore => {
  try {
    const raw = localStorage.getItem(RUNWAY_ANALYTICS_STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as RunwayAnalyticsStore;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      parsed.version !== CURRENT_VERSION ||
      !Array.isArray(parsed.completions)
    ) {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
};

const saveRunwayAnalytics = (store: RunwayAnalyticsStore) => {
  try {
    localStorage.setItem(RUNWAY_ANALYTICS_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage failures.
  }
};

export const recordRunwayCompletion = (input: RecordRunwayCompletionInput): RunwayCompletionRecord => {
  const nowTs = input.ts ?? Date.now();
  const record: RunwayCompletionRecord = {
    id: makeRecordId(),
    ts: nowTs,
    isoTime: new Date(nowTs).toISOString(),
    sport: input.sport,
    presetMinutes: input.presetMinutes,
    totalDurationSeconds: input.totalDurationSeconds,
    phases: input.phases,
  };

  const current = loadRunwayAnalytics();
  const nextCompletions = [...current.completions, record].slice(-MAX_COMPLETIONS);
  saveRunwayAnalytics({
    version: CURRENT_VERSION,
    completions: nextCompletions,
  });

  return record;
};

export const clearRunwayAnalytics = () => {
  try {
    localStorage.removeItem(RUNWAY_ANALYTICS_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export const getLatestRunwayCompletion = (): RunwayCompletionRecord | null => {
  const store = loadRunwayAnalytics();
  if (store.completions.length === 0) {
    return null;
  }
  return store.completions[store.completions.length - 1];
};

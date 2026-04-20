import { LandingExperimentVariantId } from '../config/landingExperiment';

const ANALYTICS_STORAGE_KEY = 'gamespeed_conversion_events_v1';

export type ConversionEventName =
  | 'hero_cta_click'
  | 'persona_selected'
  | 'test_start'
  | 'test_completion'
  | 'first_test_start'
  | 'first_test_completion'
  | 'results_view'
  | 'signup_prompt_shown'
  | 'signup_after_first_session'
  | 'share_score_click'
  | 'return_visit'
  | 'streak_start'
  | 'landing_experiment_exposure';

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ConversionEventRecord {
  id: string;
  name: ConversionEventName;
  ts: number;
  isoTime: string;
  deviceType: DeviceType;
  environment: string;
  mode: string;
  host: string;
  path: string;
  experimentVariant: LandingExperimentVariantId | 'unknown';
  payload: Record<string, unknown>;
}

const getDeviceType = (): DeviceType => {
  const ua = navigator.userAgent.toLowerCase();
  if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(ua)) {
    return 'tablet';
  }
  if (/(mobi|iphone|ipod|android)/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

const getEnvironment = (): string => {
  const explicit = import.meta.env.VITE_APP_ENV?.trim();
  if (explicit) {
    return explicit;
  }
  return import.meta.env.MODE;
};

const makeEventId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

const readStoredEvents = (): ConversionEventRecord[] => {
  try {
    const raw = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ConversionEventRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredEvents = (events: ConversionEventRecord[]) => {
  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage failures.
  }
};

const dispatchBrowserEvent = (eventRecord: ConversionEventRecord) => {
  window.dispatchEvent(new CustomEvent('gamespeed:conversion-event', { detail: eventRecord }));
};

const forwardToDataLayer = (eventRecord: ConversionEventRecord) => {
  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({
      event: eventRecord.name,
      ...eventRecord,
    });
  }
};

const installDebugApi = () => {
  if (window.__gamespeedAnalytics) {
    return;
  }
  window.__gamespeedAnalytics = {
    read: () => readStoredEvents(),
    clear: () => writeStoredEvents([]),
    summaryBy: (dimension: 'name' | 'deviceType' | 'environment' | 'experimentVariant') => {
      const counts = new Map<string, number>();
      for (const event of readStoredEvents()) {
        const key = String(event[dimension]);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
    },
  };
};

export const trackConversionEvent = (
  name: ConversionEventName,
  payload: Record<string, unknown> = {},
) => {
  const eventRecord: ConversionEventRecord = {
    id: makeEventId(),
    name,
    ts: Date.now(),
    isoTime: new Date().toISOString(),
    deviceType: getDeviceType(),
    environment: getEnvironment(),
    mode: import.meta.env.MODE,
    host: window.location.host,
    path: window.location.pathname,
    experimentVariant:
      (payload.experimentVariant as LandingExperimentVariantId | undefined) ?? 'unknown',
    payload,
  };

  const nextEvents = [...readStoredEvents(), eventRecord];
  writeStoredEvents(nextEvents);
  dispatchBrowserEvent(eventRecord);
  forwardToDataLayer(eventRecord);

  installDebugApi();
  return eventRecord;
};

installDebugApi();

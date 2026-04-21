export const NIGHT_GUARDRAIL_STORAGE_KEY = 'gamespeed_night_guardrail_v1';
export const NIGHT_GUARDRAIL_RUNTIME_STORAGE_KEY = 'gamespeed_night_guardrail_runtime_v1';
export const DEFAULT_TARGET_BEDTIME = '22:30';
const PRE_BED_WINDOW_HOURS = 2;

export type ReminderPreference = 'off' | 'inApp';

export interface NightGuardrailSettings {
  targetBedtime: string;
  competitionTomorrow: boolean;
  reminderPreference: ReminderPreference;
  includeBreathingRoutine: boolean;
}

interface NightGuardrailRuntime {
  lastReminderBedtimeKey: string | null;
}

export const DEFAULT_NIGHT_GUARDRAIL_SETTINGS: NightGuardrailSettings = {
  targetBedtime: DEFAULT_TARGET_BEDTIME,
  competitionTomorrow: false,
  reminderPreference: 'inApp',
  includeBreathingRoutine: true,
};

const DEFAULT_RUNTIME: NightGuardrailRuntime = {
  lastReminderBedtimeKey: null,
};

const parseTime = (value: string) => {
  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return { hours, minutes };
};

const withClock = (date: Date, time: { hours: number; minutes: number }) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    time.hours,
    time.minutes,
    0,
    0,
  );

const getBedtimeKey = (bedtimeAt: Date) => bedtimeAt.toISOString().slice(0, 16);

const isValidReminderPreference = (value: unknown): value is ReminderPreference =>
  value === 'off' || value === 'inApp';

const saveRuntime = (runtime: NightGuardrailRuntime) => {
  try {
    localStorage.setItem(NIGHT_GUARDRAIL_RUNTIME_STORAGE_KEY, JSON.stringify(runtime));
  } catch {
    // Ignore storage failures.
  }
};

const loadRuntime = (): NightGuardrailRuntime => {
  try {
    const raw = localStorage.getItem(NIGHT_GUARDRAIL_RUNTIME_STORAGE_KEY);
    if (!raw) return DEFAULT_RUNTIME;
    const parsed = JSON.parse(raw) as NightGuardrailRuntime;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      ('lastReminderBedtimeKey' in parsed && parsed.lastReminderBedtimeKey !== null && typeof parsed.lastReminderBedtimeKey !== 'string')
    ) {
      return DEFAULT_RUNTIME;
    }
    return {
      lastReminderBedtimeKey:
        typeof parsed.lastReminderBedtimeKey === 'string' ? parsed.lastReminderBedtimeKey : null,
    };
  } catch {
    return DEFAULT_RUNTIME;
  }
};

export const loadNightGuardrailSettings = (): NightGuardrailSettings => {
  try {
    const raw = localStorage.getItem(NIGHT_GUARDRAIL_STORAGE_KEY);
    if (!raw) return DEFAULT_NIGHT_GUARDRAIL_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<NightGuardrailSettings>;
    if (typeof parsed !== 'object' || parsed === null) {
      return DEFAULT_NIGHT_GUARDRAIL_SETTINGS;
    }
    const parsedBedtime =
      typeof parsed.targetBedtime === 'string' && parseTime(parsed.targetBedtime)
        ? parsed.targetBedtime
        : DEFAULT_TARGET_BEDTIME;
    return {
      targetBedtime: parsedBedtime,
      competitionTomorrow:
        typeof parsed.competitionTomorrow === 'boolean'
          ? parsed.competitionTomorrow
          : DEFAULT_NIGHT_GUARDRAIL_SETTINGS.competitionTomorrow,
      reminderPreference: isValidReminderPreference(parsed.reminderPreference)
        ? parsed.reminderPreference
        : DEFAULT_NIGHT_GUARDRAIL_SETTINGS.reminderPreference,
      includeBreathingRoutine:
        typeof parsed.includeBreathingRoutine === 'boolean'
          ? parsed.includeBreathingRoutine
          : DEFAULT_NIGHT_GUARDRAIL_SETTINGS.includeBreathingRoutine,
    };
  } catch {
    return DEFAULT_NIGHT_GUARDRAIL_SETTINGS;
  }
};

export const saveNightGuardrailSettings = (settings: NightGuardrailSettings) => {
  try {
    localStorage.setItem(NIGHT_GUARDRAIL_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures.
  }
};

export const getNextBedtime = (
  bedtime: string,
  now: Date,
): Date => {
  const parsed = parseTime(bedtime) ?? parseTime(DEFAULT_TARGET_BEDTIME)!;
  const todayBedtime = withClock(now, parsed);
  if (todayBedtime.getTime() > now.getTime()) {
    return todayBedtime;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return withClock(tomorrow, parsed);
};

export const getTonightBedtime = (bedtime: string, now: Date): Date => {
  const parsed = parseTime(bedtime) ?? parseTime(DEFAULT_TARGET_BEDTIME)!;
  return withClock(now, parsed);
};

export const isInBedtimeCutoffWindow = (
  settings: Pick<NightGuardrailSettings, 'targetBedtime'>,
  now = new Date(),
) => {
  const bedtimeTonight = getTonightBedtime(settings.targetBedtime, now);
  const windowStart = bedtimeTonight.getTime() - PRE_BED_WINDOW_HOURS * 60 * 60 * 1000;
  const timestamp = now.getTime();
  return timestamp >= windowStart && timestamp < bedtimeTonight.getTime();
};

export const shouldUseLowStimulusMode = (
  settings: NightGuardrailSettings,
  now = new Date(),
) => settings.competitionTomorrow && isInBedtimeCutoffWindow(settings, now);

export const acknowledgeNightBeforeReminder = (bedtimeAt: Date) => {
  const runtime = loadRuntime();
  runtime.lastReminderBedtimeKey = getBedtimeKey(bedtimeAt);
  saveRuntime(runtime);
};

export const shouldTriggerInAppReminder = (
  settings: NightGuardrailSettings,
  now = new Date(),
) => {
  if (settings.reminderPreference !== 'inApp') {
    return false;
  }
  const bedtime = getNextBedtime(settings.targetBedtime, now);
  const reminderAt = new Date(bedtime.getTime() - PRE_BED_WINDOW_HOURS * 60 * 60 * 1000);
  const runtime = loadRuntime();
  const bedtimeKey = getBedtimeKey(bedtime);
  return (
    now.getTime() >= reminderAt.getTime() &&
    now.getTime() < bedtime.getTime() &&
    runtime.lastReminderBedtimeKey !== bedtimeKey
  );
};

export const getNextReminderDelayMs = (
  settings: NightGuardrailSettings,
  now = new Date(),
) => {
  if (settings.reminderPreference !== 'inApp') {
    return null;
  }
  const bedtime = getNextBedtime(settings.targetBedtime, now);
  const reminderAt = bedtime.getTime() - PRE_BED_WINDOW_HOURS * 60 * 60 * 1000;
  if (now.getTime() >= reminderAt && now.getTime() < bedtime.getTime()) {
    return 0;
  }
  return Math.max(0, reminderAt - now.getTime());
};

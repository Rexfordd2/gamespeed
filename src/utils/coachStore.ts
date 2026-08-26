import { SportType, resolveSportType } from '../config/sports';
import {
  CoachAthlete,
  CoachChallengeTemplateId,
  CoachStore,
  UpsertAthleteInput,
} from '../types/coach';
import { COACH_CHALLENGE_TEMPLATES, getChallengeStatus, getChallengeUnitKey } from './coachChallenges';

export const COACH_STORE_STORAGE_KEY = 'gamespeed_coach_mode_v1';
const MAX_ACTIVITY_ITEMS = 120;

const emptyChallengeProgress = (nowTs: number) => ({
  noScroll7Day: {
    templateId: 'noScroll7Day' as const,
    completedUnits: [],
    updatedAt: nowTs,
  },
  runwayCompletion: {
    templateId: 'runwayCompletion' as const,
    completedUnits: [],
    updatedAt: nowTs,
  },
});

const emptyStore = (): CoachStore => ({
  version: 1,
  athletes: [],
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const normalizeChallengeProgress = (
  value: unknown,
  nowTs: number,
): CoachAthlete['challengeProgress'] => {
  const base = emptyChallengeProgress(nowTs);
  if (!isObject(value)) {
    return base;
  }
  const noScroll = isObject(value.noScroll7Day) ? value.noScroll7Day : null;
  const runwayCompletion = isObject(value.runwayCompletion) ? value.runwayCompletion : null;

  return {
    noScroll7Day: {
      templateId: 'noScroll7Day',
      completedUnits: Array.isArray(noScroll?.completedUnits)
        ? noScroll.completedUnits.filter((unit): unit is string => typeof unit === 'string')
        : [],
      completedAt: typeof noScroll?.completedAt === 'number' ? noScroll.completedAt : undefined,
      updatedAt: typeof noScroll?.updatedAt === 'number' ? noScroll.updatedAt : nowTs,
    },
    runwayCompletion: {
      templateId: 'runwayCompletion',
      completedUnits: Array.isArray(runwayCompletion?.completedUnits)
        ? runwayCompletion.completedUnits.filter((unit): unit is string => typeof unit === 'string')
        : [],
      completedAt: typeof runwayCompletion?.completedAt === 'number' ? runwayCompletion.completedAt : undefined,
      updatedAt: typeof runwayCompletion?.updatedAt === 'number' ? runwayCompletion.updatedAt : nowTs,
    },
  };
};

const normalizeAthlete = (rawAthlete: unknown): CoachAthlete | null => {
  if (!isObject(rawAthlete) || typeof rawAthlete.id !== 'string' || typeof rawAthlete.name !== 'string') {
    return null;
  }

  const createdAt = typeof rawAthlete.createdAt === 'number' ? rawAthlete.createdAt : Date.now();
  const updatedAt = typeof rawAthlete.updatedAt === 'number' ? rawAthlete.updatedAt : createdAt;

  const runwayCompletions = Array.isArray(rawAthlete.runwayCompletions)
    ? rawAthlete.runwayCompletions
        .filter(
          completion =>
            isObject(completion) && typeof completion.id === 'string' && typeof completion.ts === 'number',
        )
        .map(completion => ({ id: completion.id as string, ts: completion.ts as number }))
    : [];

  const gameSessions = Array.isArray(rawAthlete.gameSessions)
    ? rawAthlete.gameSessions
        .filter(session => isObject(session) && typeof session.id === 'string' && typeof session.ts === 'number')
        .map(session => ({
          id: session.id as string,
          ts: session.ts as number,
          reactionTimeMs: typeof session.reactionTimeMs === 'number' ? session.reactionTimeMs : undefined,
          decisionScore: typeof session.decisionScore === 'number' ? session.decisionScore : undefined,
        }))
    : [];

  const sleepCheckIns = Array.isArray(rawAthlete.sleepCheckIns)
    ? rawAthlete.sleepCheckIns
        .filter(
          checkIn =>
            isObject(checkIn) &&
            typeof checkIn.id === 'string' &&
            typeof checkIn.ts === 'number' &&
            typeof checkIn.readinessScore === 'number',
        )
        .map(checkIn => ({
          id: checkIn.id as string,
          ts: checkIn.ts as number,
          readinessScore: Math.min(5, Math.max(1, Math.round(checkIn.readinessScore as number))) as 1 | 2 | 3 | 4 | 5,
        }))
    : [];

  return {
    id: rawAthlete.id,
    name: rawAthlete.name.trim(),
    sport: resolveSportType(typeof rawAthlete.sport === 'string' ? rawAthlete.sport : undefined),
    createdAt,
    updatedAt,
    runwayCompletions: runwayCompletions.slice(-MAX_ACTIVITY_ITEMS),
    gameSessions: gameSessions.slice(-MAX_ACTIVITY_ITEMS),
    sleepCheckIns: sleepCheckIns.slice(-MAX_ACTIVITY_ITEMS),
    challengeProgress: normalizeChallengeProgress(rawAthlete.challengeProgress, updatedAt),
  };
};

const normalizeStore = (rawStore: unknown): CoachStore => {
  if (!isObject(rawStore) || rawStore.version !== 1 || !Array.isArray(rawStore.athletes)) {
    return emptyStore();
  }

  return {
    version: 1,
    athletes: rawStore.athletes.map(normalizeAthlete).filter((athlete): athlete is CoachAthlete => athlete !== null),
  };
};

const makeId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const loadCoachStore = (): CoachStore => {
  try {
    const raw = localStorage.getItem(COACH_STORE_STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    const normalized = normalizeStore(parsed);
    if (normalized.athletes.length !== parsed?.athletes?.length) {
      saveCoachStore(normalized);
    }
    return normalized;
  } catch {
    return emptyStore();
  }
};

export const saveCoachStore = (store: CoachStore) => {
  try {
    localStorage.setItem(COACH_STORE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore local storage failures.
  }
};

const updateAthleteInStore = (
  athleteId: string,
  updater: (athlete: CoachAthlete) => CoachAthlete,
): CoachStore => {
  const store = loadCoachStore();
  const athletes = store.athletes.map(athlete => (athlete.id === athleteId ? updater(athlete) : athlete));
  const next = { ...store, athletes };
  saveCoachStore(next);
  return next;
};

export const upsertCoachAthlete = (input: UpsertAthleteInput) => {
  const store = loadCoachStore();
  const now = Date.now();

  if (input.id) {
    const updatedAthletes = store.athletes.map(athlete =>
      athlete.id === input.id
        ? {
            ...athlete,
            name: input.name.trim(),
            sport: input.sport,
            updatedAt: now,
          }
        : athlete,
    );
    const next = { ...store, athletes: updatedAthletes };
    saveCoachStore(next);
    return next;
  }

  const athlete: CoachAthlete = {
    id: makeId(),
    name: input.name.trim(),
    sport: input.sport,
    createdAt: now,
    updatedAt: now,
    runwayCompletions: [],
    gameSessions: [],
    sleepCheckIns: [],
    challengeProgress: emptyChallengeProgress(now),
  };
  const next = { ...store, athletes: [...store.athletes, athlete] };
  saveCoachStore(next);
  return next;
};

export const recordCoachRunwayCompletion = (athleteId: string, ts = Date.now()) => {
  return updateAthleteInStore(athleteId, athlete => ({
    ...athlete,
    updatedAt: ts,
    runwayCompletions: [...athlete.runwayCompletions, { id: makeId(), ts }].slice(-MAX_ACTIVITY_ITEMS),
  }));
};

export const recordCoachGameSession = (
  athleteId: string,
  input: { reactionTimeMs?: number; decisionScore?: number; ts?: number },
) => {
  const ts = input.ts ?? Date.now();
  return updateAthleteInStore(athleteId, athlete => ({
    ...athlete,
    updatedAt: ts,
    gameSessions: [
      ...athlete.gameSessions,
      {
        id: makeId(),
        ts,
        reactionTimeMs: input.reactionTimeMs,
        decisionScore: input.decisionScore,
      },
    ].slice(-MAX_ACTIVITY_ITEMS),
  }));
};

export const recordCoachSleepCheckIn = (
  athleteId: string,
  input: { readinessScore: 1 | 2 | 3 | 4 | 5; ts?: number },
) => {
  const ts = input.ts ?? Date.now();
  return updateAthleteInStore(athleteId, athlete => ({
    ...athlete,
    updatedAt: ts,
    sleepCheckIns: [...athlete.sleepCheckIns, { id: makeId(), ts, readinessScore: input.readinessScore }].slice(
      -MAX_ACTIVITY_ITEMS,
    ),
  }));
};

export const recordCoachChallengeCompletion = (
  athleteId: string,
  templateId: CoachChallengeTemplateId,
  ts = Date.now(),
) => {
  const unitKey = getChallengeUnitKey(templateId, ts);
  return updateAthleteInStore(athleteId, athlete => {
    const current = athlete.challengeProgress[templateId];
    if (current.completedAt) {
      return athlete;
    }

    const nextUnits = current.completedUnits.includes(unitKey)
      ? current.completedUnits
      : [...current.completedUnits, unitKey];
    const nextStatus = getChallengeStatus(templateId, nextUnits);
    return {
      ...athlete,
      updatedAt: ts,
      challengeProgress: {
        ...athlete.challengeProgress,
        [templateId]: {
          ...current,
          completedUnits: nextUnits,
          updatedAt: ts,
          completedAt: nextStatus.completed ? ts : undefined,
        },
      },
    };
  });
};

export const resetCoachChallenge = (athleteId: string, templateId: CoachChallengeTemplateId, ts = Date.now()) =>
  updateAthleteInStore(athleteId, athlete => ({
    ...athlete,
    updatedAt: ts,
    challengeProgress: {
      ...athlete.challengeProgress,
      [templateId]: {
        templateId,
        completedUnits: [],
        updatedAt: ts,
      },
    },
  }));

export const clearCoachStore = () => {
  try {
    localStorage.removeItem(COACH_STORE_STORAGE_KEY);
  } catch {
    // Ignore local storage failures.
  }
};

export interface CoachRepository {
  load: () => CoachStore;
  upsertAthlete: (input: UpsertAthleteInput) => CoachStore;
  recordRunwayCompletion: (athleteId: string, ts?: number) => CoachStore;
  recordGameSession: (
    athleteId: string,
    input: { reactionTimeMs?: number; decisionScore?: number; ts?: number },
  ) => CoachStore;
  recordSleepCheckIn: (
    athleteId: string,
    input: { readinessScore: 1 | 2 | 3 | 4 | 5; ts?: number },
  ) => CoachStore;
  recordChallengeCompletion: (
    athleteId: string,
    templateId: CoachChallengeTemplateId,
    ts?: number,
  ) => CoachStore;
  resetChallenge: (athleteId: string, templateId: CoachChallengeTemplateId, ts?: number) => CoachStore;
}

export const localCoachRepository: CoachRepository = {
  load: loadCoachStore,
  upsertAthlete: upsertCoachAthlete,
  recordRunwayCompletion: recordCoachRunwayCompletion,
  recordGameSession: recordCoachGameSession,
  recordSleepCheckIn: recordCoachSleepCheckIn,
  recordChallengeCompletion: recordCoachChallengeCompletion,
  resetChallenge: resetCoachChallenge,
};

export const getCoachAthleteById = (athletes: CoachAthlete[], athleteId: string) =>
  athletes.find(athlete => athlete.id === athleteId);

export const getSportLabel = (sport: SportType) => sport.replace('_', ' / ');

export const getChallengeTemplate = (templateId: CoachChallengeTemplateId) =>
  COACH_CHALLENGE_TEMPLATES[templateId];

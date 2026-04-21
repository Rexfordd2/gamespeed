import { SportType } from '../config/sports';
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
    const parsed = JSON.parse(raw) as CoachStore;
    if (parsed?.version !== 1 || !Array.isArray(parsed.athletes)) {
      return emptyStore();
    }
    return parsed;
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

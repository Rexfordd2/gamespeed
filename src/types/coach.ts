import { SportType } from '../config/sports';

export type CoachChallengeTemplateId = 'noScroll7Day' | 'runwayCompletion';

export interface CoachChallengeTemplate {
  id: CoachChallengeTemplateId;
  title: string;
  description: string;
  targetCount: number;
}

export interface CoachRunwayCompletion {
  id: string;
  ts: number;
}

export interface CoachGameSession {
  id: string;
  ts: number;
  reactionTimeMs?: number;
  decisionScore?: number;
}

export interface CoachSleepCheckIn {
  id: string;
  ts: number;
  readinessScore: 1 | 2 | 3 | 4 | 5;
}

export interface CoachChallengeProgress {
  templateId: CoachChallengeTemplateId;
  completedUnits: string[];
  completedAt?: number;
  updatedAt: number;
}

export interface CoachAthlete {
  id: string;
  name: string;
  sport: SportType;
  createdAt: number;
  updatedAt: number;
  runwayCompletions: CoachRunwayCompletion[];
  gameSessions: CoachGameSession[];
  sleepCheckIns: CoachSleepCheckIn[];
  challengeProgress: Record<CoachChallengeTemplateId, CoachChallengeProgress>;
}

export interface CoachStore {
  version: 1;
  athletes: CoachAthlete[];
}

export interface UpsertAthleteInput {
  id?: string;
  name: string;
  sport: SportType;
}

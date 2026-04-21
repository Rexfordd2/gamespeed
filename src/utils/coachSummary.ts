import { CoachAthlete } from '../types/coach';

export type ReactionDecisionTrend = 'improving' | 'steady' | 'declining' | 'insufficient-data';

const DAY_MS = 86_400_000;

const toDay = (ts: number) => {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${`${d.getUTCMonth() + 1}`.padStart(2, '0')}-${`${d.getUTCDate()}`.padStart(2, '0')}`;
};

const getStreakFromDays = (days: string[]) => {
  if (days.length === 0) return 0;
  const daySet = new Set(days);
  const sorted = [...daySet]
    .map(value => new Date(`${value}T00:00:00Z`).getTime())
    .sort((a, b) => b - a);
  let streak = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i - 1] - sorted[i] === DAY_MS) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
};

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const getDecisionTrend = (athlete: CoachAthlete): ReactionDecisionTrend => {
  if (athlete.gameSessions.length < 4) {
    return 'insufficient-data';
  }

  const recent = [...athlete.gameSessions]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 6);

  const newer = recent.slice(0, 3);
  const older = recent.slice(3);
  if (older.length === 0) {
    return 'insufficient-data';
  }

  const newerDecision = average(newer.map(item => item.decisionScore ?? 0));
  const olderDecision = average(older.map(item => item.decisionScore ?? 0));
  const newerReaction = average(newer.map(item => item.reactionTimeMs ?? 0));
  const olderReaction = average(older.map(item => item.reactionTimeMs ?? 0));

  const decisionDelta = newerDecision - olderDecision;
  const reactionDelta = olderReaction - newerReaction;

  if (decisionDelta >= 0.3 || reactionDelta >= 15) {
    return 'improving';
  }
  if (decisionDelta <= -0.3 || reactionDelta <= -15) {
    return 'declining';
  }
  return 'steady';
};

export const getAthleteSummary = (athlete: CoachAthlete) => {
  const activityDays = [
    ...athlete.runwayCompletions.map(entry => toDay(entry.ts)),
    ...athlete.gameSessions.map(entry => toDay(entry.ts)),
    ...athlete.sleepCheckIns.map(entry => toDay(entry.ts)),
    ...Object.values(athlete.challengeProgress).flatMap(progress => progress.completedUnits),
  ];

  const readinessAvg =
    athlete.sleepCheckIns.length > 0
      ? average(athlete.sleepCheckIns.map(entry => entry.readinessScore))
      : 0;

  return {
    completionStreak: getStreakFromDays(activityDays),
    averageReadinessScore: Number(readinessAvg.toFixed(2)),
    reactionDecisionTrend: getDecisionTrend(athlete),
  };
};

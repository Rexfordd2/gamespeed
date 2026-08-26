import { CoachAthlete } from '../types/coach';
import { SportType } from '../config/sports';

export type ReactionDecisionTrend = 'improving' | 'steady' | 'declining' | 'insufficient-data';
export type TrendDirection = 'up' | 'flat' | 'down' | 'insufficient-data';

const DAY_MS = 86_400_000;
const WEEK_DAYS = 7;
const RUNWAY_WEEKLY_GOAL = 3;
const INACTIVITY_RISK_DAYS = 4;

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

const getWindowStart = (nowTs: number, days: number) => {
  const nowDay = new Date(toDay(nowTs)).getTime();
  return nowDay - DAY_MS * (days - 1);
};

const sumByWindow = (timestamps: number[], startTs: number, endTs: number) =>
  timestamps.filter(ts => ts >= startTs && ts <= endTs).length;

const averageByWindow = (entries: { ts: number; value: number }[], startTs: number, endTs: number) => {
  const values = entries.filter(item => item.ts >= startTs && item.ts <= endTs).map(item => item.value);
  return values.length > 0 ? average(values) : 0;
};

const getCountTrend = (current: number, previous: number): TrendDirection => {
  if (current === 0 && previous === 0) return 'insufficient-data';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
};

const getAverageTrend = (current: number, previous: number, minimumDelta = 0.2): TrendDirection => {
  if (current === 0 && previous === 0) return 'insufficient-data';
  if (current - previous >= minimumDelta) return 'up';
  if (previous - current >= minimumDelta) return 'down';
  return 'flat';
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

const getLatestActivity = (athlete: CoachAthlete) => {
  const activity = [
    ...athlete.runwayCompletions.map(item => ({ ts: item.ts, type: 'Runway completion' as const })),
    ...athlete.gameSessions.map(item => ({ ts: item.ts, type: 'Readiness session' as const })),
    ...athlete.sleepCheckIns.map(item => ({ ts: item.ts, type: 'Readiness check-in' as const })),
  ].sort((a, b) => b.ts - a.ts);

  if (activity.length === 0) {
    return null;
  }
  return activity[0];
};

const getPerformanceScore = (decisionScore?: number, reactionTimeMs?: number) => {
  const safeDecision = decisionScore ?? 3;
  const safeReaction = reactionTimeMs ?? 300;
  return safeDecision * 100 - safeReaction;
};

export interface CoachAtRiskFlags {
  missedRunwayUsage: boolean;
  decliningReadinessCheckIns: boolean;
  inactivity: boolean;
  reasons: string[];
}

export interface AthleteCoachSummary {
  athleteId: string;
  athleteName: string;
  sport: SportType;
  completionStreak: number;
  runwayUsageThisWeek: number;
  runwayUsagePreviousWeek: number;
  runwayUsageTrend: TrendDirection;
  readinessAverageThisWeek: number;
  readinessAveragePreviousWeek: number;
  readinessCheckInsThisWeek: number;
  readinessCheckInsPreviousWeek: number;
  readinessTrend: TrendDirection;
  recentActivityType: string;
  recentActivityTs: number | null;
  atRisk: CoachAtRiskFlags;
}

export interface SportPerformanceTrendSummary {
  sport: SportType;
  athleteCount: number;
  sessionCountThisWeek: number;
  sessionCountPreviousWeek: number;
  trend: TrendDirection;
  delta: number;
}

export interface CoachDashboardSummary {
  generatedAt: number;
  weeklyWindowStartTs: number;
  weeklyWindowEndTs: number;
  athleteSummaries: AthleteCoachSummary[];
  readinessTrend: TrendDirection;
  sportPerformanceTrends: SportPerformanceTrendSummary[];
  recentAthleteActivity: AthleteCoachSummary[];
  atRiskAthletes: AthleteCoachSummary[];
}

export const getAthleteCoachSummary = (athlete: CoachAthlete, nowTs = Date.now()): AthleteCoachSummary => {
  const currentStart = getWindowStart(nowTs, WEEK_DAYS);
  const previousEnd = currentStart - 1;
  const previousStart = previousEnd - DAY_MS * (WEEK_DAYS - 1);

  const runwayTimestamps = athlete.runwayCompletions.map(item => item.ts);
  const runwayUsageThisWeek = sumByWindow(runwayTimestamps, currentStart, nowTs);
  const runwayUsagePreviousWeek = sumByWindow(runwayTimestamps, previousStart, previousEnd);
  const runwayUsageTrend = getCountTrend(runwayUsageThisWeek, runwayUsagePreviousWeek);

  const readinessEntries = athlete.sleepCheckIns.map(item => ({ ts: item.ts, value: item.readinessScore }));
  const readinessAverageThisWeek = averageByWindow(readinessEntries, currentStart, nowTs);
  const readinessAveragePreviousWeek = averageByWindow(readinessEntries, previousStart, previousEnd);
  const readinessCheckInsThisWeek = sumByWindow(
    athlete.sleepCheckIns.map(item => item.ts),
    currentStart,
    nowTs,
  );
  const readinessCheckInsPreviousWeek = sumByWindow(
    athlete.sleepCheckIns.map(item => item.ts),
    previousStart,
    previousEnd,
  );
  const readinessTrend = getAverageTrend(readinessAverageThisWeek, readinessAveragePreviousWeek, 0.25);

  const latestActivity = getLatestActivity(athlete);
  const inactiveCutoff = nowTs - DAY_MS * INACTIVITY_RISK_DAYS;
  const inactivity = !latestActivity || latestActivity.ts < inactiveCutoff;

  const decliningReadinessCheckIns =
    readinessTrend === 'down' ||
    (readinessCheckInsPreviousWeek >= 2 && readinessCheckInsThisWeek < readinessCheckInsPreviousWeek);
  const missedRunwayUsage = runwayUsageThisWeek < RUNWAY_WEEKLY_GOAL;

  const reasons: string[] = [];
  if (missedRunwayUsage) reasons.push('Missed runway usage target');
  if (decliningReadinessCheckIns) reasons.push('Declining readiness check-ins');
  if (inactivity) reasons.push('Recent inactivity');

  const activityDays = [
    ...athlete.runwayCompletions.map(entry => toDay(entry.ts)),
    ...athlete.gameSessions.map(entry => toDay(entry.ts)),
    ...athlete.sleepCheckIns.map(entry => toDay(entry.ts)),
    ...Object.values(athlete.challengeProgress).flatMap(progress => progress.completedUnits),
  ];

  return {
    athleteId: athlete.id,
    athleteName: athlete.name,
    sport: athlete.sport,
    completionStreak: getStreakFromDays(activityDays),
    runwayUsageThisWeek,
    runwayUsagePreviousWeek,
    runwayUsageTrend,
    readinessAverageThisWeek: Number(readinessAverageThisWeek.toFixed(2)),
    readinessAveragePreviousWeek: Number(readinessAveragePreviousWeek.toFixed(2)),
    readinessCheckInsThisWeek,
    readinessCheckInsPreviousWeek,
    readinessTrend,
    recentActivityType: latestActivity?.type ?? 'No recent activity',
    recentActivityTs: latestActivity?.ts ?? null,
    atRisk: {
      missedRunwayUsage,
      decliningReadinessCheckIns,
      inactivity,
      reasons,
    },
  };
};

const getSportPerformanceTrend = (
  athletes: CoachAthlete[],
  sport: SportType,
  currentStart: number,
  currentEnd: number,
): SportPerformanceTrendSummary | null => {
  const sportAthletes = athletes.filter(athlete => athlete.sport === sport);
  if (sportAthletes.length === 0) return null;

  const previousEnd = currentStart - 1;
  const previousStart = previousEnd - DAY_MS * (WEEK_DAYS - 1);

  const currentScores = sportAthletes.flatMap(athlete =>
    athlete.gameSessions
      .filter(session => session.ts >= currentStart && session.ts <= currentEnd)
      .map(session => getPerformanceScore(session.decisionScore, session.reactionTimeMs)),
  );
  const previousScores = sportAthletes.flatMap(athlete =>
    athlete.gameSessions
      .filter(session => session.ts >= previousStart && session.ts <= previousEnd)
      .map(session => getPerformanceScore(session.decisionScore, session.reactionTimeMs)),
  );

  const currentAverage = average(currentScores);
  const previousAverage = average(previousScores);
  const delta = Number((currentAverage - previousAverage).toFixed(2));
  const trend = getAverageTrend(currentAverage, previousAverage, 10);

  return {
    sport,
    athleteCount: sportAthletes.length,
    sessionCountThisWeek: currentScores.length,
    sessionCountPreviousWeek: previousScores.length,
    trend,
    delta,
  };
};

export const getCoachDashboardSummary = (athletes: CoachAthlete[], nowTs = Date.now()): CoachDashboardSummary => {
  const currentStart = getWindowStart(nowTs, WEEK_DAYS);
  const athleteSummaries = athletes.map(athlete => getAthleteCoachSummary(athlete, nowTs));

  const readinessTrend = getAverageTrend(
    average(athleteSummaries.map(item => item.readinessAverageThisWeek).filter(value => value > 0)),
    average(athleteSummaries.map(item => item.readinessAveragePreviousWeek).filter(value => value > 0)),
    0.2,
  );

  const sports = new Set(athletes.map(athlete => athlete.sport));
  const sportPerformanceTrends = [...sports]
    .map(sport => getSportPerformanceTrend(athletes, sport, currentStart, nowTs))
    .filter((item): item is SportPerformanceTrendSummary => item !== null)
    .sort((a, b) => a.sport.localeCompare(b.sport));

  const recentAthleteActivity = [...athleteSummaries]
    .filter(item => item.recentActivityTs !== null)
    .sort((a, b) => (b.recentActivityTs ?? 0) - (a.recentActivityTs ?? 0))
    .slice(0, 6);

  const atRiskAthletes = athleteSummaries.filter(item => item.atRisk.reasons.length > 0);

  return {
    generatedAt: nowTs,
    weeklyWindowStartTs: currentStart,
    weeklyWindowEndTs: nowTs,
    athleteSummaries,
    readinessTrend,
    sportPerformanceTrends,
    recentAthleteActivity,
    atRiskAthletes,
  };
};

export const getAthleteSummary = (athlete: CoachAthlete) => {
  const readinessAvg =
    athlete.sleepCheckIns.length > 0
      ? average(athlete.sleepCheckIns.map(entry => entry.readinessScore))
      : 0;

  const coachSummary = getAthleteCoachSummary(athlete);

  return {
    completionStreak: coachSummary.completionStreak,
    averageReadinessScore: Number(readinessAvg.toFixed(2)),
    reactionDecisionTrend: getDecisionTrend(athlete),
  };
};

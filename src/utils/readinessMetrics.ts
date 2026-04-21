import { DEFAULT_SPORT, SportType, isSportType } from '../config/sports';
import { GameStats, ReadinessMetrics, StoredRound } from '../types/game';

type DeriveReadinessMetricsInput = {
  score: number;
  misses: number;
  totalAttempts?: number;
  lateDecisions?: number;
  reactionTimesMs?: number[];
  streakRuns?: number[];
  runwayCompletionsCount?: number;
  sleepCheckInCorrelation?: ReadinessMetrics['sleepCheckInCorrelation'];
};

const roundToInt = (value: number) => Math.round(value);

const avg = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const median = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
};

const stdDev = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const mean = avg(values) ?? 0;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const deriveReadinessMetrics = (
  input: DeriveReadinessMetricsInput,
): ReadinessMetrics => {
  const attempts = Math.max(
    input.score + input.misses,
    input.totalAttempts ?? input.score + input.misses,
  );
  const misses = Math.max(0, attempts - input.score);
  const lateDecisions = clamp(input.lateDecisions ?? 0, 0, misses);
  const reactionSamples = (input.reactionTimesMs ?? []).filter(value => value > 0);
  const streakRuns = (input.streakRuns ?? []).filter(value => value > 0);

  const decisionAccuracyPct =
    attempts > 0 ? roundToInt((input.score / attempts) * 100) : 0;
  const missRatePct = attempts > 0 ? roundToInt((misses / attempts) * 100) : 0;
  const lateDecisionRatePct =
    attempts > 0 ? roundToInt((lateDecisions / attempts) * 100) : 0;

  const averageStreak = avg(streakRuns) ?? 0;
  const streakVolatility = stdDev(streakRuns);
  const consistencyPct =
    streakRuns.length === 0
      ? 0
      : roundToInt(clamp(100 - (streakVolatility / Math.max(averageStreak, 1)) * 45, 0, 100));
  const bestStreak = streakRuns.length === 0 ? 0 : Math.max(...streakRuns);
  const streakQualityPct = roundToInt(
    clamp(bestStreak * 8 + averageStreak * 10 + consistencyPct * 0.35, 0, 100),
  );

  const medianReaction = median(reactionSamples);
  const averageReaction = avg(reactionSamples);
  const reactionSpeedScore =
    medianReaction === null ? 45 : clamp(((800 - medianReaction) / 600) * 100, 0, 100);
  const readinessScore = roundToInt(
    clamp(
      decisionAccuracyPct * 0.4 +
        (100 - missRatePct) * 0.2 +
        (100 - lateDecisionRatePct) * 0.15 +
        streakQualityPct * 0.15 +
        reactionSpeedScore * 0.1,
      0,
      100,
    ),
  );

  return {
    reactionTimeMs: {
      average: averageReaction === null ? null : roundToInt(averageReaction),
      median: medianReaction === null ? null : roundToInt(medianReaction),
    },
    decisionAccuracyPct,
    missRatePct,
    lateDecisionRatePct,
    streakQualityPct,
    consistencyPct,
    readinessScore,
    runwayCompletionsCount: Math.max(0, input.runwayCompletionsCount ?? 0),
    sleepCheckInCorrelation: input.sleepCheckInCorrelation ?? 'pending',
  };
};

const resolveRoundSport = (round: StoredRound): SportType =>
  round.sport && isSportType(round.sport) ? round.sport : DEFAULT_SPORT;

type TrendDirection = 'up' | 'down' | 'flat';

export type SportTrendSummary = {
  sport: SportType;
  averageReadinessScore: number;
  roundsTracked: number;
  trendDirection: TrendDirection;
  summary: string;
};

export const getSportTrendSummaries = (
  stats: GameStats,
  recentWindowSize = 3,
): SportTrendSummary[] => {
  const roundsBySport: Partial<Record<SportType, StoredRound[]>> = {};
  for (const round of stats.rounds) {
    const sport = resolveRoundSport(round);
    const bucket = roundsBySport[sport] ?? [];
    bucket.push(round);
    roundsBySport[sport] = bucket;
  }

  return Object.entries(roundsBySport)
    .map(([sport, rounds]) => {
      const sorted = [...(rounds ?? [])].sort((a, b) => a.ts - b.ts);
      const readinessSeries = sorted.map(
        round => round.readinessMetrics?.readinessScore ?? round.accuracy,
      );
      const avgReadiness = avg(readinessSeries) ?? 0;
      const window = Math.max(1, recentWindowSize);
      const recent = readinessSeries.slice(-window);
      const previous = readinessSeries.slice(-window * 2, -window);
      const recentAvg = avg(recent) ?? avgReadiness;
      const previousAvg = previous.length > 0 ? avg(previous) ?? recentAvg : recentAvg;
      const delta = recentAvg - previousAvg;
      const trendDirection: TrendDirection =
        delta >= 3 ? 'up' : delta <= -3 ? 'down' : 'flat';
      const summary =
        trendDirection === 'up'
          ? `Trending up (${roundToInt(delta)} pts vs previous block).`
          : trendDirection === 'down'
            ? `Trending down (${roundToInt(Math.abs(delta))} pts vs previous block).`
            : 'Holding steady across recent sessions.';

      return {
        sport: sport as SportType,
        averageReadinessScore: roundToInt(avgReadiness),
        roundsTracked: sorted.length,
        trendDirection,
        summary,
      };
    })
    .sort((a, b) => b.roundsTracked - a.roundsTracked);
};

export type StatsGroupSummary = {
  gameplay: {
    scoreAverage: number;
    reactionTimeMedianMs: number | null;
    rounds: number;
  };
  readiness: {
    decisionAccuracyPct: number;
    missRatePct: number;
    lateDecisionRatePct: number;
    streakQualityPct: number;
    consistencyPct: number;
    readinessScore: number;
  };
  recovery: {
    runwayCompletionsCount: number;
    sleepCorrelationState: ReadinessMetrics['sleepCheckInCorrelation'];
  };
};

export const getStatsGroupSummary = (stats: GameStats): StatsGroupSummary => {
  if (stats.rounds.length === 0) {
    return {
      gameplay: { scoreAverage: 0, reactionTimeMedianMs: null, rounds: 0 },
      readiness: {
        decisionAccuracyPct: 0,
        missRatePct: 0,
        lateDecisionRatePct: 0,
        streakQualityPct: 0,
        consistencyPct: 0,
        readinessScore: 0,
      },
      recovery: { runwayCompletionsCount: 0, sleepCorrelationState: 'pending' },
    };
  }

  const readinessList = stats.rounds.map(round => round.readinessMetrics);
  const reactionMedians = readinessList
    .map(metrics => metrics?.reactionTimeMs.median)
    .filter((value): value is number => value !== null && value !== undefined);

  const lastRound = stats.rounds[stats.rounds.length - 1];

  return {
    gameplay: {
      scoreAverage: roundToInt(avg(stats.rounds.map(round => round.score)) ?? 0),
      reactionTimeMedianMs: median(reactionMedians),
      rounds: stats.rounds.length,
    },
    readiness: {
      decisionAccuracyPct: roundToInt(
        avg(readinessList.map(metrics => metrics?.decisionAccuracyPct ?? 0)) ?? 0,
      ),
      missRatePct: roundToInt(
        avg(readinessList.map(metrics => metrics?.missRatePct ?? 0)) ?? 0,
      ),
      lateDecisionRatePct: roundToInt(
        avg(readinessList.map(metrics => metrics?.lateDecisionRatePct ?? 0)) ?? 0,
      ),
      streakQualityPct: roundToInt(
        avg(readinessList.map(metrics => metrics?.streakQualityPct ?? 0)) ?? 0,
      ),
      consistencyPct: roundToInt(
        avg(readinessList.map(metrics => metrics?.consistencyPct ?? 0)) ?? 0,
      ),
      readinessScore: roundToInt(
        avg(readinessList.map(metrics => metrics?.readinessScore ?? 0)) ?? 0,
      ),
    },
    recovery: {
      runwayCompletionsCount: lastRound.readinessMetrics?.runwayCompletionsCount ?? 0,
      sleepCorrelationState:
        lastRound.readinessMetrics?.sleepCheckInCorrelation ?? 'pending',
    },
  };
};

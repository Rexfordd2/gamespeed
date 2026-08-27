import { GameStats, StoredRound } from '../types/game';
import { PrimeSessionRecord } from '../types/prime';
import {
  ACHIEVEMENTS,
  AchievementDef,
  AchievementId,
  COGNITIVE_CATEGORIES,
  CognitiveCategoryDef,
  CognitiveCategoryId,
  EXPANSION_CATEGORY_IDS,
  RAINFOREST_TIERS,
  RainforestTier,
  RainforestTierId,
  TrendDirection,
} from '../config/athleteEvolution';
import { getDailyStreak } from './progression';

const DAY_MS = 86_400_000;
const MIN_TREND_SAMPLES = 2;
const PREGAME_STREAK_DAYS = 3;
const INHIBITION_ACHIEVEMENT_PCT = 95;
const SCHULTE_PB_GRID = 5;

export type InstinctTrainingStatus = 'untrained' | 'emerging' | 'trained';

export interface TrendSample {
  ts: number;
  value: number;
}

export interface PersonalTrend {
  id: CognitiveCategoryId | 'consistency';
  label: string;
  experienceName: string;
  samples: number;
  latest: number | null;
  baseline: number | null;
  delta: number | null;
  unit: 'ms' | 'pct' | 'count';
  direction: TrendDirection;
  ready: boolean;
  summary: string;
}

export interface InstinctMastery {
  id: CognitiveCategoryId;
  label: string;
  experienceName: string;
  rounds: number;
  status: InstinctTrainingStatus;
  latest: number | null;
  unit: 'ms' | 'pct';
}

export interface RainforestPath {
  current: RainforestTier;
  next: RainforestTier | null;
  completedPrimes: number;
  expansionCategoriesTrained: number;
  streakDays: number;
  progressLabel: string;
}

export interface EvolutionAchievement {
  id: AchievementId;
  title: string;
  description: string;
  earned: boolean;
  detail: string | null;
}

export interface AthleteEvolution {
  path: RainforestPath;
  trends: PersonalTrend[];
  instincts: InstinctMastery[];
  achievements: EvolutionAchievement[];
  earnedCount: number;
}

const startOfDay = (ts: number) => {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const roundInt = (value: number) => Math.round(value);

const toFinite = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const formatValue = (value: number, unit: PersonalTrend['unit']) => {
  if (unit === 'ms') return `${roundInt(value)} ms`;
  if (unit === 'pct') return `${roundInt(value)}%`;
  return `${roundInt(value)}`;
};

const buildTrendSummary = (trend: Omit<PersonalTrend, 'summary'>): string => {
  if (!trend.ready || trend.latest === null || trend.baseline === null || trend.delta === null) {
    return `Need ${MIN_TREND_SAMPLES} ${trend.experienceName} sessions before a trend is shown.`;
  }
  const improved =
    trend.direction === 'lower-is-better' ? trend.delta < 0 : trend.delta > 0;
  if (trend.delta === 0) {
    return `Matching your first mark (${formatValue(trend.baseline, trend.unit)}, ${trend.samples} sessions).`;
  }
  if (improved) {
    return `${formatValue(Math.abs(trend.delta), trend.unit)} better than your first mark.`;
  }
  return `${formatValue(Math.abs(trend.delta), trend.unit)} off your first mark.`;
};

const samplesFromRounds = (
  rounds: StoredRound[],
  pick: (round: StoredRound) => number | null,
): TrendSample[] =>
  rounds
    .map(round => {
      const value = pick(round);
      return value === null ? null : { ts: round.ts, value };
    })
    .filter((sample): sample is TrendSample => sample !== null)
    .sort((a, b) => a.ts - b.ts);

const pickReaction = (round: StoredRound): number | null => {
  if (round.mode !== 'reactionBenchmark') return null;
  return toFinite(round.medianReactionTimeMs) ?? toFinite(round.readinessMetrics?.reactionTimeMs.median);
};

const pickVisualSearch = (round: StoredRound): number | null => {
  const metrics = round.meta?.schulteMetrics;
  if (!metrics || metrics.gridSize !== SCHULTE_PB_GRID || metrics.completionStatus !== 'completed') {
    return null;
  }
  const value = toFinite(metrics.completionTimeMs);
  return value !== null && value > 0 ? value : null;
};

const pickControl = (round: StoredRound): number | null => {
  const value = toFinite(round.meta?.goNoGoMetrics?.inhibitionAccuracyPct);
  return value === null ? null : value;
};

const pickDecision = (round: StoredRound): number | null => {
  const value = toFinite(round.meta?.choiceReactionMetrics?.decisionAccuracyPct);
  return value === null ? null : value;
};

const pickProcessing = (round: StoredRound): number | null => {
  const value = toFinite(round.meta?.rapidComprehensionMetrics?.comprehensionAccuracyPct);
  return value === null ? null : value;
};

const PICKERS: Record<CognitiveCategoryId, (round: StoredRound) => number | null> = {
  reaction: pickReaction,
  visualSearch: pickVisualSearch,
  control: pickControl,
  decision: pickDecision,
  processing: pickProcessing,
};

const toTrend = (
  def: CognitiveCategoryDef,
  samples: TrendSample[],
): PersonalTrend => {
  const baseline = samples[0]?.value ?? null;
  const latest = samples.length > 0 ? samples[samples.length - 1].value : null;
  const ready = samples.length >= MIN_TREND_SAMPLES && baseline !== null && latest !== null;
  const delta = ready && baseline !== null && latest !== null ? latest - baseline : null;
  const partial: Omit<PersonalTrend, 'summary'> = {
    id: def.id,
    label: def.label,
    experienceName: def.experienceName,
    samples: samples.length,
    latest,
    baseline,
    delta,
    unit: def.unit,
    direction: def.direction,
    ready,
  };
  return { ...partial, summary: buildTrendSummary(partial) };
};

const mondayStart = (nowTs: number) => {
  const now = new Date(nowTs);
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.getTime();
};

const completedPrimes = (sessions: PrimeSessionRecord[]) =>
  sessions.filter(session => session.status === 'completed');

const expansionCategoriesTrained = (rounds: StoredRound[]): CognitiveCategoryId[] =>
  EXPANSION_CATEGORY_IDS.filter(id => samplesFromRounds(rounds, PICKERS[id]).length > 0);

const resolveRainforestTier = (
  primes: number,
  expansionCount: number,
  streakDays: number,
): RainforestTier => {
  let current = RAINFOREST_TIERS[0];
  for (const tier of RAINFOREST_TIERS) {
    if (
      primes >= tier.completedPrimes &&
      expansionCount >= tier.cognitiveCategories &&
      streakDays >= tier.streakDays
    ) {
      current = tier;
    }
  }
  return current;
};

const nextTierProgress = (
  current: RainforestTier,
  next: RainforestTier | null,
  primes: number,
  expansionCount: number,
  streakDays: number,
): string => {
  if (!next) {
    return 'Apex reached from completed training, not from XP.';
  }
  const parts: string[] = [];
  if (next.completedPrimes > current.completedPrimes) {
    parts.push(`${Math.min(primes, next.completedPrimes)}/${next.completedPrimes} Primes`);
  }
  if (next.cognitiveCategories > current.cognitiveCategories) {
    parts.push(
      `${Math.min(expansionCount, next.cognitiveCategories)}/${next.cognitiveCategories} cognitive instincts`,
    );
  }
  if (next.streakDays > current.streakDays) {
    parts.push(`${Math.min(streakDays, next.streakDays)}/${next.streakDays}-day streak`);
  }
  return `Next ${next.label}: ${parts.join(' · ')}`;
};

const buildPath = (
  primes: number,
  expansionCount: number,
  streakDays: number,
): RainforestPath => {
  const current = resolveRainforestTier(primes, expansionCount, streakDays);
  const currentIndex = RAINFOREST_TIERS.findIndex(tier => tier.id === current.id);
  const next = RAINFOREST_TIERS[currentIndex + 1] ?? null;
  return {
    current,
    next,
    completedPrimes: primes,
    expansionCategoriesTrained: expansionCount,
    streakDays,
    progressLabel: nextTierProgress(current, next, primes, expansionCount, streakDays),
  };
};

const buildConsistencyTrend = (
  sessions: PrimeSessionRecord[],
  nowTs: number,
): PersonalTrend => {
  const primes = completedPrimes(sessions);
  const weekStart = mondayStart(nowTs);
  const lastWeekStart = weekStart - 7 * DAY_MS;
  const thisWeek = primes.filter(session => session.ts >= weekStart).length;
  const lastWeek = primes.filter(session => session.ts >= lastWeekStart && session.ts < weekStart).length;
  const ready = primes.length >= MIN_TREND_SAMPLES && (thisWeek > 0 || lastWeek > 0);
  const baseline = lastWeek;
  const latest = thisWeek;
  const delta = ready ? latest - baseline : null;
  const partial: Omit<PersonalTrend, 'summary'> = {
    id: 'consistency',
    label: 'Consistency',
    experienceName: 'Prime',
    samples: primes.length,
    latest,
    baseline,
    delta,
    unit: 'count',
    direction: 'higher-is-better',
    ready,
  };
  let summary: string;
  if (primes.length === 0) {
    summary = 'No completed Prime sessions yet.';
  } else if (!ready) {
    summary = `Need ${MIN_TREND_SAMPLES} completed Primes before a weekly trend is shown.`;
  } else if (lastWeek === 0) {
    summary = `${thisWeek} Prime${thisWeek === 1 ? '' : 's'} this week. Last week had none logged.`;
  } else if (delta === 0) {
    summary = `Matching last week (${thisWeek} Prime${thisWeek === 1 ? '' : 's'}).`;
  } else if ((delta ?? 0) > 0) {
    summary = `${delta} more Prime${delta === 1 ? '' : 's'} than last week.`;
  } else {
    summary = `${Math.abs(delta ?? 0)} fewer Prime${Math.abs(delta ?? 0) === 1 ? '' : 's'} than last week.`;
  }
  return { ...partial, summary };
};

const instinctStatus = (rounds: number): InstinctTrainingStatus => {
  if (rounds <= 0) return 'untrained';
  if (rounds === 1) return 'emerging';
  return 'trained';
};

const consecutiveGamePrimeDays = (sessions: PrimeSessionRecord[], nowTs: number): number => {
  const uniqueDays = Array.from(
    new Set(
      completedPrimes(sessions)
        .filter(session => session.context === 'game')
        .map(session => startOfDay(session.ts)),
    ),
  ).sort((a, b) => b - a);
  if (uniqueDays.length === 0) return 0;
  const today = startOfDay(nowTs);
  if (uniqueDays[0] !== today && uniqueDays[0] !== today - DAY_MS) {
    return 0;
  }
  let streak = uniqueDays[0] === today ? 1 : 0;
  let cursor = uniqueDays[0] === today ? today - DAY_MS : today - DAY_MS;
  for (const day of uniqueDays.slice(uniqueDays[0] === today ? 1 : 0)) {
    if (day === cursor) {
      streak += 1;
      cursor -= DAY_MS;
    } else if (day < cursor) {
      break;
    }
  }
  return streak;
};

const evaluateAchievement = (
  def: AchievementDef,
  input: {
    primes: PrimeSessionRecord[];
    rounds: StoredRound[];
    reactionSamples: TrendSample[];
    gamePrimeStreak: number;
    trainedCategoryIds: CognitiveCategoryId[];
  },
): EvolutionAchievement => {
  let earned = false;
  let detail: string | null = null;

  if (def.id === 'prime-7') {
    earned = input.primes.length >= 7;
    detail = `${Math.min(input.primes.length, 7)}/7 completed Primes`;
  }

  if (def.id === 'reaction-pb') {
    const first = input.reactionSamples[0]?.value;
    const later = input.reactionSamples.slice(1).map(sample => sample.value);
    const bestLater = later.length > 0 ? Math.min(...later) : null;
    earned = first !== undefined && bestLater !== null && bestLater < first;
    if (earned && bestLater !== null && first !== undefined) {
      detail = `${roundInt(bestLater)} ms vs first mark ${roundInt(first)} ms`;
    } else if (input.reactionSamples.length < MIN_TREND_SAMPLES) {
      detail = 'Need a second baseline before a personal best can be proven.';
    } else {
      detail = 'No faster mark than your first baseline yet.';
    }
  }

  if (def.id === 'inhibition-95') {
    const best = input.rounds.reduce((high, round) => {
      const value = toFinite(round.meta?.goNoGoMetrics?.inhibitionAccuracyPct);
      return value === null ? high : Math.max(high, value);
    }, 0);
    earned = best >= INHIBITION_ACHIEVEMENT_PCT;
    detail = best > 0 ? `Best hold accuracy ${roundInt(best)}%` : 'No Caiman Control rounds yet.';
  }

  if (def.id === 'schulte-5x5-pb') {
    const times = samplesFromRounds(input.rounds, pickVisualSearch);
    earned = times.length > 0;
    if (earned) {
      const best = Math.min(...times.map(sample => sample.value));
      detail = `Best 5×5 ${roundInt(best)} ms`;
    } else {
      detail = 'No completed 5×5 Macaw Scan boards yet.';
    }
  }

  if (def.id === 'cognitive-all') {
    earned = COGNITIVE_CATEGORIES.every(category => input.trainedCategoryIds.includes(category.id));
    detail = `${input.trainedCategoryIds.length}/${COGNITIVE_CATEGORIES.length} cognitive instincts trained`;
  }

  if (def.id === 'pregame-streak') {
    earned = input.gamePrimeStreak >= PREGAME_STREAK_DAYS;
    detail = `${Math.min(input.gamePrimeStreak, PREGAME_STREAK_DAYS)}/${PREGAME_STREAK_DAYS} consecutive game-context Primes`;
  }

  return {
    id: def.id,
    title: def.title,
    description: def.description,
    earned,
    detail,
  };
};

export const buildAthleteEvolution = (
  stats: GameStats,
  primeSessions: PrimeSessionRecord[],
  nowTs = Date.now(),
): AthleteEvolution => {
  const rounds = Array.isArray(stats.rounds) ? stats.rounds : [];
  const primes = completedPrimes(Array.isArray(primeSessions) ? primeSessions : []);
  const streakDays = getDailyStreak(stats, nowTs);
  const categorySamples = COGNITIVE_CATEGORIES.map(def => ({
    def,
    samples: samplesFromRounds(rounds, PICKERS[def.id]),
  }));
  const trainedCategoryIds = categorySamples
    .filter(item => item.samples.length > 0)
    .map(item => item.def.id);
  const expansionCount = expansionCategoriesTrained(rounds).length;
  const path = buildPath(primes.length, expansionCount, streakDays);
  const trends = [
    ...categorySamples.map(item => toTrend(item.def, item.samples)),
    buildConsistencyTrend(primes, nowTs),
  ];
  const instincts: InstinctMastery[] = categorySamples.map(item => ({
    id: item.def.id,
    label: item.def.label,
    experienceName: item.def.experienceName,
    rounds: item.samples.length,
    status: instinctStatus(item.samples.length),
    latest: item.samples.length > 0 ? item.samples[item.samples.length - 1].value : null,
    unit: item.def.unit,
  }));
  const reactionSamples = categorySamples.find(item => item.def.id === 'reaction')?.samples ?? [];
  const achievements = ACHIEVEMENTS.map(def =>
    evaluateAchievement(def, {
      primes,
      rounds,
      reactionSamples,
      gamePrimeStreak: consecutiveGamePrimeDays(primes, nowTs),
      trainedCategoryIds,
    }),
  );

  return {
    path,
    trends,
    instincts,
    achievements,
    earnedCount: achievements.filter(item => item.earned).length,
  };
};

export const getRainforestTierId = (evolution: AthleteEvolution): RainforestTierId =>
  evolution.path.current.id;

export const formatTrendValue = (value: number | null, unit: PersonalTrend['unit']) =>
  value === null ? '—' : formatValue(value, unit);

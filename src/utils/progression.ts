import { GameModeType, GameResult, GameStats, StoredRound } from '../types/game';
import { MODE_ORDER, gameModes } from './gameModes';

const DAY_MS = 86_400_000;

type UnlockRule = {
  mode: GameModeType;
  requiredRounds: number;
  requiredAccuracy?: number;
  description: string;
};

export type ModeUnlockStatus = {
  mode: GameModeType;
  unlocked: boolean;
  requirement: string;
  progressLabel: string;
};

export type WeeklyChallenge = {
  title: string;
  subtitle: string;
  roundsDone: number;
  roundsTarget: number;
  modesDone: number;
  modesTarget: number;
  completed: boolean;
};

export type PercentileBadge = {
  percentile: number;
  label: string;
  tone: string;
};

export type LeaderboardEntry = {
  name: string;
  score: number;
  isYou?: boolean;
};

export type RoundProgressDelta = {
  scoreDelta: number;
  accuracyDelta: number;
  streakDelta: number;
  benchmarkDelta: number | null;
  medianRtDelta: number | null;
  newPb: boolean;
};

const UNLOCK_RULES: UnlockRule[] = [
  { mode: 'reactionBenchmark', requiredRounds: 0, description: 'Base readiness test' },
  { mode: 'quickTap', requiredRounds: 0, description: 'Core speed drill' },
  { mode: 'multiTarget', requiredRounds: 3, description: 'Unlock at 3 total sessions' },
  { mode: 'swipeStrike', requiredRounds: 6, description: 'Unlock at 6 total sessions' },
  { mode: 'holdTrack', requiredRounds: 9, description: 'Unlock at 9 total sessions' },
  {
    mode: 'sequenceMemory',
    requiredRounds: 12,
    requiredAccuracy: 70,
    description: 'Unlock at 12 sessions + 70% best accuracy',
  },
];

const startOfDay = (ts: number) => {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const getBestAccuracy = (stats: GameStats) =>
  MODE_ORDER.reduce((best, mode) => Math.max(best, stats.pbs[mode]?.accuracy ?? 0), 0);

const roundSignal = (round: StoredRound) =>
  (round.benchmarkScore ?? 0) * 0.8 +
  round.accuracy * 0.7 +
  round.score * 1.1 +
  round.bestStreak * 0.4 -
  (round.medianReactionTimeMs ?? 320) * 0.06;

export const getDailyStreak = (stats: GameStats, nowTs = Date.now()): number => {
  if (!stats.rounds.length) return 0;
  const uniqueDays = Array.from(new Set(stats.rounds.map(round => startOfDay(round.ts)))).sort(
    (a, b) => b - a,
  );
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

export const getWeeklyChallenge = (stats: GameStats, nowTs = Date.now()): WeeklyChallenge => {
  const now = new Date(nowTs);
  const day = now.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartTs = weekStart.getTime();
  const roundsThisWeek = stats.rounds.filter(round => round.ts >= weekStartTs);
  const uniqueModes = new Set(roundsThisWeek.map(round => round.mode));

  const roundsTarget = 12;
  const modesTarget = 3;
  const roundsDone = roundsThisWeek.length;
  const modesDone = uniqueModes.size;

  return {
    title: 'Weekly Challenge',
    subtitle: '12 sessions across 3 modes',
    roundsDone,
    roundsTarget,
    modesDone,
    modesTarget,
    completed: roundsDone >= roundsTarget && modesDone >= modesTarget,
  };
};

export const getModeUnlockStatuses = (stats: GameStats): ModeUnlockStatus[] => {
  const totalRounds = stats.rounds.length;
  const bestAccuracy = getBestAccuracy(stats);

  return UNLOCK_RULES.map(rule => {
    const roundsMet = totalRounds >= rule.requiredRounds;
    const accuracyMet = rule.requiredAccuracy === undefined || bestAccuracy >= rule.requiredAccuracy;
    const unlocked = roundsMet && accuracyMet;
    const progressParts = [`${Math.min(totalRounds, rule.requiredRounds)}/${rule.requiredRounds} sessions`];
    if (rule.requiredAccuracy !== undefined) {
      progressParts.push(`${Math.min(bestAccuracy, rule.requiredAccuracy)}%/${rule.requiredAccuracy}% accuracy`);
    }

    return {
      mode: rule.mode,
      unlocked,
      requirement: rule.description,
      progressLabel: unlocked ? 'Unlocked' : progressParts.join(' · '),
    };
  });
};

export const isModeUnlocked = (stats: GameStats, mode: GameModeType): boolean =>
  getModeUnlockStatuses(stats).find(status => status.mode === mode)?.unlocked ?? false;

export const estimatePercentileForRound = (round: StoredRound, stats: GameStats): number => {
  const modeRounds = stats.rounds.filter(item => item.mode === round.mode);
  if (modeRounds.length < 2) {
    const fallback = Math.round(
      Math.max(18, Math.min(97, round.accuracy * 0.55 + Math.min(round.score, 55) * 0.8)),
    );
    return fallback;
  }
  const currentSignal = roundSignal(round);
  const sorted = modeRounds.map(roundSignal).sort((a, b) => a - b);
  const betterOrEqual = sorted.filter(value => value <= currentSignal).length;
  return Math.max(5, Math.min(99, Math.round((betterOrEqual / sorted.length) * 100)));
};

export const getPercentileBadge = (percentile: number): PercentileBadge => {
  if (percentile >= 95) return { percentile, label: 'National Class', tone: '#4ade80' };
  if (percentile >= 85) return { percentile, label: 'Elite', tone: '#22d3ee' };
  if (percentile >= 70) return { percentile, label: 'Advanced', tone: '#a3e635' };
  if (percentile >= 50) return { percentile, label: 'Rising', tone: '#facc15' };
  return { percentile, label: 'Building', tone: '#fb923c' };
};

export const getFriendLeaderboard = (
  stats: GameStats,
  playerName = 'You',
  activeMode?: GameModeType,
): LeaderboardEntry[] => {
  // Placeholder leaderboard shell until live multiplayer rankings are available.
  const preferredMode = activeMode ?? 'quickTap';
  const yourScore = stats.pbs[preferredMode]?.score ?? 0;
  const seed = Math.max(18, yourScore);
  const entries: LeaderboardEntry[] = [
    { name: 'Kai', score: seed + 8 },
    { name: 'Rhea', score: seed + 4 },
    { name: playerName, score: yourScore, isYou: true },
    { name: 'Milo', score: Math.max(0, seed - 3) },
    { name: 'Jules', score: Math.max(0, seed - 7) },
  ];
  return entries.sort((a, b) => b.score - a.score);
};

const toShareDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const buildShareScoreCardText = ({
  round,
  badge,
  dailyStreak,
  newPb,
}: {
  round: StoredRound;
  badge: PercentileBadge;
  dailyStreak: number;
  newPb: boolean;
}) => {
  const headline = `${round.modeName} · ${round.score} hits · ${round.accuracy}% accuracy`;
  const lines = [
    `GameSpeed ${toShareDate(round.ts)}`,
    headline,
    `Badge: ${badge.label} (${badge.percentile}th percentile)`,
    `Best streak: ${round.bestStreak}`,
    dailyStreak > 0 ? `Daily streak: ${dailyStreak} day${dailyStreak === 1 ? '' : 's'}` : 'Daily streak: started',
    newPb ? 'Result: new personal best' : 'Result: session complete',
    '#GameSpeed #ReactionTraining',
  ];
  return lines.join('\n');
};

export const getRoundProgressDelta = (
  result: GameResult,
  previousPb: GameStats['pbs'][GameModeType] | undefined,
): RoundProgressDelta => {
  const attempts = result.score + result.misses;
  const accuracy = attempts > 0 ? Math.round((result.score / attempts) * 100) : 0;

  const scoreDelta = result.score - (previousPb?.score ?? 0);
  const accuracyDelta = accuracy - (previousPb?.accuracy ?? 0);
  const streakDelta = result.bestStreak - (previousPb?.bestStreak ?? 0);
  const benchmarkDelta =
    result.benchmarkScore !== undefined ? result.benchmarkScore - (previousPb?.benchmarkScore ?? 0) : null;
  const medianRtDelta =
    result.medianReactionTimeMs !== undefined && previousPb?.medianReactionTimeMs !== undefined
      ? previousPb.medianReactionTimeMs - result.medianReactionTimeMs
      : null;

  return {
    scoreDelta,
    accuracyDelta,
    streakDelta,
    benchmarkDelta,
    medianRtDelta,
    newPb: scoreDelta > 0 || accuracyDelta > 0 || streakDelta > 0 || (benchmarkDelta ?? 0) > 0 || (medianRtDelta ?? 0) > 0,
  };
};

export const getTodayRounds = (stats: GameStats, nowTs = Date.now()): StoredRound[] => {
  const start = startOfDay(nowTs);
  return stats.rounds.filter(round => round.ts >= start);
};

export const getRecentHistory = (stats: GameStats, limit = 12): StoredRound[] =>
  [...stats.rounds].sort((a, b) => b.ts - a.ts).slice(0, limit);

export const getProgressDisciplineNote = (stats: GameStats) => {
  const rounds = stats.rounds.length;
  if (rounds >= 20) return 'High-volume phase: focus on precision under fatigue.';
  if (rounds >= 8) return 'Solid training cadence: keep quality above 70% accuracy.';
  if (rounds >= 1) return 'Foundation phase: consistency beats intensity.';
  return 'No sessions logged yet: run your first benchmark.';
};

export const getModeUnlockMap = (stats: GameStats): Partial<Record<GameModeType, ModeUnlockStatus>> =>
  getModeUnlockStatuses(stats).reduce((acc, item) => {
    acc[item.mode] = item;
    return acc;
  }, {} as Partial<Record<GameModeType, ModeUnlockStatus>>);

export const getModeLabel = (mode: GameModeType) => gameModes[mode].name;

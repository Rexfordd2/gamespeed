import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { DEFAULT_SPORT, isSportType } from '../config/sports';
import { GameModeType, StoredRound } from '../types/game';

interface SyncRoundParams {
  userId: string;
  round: StoredRound;
}

const DUPLICATE_KEY_ERROR_CODE = '23505';
const GAME_MODE_TYPES: GameModeType[] = [
  'reactionBenchmark',
  'quickTap',
  'multiTarget',
  'swipeStrike',
  'holdTrack',
  'sequenceMemory',
  'peripheralPulse',
  'calmFocus',
];

const isGameModeType = (value: unknown): value is GameModeType =>
  typeof value === 'string' && GAME_MODE_TYPES.includes(value as GameModeType);

export const createClientRoundId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `round_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export type CloudSyncResult = 'skipped' | 'synced' | 'failed';

const toCloudRow = (userId: string, round: StoredRound) => ({
  user_id: userId,
  client_round_id: round.clientRoundId,
  round_ts: new Date(round.ts).toISOString(),
  mode: round.mode,
  mode_name: round.modeName,
  sport: round.sport ?? DEFAULT_SPORT,
  score: round.score,
  misses: round.misses,
  accuracy: round.accuracy,
  best_streak: round.bestStreak,
  median_reaction_time_ms: round.medianReactionTimeMs ?? null,
  benchmark_score: round.benchmarkScore ?? null,
  readiness_metrics: round.readinessMetrics ?? null,
  meta: round.meta ?? null,
});

export const syncRoundToCloud = async ({ userId, round }: SyncRoundParams): Promise<CloudSyncResult> => {
  if (!isSupabaseConfigured || !supabase || !round.clientRoundId) {
    return 'skipped';
  }

  const { error } = await supabase.from('user_rounds').insert(toCloudRow(userId, round));

  if (error && error.code !== DUPLICATE_KEY_ERROR_CODE) {
    console.error('Failed to sync round to cloud:', error.message);
    return 'failed';
  }

  return 'synced';
};

export const syncRoundsToCloud = async (
  userId: string,
  rounds: StoredRound[],
): Promise<CloudSyncResult> => {
  if (!isSupabaseConfigured || !supabase) {
    return 'skipped';
  }

  const rows = rounds
    .filter(round => Boolean(round.clientRoundId))
    .map(round => toCloudRow(userId, round));

  if (rows.length === 0) {
    return 'skipped';
  }

  const { error } = await supabase
    .from('user_rounds')
    .upsert(rows, {
      onConflict: 'user_id,client_round_id',
      ignoreDuplicates: true,
    });

  if (error) {
    console.error('Failed to sync local round history to cloud:', error.message);
    return 'failed';
  }

  return 'synced';
};

export interface FetchCloudRoundsResult {
  status: CloudSyncResult;
  rounds: StoredRound[];
}

export const fetchCloudRounds = async (userId: string): Promise<FetchCloudRoundsResult> => {
  if (!isSupabaseConfigured || !supabase) {
    return { status: 'skipped', rounds: [] };
  }

  const { data, error } = await supabase
    .from('user_rounds')
    .select(
      'client_round_id, round_ts, mode, mode_name, sport, score, misses, accuracy, best_streak, median_reaction_time_ms, benchmark_score, readiness_metrics, meta',
    )
    .eq('user_id', userId)
    .order('round_ts', { ascending: true })
    .limit(1000);

  if (error) {
    console.error('Failed to load cloud round history:', error.message);
    return { status: 'failed', rounds: [] };
  }

  const rounds: StoredRound[] = (data ?? []).flatMap(row => {
    if (!isGameModeType(row.mode)) {
      return [];
    }

    const timestamp = Date.parse(row.round_ts);
    if (!Number.isFinite(timestamp)) {
      return [];
    }

    return [
      {
        ts: timestamp,
        clientRoundId: row.client_round_id,
        sport: row.sport && isSportType(row.sport) ? row.sport : DEFAULT_SPORT,
        mode: row.mode,
        modeName: row.mode_name,
        score: row.score,
        misses: row.misses,
        accuracy: row.accuracy,
        bestStreak: row.best_streak,
        medianReactionTimeMs: row.median_reaction_time_ms ?? undefined,
        benchmarkScore: row.benchmark_score ?? undefined,
        readinessMetrics: row.readiness_metrics ?? undefined,
        meta: row.meta ?? undefined,
      },
    ];
  });

  return { status: 'synced', rounds };
};

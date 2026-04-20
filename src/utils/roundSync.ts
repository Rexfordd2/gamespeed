import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { StoredRound } from '../types/game';

interface SyncRoundParams {
  userId: string;
  round: StoredRound;
}

const DUPLICATE_KEY_ERROR_CODE = '23505';

export const createClientRoundId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `round_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const syncRoundToCloud = async ({ userId, round }: SyncRoundParams): Promise<void> => {
  if (!isSupabaseConfigured || !supabase || !round.clientRoundId) {
    return;
  }

  const { error } = await supabase.from('user_rounds').insert({
    user_id: userId,
    client_round_id: round.clientRoundId,
    round_ts: new Date(round.ts).toISOString(),
    mode: round.mode,
    mode_name: round.modeName,
    score: round.score,
    misses: round.misses,
    accuracy: round.accuracy,
    best_streak: round.bestStreak,
    median_reaction_time_ms: round.medianReactionTimeMs ?? null,
    benchmark_score: round.benchmarkScore ?? null,
  });

  // Duplicate key means this round already synced; treat as success.
  if (error && error.code !== DUPLICATE_KEY_ERROR_CODE) {
    console.error('Failed to sync round to cloud:', error.message);
  }
};

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StoredRound } from '../types/game';

const { insert, upsert, limit } = vi.hoisted(() => ({
  insert: vi.fn(),
  upsert: vi.fn(),
  limit: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: () => ({
      insert,
      upsert,
      select: () => ({
        eq: () => ({
          order: () => ({
            limit,
          }),
        }),
      }),
    }),
  },
}));

import { fetchCloudRounds, interpretUserRoundsWriteError, syncRoundToCloud, syncRoundsToCloud } from '../utils/roundSync';

const round = (clientRoundId: string): StoredRound => ({
  ts: Date.parse('2026-10-12T20:00:00.000Z'),
  clientRoundId,
  mode: 'quickTap',
  modeName: 'Quick Tap',
  score: 8,
  misses: 2,
  accuracy: 80,
  bestStreak: 3,
  medianReactionTimeMs: 230,
  meta: {
    metricsVersion: 1,
    quickTap: {
      scoringMethod: 'Median of in-app tap latencies.',
      browserSummary: 'iPhone · Safari',
      viewport: { width: 390, height: 844 },
      deviceKey: 'iPhone · Safari|390x844',
      hardwareLatencyCorrectionMs: null,
      validTrialCount: 4,
      accidentalTapCount: 0,
      backgroundDiscardCount: 0,
      unfinishedTrialCount: 0,
      comparabilityNote: 'Same phone only.',
    },
  },
});

describe('user_rounds idempotency', () => {
  beforeEach(() => {
    insert.mockReset();
    upsert.mockReset();
    limit.mockReset();
  });

  it('treats a duplicate client_round_id as already synced', () => {
    expect(interpretUserRoundsWriteError(null)).toBe('synced');
    expect(interpretUserRoundsWriteError({ code: '23505' })).toBe('synced');
    expect(interpretUserRoundsWriteError({ code: '42501' })).toBe('failed');
  });

  it('inserts once and ignores the duplicate write of the same athlete round', async () => {
    insert
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate key' } });

    const first = await syncRoundToCloud({ userId: 'athlete-a', round: round('round-1') });
    const second = await syncRoundToCloud({ userId: 'athlete-a', round: round('round-1') });

    expect(first).toBe('synced');
    expect(second).toBe('synced');
    expect(insert).toHaveBeenCalledTimes(2);
    expect(insert.mock.calls[0][0].client_round_id).toBe('round-1');
    expect(insert.mock.calls[0][0].user_id).toBe('athlete-a');
    expect(insert.mock.calls[0][0].median_reaction_time_ms).toBe(230);
    expect(insert.mock.calls[1][0].client_round_id).toBe('round-1');
  });

  it('retries a failed sync with the same client_round_id', async () => {
    insert
      .mockResolvedValueOnce({ error: { code: '08006', message: 'offline' } })
      .mockResolvedValueOnce({ error: null });

    const failed = await syncRoundToCloud({ userId: 'athlete-a', round: round('round-2') });
    const retried = await syncRoundToCloud({ userId: 'athlete-a', round: round('round-2') });

    expect(failed).toBe('failed');
    expect(retried).toBe('synced');
    expect(insert.mock.calls[0][0].client_round_id).toBe(insert.mock.calls[1][0].client_round_id);
  });

  it('upserts history with the user and client round conflict target', async () => {
    upsert.mockResolvedValue({ error: null });
    const status = await syncRoundsToCloud('athlete-a', [round('round-3')]);
    expect(status).toBe('synced');
    expect(upsert).toHaveBeenCalledWith(
      [expect.objectContaining({ user_id: 'athlete-a', client_round_id: 'round-3' })],
      { onConflict: 'user_id,client_round_id', ignoreDuplicates: true },
    );
  });

  it('drops missing and invalid cloud rows instead of inventing a round', async () => {
    limit.mockResolvedValue({
      data: [
        {
          client_round_id: 'kept',
          round_ts: '2026-10-12T20:00:00.000Z',
          mode: 'quickTap',
          mode_name: 'Quick Tap',
          sport: 'soccer',
          score: 4,
          misses: 1,
          accuracy: 80,
          best_streak: 2,
          median_reaction_time_ms: 210,
          benchmark_score: null,
          readiness_metrics: null,
          meta: null,
        },
        {
          client_round_id: 'bad-mode',
          round_ts: '2026-10-12T20:01:00.000Z',
          mode: 'not-a-mode',
          mode_name: 'Nope',
          score: 1,
          misses: 0,
          accuracy: 100,
          best_streak: 1,
        },
        {
          client_round_id: 'bad-time',
          round_ts: 'not-a-timestamp',
          mode: 'quickTap',
          mode_name: 'Quick Tap',
          score: 1,
          misses: 0,
          accuracy: 100,
          best_streak: 1,
        },
      ],
      error: null,
    });

    const history = await fetchCloudRounds('athlete-a');
    expect(history.status).toBe('synced');
    expect(history.rounds).toHaveLength(1);
    expect(history.rounds[0].clientRoundId).toBe('kept');
    expect(history.rounds[0].medianReactionTimeMs).toBe(210);
  });
});

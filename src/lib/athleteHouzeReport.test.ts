import { describe, expect, it, vi } from 'vitest';
import { buildGameSpeedRoundReport, deliveryIsDue, interpretHouzeDelivery, REACTION_LIMITATION } from './athleteHouzeReport';
import { handleGameSpeedLink, handleGameSpeedReport, recoverDueGameSpeedDeliveries, type HouzeDeps } from '../server/athleteHouzeHandlers';

const USER = '33333333-3333-4333-8333-333333333333';
const ROUND = '44444444-4444-4444-8444-444444444444';

const round = {
  clientRoundId: ROUND,
  occurredAt: '2026-10-22T18:00:00.000Z',
  mode: 'reactionBenchmark',
  sport: 'basketball',
  score: 12,
  misses: 3,
  accuracy: 80,
  bestStreak: 4,
  medianReactionTimeMs: 240,
  protocolVersion: 1,
};

function deps(overrides: Partial<HouzeDeps> = {}): HouzeDeps {
  return {
    env: {
      reportUrl: 'https://houze.test/api/app-reports',
      hmacSecret: 'test-secret',
      vercelEnv: 'production',
    },
    now: () => new Date('2026-10-22T18:00:02.000Z'),
    authenticate: async () => ({ id: USER }),
    loadRound: async () => ({
      client_round_id: ROUND,
      round_ts: round.occurredAt,
      mode: round.mode,
      sport: round.sport,
      score: round.score,
      misses: round.misses,
      accuracy: round.accuracy,
      best_streak: round.bestStreak,
      median_reaction_time_ms: 240,
      meta: { metricsVersion: 1 },
    }),
    loadEnrollment: async () => ({ linkedAt: '2026-10-22T17:00:00Z', backfillConsented: false }),
    recordDelivery: async () => undefined,
    recordEnrollment: async () => true,
    fetchImpl: vi.fn(async () => new Response(JSON.stringify({status: 'accepted', athleteId: USER}), { status: 201 })),
    ...overrides,
  };
}

describe('GameSpeed Houze delivery', () => {
  it('refuses an unlinked account without contacting Houze', async () => {
    const fetchImpl = vi.fn();
    const result = await handleGameSpeedReport(
      { authorization: 'Bearer token', body: { clientRoundId: ROUND } },
      deps({ loadEnrollment: async () => null, fetchImpl }),
    );
    expect(result.status).toBe(409);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('does not backfill pre-consent activity by default', async () => {
    const fetchImpl = vi.fn();
    const result = await handleGameSpeedReport(
      { authorization: 'Bearer token', body: { clientRoundId: ROUND } },
      deps({ loadEnrollment: async () => ({ linkedAt: '2026-10-22T19:00:00Z', backfillConsented: false }), fetchImpl }),
    );
    expect(result.body.reason).toBe('historical_sharing_not_consented');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('permits historical delivery only when backfill was consented', async () => {
    const result = await handleGameSpeedReport(
      { authorization: 'Bearer token', body: { clientRoundId: ROUND } },
      deps({ loadEnrollment: async () => ({ linkedAt: '2026-10-22T19:00:00Z', backfillConsented: true }) }),
    );
    expect(result.body.attachedToHouzeAthlete).toBe(true);
  });

  it('does not consume a pairing code when trusted storage is unavailable', async () => {
    const fetchImpl = vi.fn();
    const result = await handleGameSpeedLink(
      { authorization: 'Bearer token', body: { connectCode: 'AHGS-ABCD-EFGH', athleteConsent: true } },
      deps({ env: { reportUrl: 'https://houze.test/api/app-reports', hmacSecret: 'test', storageReady: false }, fetchImpl }),
    );
    expect(result.status).toBe(503);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns a recoverable link failure on receiver timeout', async () => {
    const result = await handleGameSpeedLink(
      { authorization: 'Bearer token', body: { connectCode: 'AHGS-ABCD-EFGH', athleteConsent: true } },
      deps({ fetchImpl: vi.fn().mockRejectedValue(new Error('timeout')) }),
    );
    expect(result.body).toMatchObject({ linked: false, error: 'receiver_unavailable' });
  });

  it('retains a round and records receiver failure', async () => {
    const recordDelivery = vi.fn();
    const result = await handleGameSpeedReport(
      { authorization: 'Bearer token', body: { clientRoundId: ROUND } },
      deps({ recordDelivery, fetchImpl: vi.fn().mockRejectedValue(new Error('offline')) }),
    );
    expect(result.body).toMatchObject({ retained: true, attachedToHouzeAthlete: false });
    expect(recordDelivery).toHaveBeenCalledWith(expect.objectContaining({ userId: USER, clientRoundId: ROUND, status: 'failed' }));
  });

  it('reports when Houze accepted delivery but the receipt was not stored', async () => {
    const result = await handleGameSpeedReport(
      { authorization: 'Bearer token', body: { clientRoundId: ROUND } },
      deps({ recordDelivery: vi.fn().mockRejectedValue(new Error('database unavailable')) }),
    );
    expect(result.status).toBe(503);
    expect(result.body).toMatchObject({ retained: true, attachedToHouzeAthlete: true, deliveryRecorded: false });
  });
  it('describes reaction time as an in-app measurement and keys the event by the round', () => {
    const report = buildGameSpeedRoundReport({
      round,
      externalAthleteId: USER,
      environment: 'production',
      reportedAt: '2026-10-22T18:00:02.000Z',
    });
    expect(report.eventId).toBe(`gamespeed-round-${ROUND}`);
    expect(report.idempotencyKey).toBe(`gamespeed:${ROUND}`);
    expect(report.evidencePayload.attributes.limitation).toBe(REACTION_LIMITATION);
    expect(JSON.stringify(report)).not.toMatch(/clinical|diagnosis/i);
    expect(report.evidencePayload.attributes.client_round_id).toBe(ROUND);
  });

  it('does not call a saved round attached when Houze has not linked the athlete', () => {
    expect(interpretHouzeDelivery(202).attachedToHouzeAthlete).toBe(false);
    expect(interpretHouzeDelivery(null)).toMatchObject({
      retained: true,
      attachedToHouzeAthlete: false,
      reason: 'receiver_unavailable',
    });
    expect(interpretHouzeDelivery(201, { status: 'accepted', athleteId: USER }).attachedToHouzeAthlete).toBe(true);
  });

  it('does not mistake a duplicate held report or malformed receipt for attachment', () => {
    expect(interpretHouzeDelivery(200, {status: 'duplicated', athleteId: null}).attachedToHouzeAthlete).toBe(false);
    expect(interpretHouzeDelivery(201, {}).attachedToHouzeAthlete).toBe(false);
    expect(interpretHouzeDelivery(200, {status: 'duplicated', athleteId: USER}).attachedToHouzeAthlete).toBe(true);
  });

  it('keeps the round when sharing is not configured', async () => {
    const result = await handleGameSpeedReport(
      { authorization: 'Bearer token', body: { clientRoundId: ROUND } },
      deps({ env: {} }),
    );
    expect(result.status).toBe(503);
    expect(result.body).toMatchObject({ retained: true, attachedToHouzeAthlete: false });
  });

  it('refuses to mark a link connected when local enrollment cannot be stored', async () => {
    const result = await handleGameSpeedLink(
      { authorization: 'Bearer token', body: { connectCode: 'ahgs-abcd-efgh', athleteConsent: true } },
      deps({ recordEnrollment: async () => false }),
    );
    expect(result.body).toMatchObject({ linked: false, houzeAccepted: true, enrollmentStored: false });
  });

  it('retries a saved round after the receiver recovers and then stops at the bound', async () => {
    const fetchImpl = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'accepted', athleteId: USER }), { status: 201 }));
    const receipts: Array<Record<string, unknown>> = [];
    const due = {
      userId: USER,
      clientRoundId: ROUND,
      attemptCount: 0,
      status: 'pending',
      nextAttemptAt: '2026-10-22T18:00:00.000Z',
    };
    const recoveryDeps = deps({
      fetchImpl,
      listDueDeliveries: async () => [due],
      loadRoundForUser: async () => ({
        client_round_id: ROUND,
        round_ts: round.occurredAt,
        mode: round.mode,
        sport: round.sport,
        score: round.score,
        misses: round.misses,
        accuracy: round.accuracy,
        best_streak: round.bestStreak,
        median_reaction_time_ms: 240,
        meta: { metricsVersion: 1 },
      }),
      loadEnrollmentForUser: async () => ({ linkedAt: '2026-10-22T17:00:00Z', backfillConsented: false }),
      claimDelivery: async () => true,
      recordDelivery: async (input) => { receipts.push(input); },
    });
    const first = await recoverDueGameSpeedDeliveries(recoveryDeps, { limit: 1 });
    expect(first.results[0]).toMatchObject({ retained: true, attachedToHouzeAthlete: false });
    expect(receipts[0]).toMatchObject({ status: 'failed', attemptCount: 1 });
    due.attemptCount = 4;
    const second = await recoverDueGameSpeedDeliveries(recoveryDeps, { limit: 1 });
    expect(second.results[0]?.attachedToHouzeAthlete).toBe(true);
    expect(receipts[1]).toMatchObject({ status: 'accepted' });
    expect(deliveryIsDue({ ...due, attemptCount: 5, status: 'failed', nextAttemptAt: '2026-10-22T18:00:00.000Z' }, new Date('2026-10-22T18:00:02.000Z'))).toBe(false);
  });

  it('does not send a pre-consent round during unattended recovery', async () => {
    const fetchImpl = vi.fn();
    const recordDelivery = vi.fn();
    const result = await recoverDueGameSpeedDeliveries(deps({
      fetchImpl,
      recordDelivery,
      listDueDeliveries: async () => [{
        userId: USER,
        clientRoundId: ROUND,
        attemptCount: 0,
        status: 'pending',
        nextAttemptAt: '2026-10-22T18:00:00.000Z',
      }],
      loadRoundForUser: async () => ({
        client_round_id: ROUND,
        round_ts: round.occurredAt,
        mode: round.mode,
        sport: round.sport,
        score: round.score,
        misses: round.misses,
        accuracy: round.accuracy,
        best_streak: round.bestStreak,
        median_reaction_time_ms: 240,
        meta: { metricsVersion: 1 },
      }),
      loadEnrollmentForUser: async () => ({ linkedAt: '2026-10-22T19:00:00Z', backfillConsented: false }),
      claimDelivery: async () => true,
    }), { limit: 1 });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.results[0]?.reason).toBe('historical_sharing_not_consented');
    expect(recordDelivery).toHaveBeenCalledWith(expect.objectContaining({ status: 'unattached' }));
  });

  it('requires explicit consent before redeeming a code', async () => {
    const fetchImpl = vi.fn();
    const result = await handleGameSpeedLink(
      { authorization: 'Bearer token', body: { connectCode: 'AHGS-ABCD-EFGH', athleteConsent: false } },
      deps({ fetchImpl }),
    );
    expect(result.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

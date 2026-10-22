import { describe, expect, it, vi } from 'vitest';
import { buildGameSpeedRoundReport, interpretHouzeDelivery, REACTION_LIMITATION } from './athleteHouzeReport';
import { handleGameSpeedLink, handleGameSpeedReport, type HouzeDeps } from '../server/athleteHouzeHandlers';

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
    loadEnrollment: async () => 'linked',
    recordDelivery: async () => undefined,
    recordEnrollment: async () => true,
    fetchImpl: vi.fn(async () => new Response('{"status":"accepted"}', { status: 201 })),
    ...overrides,
  };
}

describe('GameSpeed Houze delivery', () => {
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
    expect(interpretHouzeDelivery(201).attachedToHouzeAthlete).toBe(true);
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

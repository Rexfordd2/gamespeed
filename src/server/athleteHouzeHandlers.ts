import { createHmac } from 'node:crypto';
import {
  buildGameSpeedRoundReport,
  deliveryIsDue,
  HOUZE_RECOVERY_MAX_ATTEMPTS,
  interpretHouzeDelivery,
  nextRecoverySchedule,
  sourceEnvironmentFromDeploy,
  type DueDelivery,
  type GameSpeedRoundDelivery,
  type HouzeDeliveryRead,
} from '../lib/athleteHouzeReport';

export type HandlerResult = { status: number; body: Record<string, unknown> };

type FetchLike = typeof fetch;

export type HouzeServerEnv = {
  reportUrl?: string;
  hmacSecret?: string;
  vercelEnv?: string;
  nodeEnv?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  storageReady?: boolean;
};

type AuthUser = { id: string };
type RoundRow = {
  client_round_id: string;
  round_ts: string;
  mode: string;
  sport: string | null;
  score: number;
  misses: number;
  accuracy: number;
  best_streak: number;
  median_reaction_time_ms: number | null;
  meta: { metricsVersion?: number } | null;
};

export type HouzeDeps = {
  env: HouzeServerEnv;
  fetchImpl?: FetchLike;
  now?: () => Date;
  authenticate: (accessToken: string) => Promise<AuthUser | null>;
  loadRound: (userId: string, clientRoundId: string, accessToken: string) => Promise<RoundRow | null>;
  loadEnrollment: (userId: string, accessToken: string) => Promise<{ linkedAt: string; backfillConsented: boolean } | null>;
  recordDelivery: (input: {
    userId: string;
    clientRoundId: string;
    status: 'accepted' | 'unattached' | 'failed';
    receiverStatus: number | null;
    accessToken: string;
    attemptCount?: number;
    nextAttemptAt?: string;
  }) => Promise<void>;
  listDueDeliveries?: (limit: number, now: Date) => Promise<DueDelivery[]>;
  loadRoundForUser?: (userId: string, clientRoundId: string) => Promise<RoundRow | null>;
  loadEnrollmentForUser?: (userId: string) => Promise<{ linkedAt: string; backfillConsented: boolean } | null>;
  claimDelivery?: (row: DueDelivery, now: Date) => Promise<boolean>;
  recordEnrollment: (input: {
    userId: string;
    status: 'linked';
    accessToken: string;
    backfillConsented: boolean;
  }) => Promise<boolean>;
};

function bearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

function sign(rawBody: string, timestamp: number, secret: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest('hex');
}

function linkEndpoint(reportUrl: string): string {
  const url = new URL(reportUrl);
  url.pathname = '/api/integrations/gamespeed/complete-link';
  url.search = '';
  return url.toString();
}

export async function handleGameSpeedLink(
  input: { authorization?: string; body: unknown },
  deps: HouzeDeps,
): Promise<HandlerResult> {
  const token = bearer(input.authorization);
  if (!token) return { status: 401, body: { linked: false, error: 'sign_in_required' } };
  const body = input.body as { connectCode?: unknown; athleteConsent?: unknown; backfillConsented?: unknown };
  if (body?.athleteConsent !== true || typeof body.connectCode !== 'string') {
    return { status: 400, body: { linked: false, error: 'consent_required' } };
  }
  const user = await deps.authenticate(token);
  if (!user) return { status: 401, body: { linked: false, error: 'sign_in_required' } };
  if (!deps.env.reportUrl || !deps.env.hmacSecret || deps.env.storageReady === false) {
    return { status: 503, body: { linked: false, error: 'sharing_not_configured' } };
  }

  const rawBody = JSON.stringify({
    connectCode: body.connectCode.trim().toUpperCase(),
    externalAthleteId: user.id,
    athleteConsent: true,
    backfillConsented: body.backfillConsented === true,
  });
  const timestamp = Math.floor((deps.now?.() ?? new Date()).getTime() / 1000);
  let response: Response;
  try {
    response = await (deps.fetchImpl ?? fetch)(linkEndpoint(deps.env.reportUrl), {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-ah-timestamp': String(timestamp),
      'x-ah-signature': `sha256=${sign(rawBody, timestamp, deps.env.hmacSecret)}`,
      'x-ah-source': 'gamespeed',
    },
    body: rawBody,
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
    });
  } catch {
    return { status: 502, body: { linked: false, error: 'receiver_unavailable' } };
  }
  if (!response.ok) {
    return { status: response.status, body: { linked: false, error: 'link_refused' } };
  }
  const stored = await deps.recordEnrollment({ userId: user.id, status: 'linked', accessToken: token, backfillConsented: body.backfillConsented === true });
  if (!stored) {
    return {
      status: 502,
      body: {
        linked: false,
        houzeAccepted: true,
        enrollmentStored: false,
        error: 'enrollment_unstored',
      },
    };
  }
  return { status: 200, body: { linked: true, enrollmentStored: true } };
}

export async function handleGameSpeedReport(
  input: { authorization?: string; body: unknown },
  deps: HouzeDeps,
): Promise<HandlerResult> {
  const token = bearer(input.authorization);
  if (!token) {
    return { status: 401, body: { retained: true, attachedToHouzeAthlete: false, reason: 'sign_in_required' } };
  }
  const clientRoundId = (input.body as { clientRoundId?: unknown })?.clientRoundId;
  if (typeof clientRoundId !== 'string' || clientRoundId.length < 8) {
    return { status: 400, body: { retained: true, attachedToHouzeAthlete: false, reason: 'invalid_round' } };
  }
  const user = await deps.authenticate(token);
  if (!user) {
    return { status: 401, body: { retained: true, attachedToHouzeAthlete: false, reason: 'sign_in_required' } };
  }
  const round = await deps.loadRound(user.id, clientRoundId, token);
  if (!round) {
    return { status: 404, body: { retained: true, attachedToHouzeAthlete: false, reason: 'round_not_saved' } };
  }
  if (!deps.env.reportUrl || !deps.env.hmacSecret || deps.env.storageReady === false) {
    return { status: 503, body: { retained: true, attachedToHouzeAthlete: false, reason: 'sharing_not_configured' } };
  }
  const enrollment = await deps.loadEnrollment(user.id, token);
  if (!enrollment) {
    return { status: 409, body: { retained: true, attachedToHouzeAthlete: false, reason: 'not_linked' } };
  }
  const occurredAt = Date.parse(round.round_ts);
  const linkedAt = Date.parse(enrollment.linkedAt);
  if (!Number.isFinite(occurredAt) || !Number.isFinite(linkedAt) ||
      (!enrollment.backfillConsented && occurredAt < linkedAt)) {
    await deps.recordDelivery({ userId: user.id, clientRoundId, status: 'unattached', receiverStatus: null, accessToken: token });
    return { status: 409, body: { retained: true, attachedToHouzeAthlete: false, reason: 'historical_sharing_not_consented' } };
  }

  const delivery: GameSpeedRoundDelivery = {
    clientRoundId: round.client_round_id,
    occurredAt: round.round_ts,
    mode: round.mode,
    sport: round.sport ?? 'unspecified',
    score: round.score,
    misses: round.misses,
    accuracy: round.accuracy,
    bestStreak: round.best_streak,
    medianReactionTimeMs: round.median_reaction_time_ms,
    protocolVersion: round.meta?.metricsVersion ?? 1,
  };
  const reportedAt = (deps.now?.() ?? new Date()).toISOString();
  const report = buildGameSpeedRoundReport({
    round: delivery,
    externalAthleteId: user.id,
    environment: sourceEnvironmentFromDeploy(deps.env.vercelEnv, deps.env.nodeEnv),
    reportedAt,
  });
  const rawBody = JSON.stringify(report);
  const timestamp = Math.floor(Date.parse(reportedAt) / 1000);
  let receiverStatus: number | null = null;
  let acknowledgement: unknown = null;
  try {
    const response = await (deps.fetchImpl ?? fetch)(deps.env.reportUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-ah-timestamp': String(timestamp),
        'x-ah-signature': `sha256=${sign(rawBody, timestamp, deps.env.hmacSecret)}`,
        'x-ah-source': 'gamespeed',
      },
      body: rawBody,
      signal: AbortSignal.timeout(10_000),
      redirect: 'error',
    });
    receiverStatus = response.status;
    acknowledgement = await response.json().catch(() => null);
  } catch {
    receiverStatus = null;
  }
  const read = interpretHouzeDelivery(receiverStatus, acknowledgement);
  const now = deps.now?.() ?? new Date();
  try {
    await deps.recordDelivery({
    userId: user.id,
    clientRoundId,
    status: read.attachedToHouzeAthlete ? 'accepted' : read.reason === 'identity_unresolved' ? 'unattached' : 'failed',
    receiverStatus,
    accessToken: token,
    ...(read.attachedToHouzeAthlete || read.reason === 'identity_unresolved'
      ? {}
      : { nextAttemptAt: nextRecoverySchedule(1, now) }),
    });
  } catch {
    return { status: 503, body: { ...read, deliveryRecorded: false, reason: 'delivery_receipt_unstored' } };
  }
  return { status: read.attachedToHouzeAthlete ? 200 : 502, body: read };
}

const PERMANENT_RECEIVER = new Set([400, 401, 403, 413]);

function recoveryReceipt(read: HouzeDeliveryRead, attemptCount: number, now: Date) {
  if (read.attachedToHouzeAthlete) {
    return { status: 'accepted' as const, attemptCount, nextAttemptAt: undefined, receiverStatus: read.receiverStatus };
  }
  if (read.reason === 'identity_unresolved' || read.reason === 'historical_sharing_not_consented') {
    return { status: 'unattached' as const, attemptCount, nextAttemptAt: undefined, receiverStatus: read.receiverStatus };
  }
  const permanent = read.receiverStatus != null && PERMANENT_RECEIVER.has(read.receiverStatus);
  const exhausted = permanent || attemptCount >= HOUZE_RECOVERY_MAX_ATTEMPTS;
  return {
    status: 'failed' as const,
    attemptCount: exhausted ? HOUZE_RECOVERY_MAX_ATTEMPTS : attemptCount,
    nextAttemptAt: exhausted ? undefined : nextRecoverySchedule(attemptCount, now),
    receiverStatus: read.receiverStatus,
  };
}

/**
 * Sends due saved rounds without a person sitting on the sharing panel.
 * The source round stays. Attempts stop after the bound, including an expired
 * in-flight lease. Historical rounds stay unattached unless backfill was consented.
 */
export async function recoverDueGameSpeedDeliveries(
  deps: HouzeDeps,
  options?: { limit?: number },
): Promise<{ attempted: number; results: HouzeDeliveryRead[] }> {
  const now = deps.now?.() ?? new Date();
  const due = (await deps.listDueDeliveries?.(options?.limit ?? 10, now) ?? []).filter((row) => deliveryIsDue(row, now));
  const results: HouzeDeliveryRead[] = [];
  if (!deps.env.reportUrl || !deps.env.hmacSecret || deps.env.storageReady === false) {
    return { attempted: 0, results };
  }
  for (const row of due) {
    const claimed = await deps.claimDelivery?.(row, now);
    if (!claimed) continue;
    const attemptCount = row.attemptCount + 1;
    const enrollment = await deps.loadEnrollmentForUser?.(row.userId) ?? null;
    const round = await deps.loadRoundForUser?.(row.userId, row.clientRoundId) ?? null;
    if (!enrollment || !round) {
      const read: HouzeDeliveryRead = {
        retained: true,
        attachedToHouzeAthlete: false,
        receiverStatus: null,
        reason: 'not_linked',
      };
      await deps.recordDelivery({
        userId: row.userId,
        clientRoundId: row.clientRoundId,
        status: 'unattached',
        receiverStatus: null,
        accessToken: '',
        attemptCount,
      });
      results.push(read);
      continue;
    }
    const occurredAt = Date.parse(round.round_ts);
    const linkedAt = Date.parse(enrollment.linkedAt);
    if (!enrollment.backfillConsented && (!Number.isFinite(occurredAt) || !Number.isFinite(linkedAt) || occurredAt < linkedAt)) {
      const read: HouzeDeliveryRead = {
        retained: true,
        attachedToHouzeAthlete: false,
        receiverStatus: null,
        reason: 'historical_sharing_not_consented',
      };
      const receipt = recoveryReceipt(read, attemptCount, now);
      await deps.recordDelivery({
        userId: row.userId,
        clientRoundId: row.clientRoundId,
        status: receipt.status,
        receiverStatus: null,
        accessToken: '',
        attemptCount: receipt.attemptCount,
        nextAttemptAt: receipt.nextAttemptAt,
      });
      results.push(read);
      continue;
    }
    const delivery: GameSpeedRoundDelivery = {
      clientRoundId: round.client_round_id,
      occurredAt: round.round_ts,
      mode: round.mode,
      sport: round.sport ?? 'unspecified',
      score: round.score,
      misses: round.misses,
      accuracy: round.accuracy,
      bestStreak: round.best_streak,
      medianReactionTimeMs: round.median_reaction_time_ms,
      protocolVersion: round.meta?.metricsVersion ?? 1,
    };
    const reportedAt = now.toISOString();
    const report = buildGameSpeedRoundReport({
      round: delivery,
      externalAthleteId: row.userId,
      environment: sourceEnvironmentFromDeploy(deps.env.vercelEnv, deps.env.nodeEnv),
      reportedAt,
    });
    const rawBody = JSON.stringify(report);
    const timestamp = Math.floor(now.getTime() / 1000);
    let receiverStatus: number | null = null;
    let acknowledgement: unknown = null;
    try {
      const response = await (deps.fetchImpl ?? fetch)(deps.env.reportUrl, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-ah-timestamp': String(timestamp),
          'x-ah-signature': `sha256=${sign(rawBody, timestamp, deps.env.hmacSecret)}`,
          'x-ah-source': 'gamespeed',
        },
        body: rawBody,
        signal: AbortSignal.timeout(10_000),
        redirect: 'error',
      });
      receiverStatus = response.status;
      acknowledgement = await response.json().catch(() => null);
    } catch {
      receiverStatus = null;
    }
    const read = interpretHouzeDelivery(receiverStatus, acknowledgement);
    const receipt = recoveryReceipt(read, attemptCount, now);
    await deps.recordDelivery({
      userId: row.userId,
      clientRoundId: row.clientRoundId,
      status: receipt.status,
      receiverStatus: receipt.receiverStatus,
      accessToken: '',
      attemptCount: receipt.attemptCount,
      nextAttemptAt: receipt.nextAttemptAt,
    });
    results.push(read);
  }
  return { attempted: results.length, results };
}

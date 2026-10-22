import { createHmac } from 'node:crypto';
import {
  buildGameSpeedRoundReport,
  interpretHouzeDelivery,
  sourceEnvironmentFromDeploy,
  type GameSpeedRoundDelivery,
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
  }) => Promise<void>;
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
  try {
    await deps.recordDelivery({
    userId: user.id,
    clientRoundId,
    status: read.attachedToHouzeAthlete ? 'accepted' : read.reason === 'identity_unresolved' ? 'unattached' : 'failed',
    receiverStatus,
    accessToken: token,
    });
  } catch {
    return { status: 503, body: { ...read, deliveryRecorded: false, reason: 'delivery_receipt_unstored' } };
  }
  return { status: read.attachedToHouzeAthlete ? 200 : 502, body: read };
}

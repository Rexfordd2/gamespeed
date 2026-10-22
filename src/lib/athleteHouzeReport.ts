export const REACTION_LIMITATION =
  'Reaction times are in-app measurements for this drill. They are not a measure of on-field ability or neurological function.';

export type GameSpeedRoundDelivery = {
  clientRoundId: string;
  occurredAt: string;
  mode: string;
  sport: string;
  score: number;
  misses: number;
  accuracy: number;
  bestStreak: number;
  medianReactionTimeMs?: number | null;
  protocolVersion?: number | null;
};

export type HouzeDeliveryRead = {
  retained: true;
  attachedToHouzeAthlete: boolean;
  receiverStatus: number | null;
  reason: string;
};

export function sourceEnvironmentFromDeploy(
  vercelEnv: string | undefined,
  nodeEnv: string | undefined,
): 'local' | 'test' | 'preview' | 'production' {
  if (vercelEnv === 'production') return 'production';
  if (vercelEnv === 'preview') return 'preview';
  if (nodeEnv === 'test') return 'test';
  return 'local';
}

export function buildGameSpeedRoundReport(input: {
  round: GameSpeedRoundDelivery;
  externalAthleteId: string;
  environment: 'local' | 'test' | 'preview' | 'production';
  reportedAt: string;
}) {
  const measurements = [{ name: 'score', value: input.round.score, unit: 'points' }];
  if (typeof input.round.medianReactionTimeMs === 'number') {
    measurements.push({
      name: 'medianReactionTimeMs',
      value: input.round.medianReactionTimeMs,
      unit: 'ms',
    });
  }
  return {
    schemaVersion: '1.0.0',
    eventId: `gamespeed-round-${input.round.clientRoundId}`,
    eventType: 'gamespeed.round.completed',
    sourceSystem: 'gamespeed',
    sourceEnvironment: input.environment,
    externalAthleteId: input.externalAthleteId,
    occurredAt: input.round.occurredAt,
    receivedAt: input.reportedAt,
    sourceRecordId: input.round.clientRoundId,
    evidenceCategory: 'performance',
    verificationStatus: 'source_attested',
    consentScope: 'support_team',
    idempotencyKey: `gamespeed:${input.round.clientRoundId}`,
    evidencePayload: {
      title: 'GameSpeed round completed',
      summary: `In-app drill result. ${REACTION_LIMITATION}`,
      metrics: {
        score: input.round.score,
        accuracy: input.round.accuracy,
        misses: input.round.misses,
        bestStreak: input.round.bestStreak,
      },
      measurements,
      attributes: {
        client_round_id: input.round.clientRoundId,
        mode: input.round.mode,
        sport: input.round.sport,
        protocolVersion: input.round.protocolVersion ?? 1,
        limitation: REACTION_LIMITATION,
      },
    },
    units: {
      score: 'points',
      ...(typeof input.round.medianReactionTimeMs === 'number'
        ? { medianReactionTimeMs: 'ms' }
        : {}),
    },
    provenance: {
      sourceReferences: [{ type: 'gamespeed_round', id: input.round.clientRoundId }],
      deviceOrSystem: 'gamespeed',
    },
    confidence: { dataQuality: 'medium' as const, score: 0.6 },
  };
}

/** A receiver acknowledgement is not attachment until Houze accepted the athlete link. */
export function interpretHouzeDelivery(status: number | null, acknowledgement?: unknown): HouzeDeliveryRead {
  const receipt = acknowledgement as { athleteId?: unknown; status?: unknown; identityStatus?: unknown } | null;
  const attached = receipt && typeof receipt.athleteId === 'string' && receipt.athleteId.length > 0
    && (receipt.status === 'accepted' || receipt.status === 'duplicated');
  if ((status === 200 || status === 201) && attached) {
    return {
      retained: true,
      attachedToHouzeAthlete: true,
      receiverStatus: status,
      reason: status === 200 ? 'duplicate' : 'accepted',
    };
  }
  if (status === 202 || ((status === 200 || status === 201) && receipt?.athleteId === null)) {
    return {
      retained: true,
      attachedToHouzeAthlete: false,
      receiverStatus: status,
      reason: 'identity_unresolved',
    };
  }
  return {
    retained: true,
    attachedToHouzeAthlete: false,
    receiverStatus: status,
    reason: status === null ? 'receiver_unavailable' : 'receiver_rejected',
  };
}

import { GameStats, RoundProvenance, StoredRound } from '../types/game';

/** Taps faster than this are treated as accidental and left unscored. */
export const QUICK_TAP_ACCIDENTAL_TAP_MS = 100;

export const QUICK_TAP_SCORING_METHOD =
  'Median of in-app tap latencies, measured from cue createdAt to the tap, in milliseconds. No hardware latency correction is applied.';

export const QUICK_TAP_COMPARABILITY_NOTE =
  'Compare Quick Tap rounds on the same phone and browser. Results from other devices are potentially noncomparable.';

export const QUICK_TAP_CLAIM_LIMIT =
  'These figures are practice tap latencies and hit rates inside this web app. They do not show faster neural conduction, faster on-field reactions, higher football IQ, improved recruiting potential, or lab-grade reaction time.';

export const QUICK_TAP_TASK_COPY =
  'One target appears. Tap it before it vanishes. A hit is a tap on the live target. A miss is a target that disappears first. Taps faster than 100 ms are accidental and are not scored. If this tab goes to the background, the round pauses and the cue on screen is discarded.';

export const QUICK_TAP_FIELD_INSTRUCTION =
  'Tap the target before it vanishes. Taps under 100 ms are ignored. Leaving this tab pauses the round.';

const CONSENT_STORAGE_KEY = 'gamespeed_quick_tap_storage_consent_v1';

export type StorageConsent = 'unknown' | 'granted' | 'declined';

export type CloudSyncStatus =
  | 'idle'
  | 'synced'
  | 'failed'
  | 'local-only'
  | 'unconfigured'
  | 'unsaved';

export type QuickTapComparisonKind =
  | 'unsaved'
  | 'first-baseline'
  | 'same-device'
  | 'noncomparable'
  | 'missing-latency';

export interface QuickTapComparison {
  kind: QuickTapComparisonKind;
  summary: string;
  medianDeltaMs: number | null;
  accuracyDelta: number | null;
}

export const quickTapTouchTargetPx = (coarsePointer: boolean): number => (coarsePointer ? 84 : 70);

export const classifyQuickTapLatency = (latencyMs: number): 'valid' | 'accidental' => {
  if (!Number.isFinite(latencyMs) || latencyMs < QUICK_TAP_ACCIDENTAL_TAP_MS) {
    return 'accidental';
  }
  return 'valid';
};

export const medianTapLatencyMs = (times: number[]): number | undefined => {
  const valid = times.filter(
    time => Number.isFinite(time) && time >= QUICK_TAP_ACCIDENTAL_TAP_MS,
  );
  if (valid.length === 0) return undefined;
  const sorted = [...valid].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
};

export const summarizeBrowser = (userAgent: string): string => {
  const ua = userAgent || '';
  const device = /iPhone/i.test(ua)
    ? 'iPhone'
    : /iPad/i.test(ua)
      ? 'iPad'
      : /Android/i.test(ua)
        ? 'Android'
        : /Mobile/i.test(ua)
          ? 'Mobile'
          : 'Desktop';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /CriOS|Chrome\//.test(ua)
      ? 'Chrome'
      : /FxiOS|Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  return `${device} · ${browser}`;
};

export const buildDeviceKey = (userAgent: string, width: number, height: number): string =>
  `${summarizeBrowser(userAgent)}|${Math.round(width)}x${Math.round(height)}`;

export const captureRoundProvenance = (input: {
  userAgent: string;
  width: number;
  height: number;
  validTrialCount: number;
  accidentalTapCount: number;
  backgroundDiscardCount: number;
  unfinishedTrialCount: number;
}): RoundProvenance => ({
  scoringMethod: QUICK_TAP_SCORING_METHOD,
  browserSummary: summarizeBrowser(input.userAgent),
  viewport: {
    width: Math.max(0, Math.round(input.width)),
    height: Math.max(0, Math.round(input.height)),
  },
  deviceKey: buildDeviceKey(input.userAgent, input.width, input.height),
  hardwareLatencyCorrectionMs: null,
  validTrialCount: Math.max(0, input.validTrialCount),
  accidentalTapCount: Math.max(0, input.accidentalTapCount),
  backgroundDiscardCount: Math.max(0, input.backgroundDiscardCount),
  unfinishedTrialCount: Math.max(0, input.unfinishedTrialCount),
  comparabilityNote: QUICK_TAP_COMPARABILITY_NOTE,
});

export const readStorageConsent = (): StorageConsent => {
  try {
    const value = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (value === 'granted' || value === 'declined') return value;
    return 'unknown';
  } catch {
    return 'unknown';
  }
};

export const writeStorageConsent = (value: 'granted' | 'declined'): void => {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // Private mode or quota. The in-memory choice still applies to this screen.
  }
};

export const quickTapSaveDecision = (consent: StorageConsent): 'save' | 'hold' =>
  consent === 'granted' ? 'save' : 'hold';

export const findPreviousQuickTapRound = (
  stats: GameStats,
  currentClientRoundId?: string,
): StoredRound | null => {
  const previous = stats.rounds
    .filter(round => round.mode === 'quickTap' && round.clientRoundId !== currentClientRoundId)
    .sort((a, b) => b.ts - a.ts);
  return previous[0] ?? null;
};

const formatLatencyDelta = (deltaMs: number): string => {
  if (deltaMs > 0) {
    return `Median tap latency is ${deltaMs} ms shorter than the previous Quick Tap round.`;
  }
  if (deltaMs < 0) {
    return `Median tap latency is ${Math.abs(deltaMs)} ms longer than the previous Quick Tap round.`;
  }
  return 'Median tap latency matches the previous Quick Tap round.';
};

export const compareQuickTapRounds = (input: {
  saved: boolean;
  accuracy: number;
  medianReactionTimeMs?: number;
  deviceKey?: string;
  previous: StoredRound | null;
}): QuickTapComparison => {
  const { previous } = input;
  if (input.medianReactionTimeMs === undefined) {
    return {
      kind: 'missing-latency',
      summary: input.saved
        ? 'No valid taps were stored, so this round has no median tap latency to compare.'
        : 'No valid taps were recorded, and this round is not saved yet.',
      medianDeltaMs: null,
      accuracyDelta: previous ? input.accuracy - previous.accuracy : null,
    };
  }

  if (!previous) {
    return {
      kind: input.saved ? 'first-baseline' : 'unsaved',
      summary: input.saved
        ? 'First stored Quick Tap baseline on this device. Complete another round to compare.'
        : 'This round is not saved yet. No earlier Quick Tap round is stored on this device.',
      medianDeltaMs: null,
      accuracyDelta: null,
    };
  }

  const previousMedian = previous.medianReactionTimeMs;
  const medianDeltaMs =
    previousMedian !== undefined ? previousMedian - input.medianReactionTimeMs : null;
  const accuracyDelta = input.accuracy - previous.accuracy;
  const currentKey = input.deviceKey;
  const previousKey = previous.meta?.quickTap?.deviceKey;
  const sameDevice = Boolean(currentKey && previousKey && currentKey === previousKey);
  const latencySentence =
    medianDeltaMs === null
      ? 'The earlier round has no tap-latency record.'
      : formatLatencyDelta(medianDeltaMs);
  const accuracySentence = `Accuracy ${accuracyDelta >= 0 ? '+' : ''}${accuracyDelta} percentage points.`;

  if (!input.saved) {
    const deviceSentence = sameDevice
      ? ''
      : 'Device records differ, so this preview is potentially noncomparable. ';
    return {
      kind: 'unsaved',
      summary: `This round is not saved yet. ${deviceSentence}Against the previous stored round: ${latencySentence} ${accuracySentence}`,
      medianDeltaMs,
      accuracyDelta,
    };
  }

  if (!sameDevice) {
    return {
      kind: 'noncomparable',
      summary: `Potentially noncomparable. These rounds do not share a device and browser record, and no hardware latency correction is applied. ${latencySentence} ${accuracySentence}`,
      medianDeltaMs,
      accuracyDelta,
    };
  }

  return {
    kind: 'same-device',
    summary: `Same-device comparison. ${latencySentence} ${accuracySentence} ${QUICK_TAP_COMPARABILITY_NOTE}`,
    medianDeltaMs,
    accuracyDelta,
  };
};

export const describeQuickTapSync = (
  status: CloudSyncStatus,
  isSignedIn: boolean,
): string => {
  switch (status) {
    case 'synced':
      return 'Saved on this device and accepted on the signed-in user_rounds path. A repeat of the same client_round_id is ignored.';
    case 'failed':
      return 'Saved on this device. Cloud sync failed. Retry sends the same client_round_id.';
    case 'unconfigured':
      return 'Saved on this device. Cloud sync is not configured in this build, so nothing was sent to user_rounds.';
    case 'local-only':
      return 'Saved on this device only. No signed-in account is available, so this round was not sent to user_rounds.';
    case 'unsaved':
      return 'Not saved. Choose save to store this round on this device.';
    default:
      return isSignedIn
        ? 'Save state is not confirmed yet.'
        : 'No signed-in account is available.';
  }
};

export const buildQuickTapExportSummary = (input: {
  ts: number;
  score: number;
  misses: number;
  accuracy: number;
  medianReactionTimeMs?: number;
  provenance?: RoundProvenance;
  comparison: QuickTapComparison;
  syncLabel: string;
  clientRoundId?: string;
}): string => {
  const provenance = input.provenance;
  const median =
    input.medianReactionTimeMs === undefined ? 'not available' : `${input.medianReactionTimeMs} ms`;
  return [
    'GameSpeed Quick Tap practice summary',
    'Mode: Quick Tap',
    `Session time: ${new Date(input.ts).toISOString()}`,
    `Client round id: ${input.clientRoundId ?? 'not assigned'}`,
    `Device/browser: ${provenance?.browserSummary ?? 'not recorded'}`,
    `Viewport: ${provenance ? `${provenance.viewport.width}x${provenance.viewport.height}` : 'not recorded'}`,
    `Scoring method: ${provenance?.scoringMethod ?? QUICK_TAP_SCORING_METHOD}`,
    'Hardware latency correction: none',
    `Hits: ${input.score}`,
    `Misses: ${input.misses}`,
    `Accuracy: ${input.accuracy}%`,
    `Median tap latency: ${median}`,
    `Valid taps: ${provenance?.validTrialCount ?? 'not recorded'}`,
    `Accidental taps excluded: ${provenance?.accidentalTapCount ?? 'not recorded'}`,
    `Cues discarded because the tab was backgrounded: ${provenance?.backgroundDiscardCount ?? 'not recorded'}`,
    `Cues still on screen when the round ended: ${provenance?.unfinishedTrialCount ?? 'not recorded'}`,
    `Comparison: ${input.comparison.summary}`,
    `Save/sync: ${input.syncLabel}`,
    QUICK_TAP_CLAIM_LIMIT,
    'Athlete Houze identity pairing: not connected. This is a manual export pending a verified signed reporting path.',
  ].join('\n');
};

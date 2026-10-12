import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { generateTargets as quickTap } from '../modes/quickTap';
import { GameResult, StoredRound } from '../types/game';
import {
  QUICK_TAP_CLAIM_LIMIT,
  buildQuickTapExportSummary,
  classifyQuickTapLatency,
  compareQuickTapRounds,
  medianTapLatencyMs,
  quickTapSaveDecision,
  quickTapTouchTargetPx,
  readStorageConsent,
  summarizeBrowser,
  writeStorageConsent,
} from '../utils/quickTapBaseline';
import {
  loadStats,
  mergeStoredRounds,
  recordRound,
  setStatsStorageOwner,
} from '../utils/sessionStats';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const provenance = {
  scoringMethod: 'Median of in-app tap latencies.',
  browserSummary: 'iPhone · Safari',
  viewport: { width: 390, height: 844 },
  deviceKey: 'iPhone · Safari|390x844',
  hardwareLatencyCorrectionMs: null,
  validTrialCount: 4,
  accidentalTapCount: 1,
  backgroundDiscardCount: 1,
  unfinishedTrialCount: 0,
  comparabilityNote: 'Same phone only.',
};

const quickTapResult = (overrides: Partial<GameResult> = {}): GameResult => ({
  score: 8,
  misses: 2,
  bestStreak: 3,
  mode: 'quickTap',
  modeName: 'Quick Tap',
  totalAttempts: 10,
  reactionTimesMs: [180, 220, 260, 240],
  medianReactionTimeMs: 230,
  provenance,
  ...overrides,
});

describe('Quick Tap baseline contract', () => {
  afterEach(() => {
    localStorage.clear();
    setStatsStorageOwner(null);
  });

  it('keeps Quick Tap as the single-cue baseline and excludes accidental taps', () => {
    expect(classifyQuickTapLatency(99)).toBe('accidental');
    expect(classifyQuickTapLatency(100)).toBe('valid');
    expect(medianTapLatencyMs([40, 180, 220, 300])).toBe(220);
    expect(medianTapLatencyMs([20, 40])).toBeUndefined();
  });

  it('uses a touch target large enough for a phone and keeps iPhone cues inside the margins', () => {
    expect(quickTapTouchTargetPx(true)).toBeGreaterThanOrEqual(44);
    expect(quickTapTouchTargetPx(false)).toBeGreaterThanOrEqual(44);
    for (let i = 0; i < 20; i += 1) {
      const [target] = quickTap({
        screenSize: { width: 390, height: 844 },
        existingTargets: [],
      });
      expect(target.x).toBeGreaterThanOrEqual(16);
      expect(target.x).toBeLessThanOrEqual(84);
      expect(target.y).toBeGreaterThanOrEqual(15);
      expect(target.y).toBeLessThanOrEqual(85);
    }
  });

  it('stores consent without saving a declined Quick Tap round', () => {
    expect(readStorageConsent()).toBe('unknown');
    expect(quickTapSaveDecision('unknown')).toBe('hold');
    writeStorageConsent('declined');
    expect(readStorageConsent()).toBe('declined');
    expect(quickTapSaveDecision('declined')).toBe('hold');
    writeStorageConsent('granted');
    expect(quickTapSaveDecision(readStorageConsent())).toBe('save');
  });

  it('isolates synthetic account A and B local rounds', () => {
    setStatsStorageOwner('athlete-a');
    recordRound(quickTapResult(), { clientRoundId: 'round-a', ts: 1_000 });
    setStatsStorageOwner('athlete-b');
    expect(loadStats().rounds).toHaveLength(0);
    recordRound(quickTapResult({ score: 3, misses: 1 }), { clientRoundId: 'round-b', ts: 2_000 });
    expect(loadStats().rounds.map(round => round.clientRoundId)).toEqual(['round-b']);
    setStatsStorageOwner('athlete-a');
    expect(loadStats().rounds.map(round => round.clientRoundId)).toEqual(['round-a']);
  });

  it('keeps a duplicate client_round_id as one local round and preserves provenance', () => {
    const first = recordRound(quickTapResult(), { clientRoundId: 'same-round', ts: 1_700 });
    const second = recordRound(quickTapResult({ score: 99 }), { clientRoundId: 'same-round', ts: 1_800 });
    expect(second).toEqual(first);
    expect(loadStats().rounds).toHaveLength(1);
    expect(loadStats().rounds[0].medianReactionTimeMs).toBe(230);
    expect(loadStats().rounds[0].benchmarkScore).toBeUndefined();
    expect(loadStats().rounds[0].meta?.quickTap?.hardwareLatencyCorrectionMs).toBeNull();
    expect(loadStats().rounds[0].meta?.quickTap?.deviceKey).toBe('iPhone · Safari|390x844');

    const merged = mergeStoredRounds([
      { ...first, score: 99 },
      { ...first },
    ]);
    expect(merged.rounds).toHaveLength(1);
    expect(merged.rounds[0].score).toBe(8);
  });

  it('drops an invented hardware correction when reloading a stored round', () => {
    const poisoned = {
      ...recordRound(quickTapResult(), { clientRoundId: 'poison', ts: 5_000 }),
    } as StoredRound;
    poisoned.meta = {
      metricsVersion: 1,
      quickTap: {
        ...provenance,
        hardwareLatencyCorrectionMs: 12 as unknown as null,
      },
    };
    localStorage.setItem('gamespeed_stats_v1', JSON.stringify({ version: 2, rounds: [poisoned], pbs: {} }));
    expect(loadStats().rounds[0].meta?.quickTap?.hardwareLatencyCorrectionMs).toBeNull();
  });

  it('labels a second round on the same phone and refuses a cross-device comparison', () => {
    const saved = recordRound(quickTapResult(), { clientRoundId: 'base', ts: 1_000 });
    const sameDevice = compareQuickTapRounds({
      saved: true,
      accuracy: 90,
      medianReactionTimeMs: 200,
      deviceKey: saved.meta?.quickTap?.deviceKey,
      previous: saved,
    });
    expect(sameDevice.kind).toBe('same-device');
    expect(sameDevice.medianDeltaMs).toBe(30);
    expect(sameDevice.summary).toContain('Same-device comparison');

    const otherDevice = compareQuickTapRounds({
      saved: true,
      accuracy: 90,
      medianReactionTimeMs: 200,
      deviceKey: 'Desktop · Chrome|1440x900',
      previous: saved,
    });
    expect(otherDevice.kind).toBe('noncomparable');
    expect(otherDevice.summary).toContain('Potentially noncomparable');
    expect(otherDevice.summary).toContain('no hardware latency correction');

    const missing = compareQuickTapRounds({
      saved: true,
      accuracy: 80,
      medianReactionTimeMs: 210,
      deviceKey: saved.meta?.quickTap?.deviceKey,
      previous: null,
    });
    expect(missing.kind).toBe('first-baseline');
  });

  it('exports a manual summary and does not claim an Athlete Houze connection', () => {
    const summary = buildQuickTapExportSummary({
      ts: Date.parse('2026-10-12T20:00:00.000Z'),
      score: 8,
      misses: 2,
      accuracy: 80,
      medianReactionTimeMs: 230,
      provenance,
      comparison: {
        kind: 'first-baseline',
        summary: 'First stored Quick Tap baseline on this device.',
        medianDeltaMs: null,
        accuracyDelta: null,
      },
      syncLabel: 'Saved on this device only.',
      clientRoundId: 'round-1',
    });
    expect(summary).toContain('Mode: Quick Tap');
    expect(summary).toContain('iPhone · Safari');
    expect(summary).toContain('Hardware latency correction: none');
    expect(summary).toContain('Accidental taps excluded: 1');
    expect(summary).toContain(QUICK_TAP_CLAIM_LIMIT);
    expect(summary).toContain('Athlete Houze identity pairing: not connected');
    expect(summary).not.toContain('Connected');
    expect(summarizeBrowser(IPHONE_SAFARI)).toBe('iPhone · Safari');
  });

  it('keeps user_rounds private to the signed-in user and idempotent on client_round_id', () => {
    const sql = readFileSync(resolve(process.cwd(), 'supabase/user_rounds.sql'), 'utf8');
    expect(sql).toContain('unique (user_id, client_round_id)');
    expect(sql).toContain('auth.uid()) = user_id');
    expect(sql).toContain('for select');
    expect(sql).toContain('for insert');
    expect(sql).not.toMatch(/for update/i);
    expect(sql).not.toMatch(/for delete/i);
    expect(sql).toContain('grant select, insert on public.user_rounds to authenticated');
  });
});

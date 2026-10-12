import { useMemo, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { GameResult, GameStats } from '../types/game';
import {
  CloudSyncStatus,
  QUICK_TAP_CLAIM_LIMIT,
  QUICK_TAP_TASK_COPY,
  StorageConsent,
  buildQuickTapExportSummary,
  compareQuickTapRounds,
  describeQuickTapSync,
  findPreviousQuickTapRound,
} from '../utils/quickTapBaseline';

interface QuickTapBaselineCardProps {
  result: GameResult;
  stats: GameStats;
  saved: boolean;
  clientRoundId?: string;
  cloudSyncStatus: CloudSyncStatus;
  isSignedIn: boolean;
  consent: StorageConsent;
  onSave: () => void;
  onDecline: () => void;
  onRetrySync: () => void;
}

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
};

export const QuickTapBaselineCard = ({
  result,
  stats,
  saved,
  clientRoundId,
  cloudSyncStatus,
  isSignedIn,
  consent,
  onSave,
  onDecline,
  onRetrySync,
}: QuickTapBaselineCardProps) => {
  const { theme } = useTheme();
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const totalAttempts = result.totalAttempts ?? result.score + result.misses;
  const accuracy = totalAttempts > 0 ? Math.round((result.score / totalAttempts) * 100) : 0;
  const provenance = result.provenance;
  const previous = useMemo(
    () => findPreviousQuickTapRound(stats, saved ? clientRoundId : undefined),
    [clientRoundId, saved, stats],
  );
  const comparison = useMemo(
    () =>
      compareQuickTapRounds({
        saved,
        accuracy,
        medianReactionTimeMs: result.medianReactionTimeMs,
        deviceKey: provenance?.deviceKey,
        previous,
      }),
    [accuracy, previous, provenance?.deviceKey, result.medianReactionTimeMs, saved],
  );
  const syncLabel = describeQuickTapSync(cloudSyncStatus, isSignedIn);
  const sessionTimeRef = useRef(new Date().toISOString());
  const sessionTime = sessionTimeRef.current;

  if (result.mode !== 'quickTap') return null;

  const handleCopy = async () => {
    const summary = buildQuickTapExportSummary({
      ts: Date.parse(sessionTime),
      score: result.score,
      misses: result.misses,
      accuracy,
      medianReactionTimeMs: result.medianReactionTimeMs,
      provenance,
      comparison,
      syncLabel,
      clientRoundId,
    });
    try {
      await copyText(summary);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  };

  return (
    <section
      data-testid="quick-tap-baseline"
      className="mb-3 w-full rounded-2xl px-4 py-4 sm:mb-4 sm:px-5"
      style={{
        backgroundColor: 'rgba(4, 12, 18, 0.9)',
        border: `1px solid ${theme.targetColor}66`,
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: theme.targetColor }}>
        Quick Tap baseline
      </p>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.textColor }}>
        {QUICK_TAP_TASK_COPY}
      </p>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: theme.textColor, opacity: 0.75 }}>
        Session time {sessionTime}. {provenance?.browserSummary ?? 'Device not recorded'}. Viewport{' '}
        {provenance ? `${provenance.viewport.width}×${provenance.viewport.height}` : 'not recorded'}.
      </p>

      <div data-testid="quick-tap-stat-grid" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Median tap" value={result.medianReactionTimeMs !== undefined ? `${result.medianReactionTimeMs} ms` : '—'} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
        <Stat label="Hits" value={String(result.score)} />
        <Stat label="Misses" value={String(result.misses)} />
      </div>

      <dl className="mt-3 space-y-1 text-xs leading-relaxed" style={{ color: theme.textColor }}>
        <div>Scoring: {provenance?.scoringMethod ?? 'In-app tap latency. No hardware correction.'}</div>
        <div>Valid taps: {provenance?.validTrialCount ?? 0}</div>
        <div>Accidental taps excluded: {provenance?.accidentalTapCount ?? 0}</div>
        <div>Backgrounded cues discarded: {provenance?.backgroundDiscardCount ?? 0}</div>
        <div>Cues left on screen at the end: {provenance?.unfinishedTrialCount ?? 0}</div>
      </dl>

      <p className="mt-3 text-sm leading-relaxed" data-testid="quick-tap-comparison" style={{ color: theme.textColor }}>
        {comparison.summary}
      </p>
      <p className="mt-2 text-sm leading-relaxed" data-testid="quick-tap-sync" style={{ color: theme.textColor }}>
        {syncLabel}
      </p>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: theme.textColor, opacity: 0.8 }}>
        {QUICK_TAP_CLAIM_LIMIT} Athlete Houze identity pairing is not connected. Use the summary below as a manual export.
      </p>

      {consent !== 'granted' && (
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onSave}
            className="min-h-12 rounded-xl px-4 text-sm font-bold"
            style={{ backgroundColor: theme.targetColor, color: '#06120F' }}
          >
            Save this round
          </button>
          <button
            type="button"
            onClick={onDecline}
            className="min-h-12 rounded-xl border px-4 text-sm font-semibold"
            style={{ color: theme.textColor, borderColor: `${theme.textColor}55` }}
          >
            Don&apos;t save
          </button>
        </div>
      )}

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {cloudSyncStatus === 'failed' && (
          <button
            type="button"
            onClick={onRetrySync}
            className="min-h-12 rounded-xl border px-4 text-sm font-semibold"
            style={{ color: theme.textColor, borderColor: `${theme.targetColor}88` }}
          >
            Retry cloud sync
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="min-h-12 rounded-xl border px-4 text-sm font-semibold"
          style={{ color: theme.textColor, borderColor: `${theme.textColor}55` }}
        >
          Copy round summary
        </button>
      </div>
      {copyStatus !== 'idle' && (
        <p className="mt-2 text-xs" role="status" style={{ color: copyStatus === 'copied' ? '#86efac' : '#fca5a5' }}>
          {copyStatus === 'copied'
            ? 'Summary copied. It is a manual export, not an Athlete Houze connection.'
            : 'Unable to copy the summary.'}
        </p>
      )}
    </section>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => {
  const { theme } = useTheme();
  return (
    <div className="rounded-xl border px-2 py-2 text-center" style={{ borderColor: `${theme.targetColor}33` }}>
      <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.65 }}>
        {label}
      </p>
      <p className="mt-1 text-sm font-bold tabular-nums" style={{ color: theme.textColor }}>
        {value}
      </p>
    </div>
  );
};

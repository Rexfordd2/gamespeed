import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QuickTapBaselineCard } from '../components/QuickTapBaselineCard';
import { ThemeProvider } from '../context/ThemeContext';
import { jungleTheme } from '../themes/jungle';
import { GameResult, GameStats } from '../types/game';

const result: GameResult = {
  score: 6,
  misses: 2,
  bestStreak: 3,
  mode: 'quickTap',
  modeName: 'Quick Tap',
  totalAttempts: 8,
  medianReactionTimeMs: 240,
  provenance: {
    scoringMethod: 'Median of in-app tap latencies. No hardware latency correction is applied.',
    browserSummary: 'iPhone · Safari',
    viewport: { width: 390, height: 844 },
    deviceKey: 'iPhone · Safari|390x844',
    hardwareLatencyCorrectionMs: null,
    validTrialCount: 6,
    accidentalTapCount: 1,
    backgroundDiscardCount: 0,
    unfinishedTrialCount: 1,
    comparabilityNote: 'Same phone only.',
  },
};

const stats: GameStats = { version: 2, rounds: [], pbs: {} };

const renderCard = (overrides: Partial<ComponentProps<typeof QuickTapBaselineCard>> = {}) =>
  render(
    <ThemeProvider theme={jungleTheme}>
      <QuickTapBaselineCard
        result={result}
        stats={stats}
        saved={false}
        clientRoundId="round-1"
        cloudSyncStatus="unsaved"
        isSignedIn={false}
        consent="unknown"
        onSave={vi.fn()}
        onDecline={vi.fn()}
        onRetrySync={vi.fn()}
        {...overrides}
      />
    </ThemeProvider>,
  );

describe('Quick Tap baseline card on a phone layout', () => {
  it('shows the task, real stats, exclusions, and same-device caveat', () => {
    renderCard();
    expect(screen.getByTestId('quick-tap-baseline')).toBeTruthy();
    expect(screen.getByText(/Tap it before it vanishes/)).toBeTruthy();
    expect(screen.getByText('240 ms')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText(/Accidental taps excluded: 1/)).toBeTruthy();
    expect(screen.getByText(/iPhone · Safari/)).toBeTruthy();
    expect(screen.getByText(/390×844/)).toBeTruthy();
    expect(screen.getByText(/lab-grade reaction time/)).toBeTruthy();
    expect(screen.getByText(/not connected/)).toBeTruthy();
    expect(screen.getByTestId('quick-tap-comparison').textContent).toContain('not saved yet');

    const save = screen.getByRole('button', { name: 'Save this round' });
    const decline = screen.getByRole('button', { name: "Don't save" });
    expect(save.className).toContain('min-h-12');
    expect(decline.className).toContain('min-h-12');
    expect(screen.getByTestId('quick-tap-stat-grid').className).toContain('grid-cols-2');
    expect(save.parentElement?.className).toContain('grid-cols-1');
  });

  it('saves, declines, and retries sync from phone-sized controls', () => {
    const onRetrySync = vi.fn();
    renderCard({ onRetrySync, cloudSyncStatus: 'failed', saved: true, consent: 'granted' });
    fireEvent.click(screen.getByRole('button', { name: 'Retry cloud sync' }));
    expect(onRetrySync).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Save this round' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy round summary' }).className).toContain('min-h-12');
  });

  it('asks before saving and can decline', () => {
    const onSave = vi.fn();
    const onDecline = vi.fn();
    renderCard({ onSave, onDecline });
    fireEvent.click(screen.getByRole('button', { name: 'Save this round' }));
    fireEvent.click(screen.getByRole('button', { name: "Don't save" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onDecline).toHaveBeenCalledTimes(1);
  });
});

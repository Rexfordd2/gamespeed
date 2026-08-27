import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { deriveReadinessMetrics } from '../utils/readinessMetrics';
import { clearStats, recordRound } from '../utils/sessionStats';
import { TRAINING_CONTEXT_STORAGE_KEY } from '../utils/trainingContext';
import { SPORT_SELECTION_STORAGE_KEY } from '../config/sports';
import { ATHLETE_POSITION_STORAGE_KEY, clearAthletePositions } from '../config/athletePositions';
import { clearPrimeSessions, recordPrimeSession } from '../utils/primePersistence';

vi.mock('framer-motion', async () => {
  const ReactLib = await import('react');
  const motion = new Proxy(
    {},
    {
      get: (_, tagName: string) =>
        ReactLib.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
          ({ children, ...props }, ref) =>
            ReactLib.createElement(tagName, { ...props, ref }, children),
        ),
    },
  );

  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

class MockAudio {
  public src: string;
  constructor(src = '') {
    this.src = src;
  }
  play() {
    return Promise.reject(new Error('audio blocked in test'));
  }
  pause() {}
  addEventListener() {}
  removeEventListener() {}
}

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const renderApp = () => {
  window.history.replaceState({}, '', '/');
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
};

const seedDrillHistory = () => {
  recordRound(
    {
      score: 11,
      misses: 3,
      bestStreak: 4,
      mode: 'quickTap',
      modeName: 'Quick Tap',
      sport: 'soccer',
    },
    { ts: Date.now() - 3_600_000 },
  );
};

const seedBaselineHistory = () => {
  const reactionTimesMs = [250, 268, 280];
  recordRound(
    {
      score: 18,
      misses: 2,
      bestStreak: 6,
      mode: 'reactionBenchmark',
      modeName: 'Reaction Benchmark',
      sport: 'soccer',
      medianReactionTimeMs: 268,
      benchmarkScore: 74,
      reactionTimesMs,
      readinessMetrics: deriveReadinessMetrics({
        score: 18,
        misses: 2,
        totalAttempts: 20,
        reactionTimesMs,
        streakRuns: [6],
      }),
    },
    { ts: Date.now() - 3_600_000 },
  );
};

describe('first-time vs returning home', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T15:00:00.000Z'));
    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
    vi.stubGlobal('confirm', vi.fn(() => true));
    clearStats();
    clearPrimeSessions();
    clearAthletePositions();
    localStorage.removeItem(TRAINING_CONTEXT_STORAGE_KEY);
    localStorage.removeItem(SPORT_SELECTION_STORAGE_KEY);
    localStorage.removeItem(ATHLETE_POSITION_STORAGE_KEY);
    localStorage.removeItem('gamespeed_first_run_complete_v1');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps first-run landing when localStorage history is corrupted', () => {
    localStorage.setItem('gamespeed_stats_v1', '{not-json');
    localStorage.setItem('gamespeed_prime_sessions_v1', '["nope"]');
    localStorage.setItem('gamespeed_first_run_complete_v1', '1');
    renderApp();

    expect(
      screen.getByRole('heading', { name: 'Train Faster Reactions. Sharper Decisions. Better Game Speed.' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Prime Me' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Trail' })).not.toBeInTheDocument();
  });

  it('keeps the first-run landing when there is no valid local history, even if the first-run flag is set', () => {
    localStorage.setItem('gamespeed_first_run_complete_v1', '1');
    renderApp();

    expect(
      screen.getByRole('heading', { name: 'Train Faster Reactions. Sharper Decisions. Better Game Speed.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Establish Baseline' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Prime Me' })).not.toBeInTheDocument();
    expect(screen.queryByText('Target bedtime')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Night settings' }));
    expect(screen.getByText('Target bedtime')).toBeInTheDocument();
  });

  it('uses local round history, not authentication, to show returning home', () => {
    seedDrillHistory();
    renderApp();

    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prime Me' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Train Faster Reactions. Sharper Decisions. Better Game Speed.' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Kai')).not.toBeInTheDocument();
    expect(screen.queryByText('224 ms')).not.toBeInTheDocument();
    expect(screen.queryByText('Top 18%')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Personal evolution')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Trail' })).toBeInTheDocument();
    expect(screen.getByText(/path from training, not XP/i)).toBeInTheDocument();
  });

  it('shows an empty instinct profile instead of invented baseline numbers', () => {
    seedDrillHistory();
    renderApp();

    expect(screen.getByText(/Your instinct profile is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run Baseline' })).toBeInTheDocument();
    expect(screen.queryByText('74')).not.toBeInTheDocument();
    expect(screen.queryByText('268')).not.toBeInTheDocument();
  });

  it('shows defensible stored baseline numbers when a benchmark exists', () => {
    seedBaselineHistory();
    renderApp();

    expect(screen.getByText('74')).toBeInTheDocument();
    expect(screen.getByText('268')).toBeInTheDocument();
    expect(screen.queryByText(/Your instinct profile is empty/i)).not.toBeInTheDocument();
  });

  it('keeps saved sport compact and hides night settings until requested', () => {
    seedDrillHistory();
    localStorage.setItem(SPORT_SELECTION_STORAGE_KEY, 'boxing');
    renderApp();

    expect(screen.getByRole('button', { name: /Selected sport Boxing/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Soccer' })).not.toBeInTheDocument();
    expect(screen.queryByText('Night-before settings')).not.toBeInTheDocument();
    expect(screen.queryByText('Target bedtime')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByText('Night-before settings')).toBeInTheDocument();
    expect(screen.getByText('Target bedtime')).toBeInTheDocument();
  });

  it('persists training context and launches the Prime protocol from Prime Me', async () => {
    seedBaselineHistory();
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Game' }));
    expect(localStorage.getItem(TRAINING_CONTEXT_STORAGE_KEY)).toBe('game');
    expect(screen.getByText('GAME PRIME')).toBeInTheDocument();
    expect(screen.getByText('Owl Vision')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Prime Me' }));
    expect(screen.getByRole('heading', { name: 'See' })).toBeInTheDocument();
    expect(screen.getByText('Owl Vision')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Prime protocol engine is next' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    await flushMicrotasks();
    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    expect(screen.getByText('Peripheral Pulse')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /return to main menu/i }));
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prime Me' })).toBeInTheDocument();
  });

  it('shows sport, position, and context on the Prime card and changes the recipe', async () => {
    seedDrillHistory();
    renderApp();

    expect(screen.getByText('PRACTICE PRIME')).toBeInTheDocument();
    expect(screen.getByText('9 MIN')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Selected position General/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Selected sport Soccer/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Football' }));
    fireEvent.click(screen.getByRole('button', { name: /Selected position General/i }));
    fireEvent.click(screen.getByRole('button', { name: /WR\/TE/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Game' }));

    expect(screen.getByText('FOOTBALL · WR')).toBeInTheDocument();
    expect(screen.getByText('GAME PRIME')).toBeInTheDocument();
    expect(screen.getByText('5 MIN')).toBeInTheDocument();
    expect(screen.getByText('Owl Vision')).toBeInTheDocument();
    expect(screen.queryByText('Crocodile Stillness')).not.toBeInTheDocument();
    expect(screen.queryByText('Chameleon Read')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Prime Me' }));
    expect(screen.getByRole('heading', { name: 'See' })).toBeInTheDocument();
    expect(screen.getByText('Owl Vision')).toBeInTheDocument();
  });

  it('keeps existing modes reachable from Train an Instinct', async () => {
    seedDrillHistory();
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Train an Instinct' }));
    const modeHeading = screen.getByRole('heading', { name: 'Multi Target' });
    let cursor: HTMLElement | null = modeHeading.parentElement;
    while (cursor && !cursor.querySelector('button')) {
      cursor = cursor.parentElement;
    }
    const startButton = cursor
      ? within(cursor).getByRole('button', { name: /start (today'?s session|readiness drill)/i })
      : null;
    if (!startButton) {
      throw new Error('Could not find Multi Target start button');
    }
    fireEvent.click(startButton);
    await flushMicrotasks();
    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    expect(screen.getByText('Multi Target')).toBeInTheDocument();
  });

  it('moves the rainforest path to Canopy after one completed Prime', () => {
    seedDrillHistory();
    recordPrimeSession({
      id: 'prime-home-1',
      ts: Date.now(),
      protocolId: 'gamespeed-prime',
      protocolName: 'GameSpeed Prime',
      context: 'practice',
      sport: 'soccer',
      status: 'completed',
      startedAt: Date.now() - 180_000,
      endedAt: Date.now(),
      totalDurationMs: 180_000,
      stepResults: [],
      summary: {
        stepsCompleted: 5,
        stepsSkipped: 0,
        totalDurationSeconds: 180,
        averageAccuracyPct: 80,
        averageReactionMs: 260,
        trackingAccuracyPct: 80,
        consistencyPct: 70,
        strongestArea: null,
        areaToRevisit: null,
        vsPrevious: null,
      },
    });
    renderApp();

    expect(screen.getByRole('heading', { name: 'Canopy' })).toBeInTheDocument();
    expect(screen.getByText(/1 completed Prime/)).toBeInTheDocument();
    expect(screen.getByText(/Next Hunter: 1\/7 Primes/)).toBeInTheDocument();
  });
});

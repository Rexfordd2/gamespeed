import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import { jungleTheme } from '../themes/jungle';
import { PrimeSession } from '../components/prime/PrimeSession';
import { GameModeType, GameResult } from '../types/game';
import { PrimeSessionRecord } from '../types/prime';
import { clearPrimeSessions, loadPrimeSessions } from '../utils/primePersistence';
import { clearStats, loadStats } from '../utils/sessionStats';

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

vi.mock('../components/Game', () => ({
  Game: ({
    onGameOver,
    mode,
  }: {
    onGameOver: (result: GameResult) => void;
    mode?: GameModeType;
  }) => (
    <button
      type="button"
      onClick={() =>
        onGameOver({
          score: 10,
          misses: 2,
          bestStreak: 4,
          mode: mode ?? 'quickTap',
          modeName: mode ?? 'quickTap',
          totalAttempts: 12,
          readinessMetrics: {
            reactionTimeMs: { average: 260, median: 258 },
            reactionVariabilityMs: 12,
            decisionAccuracyPct: 83,
            missRatePct: 17,
            lateDecisionRatePct: 0,
            streakQualityPct: 70,
            consistencyPct: 82,
            handEyeCoordinationPct: 70,
            visualFocusPct: 70,
            neuralReadinessBand: 'build',
            readinessScore: 70,
            runwayCompletionsCount: 0,
            sleepCheckInCorrelation: 'insufficient_data',
          },
        })
      }
    >
      Complete {mode}
    </button>
  ),
}));

const renderPrime = (
  handlers: {
    onPersistStep?: (input: {
      result: GameResult;
      sessionId: string;
      protocolId: string;
      stepId: string;
    }) => void;
    onComplete?: (session: PrimeSessionRecord) => void;
    onCancel?: (session: PrimeSessionRecord | null) => void;
  } = {},
) => {
  const onPersistStep = handlers.onPersistStep ?? vi.fn();
  const onComplete = handlers.onComplete ?? vi.fn();
  const onCancel = handlers.onCancel ?? vi.fn();
  render(
    <ThemeProvider theme={jungleTheme}>
      <PrimeSession
        context="practice"
        selectedSport="soccer"
        sessionOptions={{}}
        cueIntensity="standard"
        hapticsEnabled={false}
        lowStimulus={false}
        onPersistStep={onPersistStep}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    </ThemeProvider>,
  );
  return { onPersistStep, onComplete, onCancel };
};

const completeCurrentDrill = async () => {
  fireEvent.click(screen.getByRole('button', { name: /^Complete / }));
  await act(async () => {
    await Promise.resolve();
  });
};

describe('prime session orchestration', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    clearPrimeSessions();
    clearStats();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs protocol start → transitions → completion and shows a Prime summary', async () => {
    const { onPersistStep, onComplete, onCancel } = renderPrime();

    expect(screen.getByRole('heading', { name: 'Settle' })).toBeInTheDocument();
    expect(screen.getByText('Crocodile Stillness')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    expect(screen.getByRole('button', { name: 'Complete calmFocus' })).toBeInTheDocument();
    await completeCurrentDrill();

    expect(screen.getByRole('heading', { name: 'See' })).toBeInTheDocument();
    expect(screen.getByText('Owl Vision')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    await completeCurrentDrill();

    expect(screen.getByRole('heading', { name: 'Scan' })).toBeInTheDocument();
    expect(screen.getByText('Macaw Scan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    await completeCurrentDrill();

    expect(screen.getByRole('heading', { name: 'React' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    await completeCurrentDrill();

    expect(screen.getByRole('heading', { name: 'Control' })).toBeInTheDocument();
    expect(screen.getByText('Caiman Control')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    await completeCurrentDrill();

    expect(screen.getByRole('heading', { name: 'Process' })).toBeInTheDocument();
    expect(screen.getByText('Chameleon Read')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    await completeCurrentDrill();

    expect(screen.getByRole('heading', { name: 'Decide' })).toBeInTheDocument();
    expect(screen.getByText('Mongoose Read')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    await completeCurrentDrill();

    expect(screen.getByRole('heading', { name: 'Track' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Begin' }));
    await completeCurrentDrill();

    expect(screen.getByRole('heading', { name: 'Move' })).toBeInTheDocument();
    expect(screen.getByText('First-Step Plant')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

    expect(screen.getByRole('heading', { name: "YOU'RE PRIMED" })).toBeInTheDocument();
    expect(screen.getByText(/Accuracy/i)).toBeInTheDocument();
    expect(onPersistStep).toHaveBeenCalledTimes(8);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(loadPrimeSessions()[0]?.status).toBe('completed');
    expect(loadPrimeSessions()[0]?.stepResults.map(result => result.stepId)).toEqual([
      'settle',
      'see',
      'scan',
      'react',
      'control',
      'process',
      'decide',
      'track',
      'move',
    ]);

    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onCancel).toHaveBeenCalledWith(null);
  });

  it('cancels from a transition and records a cancelled Prime session', () => {
    const { onComplete, onCancel } = renderPrime();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel Prime' }));
    expect(onComplete).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
    const session = (onCancel as ReturnType<typeof vi.fn>).mock.calls[0][0] as PrimeSessionRecord;
    expect(session.status).toBe('cancelled');
    expect(loadPrimeSessions()[0]?.status).toBe('cancelled');
    expect(loadStats().rounds).toHaveLength(0);
  });
});

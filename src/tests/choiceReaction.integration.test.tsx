import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { clearStats, loadStats, recordRound } from '../utils/sessionStats';

vi.mock('framer-motion', async () => {
  const ReactLib = await import('react');
  const motion = new Proxy(
    {},
    {
      get: (_, tagName: string) =>
        ReactLib.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
          ({ children, ...props }, ref) => ReactLib.createElement(tagName, { ...props, ref }, children),
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
    return Promise.reject(new Error('blocked in tests'));
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

const advance = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

const seedUnlockHistory = () => {
  for (let i = 0; i < 3; i += 1) {
    recordRound(
      {
        score: 10,
        misses: 2,
        bestStreak: 3,
        mode: 'quickTap',
        modeName: 'Quick Tap',
        sport: 'soccer',
      },
      { ts: Date.now() - (i + 1) * 60_000 },
    );
  }
};

const gesture = (
  surface: HTMLElement,
  kind: 'tap' | 'swipeLeft' | 'swipeRight',
) => {
  fireEvent.pointerDown(surface, { pointerId: 1, pointerType: 'mouse', clientX: 120, clientY: 120 });
  if (kind === 'tap') {
    fireEvent.pointerUp(surface, { pointerId: 1, pointerType: 'mouse', clientX: 122, clientY: 121 });
    return;
  }
  const moveBy = kind === 'swipeLeft' ? { clientX: 70, clientY: 122 } : { clientX: 176, clientY: 122 };
  fireEvent.pointerMove(surface, { pointerId: 1, pointerType: 'mouse', ...moveBy });
  fireEvent.pointerUp(surface, { pointerId: 1, pointerType: 'mouse', ...moveBy });
};

describe('Mongoose Read integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
    vi.stubGlobal('confirm', vi.fn(() => true));
    clearStats();
    seedUnlockHistory();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows rules, scores choice responses, and saves speed vs decision metrics', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Train an Instinct' }));
    const modeHeading = screen.getByRole('heading', { name: 'Mongoose Read' });
    let cursor: HTMLElement | null = modeHeading.parentElement;
    while (cursor && !cursor.querySelector('button')) {
      cursor = cursor.parentElement;
    }
    const startButton = cursor
      ? within(cursor).getByRole('button', { name: /start (today'?s session|readiness drill)/i })
      : null;
    if (!startButton) {
      throw new Error('Could not find Mongoose Read start button');
    }
    fireEvent.click(startButton);
    await flushMicrotasks();

    expect(screen.getByText('Read first. Move second.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Mongoose Read rules/i)).toBeInTheDocument();
    expect(screen.getByText('Tap')).toBeInTheDocument();
    expect(screen.getByText('Swipe left')).toBeInTheDocument();

    const briefingSurface = screen.getByRole('application', { name: /Mongoose Read rules/i });
    gesture(briefingSurface, 'tap');
    await flushMicrotasks();

    await advance(3_400);

    const stillCue = screen.getByRole('application', { name: /Mongoose Read still/i });
    gesture(stillCue, 'tap');
    await flushMicrotasks();

    await advance(1_200);

    for (let i = 0; i < 6; i += 1) {
      const green = screen.queryByRole('application', { name: /Mongoose Read GREEN cue/i });
      const yellow = screen.queryByRole('application', { name: /Mongoose Read YELLOW cue/i });
      const blue = screen.queryByRole('application', { name: /Mongoose Read BLUE cue/i });
      const red = screen.queryByRole('application', { name: /Mongoose Read RED cue/i });
      if (green) {
        gesture(green, 'tap');
        await flushMicrotasks();
      } else if (yellow) {
        gesture(yellow, 'swipeLeft');
        await flushMicrotasks();
      } else if (blue) {
        gesture(blue, 'swipeRight');
        await flushMicrotasks();
      } else if (red) {
        await advance(950);
      } else {
        await advance(200);
      }
      await advance(280);
    }

    await advance(60_500);
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Decision')).toBeInTheDocument();
    expect(screen.getByText(/Fast is only useful when the decision is right/i)).toBeInTheDocument();

    const mongooseRound = loadStats().rounds.find(round => round.mode === 'choiceReaction');
    expect(mongooseRound?.meta?.choiceReactionMetrics).toBeDefined();
    expect(mongooseRound?.meta?.choiceReactionMetrics?.falseStarts).toBeGreaterThan(0);
    expect(mongooseRound?.meta?.choiceReactionMetrics?.decisionAccuracyPct).toBeGreaterThanOrEqual(0);
  });

  it('lists Mongoose Read in the Prime DECIDE step and keeps Jaguar Hunt available', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );
    expect(screen.getByRole('button', { name: 'Prime Me' })).toBeInTheDocument();
    expect(screen.getByText('Decide')).toBeInTheDocument();
    expect(screen.getByText('Mongoose Read')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Train an Instinct' }));
    expect(screen.getByRole('heading', { name: 'Multi Target' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mongoose Read' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Swipe Strike' })).toBeInTheDocument();
  });
});

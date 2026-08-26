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

describe('Caiman Control integration', () => {
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

  it('runs GO and NO-GO outcomes, blocks ISI spam, and saves distinct metrics', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Train an Instinct' }));
    const modeHeading = screen.getByRole('heading', { name: 'Caiman Control' });
    let cursor: HTMLElement | null = modeHeading.parentElement;
    while (cursor && !cursor.querySelector('button')) {
      cursor = cursor.parentElement;
    }
    const startButton = cursor
      ? within(cursor).getByRole('button', { name: /start (today'?s session|readiness drill)/i })
      : null;
    if (!startButton) {
      throw new Error('Could not find Caiman Control start button');
    }
    fireEvent.click(startButton);
    await flushMicrotasks();

    const stillCue = screen.getByRole('button', { name: /Caiman Control still/i });
    fireEvent.click(stillCue);
    await flushMicrotasks();

    await advance(1_100);

    for (let i = 0; i < 4; i += 1) {
      const goCue = screen.queryByRole('button', { name: /Caiman Control go cue/i });
      const noGoCue = screen.queryByRole('button', { name: /Caiman Control no-go cue/i });
      if (goCue) {
        fireEvent.click(goCue);
        await flushMicrotasks();
      } else if (noGoCue) {
        await advance(950);
      } else {
        await advance(200);
      }
      await advance(280);
    }

    await advance(60_500);
    expect(screen.getByText('Reaction')).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('False starts')).toBeInTheDocument();
    expect(screen.getByText(/Speed only counts when the cue is real/i)).toBeInTheDocument();

    const caimanRound = loadStats().rounds.find(round => round.mode === 'goNoGo');
    expect(caimanRound?.meta?.goNoGoMetrics).toBeDefined();
    expect(caimanRound?.meta?.goNoGoMetrics?.prematureResponses).toBeGreaterThan(0);
  });

  it('lists Caiman Control in the Prime CONTROL step and keeps existing drills available', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );
    expect(screen.getByRole('button', { name: 'Prime Me' })).toBeInTheDocument();
    expect(screen.getByText('Control')).toBeInTheDocument();
    expect(screen.getByText('Caiman Control')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Train an Instinct' }));
    expect(screen.getByRole('heading', { name: 'Quick Tap' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Caiman Control' })).toBeInTheDocument();
  });
});

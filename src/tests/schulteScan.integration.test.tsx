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

describe('Macaw Scan integration', () => {
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

  it('completes a static 3x3, scales to 4x4, and saves scan metrics', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Train an Instinct' }));
    const modeHeading = screen.getByRole('heading', { name: 'Macaw Scan' });
    let cursor: HTMLElement | null = modeHeading.parentElement;
    while (cursor && !cursor.querySelector('button')) {
      cursor = cursor.parentElement;
    }
    const startButton = cursor
      ? within(cursor).getByRole('button', { name: /start (today'?s session|readiness drill)/i })
      : null;
    if (!startButton) {
      throw new Error('Could not find Macaw Scan start button');
    }
    fireEvent.click(startButton);
    await flushMicrotasks();

    expect(screen.getByRole('grid', { name: /Macaw Scan 3 by 3 grid/i })).toBeInTheDocument();
    expect(screen.getByText(/Find the signal inside the noise/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('gridcell', { name: 'Macaw Scan cell 9' }));
    await flushMicrotasks();
    expect(screen.getByLabelText('Current streak 0')).toBeInTheDocument();

    await advance(220);
    for (let value = 1; value <= 9; value += 1) {
      fireEvent.click(screen.getByRole('gridcell', { name: `Macaw Scan cell ${value}` }));
      await flushMicrotasks();
    }

    expect(screen.getByRole('grid', { name: /Macaw Scan 4 by 4 grid/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Current streak 9')).toBeInTheDocument();

    await advance(60_500);
    expect(screen.getByText(/Search timing from this round only/i)).toBeInTheDocument();
    expect(screen.getByText('Boards')).toBeInTheDocument();
    expect(screen.getByText('Hits')).toBeInTheDocument();
    expect(screen.getByText('Errors')).toBeInTheDocument();
    const macawRound = loadStats().rounds.find(round => round.mode === 'schulteScan');
    expect(macawRound?.meta?.schulteMetrics?.boardsCompleted).toBe(1);
    expect(macawRound?.meta?.schulteMetrics?.correctSelections).toBe(9);
    expect(macawRound?.meta?.schulteMetrics?.errors).toBe(1);
    expect(macawRound?.score).toBe(9);
  });

  it('lists Macaw Scan in the Prime preview and keeps existing drills available', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );
    expect(screen.getByRole('button', { name: 'Prime Me' })).toBeInTheDocument();
    expect(screen.getByText('Scan')).toBeInTheDocument();
    expect(screen.getByText('Macaw Scan')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Train an Instinct' }));
    expect(screen.getByRole('heading', { name: 'Multi Target' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Macaw Scan' })).toBeInTheDocument();
  });
});

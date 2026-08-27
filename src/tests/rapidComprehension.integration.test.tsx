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

describe('Chameleon Read integration', () => {
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

  it('shows a picture, asks after it changes, and saves comprehension metrics', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Train an Instinct' }));
    const modeHeading = screen.getByRole('heading', { name: 'Chameleon Read' });
    let cursor: HTMLElement | null = modeHeading.parentElement;
    while (cursor && !cursor.querySelector('button')) {
      cursor = cursor.parentElement;
    }
    const startButton = cursor
      ? within(cursor).getByRole('button', { name: /start (today'?s session|readiness drill)/i })
      : null;
    if (!startButton) {
      throw new Error('Could not find Chameleon Read start button');
    }
    fireEvent.click(startButton);
    await flushMicrotasks();

    expect(screen.getByText('Adapt before the picture changes.')).toBeInTheDocument();
    const encoding = screen.getByRole('application', { name: /Chameleon Read encoding/i });
    const encodingName = encoding.getAttribute('aria-label') ?? '';
    fireEvent.click(encoding);
    await flushMicrotasks();

    await advance(2_800);

    const question = screen.getByRole('application', { name: /Chameleon Read question/i });
    const questionName = question.getAttribute('aria-label') ?? '';
    const moved = /([A-Za-z]+ [a-z]+) moved/.exec(encodingName)?.[1];
    const before = /What came before ([A-F])\?/.exec(questionName)?.[1];

    if (moved) {
      fireEvent.click(screen.getByRole('button', { name: `Chameleon Read answer ${moved}` }));
    } else if (before) {
      const sequence = /([A-F](?: → [A-F])+)/.exec(encodingName)?.[1]?.split(' → ') ?? [];
      const probeIndex = sequence.indexOf(before);
      const predecessor = probeIndex > 0 ? sequence[probeIndex - 1] : sequence[0];
      fireEvent.click(screen.getByRole('button', { name: `Chameleon Read answer ${predecessor}` }));
    } else {
      const firstAnswer = screen.getAllByRole('button', { name: /Chameleon Read answer /i })[0];
      fireEvent.click(firstAnswer);
    }
    await flushMicrotasks();

    await advance(60_500);
    expect(screen.getByText('Speed')).toBeInTheDocument();
    expect(screen.getByText('Comprehend')).toBeInTheDocument();
    expect(screen.getByText(/Not an IQ test/i)).toBeInTheDocument();
    expect(screen.getByText(/Not a medical cognitive assessment/i)).toBeInTheDocument();

    const chameleonRound = loadStats().rounds.find(round => round.mode === 'rapidComprehension');
    expect(chameleonRound?.meta?.rapidComprehensionMetrics).toBeDefined();
    expect(chameleonRound?.meta?.rapidComprehensionMetrics?.encodingFailures).toBeGreaterThanOrEqual(0);
    expect(chameleonRound?.meta?.rapidComprehensionMetrics?.comprehensionAccuracyPct).toBeGreaterThanOrEqual(0);
    expect(chameleonRound?.meta?.rapidComprehensionMetrics?.prematureResponses ?? 0).toBeGreaterThanOrEqual(0);
  });

  it('lists Chameleon Read in the Prime PROCESS step and keeps Chameleon Chain available', () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );
    expect(screen.getByRole('button', { name: 'Prime Me' })).toBeInTheDocument();
    expect(screen.getByText('Process')).toBeInTheDocument();
    expect(screen.getAllByText('Chameleon Read').length).toBeGreaterThan(0);
    expect(screen.getByText(/sequence: settle, see, scan, react, control, process, decide, track/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Train an Instinct' }));
    expect(screen.getByRole('heading', { name: 'Chameleon Read' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sequence Memory' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mongoose Read' })).toBeInTheDocument();
  });
});

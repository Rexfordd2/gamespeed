import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';

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
    AnimatePresence: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
});

class MockAudio {
  public src: string;
  public muted = true;
  public loop = false;
  public preload = 'auto';
  public volume = 1;
  public currentTime = 0;
  public currentSrc = '';

  constructor(src = '') {
    this.src = src;
    this.currentSrc = src;
  }

  play() {
    return Promise.reject(new Error('audio blocked in test'));
  }

  pause() {
    // no-op
  }

  addEventListener() {
    // no-op
  }

  removeEventListener() {
    // no-op
  }
}

const advance = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

const renderApp = () => {
  render(<App />);
};

const flushMicrotasks = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const getModeStartButton = (modeName: string) => {
  const modeHeading = screen.getByRole('heading', { name: modeName });
  let cursor: HTMLElement | null = modeHeading.parentElement;
  while (cursor && !cursor.querySelector('button')) {
    cursor = cursor.parentElement;
  }

  const modeButton = cursor
    ? within(cursor).queryByRole('button', { name: /start drill/i })
    : null;

  if (!modeButton) {
    throw new Error(`Could not find Start Drill button for ${modeName}`);
  }

  return modeButton;
};

const startMode = async (modeName: string) => {
  fireEvent.click(getModeStartButton(modeName));
  await flushMicrotasks();
  const dialog = screen.getByRole('dialog', {
    name: new RegExp(`how to play ${modeName}`, 'i'),
  });
  fireEvent.click(within(dialog).getByRole('button', { name: /^start drill$/i }));
  await flushMicrotasks();
  expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
};

describe('App integration flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders the start screen and mode sections', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'GameSpeed' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Choose Your Drill' })).toBeInTheDocument();
    expect(screen.getByText('Available now')).toBeInTheDocument();
    expect(screen.getByText('Next release')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unmute audio' })).toBeInTheDocument();
  });

  it('allows selecting a playable mode and starting gameplay', async () => {
    renderApp();

    await startMode('Quick Tap');

    expect(screen.getByText('Quick Tap')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Gameplay area')).toBeInTheDocument();
  });

  it('does not launch coming-soon modes', async () => {
    renderApp();

    fireEvent.click(screen.getByRole('heading', { name: 'Swipe Strike' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /pause game/i })).not.toBeInTheDocument();
  });

  it('runs gameplay loop and reaches results for supported v1 modes', async () => {
    renderApp();

    for (const modeName of ['Quick Tap', 'Multi Target']) {
      await startMode(modeName);
      await advance(900);

      const [target] = screen.getAllByRole('button', { name: 'Hit target' });
      fireEvent.click(target);
      await advance(150);

      expect(screen.getByLabelText('Current streak 1')).toBeInTheDocument();

      await advance(60_500);

      expect(screen.getByText('Final Score')).toBeInTheDocument();
      expect(screen.getByText(modeName)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Main Menu' }));
      expect(screen.getByRole('heading', { name: 'Choose Your Drill' })).toBeInTheDocument();
    }
  });

  it('supports pause and resume without time leaking while paused', async () => {
    renderApp();
    await startMode('Quick Tap');

    await advance(2_200);
    expect(screen.getByText('58s')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /pause game/i }));
    expect(screen.getByRole('heading', { name: 'Paused' })).toBeInTheDocument();

    await advance(5_000);
    expect(screen.getByText('58s')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    await advance(1_200);
    expect(screen.getByText('57s')).toBeInTheDocument();
  });

  it('supports replay and returning to main menu from results', async () => {
    renderApp();
    await startMode('Quick Tap');

    await advance(60_500);
    expect(screen.getByText('Final Score')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    await flushMicrotasks();
    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();

    await advance(60_500);
    expect(screen.getByText('Final Score')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Main Menu' }));
    expect(screen.getByRole('heading', { name: 'Choose Your Drill' })).toBeInTheDocument();
  });

  it('toggles audio safely without crashing the UI', async () => {
    renderApp();
    const audioToggle = screen.getByRole('button', { name: 'Unmute audio' });

    fireEvent.click(audioToggle);
    await flushMicrotasks();
    expect(screen.getByRole('button', { name: 'Mute audio' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mute audio' }));
    await flushMicrotasks();
    expect(screen.getByRole('button', { name: 'Unmute audio' })).toBeInTheDocument();

    await startMode('Quick Tap');
    await advance(500);
    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
  });
});

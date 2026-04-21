import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../context/AuthContext';

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
  static rejectPlayback = true;
  public src: string;
  public muted = true;
  public loop = false;
  public preload = 'auto';
  public volume = 1;
  public currentTime = 0;

  constructor(src = '') {
    this.src = src;
  }

  play() {
    if (MockAudio.rejectPlayback) {
      return Promise.reject(new Error('blocked in tests'));
    }
    return Promise.resolve();
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

const renderApp = () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
};

const getModeStartButton = (modeName: string) => {
  const modeHeading = screen.getByRole('heading', { name: modeName });
  let cursor: HTMLElement | null = modeHeading.parentElement;
  while (cursor && !cursor.querySelector('button')) {
    cursor = cursor.parentElement;
  }
  const modeButton = cursor
    ? within(cursor).queryByRole('button', { name: /start (today'?s session|readiness drill)/i })
    : null;
  if (!modeButton) throw new Error(`Could not find start button for ${modeName}`);
  return modeButton;
};

const startMode = async (modeName: string) => {
  fireEvent.click(getModeStartButton(modeName));
  await flushMicrotasks();
  expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
};

const swipeTargetInDirection = (target: HTMLElement, direction: 'left' | 'right' | 'up' | 'down') => {
  fireEvent.pointerDown(target, { pointerId: 1, clientX: 120, clientY: 120 });
  const moveBy =
    direction === 'left'
      ? { clientX: 72, clientY: 120 }
      : direction === 'right'
        ? { clientX: 168, clientY: 120 }
        : direction === 'up'
          ? { clientX: 120, clientY: 72 }
          : { clientX: 120, clientY: 168 };
  fireEvent.pointerUp(target, { pointerId: 1, ...moveBy });
};

describe('mode drills integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('Swipe Strike registers an early swipe as a fail', async () => {
    renderApp();
    await startMode('Swipe Strike');
    await advance(140);

    const earlyTarget = screen.getByRole('button', { name: /swipe target/i });
    const earlyDirection = /swipe target (\w+)/i.exec(earlyTarget.getAttribute('aria-label') || '')?.[1] as
      | 'left'
      | 'right'
      | 'up'
      | 'down';
    swipeTargetInDirection(earlyTarget, earlyDirection);
    await advance(200);
    expect(screen.getByLabelText('Current streak 0')).toBeInTheDocument();

  });

  it('Swipe Strike treats wrong-direction swipes as misses', async () => {
    renderApp();
    await startMode('Swipe Strike');
    await advance(620);

    const target = screen.getByRole('button', { name: /swipe target/i });
    const direction = /swipe target (\w+)/i.exec(target.getAttribute('aria-label') || '')?.[1] as
      | 'left'
      | 'right'
      | 'up'
      | 'down';
    const wrongDirection =
      direction === 'left'
        ? 'right'
        : direction === 'right'
          ? 'left'
          : direction === 'up'
            ? 'down'
            : 'up';
    swipeTargetInDirection(target, wrongDirection);
    await advance(260);
    expect(screen.getByLabelText('Current streak 0')).toBeInTheDocument();
  });

  it('Hold Track scores sustained holds', async () => {
    renderApp();
    await startMode('Hold Track');
    await advance(400);

    const successTarget = screen.getByRole('button', { name: 'Hold target' });
    fireEvent.pointerDown(successTarget, {
      pointerId: 4,
      clientX: 0,
      clientY: 0,
    });
    await advance(1100);
    expect(screen.getByLabelText('Current streak 1')).toBeInTheDocument();
  });

  it('Hold Track resets streak when contact breaks', async () => {
    renderApp();
    await startMode('Hold Track');
    await advance(450);

    const failTarget = screen.getByRole('button', { name: 'Hold target' });
    fireEvent.pointerDown(failTarget, { pointerId: 8, clientX: 0, clientY: 0 });
    fireEvent.pointerUp(failTarget, { pointerId: 8, clientX: 0, clientY: 0 });
    await advance(280);
    expect(screen.getByLabelText('Current streak 0')).toBeInTheDocument();
  });

  it('Sequence Memory handles spawn, ordered input, fail path, and pause safety', async () => {
    renderApp();
    await startMode('Sequence Memory');
    await advance(180);

    const previewTargets = screen.getAllByRole('button', { name: 'Sequence target' });
    expect(previewTargets.length).toBeGreaterThanOrEqual(3);
    expect(previewTargets.every(target => within(target).queryByText(/^\d+$/) === null)).toBe(true);

    await advance(3200);
    const roundClockBeforePause = screen.getAllByText(/^\d+s$/)[0]?.textContent ?? '58s';
    const sequenceTargets = screen
      .getAllByRole('button', { name: 'Sequence target' })
      .map(target => ({
        target,
        step: Number(target.getAttribute('data-sequence-step') ?? '0'),
      }))
      .sort((a, b) => a.step - b.step);

    fireEvent.click(sequenceTargets[0].target);
    await advance(120);
    expect(screen.getByLabelText('Current streak 1')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /pause game/i }));
    await advance(4000);
    expect(screen.getByText(roundClockBeforePause || '')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

    const refreshedTargets = screen
      .getAllByRole('button', { name: 'Sequence target' })
      .map(target => ({
        target,
        step: Number(target.getAttribute('data-sequence-step') ?? '0'),
      }))
      .sort((a, b) => a.step - b.step);
    fireEvent.click(refreshedTargets[refreshedTargets.length - 1].target);
    await advance(120);
    expect(screen.getByText(/Wrong order/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Current streak 0')).toBeInTheDocument();
  });
});

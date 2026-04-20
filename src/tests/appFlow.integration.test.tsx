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
  static instances: MockAudio[] = [];
  static rejectPlayback = true;

  public src: string;
  public muted = true;
  public loop = false;
  public preload = 'auto';
  public volume = 1;
  public currentTime = 0;
  public currentSrc = '';
  private listeners = new Map<string, Set<() => void>>();

  constructor(src = '') {
    this.src = src;
    this.currentSrc = src;
    MockAudio.instances.push(this);
  }

  static reset() {
    MockAudio.instances = [];
    MockAudio.rejectPlayback = true;
  }

  static emitErrorForAsset(assetFileName: string) {
    MockAudio.instances
      .filter(instance => instance.src.includes(assetFileName))
      .forEach(instance => instance.emit('error'));
  }

  play() {
    if (MockAudio.rejectPlayback) {
      return Promise.reject(new Error('audio blocked in test'));
    }
    return Promise.resolve();
  }

  pause() {
    // no-op
  }

  addEventListener(eventName: string, listener: () => void) {
    const eventListeners = this.listeners.get(eventName) ?? new Set();
    eventListeners.add(listener);
    this.listeners.set(eventName, eventListeners);
  }

  removeEventListener(eventName: string, listener: () => void) {
    this.listeners.get(eventName)?.delete(listener);
  }

  private emit(eventName: string) {
    this.listeners.get(eventName)?.forEach(listener => listener());
  }
}

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
    ? within(cursor).queryByRole('button', { name: /start today'?s session/i })
    : null;

  if (!modeButton) {
    throw new Error(`Could not find Start Today's Session button for ${modeName}`);
  }

  return modeButton;
};

const startMode = async (modeName: string) => {
  fireEvent.click(getModeStartButton(modeName));
  await flushMicrotasks();
  expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
};

describe('App integration flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    MockAudio.reset();
    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
    vi.stubGlobal('confirm', vi.fn(() => true));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders the first-run quickstart and drill sections', () => {
    renderApp();

    expect(
      screen.getByRole('heading', {
        name: 'Start in 60 seconds',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('1. Choose role')).toBeInTheDocument();
    expect(screen.queryByText('2. Choose one goal')).not.toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Choose Your Drill' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Unmute audio' })).toBeInTheDocument();
  });

  it('runs first-run role-and-goal flow into immediate benchmark', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Athlete/i }));
    fireEvent.click(screen.getByRole('button', { name: /First-step quickness/i }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Run the 60-Second Test' })[0]);
    await flushMicrotasks();

    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Gameplay area')).toBeInTheDocument();
  });

  it('reveals post-first-session dashboard, recommendation, checklist, and deferred signup', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /Athlete/i }));
    fireEvent.click(screen.getByRole('button', { name: /First-step quickness/i }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Run the 60-Second Test' })[0]);
    await flushMicrotasks();

    await advance(60_500);

    expect(screen.getByText('Results Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Percentile')).toBeInTheDocument();
    expect(screen.getByText('Recommended Next Mode')).toBeInTheDocument();
    expect(screen.getByText('Onboarding Checklist')).toBeInTheDocument();
    expect(screen.getByText('Save this progress')).toBeInTheDocument();
  });

  it('allows selecting a playable mode and starting gameplay', async () => {
    renderApp();

    await startMode('Quick Tap');

    expect(screen.getByText('Quick Tap')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Gameplay area')).toBeInTheDocument();
  });

  it('launches Sequence Memory as a playable mode', async () => {
    renderApp();
    await startMode('Sequence Memory');
    await advance(120);
    expect(screen.getByText(/Watch sequence/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
  });

  it('runs gameplay loop and reaches results for supported v1.1 tap modes', async () => {
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
      expect(screen.getAllByText(modeName).length).toBeGreaterThan(0);

      fireEvent.click(screen.getByRole('button', { name: 'Main Menu' }));
      expect(screen.getAllByRole('heading', { name: 'Choose Your Drill' }).length).toBeGreaterThan(0);
    }
  });

  it('keeps Swipe Strike playable in the full round flow', async () => {
    renderApp();
    await startMode('Swipe Strike');
    await advance(1_000);

    const swipeTargetButton = screen.getByRole('button', { name: /swipe target/i });
    fireEvent.click(swipeTargetButton);
    await advance(220);
    expect(screen.getByLabelText('Current streak 0')).toBeInTheDocument();

    await advance(60_500);
    expect(screen.getByText('Final Score')).toBeInTheDocument();
    expect(screen.getByText('Swipe Strike')).toBeInTheDocument();
  });

  it('keeps Hold Track playable with pointer interactions', async () => {
    renderApp();
    await startMode('Hold Track');
    await advance(1_000);

    const holdTarget = screen.getByRole('button', { name: 'Hold target' });
    fireEvent.pointerDown(holdTarget, {
      pointerId: 1,
      clientX: 0,
      clientY: 0,
    });
    await advance(120);
    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hold target' })).toBeInTheDocument();
  });

  it('runs Sequence Memory preview then accepts correct ordered input', async () => {
    renderApp();
    await startMode('Sequence Memory');
    await advance(180);
    expect(screen.getByText(/Watch sequence/i)).toBeInTheDocument();

    await advance(2_900);
    expect(screen.getByText(/Tap the cues in the same order/i)).toBeInTheDocument();

    const sequenceTargets = screen.getAllByRole('button', { name: 'Sequence target' });
    const orderedTargets = sequenceTargets
      .map(target => ({
        element: target,
        step: Number(target.getAttribute('data-sequence-step') ?? '0'),
      }))
      .sort((a, b) => a.step - b.step);

    orderedTargets.forEach(({ element }) => {
      fireEvent.click(element);
    });
    await advance(120);
    expect(screen.getByLabelText('Current streak 3')).toBeInTheDocument();
    expect(screen.getByText(/Sequence complete/i)).toBeInTheDocument();
  });

  it('marks failure when Sequence Memory input order is wrong', async () => {
    renderApp();
    await startMode('Sequence Memory');
    await advance(3_200);

    const sequenceTargets = screen.getAllByRole('button', { name: 'Sequence target' });
    const descendingOrderTargets = sequenceTargets
      .map(target => ({
        element: target,
        step: Number(target.getAttribute('data-sequence-step') ?? '0'),
      }))
      .sort((a, b) => b.step - a.step);

    fireEvent.click(descendingOrderTargets[0].element);
    await advance(100);
    expect(screen.getByText(/Wrong order/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Current streak 0')).toBeInTheDocument();
  });

  it('counts a miss when Hold Track contact breaks early', async () => {
    renderApp();
    await startMode('Hold Track');
    await advance(900);

    const holdTarget = screen.getByRole('button', { name: 'Hold target' });
    fireEvent.pointerDown(holdTarget, {
      pointerId: 11,
      clientX: 0,
      clientY: 0,
    });
    fireEvent.pointerUp(holdTarget, {
      pointerId: 11,
      clientX: 0,
      clientY: 0,
    });
    await advance(300);
    expect(screen.getByRole('button', { name: 'Hold target' })).toBeInTheDocument();
    expect(screen.getByLabelText('Current streak 0')).toBeInTheDocument();
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
    expect(screen.getAllByRole('heading', { name: 'Choose Your Drill' }).length).toBeGreaterThan(0);
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

  it('keeps UI/gameplay stable when required audio assets are missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderApp();

    MockAudio.emitErrorForAsset('rainforest-loop.mp3');
    MockAudio.emitErrorForAsset('target-hit.mp3');
    MockAudio.emitErrorForAsset('target-miss.mp3');
    MockAudio.emitErrorForAsset('round-complete.mp3');

    fireEvent.click(screen.getByRole('button', { name: 'Unmute audio' }));
    await flushMicrotasks();
    expect(screen.getByRole('button', { name: 'Mute audio' })).toBeInTheDocument();

    await startMode('Quick Tap');
    await advance(500);
    expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Gameplay area')).toBeInTheDocument();
    expect(warnSpy).toHaveBeenCalled();
  });

  it('continues full game flow when cue playback rejects', async () => {
    renderApp();

    fireEvent.click(screen.getByRole('button', { name: 'Unmute audio' }));
    await flushMicrotasks();
    expect(screen.getByRole('button', { name: 'Mute audio' })).toBeInTheDocument();

    await startMode('Quick Tap');
    await advance(900);

    const [target] = screen.getAllByRole('button', { name: 'Hit target' });
    fireEvent.click(target);
    await advance(120);

    await advance(3_500);
    await advance(57_000);

    expect(screen.getByText('Final Score')).toBeInTheDocument();
  });
});

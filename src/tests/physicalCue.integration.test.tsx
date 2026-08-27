import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeContext';
import { jungleTheme } from '../themes/jungle';
import { PhysicalCueSession } from '../components/physical/PhysicalCueSession';
import { jaguarMovementModule } from '../config/physicalCueModules';
import { GameModeType } from '../types/game';
import { gamespeedPrimeProtocol, validatePrimeProtocol } from '../config/primeProtocols';
import {
  completeCurrentPrimeStep,
  createPrimeSession,
  getCurrentPrimeStep,
  startCurrentPrimeStep,
} from '../utils/primeEngine';

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

describe('physical cue session UI', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows safety, runs the cue sequence, and records athlete-confirmed completion without quality scores', async () => {
    const onComplete = vi.fn();
    const onCancel = vi.fn();
    render(
      <ThemeProvider theme={jungleTheme}>
        <PhysicalCueSession
          module={jaguarMovementModule}
          hapticsEnabled={false}
          lowStimulus={false}
          reducedMotion
          onComplete={onComplete}
          onCancel={onCancel}
        />
      </ThemeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Jaguar Movement' })).toBeInTheDocument();
    expect(screen.getByText(/Create clear space/i)).toBeInTheDocument();
    expect(screen.getByText(/stable footing/i)).toBeInTheDocument();
    expect(screen.getByText(/stop if movement causes pain/i)).toBeInTheDocument();
    expect(screen.getByText(/Do not stare at the device while moving/i)).toBeInTheDocument();
    expect(screen.getByText(/does not score how you moved/i)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/diagnos|injury|rehab/i);

    fireEvent.click(screen.getByRole('button', { name: 'Start cues' }));
    expect(screen.getByText('LEFT')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(jaguarMovementModule.cueHoldMs + jaguarMovementModule.gapMs + 120);
    });
    expect(screen.getByText('RIGHT')).toBeInTheDocument();

    await act(async () => {
      const remaining = jaguarMovementModule.sequence.length - 1;
      vi.advanceTimersByTime(remaining * (jaguarMovementModule.cueHoldMs + jaguarMovementModule.gapMs) + 250);
    });

    expect(screen.getByRole('heading', { name: 'Cue sequence done' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'I finished this set' }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    const metrics = onComplete.mock.calls[0][0];
    expect(metrics.cueCount).toBe(6);
    expect(metrics.presentedCueCount).toBe(6);
    expect(metrics.athleteConfirmed).toBe(true);
    expect(metrics.cueIntervalMs).toBe(jaguarMovementModule.cueHoldMs + jaguarMovementModule.gapMs);
    expect(metrics).not.toHaveProperty('qualityScore');
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe('prime physicalCue step', () => {
  it('validates Jaguar Movement on the default Prime MOVE step', () => {
    expect(validatePrimeProtocol(gamespeedPrimeProtocol)).toEqual([]);
    const move = gamespeedPrimeProtocol.steps.find(step => step.id === 'move');
    expect(move?.kind).toBe('physicalCue');
    expect(move?.experienceName).toBe('Jaguar Movement');
    expect(move?.physicalCueModuleId).toBe('jaguar-movement');
  });

  it('completes a physicalCue Prime step without a game result', () => {
    let now = 1_000;
    let state = createPrimeSession({
      protocol: gamespeedPrimeProtocol,
      context: 'practice',
      sport: 'soccer',
      now,
      sessionId: 'physical-prime',
    });
    while (getCurrentPrimeStep(state)?.id !== 'move') {
      now += 10;
      state = startCurrentPrimeStep(state, now);
      now += 10;
      const step = getCurrentPrimeStep(state);
      if (step?.kind === 'drill') {
        state = completeCurrentPrimeStep(state, now, {
          score: 1,
          misses: 0,
          bestStreak: 1,
          mode: step.modeId as GameModeType,
          modeName: step.modeId as GameModeType,
          totalAttempts: 1,
        });
      }
    }
    expect(getCurrentPrimeStep(state)?.kind).toBe('physicalCue');
    now += 10;
    state = startCurrentPrimeStep(state, now);
    now += 20_000;
    state = completeCurrentPrimeStep(state, now, undefined, {
      moduleId: 'jaguar-movement',
      cueCount: 6,
      presentedCueCount: 6,
      cueIntervalMs: 2050,
      athleteConfirmed: true,
      durationMs: 12_000,
    });
    expect(state.phase).toBe('summary');
    expect(state.results[state.results.length - 1]).toMatchObject({
      stepId: 'move',
      status: 'completed',
      physicalCue: {
        cueCount: 6,
        athleteConfirmed: true,
      },
    });
  });
});

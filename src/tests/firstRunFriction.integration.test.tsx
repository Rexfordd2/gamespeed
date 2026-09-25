import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { NIGHT_GUARDRAIL_STORAGE_KEY } from '../utils/nightGuardrail';
import { loadStats, recordRound, setStatsStorageOwner } from '../utils/sessionStats';
import { saveRecommendedSession } from '../utils/recommendedSession';
import { getExperienceName } from '../config/animalInstincts';
import { playableModeKeys } from '../utils/gameModes';

vi.mock('framer-motion', async () => {
  const ReactLib = await import('react');
  const components = new Map<string, React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLElement>>>();
  const motion = new Proxy(
    {},
    {
      get: (_, tagName: string) => {
        if (!components.has(tagName)) {
          components.set(
            tagName,
            ReactLib.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(({ children, ...props }, ref) =>
              ReactLib.createElement(tagName, { ...props, ref }, children),
            ),
          );
        }
        return components.get(tagName);
      },
    },
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

class MockAudio {
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
    return Promise.reject(new Error('audio blocked in test'));
  }
  pause() {}
  addEventListener() {}
  removeEventListener() {}
}

const EXPERIMENT_STORAGE_KEY = 'gamespeed_landing_experiment_assignment_v1';
const FIRST_RUN_COMPLETE_STORAGE_KEY = 'gamespeed_first_run_complete_v1';
const HEADLINE = 'Measure how quickly you see, decide and react.';
const CTA = 'Run 60-second baseline';

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

const renderAppAt = (url = '/') => {
  window.history.replaceState({}, '', url);
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
};

const lastRound = () => {
  const { rounds } = loadStats();
  return rounds[rounds.length - 1];
};

const getQuickstart = () => screen.getByTestId('first-run-quickstart');
const getMain = () => screen.getByRole('main');

const isBefore = (a: Element, b: Element) =>
  (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

/**
 * Walks the shortest path to the first benchmark and returns how many
 * choices the athlete had to make (the start CTA itself is not a decision).
 */
const reachFirstBenchmark = async () => {
  let decisions = 0;
  const getCta = () => within(getQuickstart()).getByRole('button', { name: CTA });
  const personaButtons = within(getQuickstart()).getAllByRole('button', { name: /^(Athlete|Gamer)$/ });

  if (!personaButtons.some(button => button.getAttribute('aria-pressed') === 'true')) {
    expect(getCta()).toBeDisabled();
    fireEvent.click(personaButtons[0]);
    decisions += 1;
  }

  expect(getCta()).toBeDisabled();
  const goalGroup = within(getQuickstart()).getByRole('group', { name: 'Pick one goal' });
  fireEvent.click(within(goalGroup).getAllByRole('button')[0]);
  decisions += 1;

  expect(getCta()).toBeEnabled();
  fireEvent.click(getCta());
  await flushMicrotasks();
  expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
  return decisions;
};

const completeFirstBenchmark = async () => {
  await reachFirstBenchmark();
  await advance(1_000);
  await advance(62_000);
};

const CONFIGURATION_QUERIES = [
  () => document.querySelector('input[type="time"]'),
  () => document.querySelector('select'),
  () => screen.queryByRole('button', { name: /Competition tomorrow/i }),
  () => screen.queryByRole('button', { name: /Short breathing/i }),
  () => screen.queryByRole('button', { name: /^minimal$/i }),
  () => screen.queryByRole('button', { name: /Mobile haptics/i }),
  () => screen.queryByRole('button', { name: 'Soccer' }),
];

describe('first-run friction contract', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00'));
    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
    vi.stubGlobal('confirm', vi.fn(() => true));
    localStorage.clear();
    sessionStorage.clear();
    setStatsStorageOwner(null);
    localStorage.setItem(
      'gamespeed_instinct_intro_seen_v1',
      JSON.stringify(Object.fromEntries(playableModeKeys.map(mode => [mode, true]))),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('decisions before the first benchmark', () => {
    it.each([
      ['A', 1],
      ['B', 1],
      ['C', 2],
    ])('variant %s needs %i decision(s) and never more than two', async (variant, expected) => {
      localStorage.setItem(EXPERIMENT_STORAGE_KEY, variant);
      renderAppAt('/');
      const decisions = await reachFirstBenchmark();
      expect(decisions).toBe(expected);
      expect(decisions).toBeLessThanOrEqual(2);
    });

    it('shows only the explanation, persona, one goal choice, and the CTA in the first-task section', () => {
      localStorage.setItem(EXPERIMENT_STORAGE_KEY, 'A');
      renderAppAt('/');
      const quickstart = getQuickstart();

      expect(within(quickstart).getByRole('heading', { level: 1 })).toHaveTextContent(HEADLINE);
      expect(within(quickstart).getAllByRole('heading')).toHaveLength(1);
      const buttons = within(quickstart).getAllByRole('button').map(button => button.textContent?.trim());
      expect(buttons).toEqual([
        'Athlete',
        'Gamer',
        expect.stringContaining('First-step quickness'),
        expect.stringContaining('Peripheral awareness'),
        expect.stringContaining('Game-speed decisions'),
        CTA,
      ]);
      expect(quickstart.querySelectorAll('input, select, textarea')).toHaveLength(0);
    });

    it('records the persona and goal on first_test_start for the experiment funnel', async () => {
      localStorage.setItem(EXPERIMENT_STORAGE_KEY, 'C');
      renderAppAt('/');
      await reachFirstBenchmark();
      const events = window.__gamespeedAnalytics?.read() ?? [];
      const firstStart = events.find(event => event.name === 'first_test_start');
      expect(firstStart?.experimentVariant).toBe('C');
      expect(firstStart?.payload).toMatchObject({ persona: 'athlete', goal: 'firstStepQuickness', entrySource: null });
    });
  });

  describe('first benchmark reachable at 390px', () => {
    beforeEach(() => {
      vi.stubGlobal('innerWidth', 390);
      window.dispatchEvent(new Event('resize'));
    });

    it('puts the first-task section first and keeps configuration out of the way until requested', () => {
      renderAppAt('/');
      const quickstart = getQuickstart();
      const cta = within(quickstart).getByRole('button', { name: CTA });
      const moreSettings = screen.getByRole('button', { name: /more settings/i });

      expect(getMain().firstElementChild).toBe(quickstart);
      expect(moreSettings).toHaveAttribute('aria-expanded', 'false');
      CONFIGURATION_QUERIES.forEach(query => expect(query()).toBeNull());
      expect(isBefore(cta, moreSettings)).toBe(true);

      fireEvent.click(moreSettings);
      CONFIGURATION_QUERIES.forEach(query => {
        const control = query();
        expect(control).not.toBeNull();
        expect(isBefore(cta, control!)).toBe(true);
      });
    });

    it('stages sleep check-in and the leaderboard until after first completion', () => {
      renderAppAt('/');
      expect(screen.queryByRole('heading', { name: 'Sleep check-in' })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Readiness leaderboard snapshot' })).not.toBeInTheDocument();
    });
  });

  describe('first completion', () => {
    it('leads with score, one interpretation, one recommended session, and the primary CTA', async () => {
      renderAppAt('/');
      await completeFirstBenchmark();

      const summary = screen.getByTestId('result-summary');
      const storedRound = lastRound();
      expect(storedRound.mode).toBe('reactionBenchmark');
      expect(within(summary).getByTestId('result-score')).toHaveTextContent(
        String(storedRound.readinessMetrics?.readinessScore),
      );
      expect(within(summary).getByTestId('result-interpretation').textContent).toMatch(/^Baseline set\. /);
      expect(within(summary).getByText('Recommended next session')).toBeInTheDocument();

      const recommendedName = getExperienceName('quickTap');
      expect(within(summary).getByText(recommendedName)).toBeInTheDocument();
      const primary = within(summary).getByRole('button', { name: `TRAIN: ${recommendedName}` });
      expect(within(summary).getAllByRole('button')).toEqual([primary]);
      expect(screen.getAllByRole('button', { name: /^TRAIN:/ })).toHaveLength(1);

      const savePrompt = screen.getByRole('region', { name: 'Save my progress' });
      expect(isBefore(summary, savePrompt)).toBe(true);
      expect(isBefore(savePrompt, screen.getByText('Result details'))).toBe(true);
      expect(screen.queryByRole('link', { name: 'Return to Athlete Houze' })).not.toBeInTheDocument();

      fireEvent.click(primary);
      await flushMicrotasks();
      expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
      expect(screen.getAllByText(recommendedName).length).toBeGreaterThan(0);
    });

    it('keeps the signup prompt after the first session and tracks it', async () => {
      renderAppAt('/');
      await completeFirstBenchmark();
      expect(screen.getByRole('heading', { name: 'Save my progress' })).toBeInTheDocument();
      const names = (window.__gamespeedAnalytics?.read() ?? []).map(event => event.name);
      expect(names).toContain('first_test_completion');
      expect(names).toContain('signup_prompt_shown');
    });
  });

  describe('Athlete Houze handoff', () => {
    it('shows the return link at first completion without claiming a sync', async () => {
      renderAppAt('/?source=athlete-houze');
      await completeFirstBenchmark();

      const link = screen.getByRole('link', { name: 'Return to Athlete Houze' });
      expect(link).toHaveAttribute('href', 'https://athletehouze.com/');
      expect(link).not.toHaveAttribute('target');
      expect(screen.getByText(/Athlete Houze does not receive it automatically/)).toBeInTheDocument();
      expect(document.body.textContent).not.toMatch(/(synced|saved) (to|with|in) Athlete Houze/i);

      const preventNavigation = (event: Event) => event.preventDefault();
      document.addEventListener('click', preventNavigation, true);
      fireEvent.click(link);
      document.removeEventListener('click', preventNavigation, true);
      const events = window.__gamespeedAnalytics?.read() ?? [];
      expect(events.find(event => event.name === 'handoff_return_click')?.payload).toMatchObject({
        source: 'athlete-houze',
        firstCompletion: true,
        isSignedIn: false,
      });
      expect(events.find(event => event.name === 'first_test_start')?.payload).toMatchObject({
        entrySource: 'athlete-houze',
      });
    });

    it('keeps return targets on https://athletehouze.com only', async () => {
      renderAppAt('/?source=athlete-houze&return_to=https://evil.example/steal');
      await completeFirstBenchmark();
      expect(screen.getByRole('link', { name: 'Return to Athlete Houze' })).toHaveAttribute(
        'href',
        'https://athletehouze.com/',
      );
    });

    it('allows a return path on the Athlete Houze origin and survives in-app navigation', async () => {
      renderAppAt('/?source=athlete-houze&return_to=/athletes/me');
      fireEvent.click(screen.getByRole('button', { name: /see benchmark methodology/i }));
      expect(window.location.search).not.toContain('source=');
      fireEvent.click(screen.getByRole('button', { name: /back/i }));
      await completeFirstBenchmark();
      expect(screen.getByRole('link', { name: 'Return to Athlete Houze' })).toHaveAttribute(
        'href',
        'https://athletehouze.com/athletes/me',
      );
    });
  });

  describe('returning athlete', () => {
    const seedReturningAthlete = () => {
      localStorage.setItem(FIRST_RUN_COMPLETE_STORAGE_KEY, '1');
      recordRound({
        score: 18,
        misses: 3,
        bestStreak: 9,
        mode: 'reactionBenchmark',
        modeName: 'Panther Readiness',
        benchmarkScore: 74,
        medianReactionTimeMs: 412,
      });
      saveRecommendedSession('multiTarget');
    };

    it('puts GameSpeed Score, recommended session, and one Start CTA at the top', async () => {
      seedReturningAthlete();
      renderAppAt('/');

      const summary = screen.getByTestId('returning-summary');
      expect(getMain().firstElementChild).toBe(summary);
      expect(screen.queryByTestId('first-run-quickstart')).not.toBeInTheDocument();
      expect(within(summary).getByTestId('returning-score')).toHaveTextContent('74');
      expect(within(summary).getByText('Recommended session')).toBeInTheDocument();
      const recommendedName = getExperienceName('multiTarget');
      expect(within(summary).getByText(recommendedName)).toBeInTheDocument();
      const buttons = within(summary).getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent(`Start ${recommendedName}`);

      expect(isBefore(summary, screen.getByRole('region', { name: 'Progress details' }))).toBe(true);
      expect(screen.getByRole('button', { name: /more settings/i })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('heading', { name: 'Sleep check-in' })).toBeInTheDocument();

      fireEvent.click(buttons[0]);
      await flushMicrotasks();
      expect(screen.getByRole('button', { name: /pause game/i })).toBeInTheDocument();
      expect(screen.getAllByText(recommendedName).length).toBeGreaterThan(0);
    });

    it('returns to the returning view after the first completion', async () => {
      renderAppAt('/');
      await completeFirstBenchmark();
      fireEvent.click(screen.getByRole('button', { name: 'Main Menu' }));
      expect(screen.getByTestId('returning-summary')).toBeInTheDocument();
      expect(screen.queryByTestId('first-run-quickstart')).not.toBeInTheDocument();
    });
  });

  describe('night guardrail after staging', () => {
    const activeGuardrail = {
      targetBedtime: '22:00',
      competitionTomorrow: true,
      reminderPreference: 'inApp',
      includeBreathingRoutine: true,
    };

    it('forces the first-run baseline into low-stimulation mode', async () => {
      vi.setSystemTime(new Date('2026-01-01T20:30:00'));
      localStorage.setItem(NIGHT_GUARDRAIL_STORAGE_KEY, JSON.stringify(activeGuardrail));
      renderAppAt('/');

      expect(within(getQuickstart()).getByText(/runs in low-stimulation mode/)).toBeInTheDocument();
      expect(screen.getByText('Low-stimulation option')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Choose Your Instinct' })).not.toBeInTheDocument();

      await reachFirstBenchmark();
      expect(screen.getByRole('heading', { name: 'Breathing reset' })).toBeInTheDocument();
      const firstStart = (window.__gamespeedAnalytics?.read() ?? []).find(event => event.name === 'test_start');
      expect(firstStart?.payload).toMatchObject({ lowStimulus: true, mode: 'reactionBenchmark' });
    });

    it('still activates when configured from More settings', () => {
      vi.setSystemTime(new Date('2026-01-01T20:45:00'));
      renderAppAt('/');
      expect(screen.queryByText('Low-stimulation option')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /more settings/i }));
      fireEvent.click(screen.getByRole('button', { name: 'Competition tomorrow: Off' }));

      expect(JSON.parse(localStorage.getItem(NIGHT_GUARDRAIL_STORAGE_KEY)!).competitionTomorrow).toBe(true);
      expect(screen.getByText('Low-stimulation option')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Low-Stimulation Night Option' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Choose Your Instinct' })).not.toBeInTheDocument();
    });

    it('makes the returning Start CTA the low-stimulation session', async () => {
      vi.setSystemTime(new Date('2026-01-01T20:30:00'));
      localStorage.setItem(NIGHT_GUARDRAIL_STORAGE_KEY, JSON.stringify(activeGuardrail));
      localStorage.setItem(FIRST_RUN_COMPLETE_STORAGE_KEY, '1');
      recordRound({ score: 10, misses: 2, bestStreak: 4, mode: 'quickTap', modeName: 'Quick Tap' });
      renderAppAt('/');

      const summary = screen.getByTestId('returning-summary');
      expect(within(summary).getByText('Low-stimulation readiness check')).toBeInTheDocument();
      fireEvent.click(within(summary).getByRole('button', { name: 'Start low-stimulation session' }));
      await flushMicrotasks();
      expect(screen.getByRole('heading', { name: 'Breathing reset' })).toBeInTheDocument();
    });
  });

  describe('modes and scoring', () => {
    it('keeps every playable mode reachable from the first-run screen', () => {
      renderAppAt('/');
      playableModeKeys.forEach(mode => {
        expect(screen.getByRole('heading', { name: getExperienceName(mode) })).toBeInTheDocument();
      });
    });

    it('scores the first benchmark with the existing benchmark pipeline', async () => {
      renderAppAt('/');
      await reachFirstBenchmark();
      for (let waited = 0; waited < 6_000 && !screen.queryByRole('button', { name: 'Hit target' }); waited += 250) {
        await advance(250);
      }
      fireEvent.click(screen.getByRole('button', { name: 'Hit target' }));
      await advance(62_000);

      const round = lastRound();
      expect(round.mode).toBe('reactionBenchmark');
      expect(round.score).toBe(1);
      expect(typeof round.benchmarkScore).toBe('number');
      expect(loadStats().pbs.reactionBenchmark).toBeDefined();
      expect(screen.getByTestId('result-score')).toHaveTextContent(String(round.readinessMetrics?.readinessScore));
    });
  });
});

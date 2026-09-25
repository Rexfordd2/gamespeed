import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { App } from '../App';
import { loadStats, setStatsStorageOwner } from '../utils/sessionStats';
import { playableModeKeys } from '../utils/gameModes';
import { fetchCloudRounds, syncRoundToCloud, syncRoundsToCloud } from '../utils/roundSync';

const authStore = vi.hoisted(() => {
  let user: { id: string; email: string } | null = null;
  const listeners = new Set<() => void>();
  return {
    getUser: () => user,
    setUser: (next: { id: string; email: string } | null) => {
      user = next;
      listeners.forEach(listener => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
});

vi.mock('../context/AuthContext', async () => {
  const ReactLib = await import('react');
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => {
      const user = ReactLib.useSyncExternalStore(authStore.subscribe, authStore.getUser) as User | null;
      return {
        isConfigured: true,
        isLoading: false,
        isProfileLoading: false,
        session: null,
        user,
        profile: null,
        signInWithProvider: vi.fn(async () => ({ error: null })),
        upsertProfile: vi.fn(async () => ({ error: null })),
        signOut: vi.fn(async () => ({ error: null })),
        refreshProfile: vi.fn(async () => undefined),
      };
    },
  };
});

vi.mock('../utils/roundSync', () => ({
  createClientRoundId: () => `round-${Math.random().toString(16).slice(2)}`,
  syncRoundToCloud: vi.fn(async () => 'synced'),
  syncRoundsToCloud: vi.fn(async () => 'synced'),
  fetchCloudRounds: vi.fn(async () => ({ status: 'synced', rounds: [] })),
}));

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

const flushMicrotasks = async () => {
  await act(async () => {
    for (let i = 0; i < 5; i += 1) {
      await Promise.resolve();
    }
  });
};

const advance = async (ms: number) => {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
};

describe('anonymous -> authenticated save transition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00'));
    vi.stubGlobal('Audio', MockAudio as unknown as typeof Audio);
    localStorage.clear();
    sessionStorage.clear();
    setStatsStorageOwner(null);
    authStore.setUser(null);
    localStorage.setItem(
      'gamespeed_instinct_intro_seen_v1',
      JSON.stringify(Object.fromEntries(playableModeKeys.map(mode => [mode, true]))),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    setStatsStorageOwner(null);
  });

  it('saves the anonymous first result to the account once the athlete signs in', async () => {
    window.history.replaceState({}, '', '/');
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Athlete' }));
    fireEvent.click(screen.getByRole('button', { name: /First-step quickness/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Run 60-second baseline' }));
    await flushMicrotasks();
    await advance(1_000);
    await advance(62_000);

    const savePrompt = screen.getByRole('region', { name: 'Save my progress' });
    expect(within(savePrompt).getByRole('button', { name: 'Email me a magic link' })).toBeInTheDocument();
    expect(syncRoundToCloud).not.toHaveBeenCalled();
    const anonymousRounds = loadStats().rounds;
    expect(anonymousRounds).toHaveLength(1);

    act(() => {
      authStore.setUser({ id: 'user-1', email: 'ava@team.com' });
    });
    await flushMicrotasks();

    expect(screen.queryByRole('region', { name: 'Save my progress' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Progress saved to your GameSpeed account.');
    expect(syncRoundsToCloud).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([expect.objectContaining({ clientRoundId: anonymousRounds[0].clientRoundId })]),
    );
    expect(fetchCloudRounds).toHaveBeenCalledWith('user-1');
    expect(loadStats().rounds.map(round => round.clientRoundId)).toEqual([anonymousRounds[0].clientRoundId]);

    const events = window.__gamespeedAnalytics?.read() ?? [];
    expect(events.map(event => event.name)).toContain('signup_after_first_session');
  });
});

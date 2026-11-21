import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { ATHLETE_HOUZE_HOME_URL } from '../components/AthleteHouzeReturnBar';

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

class SilentAudio {
  src: string;
  muted = true;
  loop = false;
  preload = 'auto';
  volume = 1;
  currentTime = 0;
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

const renderAt = async (url: string) => {
  window.history.replaceState({}, '', url);
  render(
    <AuthProvider>
      <App />
    </AuthProvider>,
  );
  await act(async () => {
    await Promise.resolve();
  });
};

const UNSUPPORTED_CLAIMS = [
  /placeholder/i,
  /n=\d/i,
  /\+11%|62%|-19 ms|\+7\.6/,
  /D\. Reynolds|A\. Kim|J\. Patel|R\. Ellis|M\. Torres|K\. Shah/,
  /Readiness Band [A-D]/,
  /leaderboard/i,
];

describe('public routes', () => {
  beforeEach(() => {
    vi.stubGlobal('Audio', SilentAudio as unknown as typeof Audio);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.title = '';
  });

  it('shows a not-found state for unknown paths and returns home', async () => {
    await renderAt('/definitely-missing');
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(document.title).toBe('Page not found — GameSpeed');

    fireEvent.click(screen.getByRole('button', { name: 'Go to GameSpeed home' }));
    expect(window.location.pathname).toBe('/');
    expect(screen.queryByTestId('not-found-page')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'TRAIN YOUR INSTINCTS' })).toBeInTheDocument();
  });

  it('restores the not-found state on browser Back', async () => {
    await renderAt('/definitely-missing');
    fireEvent.click(screen.getByRole('button', { name: 'Go to GameSpeed home' }));
    await act(async () => {
      window.history.replaceState({}, '', '/definitely-missing');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByTestId('not-found-page')).toBeInTheDocument();
  });

  it('shows an honest privacy status instead of the homepage or invented policy terms', async () => {
    await renderAt('/privacy');
    expect(screen.getByTestId('privacy-status-page')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Privacy policy not yet published' })).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/we (collect|share|sell|retain)/i);
  });

  it.each(['/', '/index.html', '/benchmark', '/benchmark/', '/?view=benchmark', '/runway'])(
    'keeps %s as a real page',
    async url => {
      await renderAt(url);
      expect(screen.queryByTestId('not-found-page')).not.toBeInTheDocument();
    },
  );

  it.each(['/', '/?view=benchmark', '/privacy', '/definitely-missing'])(
    'links %s back to the public Athlete Houze homepage',
    async url => {
      await renderAt(url);
      const link = screen.getByRole('link', { name: /Return to Athlete Houze/ });
      expect(link).toHaveAttribute('href', ATHLETE_HOUZE_HOME_URL);
      expect(ATHLETE_HOUZE_HOME_URL).toBe('https://athletehouze.com/');
    },
  );

  it.each(['/', '/?view=benchmark'])('publishes no placeholder proof on %s', async url => {
    await renderAt(url);
    const text = document.body.textContent ?? '';
    for (const claim of UNSUPPORTED_CLAIMS) expect(text).not.toMatch(claim);
  });

  it('describes the benchmark protocol from the mode configuration', async () => {
    await renderAt('/?view=benchmark');
    expect(screen.getByText('60 seconds')).toBeInTheDocument();
    expect(screen.getByText('1.2 seconds per target')).toBeInTheDocument();
    expect(
      screen.getByText(/has not published user statistics, study results, or testimonials/),
    ).toBeInTheDocument();
  });
});

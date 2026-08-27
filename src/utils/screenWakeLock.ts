type WakeLockSentinelLike = {
  released?: boolean;
  release: () => Promise<void>;
};

export interface ScreenWakeLockHandle {
  supported: boolean;
  active: boolean;
  release: () => Promise<void>;
}

const isWakeLockSupported = () =>
  typeof navigator !== 'undefined' &&
  'wakeLock' in navigator &&
  typeof (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } })
    .wakeLock?.request === 'function';

/**
 * Ask the browser to keep the screen awake during a physical-cue set.
 * Not guaranteed. Safe no-op where Wake Lock is missing or denied.
 */
export const acquireScreenWakeLock = async (): Promise<ScreenWakeLockHandle> => {
  const empty = async () => undefined;
  if (!isWakeLockSupported()) {
    return { supported: false, active: false, release: empty };
  }

  let sentinel: WakeLockSentinelLike | null = null;
  const request = async () => {
    try {
      const api = (
        navigator as Navigator & {
          wakeLock: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
        }
      ).wakeLock;
      sentinel = await api.request('screen');
    } catch {
      sentinel = null;
    }
  };

  await request();

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && (!sentinel || sentinel.released)) {
      void request();
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibility);
  }

  return {
    supported: true,
    active: Boolean(sentinel),
    release: async () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
      try {
        await sentinel?.release();
      } catch {
        // ignore
      }
      sentinel = null;
    },
  };
};

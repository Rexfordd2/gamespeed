import { afterEach, describe, expect, it, vi } from 'vitest';
import { acquireScreenWakeLock } from '../utils/screenWakeLock';

describe('screen wake lock helper', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no-ops when Wake Lock is unsupported', async () => {
    vi.stubGlobal('navigator', { userAgent: 'test' });
    const handle = await acquireScreenWakeLock();
    expect(handle.supported).toBe(false);
    expect(handle.active).toBe(false);
    await expect(handle.release()).resolves.toBeUndefined();
  });

  it('requests a screen lock when the API exists', async () => {
    const release = vi.fn(async () => undefined);
    const request = vi.fn(async () => ({ released: false, release }));
    vi.stubGlobal('navigator', {
      ...navigator,
      wakeLock: { request },
    });

    const handle = await acquireScreenWakeLock();
    expect(request).toHaveBeenCalledWith('screen');
    expect(handle.supported).toBe(true);
    expect(handle.active).toBe(true);
    await handle.release();
    expect(release).toHaveBeenCalled();
  });
});

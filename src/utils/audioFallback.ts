export type FallbackEffect = 'hit' | 'miss' | 'success';

const warnedEffects = new Set<FallbackEffect>();
let fallbackAudioContext: AudioContext | null = null;

const effectProfiles: Record<
  FallbackEffect,
  { frequency: number; duration: number; type: OscillatorType; gain: number; glideTo?: number }
> = {
  hit: { frequency: 760, duration: 0.08, type: 'triangle', gain: 0.06, glideTo: 900 },
  miss: { frequency: 220, duration: 0.14, type: 'sawtooth', gain: 0.05, glideTo: 170 },
  success: { frequency: 520, duration: 0.24, type: 'sine', gain: 0.07, glideTo: 740 },
};

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (fallbackAudioContext) return fallbackAudioContext;

  const ContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!ContextCtor) return null;

  fallbackAudioContext = new ContextCtor();
  return fallbackAudioContext;
};

export const playFallbackEffect = (effect: FallbackEffect) => {
  const profile = effectProfiles[effect];
  const context = getAudioContext();
  if (!context) return;

  if (context.state === 'suspended') {
    void context.resume();
  }

  const startedAt = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = profile.type;
  oscillator.frequency.setValueAtTime(profile.frequency, startedAt);
  if (profile.glideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(profile.glideTo, startedAt + profile.duration);
  }

  gain.gain.setValueAtTime(profile.gain, startedAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + profile.duration);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startedAt);
  oscillator.stop(startedAt + profile.duration);

  if (!warnedEffects.has(effect)) {
    warnedEffects.add(effect);
    console.warn(
      `[assets] Using synthesized fallback for "${effect}" effect. Add the production audio file when available.`,
    );
  }
};

export type FallbackEffect =
  | 'hit'
  | 'miss'
  | 'success'
  | 'hiss'
  | 'growl'
  | 'waterThud';

const warnedEffects = new Set<FallbackEffect>();
let fallbackAudioContext: AudioContext | null = null;

type ToneProfile = {
  frequency: number;
  duration: number;
  type: OscillatorType;
  gain: number;
  glideTo?: number;
  noise?: boolean;
};

const effectProfiles: Record<FallbackEffect, ToneProfile> = {
  hit: { frequency: 760, duration: 0.08, type: 'triangle', gain: 0.06, glideTo: 900 },
  miss: { frequency: 220, duration: 0.14, type: 'sawtooth', gain: 0.05, glideTo: 170 },
  success: { frequency: 520, duration: 0.24, type: 'sine', gain: 0.07, glideTo: 740 },
  // Short identity accents — not realistic animal loops.
  hiss: { frequency: 2400, duration: 0.09, type: 'sawtooth', gain: 0.035, glideTo: 1800, noise: true },
  growl: { frequency: 90, duration: 0.11, type: 'square', gain: 0.05, glideTo: 70 },
  waterThud: { frequency: 140, duration: 0.16, type: 'sine', gain: 0.07, glideTo: 55 },
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

const playNoiseBurst = (context: AudioContext, startedAt: number, duration: number, gainLevel: number) => {
  const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / sampleCount);
  }
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  gain.gain.setValueAtTime(gainLevel, startedAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);
  source.connect(gain);
  gain.connect(context.destination);
  source.start(startedAt);
  source.stop(startedAt + duration);
};

export const playFallbackEffect = (effect: FallbackEffect) => {
  const profile = effectProfiles[effect];
  const context = getAudioContext();
  if (!context) return;

  if (context.state === 'suspended') {
    void context.resume();
  }

  const startedAt = context.currentTime;

  if (profile.noise) {
    playNoiseBurst(context, startedAt, profile.duration, profile.gain);
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = profile.type;
  oscillator.frequency.setValueAtTime(profile.frequency, startedAt);
  if (profile.glideTo) {
    oscillator.frequency.exponentialRampToValueAtTime(profile.glideTo, startedAt + profile.duration);
  }

  gain.gain.setValueAtTime(profile.noise ? profile.gain * 0.35 : profile.gain, startedAt);
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

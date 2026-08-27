import { PhysicalCueId } from '../types/physicalCue';
import { getPhysicalCueDefinition } from '../config/physicalCueVocabulary';

let toneContext: AudioContext | null = null;

const getToneContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (toneContext) return toneContext;
  const ContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!ContextCtor) return null;
  toneContext = new ContextCtor();
  return toneContext;
};

export const playPhysicalCueTone = (cueId: PhysicalCueId): boolean => {
  const definition = getPhysicalCueDefinition(cueId);
  const context = getToneContext();
  if (!context) return false;
  if (context.state === 'suspended') {
    void context.resume();
  }

  const startedAt = context.currentTime;
  const durationSec = Math.max(0.05, definition.toneMs / 1000);
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(definition.toneHz, startedAt);
  gain.gain.setValueAtTime(0.07, startedAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + durationSec);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startedAt);
  oscillator.stop(startedAt + durationSec);
  return true;
};

export const speakPhysicalCue = (label: string): boolean => {
  if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(label);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
};

export const stopPhysicalCueSpeech = (): void => {
  if (typeof window === 'undefined' || typeof window.speechSynthesis === 'undefined') {
    return;
  }
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
};

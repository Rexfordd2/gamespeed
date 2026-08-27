import { useEffect, useRef, useState } from 'react';
import { PhysicalCueId, PhysicalCueMetrics, PhysicalCueModule } from '../../types/physicalCue';
import { useTheme } from '../../context/ThemeContext';
import { useOptionalAudio } from '../AudioManager';
import { JungleButton } from '../JungleButton';
import {
  cancelPhysicalCueSession,
  confirmPhysicalCueSession,
  createPhysicalCueSession,
  getCurrentPhysicalCue,
  getPhysicalCueMetrics,
  startPhysicalCueSequence,
  tickPhysicalCueSession,
} from '../../utils/physicalCueEngine';
import { playPhysicalCueTone, speakPhysicalCue, stopPhysicalCueSpeech } from '../../utils/physicalCueAudio';
import { acquireScreenWakeLock } from '../../utils/screenWakeLock';
import { triggerHapticCue } from '../../utils/haptics';

interface PhysicalCueSessionProps {
  module: PhysicalCueModule;
  hapticsEnabled: boolean;
  lowStimulus: boolean;
  reducedMotion: boolean;
  onComplete: (metrics: PhysicalCueMetrics) => void;
  onCancel: () => void;
}

const DIRECTION_ARROWS: Partial<Record<PhysicalCueId, string>> = {
  left: '◀',
  right: '▶',
  forward: '▲',
  back: '▼',
};

const hapticForCue = (cueId: PhysicalCueId): 'cue' | 'hold' | 'start' | 'complete' => {
  if (cueId === 'hold' || cueId === 'stick') return 'hold';
  if (cueId === 'go') return 'start';
  if (cueId === 'reset') return 'complete';
  return 'cue';
};

export const PhysicalCueSession = ({
  module,
  hapticsEnabled,
  lowStimulus,
  reducedMotion,
  onComplete,
  onCancel,
}: PhysicalCueSessionProps) => {
  const { theme } = useTheme();
  const audio = useOptionalAudio();
  const muted = audio?.isMuted ?? true;
  const [engine, setEngine] = useState(() => createPhysicalCueSession(module));
  const lastSignaledCue = useRef<string | null>(null);

  useEffect(() => {
    let released = false;
    let release: (() => Promise<void>) | null = null;
    void acquireScreenWakeLock().then(handle => {
      if (released) {
        void handle.release();
        return;
      }
      release = handle.release;
    });
    return () => {
      released = true;
      void release?.();
      stopPhysicalCueSpeech();
    };
  }, []);

  useEffect(() => {
    if (engine.phase !== 'cueing' && engine.phase !== 'gap') {
      return;
    }
    const timerId = window.setInterval(() => {
      setEngine(current => tickPhysicalCueSession(current, module, Date.now()));
    }, 80);
    return () => window.clearInterval(timerId);
  }, [engine.phase, module]);

  const currentCue = getCurrentPhysicalCue(engine, module);

  useEffect(() => {
    if (engine.phase !== 'cueing' || !currentCue) {
      return;
    }
    const signalKey = `${engine.cueIndex}:${currentCue.id}`;
    if (lastSignaledCue.current === signalKey) {
      return;
    }
    lastSignaledCue.current = signalKey;
    if (!muted && !lowStimulus) {
      playPhysicalCueTone(currentCue.id);
      speakPhysicalCue(currentCue.label);
    }
    triggerHapticCue(hapticForCue(currentCue.id), { enabled: hapticsEnabled, lowStimulus });
  }, [currentCue, engine.cueIndex, engine.phase, hapticsEnabled, lowStimulus, muted]);

  const handleStart = () => {
    void audio?.ensureAudioReady();
    setEngine(startPhysicalCueSequence(engine, Date.now()));
  };

  const handleConfirm = () => {
    const completed = confirmPhysicalCueSession(engine, Date.now());
    setEngine(completed);
    onComplete(getPhysicalCueMetrics(completed, module, Date.now()));
  };

  const handleCancel = () => {
    if (typeof window !== 'undefined' && !window.confirm('Leave Jaguar Movement and return home?')) {
      return;
    }
    setEngine(cancelPhysicalCueSession(engine, Date.now()));
    stopPhysicalCueSpeech();
    onCancel();
  };

  const preventBrowserChrome = (event: { preventDefault: () => void }) => {
    event.preventDefault();
  };

  const cueLabel = currentCue?.label ?? (engine.phase === 'gap' ? '' : 'READY');

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        minHeight: '100dvh',
        height: '100dvh',
        backgroundColor: '#02080c',
        color: theme.textColor,
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        overscrollBehavior: 'none',
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
      }}
      onContextMenu={preventBrowserChrome}
    >
      <div className="flex h-full min-h-[100dvh] flex-col">
        <header className="flex items-center justify-between gap-3 px-3 sm:px-4">
          <p className="text-[11px] uppercase tracking-[0.16em] font-semibold" style={{ color: theme.targetColor }}>
            {module.publicName}
          </p>
          <button
            type="button"
            onClick={handleCancel}
            className="min-h-11 min-w-11 rounded-xl px-3 text-xs"
            style={{ color: theme.textColor, border: `1px solid ${theme.textColor}44`, touchAction: 'manipulation' }}
            aria-label="Leave Jaguar Movement"
          >
            Leave
          </button>
        </header>

        {engine.phase === 'briefing' && (
          <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-4">
            <h1 className="text-3xl font-extrabold sm:text-4xl" style={{ color: theme.textColor }}>
              {module.publicName}
            </h1>
            <p className="text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.84 }}>
              {module.tagline} GameSpeed provides the cue. You perform it. This does not score how you moved.
            </p>
            <ul className="space-y-2 text-sm" style={{ color: theme.textColor, opacity: 0.8 }}>
              {module.safetyNotes.map(note => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <JungleButton onClick={handleStart} className="mt-2 w-full min-h-14 px-5 py-3 text-lg font-extrabold">
              Start cues
            </JungleButton>
          </main>
        )}

        {(engine.phase === 'cueing' || engine.phase === 'gap') && (
          <main
            className="flex flex-1 flex-col items-center justify-center px-3 text-center"
            style={{ touchAction: 'none' }}
            aria-live="assertive"
            aria-label={currentCue ? `Movement cue ${currentCue.label}` : 'Cue rest'}
          >
            {currentCue && DIRECTION_ARROWS[currentCue.id] && (
              <p
                aria-hidden="true"
                className="mb-2 font-extrabold leading-none"
                style={{
                  fontSize: 'clamp(2.5rem, 12vw, 6rem)',
                  color: theme.targetColor,
                  opacity: reducedMotion ? 1 : 0.92,
                }}
              >
                {DIRECTION_ARROWS[currentCue.id]}
              </p>
            )}
            <p
              className="font-black uppercase tracking-[0.04em] leading-none"
              style={{
                fontSize: 'clamp(3.4rem, 22vw, 9rem)',
                color: theme.textColor,
                textShadow: `0 0 32px ${theme.targetColor}66`,
              }}
            >
              {cueLabel}
            </p>
            {currentCue && (
              <p className="mt-4 max-w-md text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.78 }}>
                {currentCue.instruction}
              </p>
            )}
            <p className="mt-6 text-[11px] uppercase tracking-[0.16em]" style={{ color: theme.textColor, opacity: 0.55 }}>
              Cue {Math.min(engine.presentedCueCount, module.sequence.length)} of {module.sequence.length}
            </p>
          </main>
        )}

        {engine.phase === 'confirming' && (
          <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-4">
            <h1 className="text-3xl font-extrabold" style={{ color: theme.textColor }}>
              Cue sequence done
            </h1>
            <p className="text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.84 }}>
              Confirm only that you finished this set. GameSpeed did not track or score your movement.
            </p>
            <p className="text-sm" style={{ color: theme.textColor, opacity: 0.7 }}>
              {module.sequence.length} cues · {getPhysicalCueMetrics(engine, module).cueIntervalMs} ms interval
            </p>
            <JungleButton onClick={handleConfirm} className="w-full min-h-14 px-5 py-3 text-lg font-extrabold">
              I finished this set
            </JungleButton>
          </main>
        )}
      </div>
    </div>
  );
};

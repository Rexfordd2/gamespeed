import { CueIntensity } from '../types/game';
import { GameplayCueSet, GameplayCueType, isCueTimingVisible } from '../utils/gameplayCues';

interface GameplayCueOverlayProps {
  cueIntensity: CueIntensity;
  cueSet: GameplayCueSet;
  preRoundCueText: string | null;
  phaseCue: { text: string; type: GameplayCueType } | null;
  streakCue: { text: string; type: GameplayCueType } | null;
  lowStimulusMode?: boolean;
}

const cueTypeColor: Record<GameplayCueType, string> = {
  focus: 'rgba(56, 189, 248, 0.8)',
  tactical: 'rgba(74, 222, 128, 0.8)',
  reset: 'rgba(248, 113, 113, 0.82)',
};

export const GameplayCueOverlay = ({
  cueIntensity,
  cueSet,
  preRoundCueText,
  phaseCue,
  streakCue,
  lowStimulusMode = false,
}: GameplayCueOverlayProps) => {
  return (
    <div
      className="absolute inset-0 z-[16] pointer-events-none"
      data-testid="gameplay-cue-overlay"
      aria-label="Gameplay cue overlay"
    >
      {isCueTimingVisible(cueIntensity, 'preRound') && preRoundCueText && (
        <div className="absolute inset-x-0 top-[max(8px,env(safe-area-inset-top,0px))] px-3 sm:px-4">
          <div
            className="mx-auto rounded-xl px-3 py-2 text-center"
            style={{
              maxWidth: 'min(86vw, 360px)',
              backgroundColor: lowStimulusMode ? 'rgba(4, 10, 12, 0.9)' : 'rgba(4, 12, 12, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.75)',
              color: '#dbeafe',
            }}
            aria-live="polite"
            data-testid="gameplay-pre-round-cue"
          >
            <p className="text-[10px] uppercase tracking-[0.17em] opacity-75">Pre-round cue</p>
            <p className="mt-1 text-xs sm:text-sm font-semibold">{preRoundCueText}</p>
          </div>
        </div>
      )}

      {isCueTimingVisible(cueIntensity, 'phaseTriggered') && phaseCue && (
        <div className="absolute inset-x-0 bottom-[max(86px,calc(env(safe-area-inset-bottom,0px)+74px))] px-3 sm:px-4">
          <div
            className="mx-auto rounded-xl px-3 py-2 text-center"
            style={{
              maxWidth: 'min(82vw, 360px)',
              backgroundColor: lowStimulusMode ? 'rgba(5, 10, 10, 0.9)' : 'rgba(4, 10, 10, 0.78)',
              border: `1px solid ${cueTypeColor[phaseCue.type]}`,
              color: '#e2e8f0',
            }}
            aria-live="polite"
            data-testid="gameplay-phase-cue"
          >
            <p className="text-[10px] uppercase tracking-[0.17em] opacity-70">Phase cue</p>
            <p className="mt-1 text-xs sm:text-sm font-semibold">{phaseCue.text}</p>
          </div>
        </div>
      )}

      {isCueTimingVisible(cueIntensity, 'streakTriggered') && streakCue && (
        <div className="absolute inset-x-0 bottom-[max(42px,calc(env(safe-area-inset-bottom,0px)+32px))] px-3 sm:px-4">
          <div
            className="mx-auto rounded-xl px-3 py-1.5 text-center"
            style={{
              maxWidth: 'min(80vw, 340px)',
              backgroundColor: lowStimulusMode ? 'rgba(8, 12, 16, 0.92)' : 'rgba(5, 11, 15, 0.84)',
              border: `1px solid ${cueTypeColor[streakCue.type]}`,
              color: '#e5e7eb',
            }}
            aria-live="polite"
            data-testid="gameplay-streak-cue"
          >
            <p className="text-xs font-semibold">{streakCue.text}</p>
          </div>
        </div>
      )}

      {isCueTimingVisible(cueIntensity, 'alwaysVisible') && (
        <aside
          className="absolute rounded-xl px-2.5 py-2"
          data-testid="gameplay-micro-hud"
          style={{
            right: 'var(--cue-safe-right)',
            bottom: 'var(--cue-safe-bottom)',
            ['--cue-safe-right' as string]: 'max(8px, calc(env(safe-area-inset-right, 0px) + 8px))',
            ['--cue-safe-bottom' as string]: 'max(8px, calc(env(safe-area-inset-bottom, 0px) + 8px))',
            maxWidth: 'min(56vw, 250px)',
            backgroundColor: lowStimulusMode ? 'rgba(3, 8, 12, 0.9)' : 'rgba(3, 10, 14, 0.78)',
            border: '1px solid rgba(148, 163, 184, 0.42)',
            color: '#f8fafc',
          }}
          aria-label="Cue micro HUD"
        >
          <p className="text-[10px] uppercase tracking-[0.16em] opacity-70">{cueSet.microHudLabel}</p>
          <p className="mt-1 text-[11px] sm:text-xs leading-tight">{cueSet.focus}</p>
          {cueIntensity !== 'minimal' && (
            <p className="mt-1 text-[11px] sm:text-xs leading-tight opacity-85">{cueSet.tactical}</p>
          )}
        </aside>
      )}
    </div>
  );
};

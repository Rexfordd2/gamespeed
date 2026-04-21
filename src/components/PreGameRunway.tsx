import { useEffect, useRef, useState } from 'react';
import { getSportConfig, SportType } from '../config/sports';
import { useTheme } from '../context/ThemeContext';
import { JungleBackground } from './JungleBackground';
import { JungleButton } from './JungleButton';
import { useAudio } from './AudioManager';
import { buildRunwayPlan, RUNWAY_PRESETS, RunwayPlan, RunwayPresetMinutes } from '../utils/runwayPlan';
import { getLatestRunwayCompletion, recordRunwayCompletion } from '../utils/runwayStats';

interface PreGameRunwayProps {
  selectedSport: SportType;
  onBackToHome: () => void;
}

type RunwayScreen = 'intro' | 'active' | 'complete';

interface ActiveRunwayState {
  phaseIndex: number;
  phaseRemainingSeconds: number;
  totalRemainingSeconds: number;
}

const formatClock = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => {
      setReduced(event.matches);
    };

    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

export const PreGameRunway = ({ selectedSport, onBackToHome }: PreGameRunwayProps) => {
  const { theme } = useTheme();
  const { playEffect } = useAudio();
  const reducedMotion = usePrefersReducedMotion();
  const sportConfig = getSportConfig(selectedSport);
  const [screen, setScreen] = useState<RunwayScreen>('intro');
  const [selectedPreset, setSelectedPreset] = useState<RunwayPresetMinutes>(5);
  const [activePlan, setActivePlan] = useState<RunwayPlan | null>(null);
  const [activeState, setActiveState] = useState<ActiveRunwayState | null>(null);
  const [selfCueNote, setSelfCueNote] = useState('');
  const latestCompletion = getLatestRunwayCompletion();
  const completionPersistedRef = useRef(false);

  const currentPhase = activePlan && activeState ? activePlan.phases[activeState.phaseIndex] : null;
  const completionProgress = activePlan && activeState
    ? 100 - Math.round((activeState.totalRemainingSeconds / activePlan.totalDurationSeconds) * 100)
    : 0;

  useEffect(() => {
    if (screen !== 'active' || !activePlan) {
      return;
    }

    const timerId = window.setInterval(() => {
      setActiveState(prev => {
        if (!prev) return prev;

        const nextTotalRemaining = prev.totalRemainingSeconds - 1;
        const nextPhaseRemaining = prev.phaseRemainingSeconds - 1;

        if (nextTotalRemaining <= 0) {
          if (!completionPersistedRef.current) {
            completionPersistedRef.current = true;
            recordRunwayCompletion({
              sport: selectedSport,
              presetMinutes: activePlan.presetMinutes,
              totalDurationSeconds: activePlan.totalDurationSeconds,
              phases: activePlan.phases.map(phase => ({
                id: phase.id,
                durationSeconds: phase.durationSeconds,
              })),
            });
            playEffect('success');
          }
          setScreen('complete');
          return null;
        }

        if (nextPhaseRemaining <= 0) {
          const nextPhaseIndex = prev.phaseIndex + 1;
          return {
            phaseIndex: nextPhaseIndex,
            phaseRemainingSeconds: activePlan.phases[nextPhaseIndex].durationSeconds,
            totalRemainingSeconds: nextTotalRemaining,
          };
        }

        return {
          ...prev,
          phaseRemainingSeconds: nextPhaseRemaining,
          totalRemainingSeconds: nextTotalRemaining,
        };
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [activePlan, playEffect, screen, selectedSport]);

  const handleStart = () => {
    const nextPlan = buildRunwayPlan(sportConfig, selectedPreset);
    completionPersistedRef.current = false;
    setActivePlan(nextPlan);
    setActiveState({
      phaseIndex: 0,
      phaseRemainingSeconds: nextPlan.phases[0].durationSeconds,
      totalRemainingSeconds: nextPlan.totalDurationSeconds,
    });
    setScreen('active');
  };

  const handleReset = () => {
    setScreen('intro');
    setActivePlan(null);
    setActiveState(null);
    setSelfCueNote('');
  };

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1.25rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <JungleBackground />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(3,8,12,0.7), rgba(2,8,10,0.9))',
        }}
      />

      <main className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-4 py-4 sm:py-7">
        <section
          className="rounded-3xl p-5 sm:p-7"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.84)',
            border: `1px solid ${sportConfig.accents.primary}55`,
            boxShadow: `0 16px 42px ${sportConfig.accents.glow}`,
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: sportConfig.accents.secondary }}>
            Pre-Game Runway
          </p>
          {screen === 'intro' && (
            <>
              <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl" style={{ color: theme.textColor }}>
                {sportConfig.runwayCopy.introTitle}
              </h1>
              <p className="mt-3 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.84 }}>
                {sportConfig.runwayCopy.introBody}
              </p>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.78 }}>
                This replaces scrolling with a phone-down readiness sequence that prepares attention, gaze control, and sport-specific cue pickup.
              </p>

              <div
                className="mt-4 rounded-2xl p-3 text-sm"
                style={{
                  backgroundColor: 'rgba(2, 8, 12, 0.76)',
                  border: `1px solid ${theme.textColor}2f`,
                  color: theme.textColor,
                  opacity: 0.84,
                }}
              >
                <p>Runway sequence</p>
                <p className="mt-1">1) Breathing reset  2) Gaze stabilization  3) Object tracking  4) Cue review</p>
              </div>

              <div className="mt-5">
                <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: theme.targetColor }}>
                  Duration preset
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {RUNWAY_PRESETS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSelectedPreset(preset)}
                      aria-pressed={selectedPreset === preset}
                      className="min-h-12 rounded-xl text-sm font-semibold"
                      style={{
                        color: theme.textColor,
                        backgroundColor: selectedPreset === preset ? `${sportConfig.accents.primary}2c` : 'rgba(3, 10, 14, 0.66)',
                        border: `1px solid ${selectedPreset === preset ? `${sportConfig.accents.primary}bb` : `${theme.textColor}35`}`,
                      }}
                    >
                      {preset} min
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <JungleButton onClick={handleStart} className="w-full sm:w-auto px-7 py-3 text-base font-bold">
                  Start runway session
                </JungleButton>
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="ui-secondary-button min-h-12 w-full px-6 sm:w-auto"
                  style={{ color: theme.textColor, borderColor: `${theme.textColor}45` }}
                >
                  Back to home
                </button>
              </div>

              {latestCompletion && (
                <p className="mt-3 text-xs" style={{ color: theme.textColor, opacity: 0.7 }}>
                  Last completion: {new Date(latestCompletion.ts).toLocaleString()} ({latestCompletion.presetMinutes} min)
                </p>
              )}
            </>
          )}

          {screen === 'active' && activePlan && activeState && currentPhase && (
            <div aria-live="polite">
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl" style={{ color: theme.textColor }}>
                {currentPhase.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.82 }}>
                {currentPhase.subtitle}
              </p>

              {currentPhase.id === 'cueReview' && (
                <div
                  className="mt-4 rounded-2xl p-3.5"
                  style={{
                    backgroundColor: 'rgba(2, 8, 12, 0.76)',
                    border: `1px solid ${sportConfig.accents.secondary}66`,
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.12em] font-semibold" style={{ color: sportConfig.accents.secondary }}>
                    Review these cues
                  </p>
                  <ul className="mt-2 space-y-1 text-sm" style={{ color: theme.textColor }}>
                    {sportConfig.runwayCopy.cueReviewChecklist.map(cue => (
                      <li key={cue}>- {cue}</li>
                    ))}
                  </ul>
                  <label className="mt-3 block text-xs" style={{ color: theme.textColor, opacity: 0.75 }}>
                    Self cue note
                    <textarea
                      value={selfCueNote}
                      onChange={event => setSelfCueNote(event.target.value)}
                      className="mt-1 w-full rounded-lg px-2.5 py-2 text-sm"
                      style={{
                        color: theme.textColor,
                        backgroundColor: 'rgba(5, 12, 16, 0.86)',
                        border: `1px solid ${theme.textColor}38`,
                      }}
                      rows={2}
                      placeholder="Example: quick first read, calm first touch"
                    />
                  </label>
                </div>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs" style={{ color: theme.textColor, opacity: 0.8 }}>
                  <span>{formatClock(activeState.phaseRemainingSeconds)} in this phase</span>
                  <span>{formatClock(activeState.totalRemainingSeconds)} total</span>
                </div>
                <div
                  className="mt-2 h-2.5 overflow-hidden rounded-full"
                  style={{ backgroundColor: `${theme.textColor}1f` }}
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={completionProgress}
                  aria-label="Runway completion progress"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${completionProgress}%`,
                      backgroundColor: sportConfig.accents.primary,
                      transition: reducedMotion ? 'none' : 'width 300ms ease-out',
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="ui-secondary-button mt-5 min-h-11 px-5"
                style={{ color: theme.textColor, borderColor: `${theme.textColor}45` }}
              >
                Exit runway
              </button>
            </div>
          )}

          {screen === 'complete' && (
            <>
              <h2 className="mt-2 text-2xl font-extrabold sm:text-3xl" style={{ color: theme.textColor }}>
                Runway complete
              </h2>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.82 }}>
                You finished the {selectedPreset}-minute pre-game runway. Attention is up, gaze is steadier, and cue pickup is primed for competition reps.
              </p>
              <div
                className="mt-4 inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold"
                style={{
                  color: '#06230f',
                  backgroundColor: '#86efac',
                }}
              >
                Runway completion badge earned
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
                <JungleButton onClick={handleReset} className="w-full sm:w-auto px-7 py-3 text-base font-bold">
                  Run again
                </JungleButton>
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="ui-secondary-button min-h-12 w-full px-6 sm:w-auto"
                  style={{ color: theme.textColor, borderColor: `${theme.textColor}45` }}
                >
                  Back to drills
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

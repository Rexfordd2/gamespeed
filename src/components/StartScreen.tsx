import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { GameModeType, FirstRunSelection, GameStats, PlayerGoal, PlayerPersona } from '../types/game';
import { JungleBackground } from './JungleBackground';
import { GameModeSelector } from './GameModeSelector';
import { JungleButton } from './JungleButton';
import { LandingHero } from './landing/LandingHero';
import { LandingDemoShell } from './landing/LandingDemoShell';
import { LandingWhyItMatters } from './landing/LandingWhyItMatters';
import { LandingProgression } from './landing/LandingProgression';
import { LandingFaq } from './landing/LandingFaq';
import { LandingFinalCta } from './landing/LandingFinalCta';
import { landingContent } from '../content/landingContent';
import { SPORT_ORDER, SportType, getSportConfig } from '../config/sports';
import { gameModes } from '../utils/gameModes';
import { NightGuardrailSettings } from '../utils/nightGuardrail';
import {
  getDailyStreak,
  getFriendLeaderboard,
  getModeUnlockMap,
  getProgressDisciplineNote,
  getWeeklyChallenge,
} from '../utils/progression';
import { getLandingExperimentAssignment } from '../config/landingExperiment';
import { trackConversionEvent } from '../lib/analytics';
import { SleepOnTimeAnswer, getLatestSleepCheckIn, recordSleepCheckIn } from '../utils/sleepCheckIn';

interface StartScreenProps {
  onStart: (
    mode: GameModeType,
    firstRunSelection?: FirstRunSelection,
    options?: { lowStimulus?: boolean; includeRoutine?: boolean },
  ) => void;
  selectedSport: SportType;
  onSportChange: (sport: SportType) => void;
  onViewStats: () => void;
  onOpenBenchmarkPage: () => void;
  onOpenRunway: () => void;
  onOpenCoachMode: () => void;
  isFirstRun: boolean;
  stats: GameStats;
  playerName: string;
  nightGuardrailSettings: NightGuardrailSettings;
  onNightGuardrailSettingsChange: (settings: NightGuardrailSettings) => void;
  showNightReminder: boolean;
  onDismissNightReminder: () => void;
  isNightGuardrailActive: boolean;
}

type GoalOption = {
  id: PlayerGoal;
  label: string;
  hint: string;
};

const GOALS_BY_PERSONA: Record<PlayerPersona, GoalOption[]> = {
  athlete: [
    { id: 'firstStepQuickness', label: 'First-step quickness', hint: 'Explode into the first movement faster.' },
    { id: 'peripheralAwareness', label: 'Peripheral awareness', hint: 'Read and react to wider visual cues.' },
    { id: 'gameSpeedDecisions', label: 'Game-speed decisions', hint: 'Process cues and choose under time pressure.' },
  ],
  gamer: [
    { id: 'rawReaction', label: 'Raw reaction', hint: 'Lower your response time on first cue.' },
    { id: 'flickResponse', label: 'Flick response', hint: 'Improve snap movement and target acquisition.' },
    { id: 'focusUnderPressure', label: 'Focus under pressure', hint: 'Stay accurate while pace ramps up.' },
  ],
};

const PERSONA_LABELS: Record<PlayerPersona, string> = {
  athlete: 'Athlete',
  gamer: 'Gamer',
};

export const StartScreen = ({
  onStart,
  selectedSport,
  onSportChange,
  onViewStats,
  onOpenBenchmarkPage,
  onOpenRunway,
  onOpenCoachMode,
  isFirstRun,
  stats,
  playerName,
  nightGuardrailSettings,
  onNightGuardrailSettingsChange,
  showNightReminder,
  onDismissNightReminder,
  isNightGuardrailActive,
}: StartScreenProps) => {
  const { theme } = useTheme();
  const landingExperiment = useMemo(() => getLandingExperimentAssignment(), []);
  const orderedPersonas = landingExperiment.personaOrder as PlayerPersona[];
  const [persona, setPersona] = useState<PlayerPersona | null>(
    isFirstRun ? landingExperiment.defaultPersona : null,
  );
  const [goal, setGoal] = useState<PlayerGoal | null>(null);
  const streakDays = getDailyStreak(stats);
  const weeklyChallenge = getWeeklyChallenge(stats);
  const unlockMap = getModeUnlockMap(stats);
  const leaderboard = getFriendLeaderboard(stats, playerName).slice(0, 5);
  const disciplineNote = getProgressDisciplineNote(stats);
  const activePersona = persona ?? orderedPersonas[0];
  const sportConfig = getSportConfig(selectedSport);
  const cueVocabulary = sportConfig.cueVocabulary.join(' | ');
  const demoSectionRef = useRef<HTMLElement | null>(null);
  const onboardingSectionRef = useRef<HTMLElement | null>(null);
  const [wentToBedOnTime, setWentToBedOnTime] = useState<SleepOnTimeAnswer>('yes');
  const [readiness, setReadiness] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [latestCheckInLabel, setLatestCheckInLabel] = useState<string | null>(null);
  const [savedCheckInNotice, setSavedCheckInNotice] = useState<string | null>(null);

  useEffect(() => {
    const latest = getLatestSleepCheckIn();
    if (!latest) {
      setLatestCheckInLabel(null);
      return;
    }
    setLatestCheckInLabel(
      `${new Date(latest.ts).toLocaleDateString()} - Ready ${latest.readiness}/5 (${latest.wentToBedOnTime})`,
    );
  }, []);

  useEffect(() => {
    trackConversionEvent('landing_experiment_exposure', {
      experimentVariant: landingExperiment.id,
      framing: landingExperiment.framing,
      heroLayout: landingExperiment.heroLayout,
    });
  }, [landingExperiment]);

  const handlePersonaSelect = (nextPersona: PlayerPersona) => {
    setPersona(nextPersona);
    setGoal(null);
    trackConversionEvent('persona_selected', {
      persona: nextPersona,
      isFirstRun,
      experimentVariant: landingExperiment.id,
      source: 'first_run_role_picker',
    });
  };

  const handleStartFirstTest = () => {
    if (!isFirstRun) {
      onStart('reactionBenchmark');
      return;
    }
    if (!persona || !goal) {
      return;
    }
    trackConversionEvent('hero_cta_click', {
      cta: 'run_60_second_test',
      source: 'start_screen_primary',
      persona,
      goal,
      isFirstRun,
      experimentVariant: landingExperiment.id,
    });
    onStart('reactionBenchmark', { persona, goal });
  };

  const handlePrimaryCta = () => {
    if (!isFirstRun) {
      onStart('reactionBenchmark');
      return;
    }
    if (persona && goal) {
      handleStartFirstTest();
      return;
    }
    onboardingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleWatchDemo = () => {
    demoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSleepCheckInSave = () => {
    const saved = recordSleepCheckIn({
      wentToBedOnTime,
      readiness,
    });
    setLatestCheckInLabel(
      `${new Date(saved.ts).toLocaleDateString()} - Ready ${saved.readiness}/5 (${saved.wentToBedOnTime})`,
    );
    setSavedCheckInNotice('Saved locally on this device.');
  };

  const handleStartLowStimulusSession = () => {
    onStart('reactionBenchmark', undefined, {
      lowStimulus: true,
      includeRoutine: nightGuardrailSettings.includeBreathingRoutine,
    });
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
            'radial-gradient(circle at 20% 20%, rgba(163,230,53,0.14), transparent 45%), radial-gradient(circle at 80% 80%, rgba(16,185,129,0.12), transparent 50%), linear-gradient(180deg, rgba(3,8,12,0.68), rgba(2,8,10,0.9))',
        }}
      />

      <motion.main
        className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col gap-4 py-3 sm:gap-7 sm:py-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: 'easeOut' }}
      >
        <LandingHero
          content={landingContent.hero}
          persona={activePersona}
          onPersonaChange={handlePersonaSelect}
          onPrimaryCta={handlePrimaryCta}
          onSecondaryCta={handleWatchDemo}
        />

        <section ref={demoSectionRef} aria-label="Demo section">
          <LandingDemoShell content={landingContent.demo} onRunBenchmark={handlePrimaryCta} />
        </section>

        <LandingWhyItMatters content={landingContent.whyItMatters} persona={activePersona} />

        {showNightReminder && (
          <section
            className="rounded-2xl p-4 sm:p-5"
            style={{
              backgroundColor: 'rgba(8, 12, 20, 0.86)',
              border: '1px solid rgba(148, 163, 184, 0.6)',
            }}
            aria-live="polite"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.15em]" style={{ color: theme.textColor, opacity: 0.72 }}>
                  Night-before guardrail
                </p>
                <p className="mt-1 text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.9 }}>
                  Bedtime window started. Keep stimulation low and wrap phone time quickly.
                </p>
              </div>
              <button
                type="button"
                onClick={onDismissNightReminder}
                className="ui-secondary-button min-h-10 px-4 text-sm"
                style={{ color: theme.textColor, borderColor: `${theme.textColor}55` }}
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        <section
          className="rounded-3xl p-4 sm:p-6 md:p-7 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.8)',
            border: `1px solid ${sportConfig.accents.primary}66`,
            boxShadow: `0 18px 48px ${sportConfig.accents.glow}`,
          }}
        >
          <p
            className="text-[11px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: sportConfig.accents.secondary }}
          >
            Sport pack
          </p>
          <h2 className="mt-2 text-xl font-extrabold sm:text-2xl" style={{ color: theme.textColor }}>
            Pick your pre-performance context
          </h2>
          <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.82 }}>
            {sportConfig.readinessCopy.heroTitle}
          </p>
          <p className="mt-1.5 text-xs sm:text-sm" style={{ color: theme.textColor, opacity: 0.72 }}>
            {sportConfig.readinessCopy.heroBody}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SPORT_ORDER.map(sport => {
              const option = getSportConfig(sport);
              const isSelected = selectedSport === sport;
              return (
                <button
                  key={sport}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSportChange(sport)}
                  className="rounded-2xl px-3 py-2.5 text-left transition-transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: isSelected ? `${option.accents.primary}24` : 'rgba(5, 12, 16, 0.66)',
                    border: `1px solid ${isSelected ? `${option.accents.primary}cc` : `${theme.textColor}2b`}`,
                  }}
                >
                  <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
                    {option.displayName}
                  </p>
                </button>
              );
            })}
          </div>

          <div
            className="mt-4 rounded-2xl p-3 text-xs sm:text-sm"
            style={{
              backgroundColor: 'rgba(3, 10, 14, 0.72)',
              border: `1px solid ${sportConfig.accents.secondary}5f`,
            }}
          >
            <p className="font-semibold" style={{ color: theme.textColor }}>
              Cue vocabulary: <span style={{ color: sportConfig.accents.secondary }}>{cueVocabulary}</span>
            </p>
            <p className="mt-1.5" style={{ color: theme.textColor, opacity: 0.78 }}>
              Recommended first block:{' '}
              {sportConfig.defaultRecommendedModes
                .map(mode => gameModes[mode].name)
                .join(' -> ')}
            </p>
          </div>
        </section>

        <section
          className="rounded-3xl p-4 sm:p-6 md:p-7 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(5, 10, 16, 0.8)',
            border: `1px solid ${theme.textColor}33`,
          }}
        >
          <p
            className="text-[11px] uppercase tracking-[0.18em] font-semibold"
            style={{ color: theme.textColor, opacity: 0.75 }}
          >
            Night-Before Guardrail
          </p>
          <h2 className="mt-2 text-xl font-bold sm:text-2xl" style={{ color: theme.textColor }}>
            Protect your final 2 hours before bed
          </h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.8 }}>
            Set your bedtime and reminder preference. On competition nights, the app offers a lower-stimulation session.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="rounded-2xl p-3" style={{ backgroundColor: 'rgba(2, 8, 12, 0.72)', border: `1px solid ${theme.textColor}2d` }}>
              <span className="text-xs uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.7 }}>
                Target bedtime
              </span>
              <input
                type="time"
                value={nightGuardrailSettings.targetBedtime}
                onChange={event =>
                  onNightGuardrailSettingsChange({
                    ...nightGuardrailSettings,
                    targetBedtime: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  color: theme.textColor,
                  border: `1px solid ${theme.textColor}44`,
                }}
              />
            </label>

            <label className="rounded-2xl p-3" style={{ backgroundColor: 'rgba(2, 8, 12, 0.72)', border: `1px solid ${theme.textColor}2d` }}>
              <span className="text-xs uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.7 }}>
                Reminder preference
              </span>
              <select
                value={nightGuardrailSettings.reminderPreference}
                onChange={event =>
                  onNightGuardrailSettingsChange({
                    ...nightGuardrailSettings,
                    reminderPreference: event.target.value === 'off' ? 'off' : 'inApp',
                  })
                }
                className="mt-2 w-full rounded-lg px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  color: theme.textColor,
                  border: `1px solid ${theme.textColor}44`,
                }}
              >
                <option value="inApp">In-app reminder</option>
                <option value="off">Off</option>
              </select>
            </label>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={nightGuardrailSettings.competitionTomorrow}
              onClick={() =>
                onNightGuardrailSettingsChange({
                  ...nightGuardrailSettings,
                  competitionTomorrow: !nightGuardrailSettings.competitionTomorrow,
                })
              }
              className="rounded-xl px-4 py-3 text-sm text-left"
              style={{
                color: theme.textColor,
                backgroundColor: nightGuardrailSettings.competitionTomorrow ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 8, 12, 0.72)',
                border: `1px solid ${nightGuardrailSettings.competitionTomorrow ? 'rgba(56, 189, 248, 0.8)' : `${theme.textColor}30`}`,
              }}
            >
              Competition tomorrow: {nightGuardrailSettings.competitionTomorrow ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              aria-pressed={nightGuardrailSettings.includeBreathingRoutine}
              onClick={() =>
                onNightGuardrailSettingsChange({
                  ...nightGuardrailSettings,
                  includeBreathingRoutine: !nightGuardrailSettings.includeBreathingRoutine,
                })
              }
              className="rounded-xl px-4 py-3 text-sm text-left"
              style={{
                color: theme.textColor,
                backgroundColor: nightGuardrailSettings.includeBreathingRoutine ? 'rgba(52, 211, 153, 0.16)' : 'rgba(2, 8, 12, 0.72)',
                border: `1px solid ${nightGuardrailSettings.includeBreathingRoutine ? 'rgba(52, 211, 153, 0.72)' : `${theme.textColor}30`}`,
              }}
            >
              Short breathing + gaze routine: {nightGuardrailSettings.includeBreathingRoutine ? 'On' : 'Off'}
            </button>
          </div>

          {isNightGuardrailActive && (
            <div
              className="mt-4 rounded-2xl p-4"
              style={{
                backgroundColor: 'rgba(6, 12, 18, 0.9)',
                border: '1px solid rgba(148, 163, 184, 0.45)',
              }}
            >
              <p className="text-xs uppercase tracking-[0.15em]" style={{ color: theme.textColor, opacity: 0.68 }}>
                Low-stimulation option
              </p>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.86 }}>
                Tonight is set as a competition eve. Use a calm readiness check with dimmed visuals and reduced motion.
              </p>
              <p className="mt-1 text-xs" style={{ color: theme.textColor, opacity: 0.68 }}>
                Includes optional short breathing + gaze routine before the round.
              </p>
              <JungleButton onClick={handleStartLowStimulusSession} className="mt-4 w-full sm:w-auto px-6 py-3 text-base">
                Start low-stimulation session
              </JungleButton>
            </div>
          )}
        </section>

        <section
          ref={onboardingSectionRef}
          className="rounded-3xl p-4 sm:p-6 md:p-7 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.76)',
            border: `1px solid ${theme.targetColor}44`,
            boxShadow: '0 20px 52px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: theme.textColor }}>
            {isFirstRun ? 'Replace the pre-game scroll in 60 seconds' : `Welcome back, ${sportConfig.displayName} focus`}
          </h2>
          <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.82 }}>
            {isFirstRun
              ? `${sportConfig.readinessCopy.onboardingIntro} Use this to sharpen decision-making and cue pickup before you play.`
              : `Run a quick ${sportConfig.displayName} readiness benchmark or jump straight into a drill.`}
          </p>

          <div className="mt-5">
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              <div
                className="rounded-2xl px-3.5 py-3"
                style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)', border: `1px solid ${theme.textColor}2c` }}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-60" style={{ color: theme.textColor }}>
                  Daily streak
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: theme.targetColor }}>
                  {streakDays}
                  <span className="ml-1 text-xs font-semibold opacity-70">days</span>
                </p>
              </div>
              <div
                className="rounded-2xl px-3.5 py-3"
                style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)', border: `1px solid ${theme.textColor}2c` }}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-60" style={{ color: theme.textColor }}>
                  Weekly challenge
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: theme.textColor }}>
                  {weeklyChallenge.roundsDone}/{weeklyChallenge.roundsTarget} sessions
                </p>
                <p className="text-xs opacity-65" style={{ color: theme.textColor }}>
                  {weeklyChallenge.modesDone}/{weeklyChallenge.modesTarget} modes
                </p>
              </div>
              <div
                className="rounded-2xl px-3.5 py-3"
                style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)', border: `1px solid ${theme.textColor}2c` }}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-60" style={{ color: theme.textColor }}>
                  Training note
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.textColor, opacity: 0.8 }}>
                  {disciplineNote}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: theme.targetColor }}>
              1. Choose role
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {orderedPersonas.map(option => {
                const isSelected = persona === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handlePersonaSelect(option)}
                    className="rounded-2xl p-3.5 text-left transition-transform hover:-translate-y-0.5"
                    style={{
                      backgroundColor: isSelected ? `${theme.targetColor}1f` : 'rgba(5, 12, 16, 0.7)',
                      border: `1px solid ${isSelected ? `${theme.targetColor}cc` : `${theme.textColor}2b`}`,
                    }}
                  >
                    <p className="text-sm sm:text-base font-semibold" style={{ color: theme.textColor }}>
                      {PERSONA_LABELS[option]}
                    </p>
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: theme.textColor, opacity: 0.72 }}>
                      {option === 'athlete'
                        ? 'Field / court / match play'
                        : 'Competition prep profile'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {persona && (
            <div className="mt-5">
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: theme.targetColor }}>
                2. Choose one goal
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2.5 md:grid-cols-3">
                {GOALS_BY_PERSONA[persona].map(option => {
                  const isSelected = goal === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setGoal(option.id)}
                      className="rounded-2xl p-3.5 text-left transition-transform hover:-translate-y-0.5"
                      style={{
                        backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.16)' : 'rgba(5, 12, 16, 0.64)',
                        border: `1px solid ${isSelected ? 'rgba(56, 189, 248, 0.85)' : `${theme.textColor}2b`}`,
                      }}
                    >
                      <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
                        {option.label}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: theme.textColor, opacity: 0.72 }}>
                        {option.hint}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className="mt-4 rounded-2xl p-3 text-xs sm:text-sm"
            style={{
              backgroundColor: 'rgba(2, 8, 12, 0.72)',
              border: `1px solid ${theme.textColor}2b`,
              color: theme.textColor,
              opacity: 0.85,
            }}
          >
            {!persona
              ? `Hint: pick the profile that best matches how you compete in ${sportConfig.displayName}.`
              : !goal
                ? 'Hint: choose one focus area now. You can switch goals after this readiness test.'
                : 'Hint: replace scrolling with one clean 60-second rep. Stay smooth, then play.'}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <JungleButton
              onClick={handleStartFirstTest}
              className="w-full sm:w-auto px-6 py-3 text-base font-bold"
              disabled={isFirstRun && (!persona || !goal)}
            >
              {isFirstRun ? 'Run the 60-Second Test' : 'Run Benchmark Session'}
            </JungleButton>
            <button
              onClick={onOpenRunway}
              className="ui-secondary-button w-full sm:w-auto px-5 py-3 text-sm"
              style={{
                color: theme.textColor,
                borderColor: `${sportConfig.accents.primary}66`,
              }}
            >
              Start Pre-Game Runway (5-10 min)
            </button>
            <button
              onClick={() => {
                trackConversionEvent('hero_cta_click', {
                  cta: 'watch_demo',
                  source: 'start_screen_secondary_demo_jump',
                  isFirstRun,
                  experimentVariant: landingExperiment.id,
                });
                handleWatchDemo();
              }}
              className="ui-secondary-button w-full sm:w-auto px-5 py-3 text-sm"
              style={{
                color: theme.textColor,
                borderColor: `${theme.textColor}44`,
              }}
            >
              Watch Demo
            </button>
          </div>
        </section>

        <section
          className="rounded-3xl p-4 sm:p-6 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.7)',
            border: `1px solid ${theme.targetColor}30`,
          }}
        >
          <h2 className="text-xl font-bold sm:text-2xl" style={{ color: theme.textColor }}>
            {isNightGuardrailActive ? 'Low-Stimulation Night Option' : `${sportConfig.displayName} Readiness Drills`}
          </h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.76 }}>
            {isNightGuardrailActive
              ? 'High-arousal drill cards are paused in this bedtime window. Choose the calm session above.'
              : sportConfig.readinessCopy.modeSelectorSubtitle}
          </p>
          {!isNightGuardrailActive && (
            <div className="mt-4">
              <GameModeSelector
                onSelectMode={mode => onStart(mode)}
                selectedSport={selectedSport}
                unlocks={unlockMap}
                copy={{
                  title: `${sportConfig.displayName} mode selector`,
                  subtitle:
                    'Benchmark mode is your fixed readiness baseline. Drill modes are variable load reps for sport-specific cue training.',
                  availableLabel: 'Playable protocols',
                  nextReleaseLabel: 'Sport pack roadmap',
                  benchmarkCta: 'Run the 60-Second Readiness Test',
                  drillCta: 'Start Readiness Drill',
                  benchmarkPillLabel: 'Benchmark',
                  drillPillLabel: 'Drill',
                  focusLabel: 'Skill focus',
                  intensityLabel: 'Session load',
                  comingSoonLabel: 'Coming Soon',
                }}
              />
            </div>
          )}
        </section>

        <section
          className="rounded-3xl p-4 sm:p-6 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.64)',
            border: `1px solid ${theme.textColor}2d`,
          }}
        >
          <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.textColor }}>
            Sleep check-in
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.textColor, opacity: 0.78 }}>
            Local only. Quick daily log to compare bedtime consistency with pre-performance readiness.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              aria-pressed={wentToBedOnTime === 'yes'}
              onClick={() => setWentToBedOnTime('yes')}
              className="rounded-xl px-4 py-3 text-sm text-left"
              style={{
                color: theme.textColor,
                backgroundColor: wentToBedOnTime === 'yes' ? 'rgba(52, 211, 153, 0.16)' : 'rgba(2, 8, 12, 0.72)',
                border: `1px solid ${wentToBedOnTime === 'yes' ? 'rgba(52, 211, 153, 0.78)' : `${theme.textColor}30`}`,
              }}
            >
              Went to bed on time: Yes
            </button>
            <button
              type="button"
              aria-pressed={wentToBedOnTime === 'no'}
              onClick={() => setWentToBedOnTime('no')}
              className="rounded-xl px-4 py-3 text-sm text-left"
              style={{
                color: theme.textColor,
                backgroundColor: wentToBedOnTime === 'no' ? 'rgba(248, 113, 113, 0.17)' : 'rgba(2, 8, 12, 0.72)',
                border: `1px solid ${wentToBedOnTime === 'no' ? 'rgba(248, 113, 113, 0.76)' : `${theme.textColor}30`}`,
              }}
            >
              Went to bed on time: No
            </button>
          </div>
          <div className="mt-3">
            <p className="text-xs uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.68 }}>
              Readiness today (1-5)
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={readiness === value}
                  onClick={() => setReadiness(value as 1 | 2 | 3 | 4 | 5)}
                  className="min-h-10 min-w-10 rounded-lg px-3 text-sm font-semibold"
                  style={{
                    color: theme.textColor,
                    backgroundColor: readiness === value ? `${theme.targetColor}2a` : 'rgba(2, 8, 12, 0.72)',
                    border: `1px solid ${readiness === value ? `${theme.targetColor}cc` : `${theme.textColor}2f`}`,
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <JungleButton onClick={handleSleepCheckInSave} className="w-full sm:w-auto px-5 py-2.5 text-sm">
              Save sleep and readiness
            </JungleButton>
            {savedCheckInNotice && (
              <span className="text-xs" style={{ color: theme.textColor, opacity: 0.72 }}>
                {savedCheckInNotice}
              </span>
            )}
          </div>
          {latestCheckInLabel && (
            <p className="mt-3 text-xs" style={{ color: theme.textColor, opacity: 0.68 }}>
              Latest: {latestCheckInLabel}
            </p>
          )}
        </section>

        <section
          className="rounded-3xl p-4 sm:p-6 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.64)',
            border: `1px solid ${theme.targetColor}2a`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg sm:text-xl font-bold" style={{ color: theme.textColor }}>
              Readiness leaderboard snapshot
            </h2>
            <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: theme.textColor, opacity: 0.62 }}>
              top quick tap score
            </span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.56 }}>
            Local sample ranking seeded from your current profile data.
          </p>
          <div className="mt-3 space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.name}
                className="rounded-xl px-3.5 py-2.5 flex items-center justify-between"
                style={{
                  backgroundColor: entry.isYou ? `${theme.targetColor}1f` : 'rgba(2, 8, 12, 0.6)',
                  border: `1px solid ${entry.isYou ? `${theme.targetColor}66` : `${theme.textColor}22`}`,
                }}
              >
                <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
                  {index + 1}. {entry.name}
                </p>
                <p className="text-sm font-bold tabular-nums" style={{ color: entry.isYou ? theme.targetColor : '#a5f3fc' }}>
                  {entry.score}
                </p>
              </div>
            ))}
          </div>
        </section>

        <LandingProgression
          content={landingContent.progression}
          onRunStarter={() => onStart(landingContent.progression.starterMode)}
        />
        <LandingFaq content={landingContent.faq} />
        <LandingFinalCta
          content={landingContent.finalCta}
          onPrimary={handlePrimaryCta}
          onSecondary={handleWatchDemo}
        />

        <section
          className="rounded-2xl border px-4 py-3 sm:px-5 sm:py-4"
          style={{
            borderColor: `${theme.targetColor}30`,
            backgroundColor: 'rgba(4, 10, 14, 0.66)',
          }}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: theme.textColor, opacity: 0.8 }}>
              Want benchmark interpretation, scoring methodology, and latency caveats?
            </p>
            <button
              type="button"
              onClick={onOpenBenchmarkPage}
              className="ui-secondary-button min-h-11 rounded-xl px-4 text-sm"
            >
              See benchmark methodology
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onOpenCoachMode}
            className="ui-secondary-button min-h-12 px-6 text-sm sm:text-base"
            style={{ color: theme.textColor, borderColor: `${theme.targetColor}55` }}
          >
            Coach Mode
          </button>
          <button
            type="button"
            onClick={onOpenRunway}
            className="ui-secondary-button min-h-12 px-6 text-sm sm:text-base"
            style={{ color: theme.textColor, borderColor: `${sportConfig.accents.primary}66` }}
          >
            Pre-Game Runway
          </button>
          <button
            type="button"
            onClick={onViewStats}
            className="ui-secondary-button min-h-12 px-6 text-sm sm:text-base"
            style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
          >
            Compare My Score
          </button>
          <button
            type="button"
            onClick={onOpenBenchmarkPage}
            className="ui-secondary-button min-h-12 px-6 text-sm sm:text-base"
            style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
          >
            How scoring works
          </button>
          <a
            href={landingContent.footer.feedbackUrl}
            target="_blank"
            rel="noreferrer"
            className="ui-secondary-button inline-flex min-h-12 items-center justify-center px-6 text-sm sm:text-base"
            style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
          >
            {landingContent.footer.feedbackLabel}
          </a>
        </section>
      </motion.main>
    </div>
  );
};
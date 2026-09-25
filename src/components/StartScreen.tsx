import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { CueIntensity, GameModeType, FirstRunSelection, GameStats, PlayerGoal, PlayerPersona, SessionOptions } from '../types/game';
import { JungleBackground } from './JungleBackground';
import { GameModeSelector } from './GameModeSelector';
import { JungleButton } from './JungleButton';
import { LandingDemoShell } from './landing/LandingDemoShell';
import { LandingWhyItMatters } from './landing/LandingWhyItMatters';
import { LandingProgression } from './landing/LandingProgression';
import { LandingFaq } from './landing/LandingFaq';
import { LandingFinalCta } from './landing/LandingFinalCta';
import { FirstRunQuickstart, FIRST_RUN_CTA_LABEL } from './start/FirstRunQuickstart';
import { ReturningSummary } from './start/ReturningSummary';
import { MoreSettings } from './start/MoreSettings';
import { landingContent } from '../content/landingContent';
import { SportType, getSportConfig } from '../config/sports';
import { NightGuardrailSettings } from '../utils/nightGuardrail';
import {
  getDailyStreak,
  getFriendLeaderboard,
  getLatestBenchmarkRound,
  getLatestGameSpeedScore,
  getModeUnlockMap,
  getProgressDisciplineNote,
  getStrongestPersonalBest,
  getTodaysInstinct,
  getWeeklyChallenge,
  getModeLabel,
} from '../utils/progression';
import { getExperienceName } from '../config/animalInstincts';
import { getLandingExperimentAssignment } from '../config/landingExperiment';
import { trackConversionEvent } from '../lib/analytics';
import { SleepOnTimeAnswer, getLatestSleepCheckIn, recordSleepCheckIn } from '../utils/sleepCheckIn';
import { isHapticsSupported } from '../utils/haptics';
import { loadRecommendedSession } from '../utils/recommendedSession';

interface StartScreenProps {
  onStart: (
    mode: GameModeType,
    firstRunSelection?: FirstRunSelection,
    options?: SessionOptions,
  ) => void;
  selectedSport: SportType;
  onSportChange: (sport: SportType) => void;
  cueIntensity: CueIntensity;
  onCueIntensityChange: (intensity: CueIntensity) => void;
  hapticsEnabled: boolean;
  onHapticsEnabledChange: (enabled: boolean) => void;
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

export const StartScreen = ({
  onStart,
  selectedSport,
  onSportChange,
  cueIntensity,
  onCueIntensityChange,
  hapticsEnabled,
  onHapticsEnabledChange,
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
  const isEmptyProfile = !isFirstRun && stats.rounds.length === 0;
  const isReturningAthlete = !isFirstRun && stats.rounds.length > 0;
  const latestBenchmark = getLatestBenchmarkRound(stats);
  const latestScore = getLatestGameSpeedScore(stats);
  const strongestPb = getStrongestPersonalBest(stats);
  const todaysInstinct = getTodaysInstinct(stats);
  const storedRecommendation = useMemo(() => loadRecommendedSession(), []);
  const recommendedMode: GameModeType = todaysInstinct?.mode ?? storedRecommendation ?? 'quickTap';
  const recommendedReason =
    todaysInstinct?.reason ??
    (storedRecommendation
      ? 'Picked from your last result.'
      : 'A short reaction rep to keep your baseline moving.');
  const activePersona = persona ?? orderedPersonas[0];
  const hapticsAvailable = isHapticsSupported();
  const sportConfig = getSportConfig(selectedSport);
  const demoSectionRef = useRef<HTMLElement | null>(null);
  const quickstartSectionRef = useRef<HTMLElement | null>(null);
  const instinctsSectionRef = useRef<HTMLElement | null>(null);
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
    if (nextPersona !== persona) {
      setGoal(null);
    }
    setPersona(nextPersona);
    trackConversionEvent('persona_selected', {
      persona: nextPersona,
      isFirstRun,
      experimentVariant: landingExperiment.id,
      source: 'first_run_quickstart',
    });
  };

  const handleStartBenchmark = () => {
    onStart('reactionBenchmark', undefined, { cueIntensity, hapticsEnabled });
  };

  const handleStartFirstTest = () => {
    if (!isFirstRun) {
      handleStartBenchmark();
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
    onStart('reactionBenchmark', { persona, goal }, { cueIntensity, hapticsEnabled });
  };

  const scrollToQuickstart = () => {
    quickstartSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToInstincts = () => {
    instinctsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleBenchmarkCta = () => {
    if (isFirstRun) {
      scrollToQuickstart();
      return;
    }
    handleStartBenchmark();
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
      cueIntensity,
      hapticsEnabled,
    });
  };

  const handleStartRecommended = () => {
    onStart(recommendedMode, undefined, { cueIntensity, hapticsEnabled });
  };

  const returningTop = isNightGuardrailActive
    ? {
        label: 'Low-stimulation readiness check',
        reason: 'Competition eve: dimmed visuals, reduced motion, optional breathing routine.',
        cta: 'Start low-stimulation session',
        onStart: handleStartLowStimulusSession,
      }
    : isEmptyProfile
      ? {
          label: 'Panther Readiness baseline',
          reason: 'Complete your first benchmark to establish a baseline.',
          cta: FIRST_RUN_CTA_LABEL,
          onStart: handleStartBenchmark,
        }
      : {
          label: getExperienceName(recommendedMode),
          reason: recommendedReason,
          cta: `Start ${getExperienceName(recommendedMode)}`,
          onStart: handleStartRecommended,
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
        {isFirstRun ? (
          <FirstRunQuickstart
            ref={quickstartSectionRef}
            personaOrder={orderedPersonas}
            persona={persona}
            onPersonaSelect={handlePersonaSelect}
            goal={goal}
            onGoalSelect={setGoal}
            onStart={handleStartFirstTest}
            isNightGuardrailActive={isNightGuardrailActive}
          />
        ) : (
          <ReturningSummary
            playerName={playerName}
            score={isEmptyProfile ? null : latestScore}
            recommendedLabel={returningTop.label}
            recommendedReason={returningTop.reason}
            ctaLabel={returningTop.cta}
            onStart={returningTop.onStart}
          />
        )}

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

        {isNightGuardrailActive && isFirstRun && (
          <section
            className="rounded-2xl p-4"
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
          </section>
        )}

        {isReturningAthlete && (
          <section
            aria-label="Progress details"
            className="rounded-3xl p-4 sm:p-6 backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(6, 12, 18, 0.76)',
              border: `1px solid ${theme.textColor}2c`,
            }}
          >
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
              <div
                className="rounded-2xl px-3.5 py-3"
                style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)', border: `1px solid ${theme.textColor}2c` }}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-60" style={{ color: theme.textColor }}>
                  Last benchmark
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: theme.textColor }}>
                  {latestBenchmark?.benchmarkScore ?? latestBenchmark?.accuracy ?? '—'}
                </p>
              </div>
              <div
                className="rounded-2xl px-3.5 py-3"
                style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)', border: `1px solid ${theme.textColor}2c` }}
              >
                <p className="text-[10px] uppercase tracking-[0.18em] opacity-60" style={{ color: theme.textColor }}>
                  Personal best
                </p>
                <p className="mt-1 text-sm font-semibold" style={{ color: theme.textColor }}>
                  {strongestPb ? `${getModeLabel(strongestPb.mode)} · ${strongestPb.accuracy}%` : '—'}
                </p>
              </div>
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
                className="col-span-2 rounded-2xl px-3.5 py-3 md:col-span-1"
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

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
              {!isNightGuardrailActive && (
                <button
                  type="button"
                  onClick={handleStartBenchmark}
                  className="ui-secondary-button w-full sm:w-auto px-5 py-3 text-sm"
                  style={{ color: theme.textColor, borderColor: `${theme.targetColor}66` }}
                >
                  Re-run 60-second baseline
                </button>
              )}
              <button
                type="button"
                onClick={onOpenRunway}
                className="ui-secondary-button w-full sm:w-auto px-5 py-3 text-sm"
                style={{ color: theme.textColor, borderColor: `${sportConfig.accents.primary}66` }}
              >
                Start Pre-Game Runway (5-10 min)
              </button>
              <button
                type="button"
                onClick={() => {
                  trackConversionEvent('hero_cta_click', {
                    cta: 'explore_instincts',
                    source: 'start_screen_secondary_demo_jump',
                    isFirstRun,
                    experimentVariant: landingExperiment.id,
                  });
                  scrollToInstincts();
                }}
                className="ui-secondary-button w-full sm:w-auto px-5 py-3 text-sm"
                style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
              >
                EXPLORE INSTINCTS
              </button>
            </div>
          </section>
        )}

        <section
          ref={instinctsSectionRef}
          className="rounded-3xl p-4 sm:p-6 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.7)',
            border: `1px solid ${theme.targetColor}30`,
          }}
        >
          <h2 className="font-display text-xl font-bold uppercase tracking-[0.05em] sm:text-2xl" style={{ color: theme.textColor }}>
            {isNightGuardrailActive ? 'Low-Stimulation Night Option' : 'Choose Your Instinct'}
          </h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.76 }}>
            {isNightGuardrailActive
              ? 'High-arousal drill cards are paused in this bedtime window. Choose the calm session above.'
              : 'Every athlete reacts. Elite athletes perceive sooner.'}
          </p>
          {!isNightGuardrailActive && (
            <div className="mt-4">
              <GameModeSelector
                onSelectMode={mode =>
                  onStart(mode, undefined, {
                    cueIntensity,
                    hapticsEnabled,
                  })
                }
                selectedSport={selectedSport}
                unlocks={unlockMap}
                stats={stats}
                copy={landingContent.trainingModes.selector}
              />
            </div>
          )}
        </section>

        <MoreSettings
          defaultOpen={!isFirstRun}
          selectedSport={selectedSport}
          onSportChange={onSportChange}
          nightGuardrailSettings={nightGuardrailSettings}
          onNightGuardrailSettingsChange={onNightGuardrailSettingsChange}
          cueIntensity={cueIntensity}
          onCueIntensityChange={onCueIntensityChange}
          hapticsEnabled={hapticsEnabled}
          onHapticsEnabledChange={onHapticsEnabledChange}
          hapticsAvailable={hapticsAvailable}
        />

        {!isFirstRun && (
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
        )}

        {isReturningAthlete && (
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
        )}

        <section ref={demoSectionRef} aria-label="Demo section">
          <LandingDemoShell content={landingContent.demo} onRunBenchmark={handleBenchmarkCta} />
        </section>

        <LandingWhyItMatters content={landingContent.whyItMatters} persona={activePersona} />

        <LandingProgression
          content={landingContent.progression}
          onRunStarter={() =>
            isFirstRun
              ? scrollToQuickstart()
              : onStart(landingContent.progression.starterMode, undefined, { cueIntensity, hapticsEnabled })
          }
        />
        <LandingFaq content={landingContent.faq} />
        <LandingFinalCta
          content={landingContent.finalCta}
          onPrimary={handleBenchmarkCta}
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

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import {
  CueIntensity,
  GameModeType,
  GameStats,
  SessionOptions,
  TrainingContext,
} from '../types/game';
import { JungleBackground } from './JungleBackground';
import { JungleButton } from './JungleButton';
import { GameModeSelector } from './GameModeSelector';
import { NightSettingsPanel } from './NightSettingsPanel';
import { SPORT_ORDER, SportType, getSportConfig, getSportPack } from '../config/sports';
import { getSportPackAssets } from '../config/sportPacks';
import { NightGuardrailSettings } from '../utils/nightGuardrail';
import { getModeUnlockMap } from '../utils/progression';
import { getCompletedPrimeSessions } from '../utils/primePersistence';
import { buildAthleteEvolution } from '../utils/athleteEvolution';
import { PersonalEvolutionPanel } from './PersonalEvolutionPanel';
import { getPrimeHomeCard } from '../config/primePreview';
import {
  getPositionsForSport,
  loadAthletePosition,
  saveAthletePosition,
} from '../config/athletePositions';
import {
  getDefensibleTodayStatus,
  getTimeOfDayGreeting,
  hasBaselineRound,
} from '../utils/athleteHome';
import {
  TRAINING_CONTEXT_LABELS,
  TRAINING_CONTEXT_ORDER,
  loadTrainingContext,
  saveTrainingContext,
} from '../utils/trainingContext';
import { trackConversionEvent } from '../lib/analytics';
import { SleepOnTimeAnswer, getLatestSleepCheckIn, recordSleepCheckIn } from '../utils/sleepCheckIn';
import { isHapticsSupported } from '../utils/haptics';

type ReturningHomeView = 'dashboard' | 'instincts' | 'settings';

interface ReturningHomeProps {
  onStart: (
    mode: GameModeType,
    firstRunSelection?: undefined,
    options?: SessionOptions,
  ) => void;
  onPrimeStart: (options?: SessionOptions) => void;
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
  stats: GameStats;
  playerName: string;
  nightGuardrailSettings: NightGuardrailSettings;
  onNightGuardrailSettingsChange: (settings: NightGuardrailSettings) => void;
  showNightReminder: boolean;
  onDismissNightReminder: () => void;
  isNightGuardrailActive: boolean;
}

const SportChipIcon = ({ sport }: { sport: SportType }) => {
  const assets = getSportPackAssets(getSportPack(sport));
  const [iconSrc, setIconSrc] = useState(assets.sportIcon);

  useEffect(() => {
    setIconSrc(assets.sportIcon);
  }, [assets.sportIcon]);

  if (!iconSrc) {
    return (
      <span aria-hidden="true" className="text-base leading-none">
        ◉
      </span>
    );
  }

  return (
    <img
      src={iconSrc}
      alt=""
      aria-hidden="true"
      className="h-4 w-4 object-contain"
      onError={() => {
        if (iconSrc !== assets.sportIconFallback) {
          setIconSrc(assets.sportIconFallback);
          return;
        }
        setIconSrc('');
      }}
    />
  );
};

const formatSessionAge = (ts: number, nowTs = Date.now()) => {
  const deltaMs = Math.max(0, nowTs - ts);
  const minutes = Math.round(deltaMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
};

export const ReturningHome = ({
  onStart,
  onPrimeStart,
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
  stats,
  playerName,
  nightGuardrailSettings,
  onNightGuardrailSettingsChange,
  showNightReminder,
  onDismissNightReminder,
  isNightGuardrailActive,
}: ReturningHomeProps) => {
  const { theme } = useTheme();
  const sportConfig = getSportConfig(selectedSport);
  const unlockMap = getModeUnlockMap(stats);
  const todayStatus = getDefensibleTodayStatus(stats);
  const evolution = buildAthleteEvolution(stats, getCompletedPrimeSessions());
  const hasBaseline = hasBaselineRound(stats);
  const greeting = getTimeOfDayGreeting();
  const hapticsAvailable = isHapticsSupported();

  const [view, setView] = useState<ReturningHomeView>('dashboard');
  const [sportPickerOpen, setSportPickerOpen] = useState(false);
  const [positionPickerOpen, setPositionPickerOpen] = useState(false);
  const [trainingContext, setTrainingContext] = useState<TrainingContext>(loadTrainingContext);
  const [position, setPosition] = useState(() => loadAthletePosition(selectedSport));
  const [wentToBedOnTime, setWentToBedOnTime] = useState<SleepOnTimeAnswer>('yes');
  const [readiness, setReadiness] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [latestCheckInLabel, setLatestCheckInLabel] = useState<string | null>(null);
  const [savedCheckInNotice, setSavedCheckInNotice] = useState<string | null>(null);
  const positions = getPositionsForSport(selectedSport);
  const selectedPosition = positions.find(option => option.id === position) ?? positions[0];
  const primeCard = getPrimeHomeCard({
    sport: selectedSport,
    position,
    context: trainingContext,
  });

  useEffect(() => {
    setPosition(loadAthletePosition(selectedSport));
  }, [selectedSport]);

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

  const sessionOptions = (): SessionOptions => ({
    cueIntensity,
    hapticsEnabled,
    trainingContext,
  });

  const handleTrainingContextChange = (nextContext: TrainingContext) => {
    setTrainingContext(nextContext);
    saveTrainingContext(nextContext);
  };

  const handlePrimeMe = () => {
    trackConversionEvent('hero_cta_click', {
      cta: 'prime_me',
      source: 'returning_home',
      sport: selectedSport,
      position,
      trainingContext,
      hasBaseline,
    });
    onPrimeStart({
      ...sessionOptions(),
      lowStimulus: isNightGuardrailActive,
      includeRoutine: false,
    });
  };

  const handlePositionChange = (nextPosition: string) => {
    setPosition(nextPosition);
    saveAthletePosition(selectedSport, nextPosition);
    setPositionPickerOpen(false);
  };

  const handleRunBaseline = () => {
    onStart('reactionBenchmark', undefined, sessionOptions());
  };

  const handleStartLowStimulusSession = () => {
    onStart('reactionBenchmark', undefined, {
      ...sessionOptions(),
      lowStimulus: true,
      includeRoutine: nightGuardrailSettings.includeBreathingRoutine,
    });
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

  const cardStyle = {
    backgroundColor: 'rgba(6, 12, 18, 0.84)',
    border: `1px solid ${sportConfig.accents.primary}66`,
    boxShadow: `0 18px 48px ${sportConfig.accents.glow}`,
  };

  return (
    <div
      className="relative w-full overflow-y-auto overflow-x-hidden px-4 sm:px-6"
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <JungleBackground />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 12%, rgba(163,230,53,0.12), transparent 42%), linear-gradient(180deg, rgba(3,8,12,0.72), rgba(2,8,10,0.92))',
        }}
      />

      <motion.main
        className="relative z-10 mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col gap-3 py-3 sm:max-w-2xl sm:gap-4 sm:py-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
      >
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: sportConfig.accents.secondary }}>
              {greeting}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: theme.textColor }}>
              Welcome back{playerName && playerName !== 'You' ? `, ${playerName}` : ''}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              type="button"
              aria-expanded={sportPickerOpen}
              aria-label={`Selected sport ${sportConfig.displayName}. Change sport`}
              onClick={() => {
                setPositionPickerOpen(false);
                setSportPickerOpen(open => !open);
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                color: theme.textColor,
                backgroundColor: `${sportConfig.accents.primary}22`,
                border: `1px solid ${sportConfig.accents.primary}99`,
              }}
            >
              <SportChipIcon sport={selectedSport} />
              {sportConfig.displayName}
            </button>
            <button
              type="button"
              aria-expanded={positionPickerOpen}
              aria-label={`Selected position ${selectedPosition.label}. Change position`}
              onClick={() => {
                setSportPickerOpen(false);
                setPositionPickerOpen(open => !open);
              }}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{
                color: theme.textColor,
                backgroundColor: `${theme.textColor}14`,
                border: `1px solid ${theme.textColor}44`,
              }}
            >
              {selectedPosition.shortLabel}
            </button>
            <button
              type="button"
              onClick={() => setView('settings')}
              className="ui-secondary-button min-h-10 px-3 text-xs"
              style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
            >
              Settings
            </button>
          </div>
        </header>

        {sportPickerOpen && (
          <section
            className="rounded-2xl p-3"
            style={{ backgroundColor: 'rgba(5, 12, 16, 0.88)', border: `1px solid ${theme.textColor}2b` }}
            aria-label="Change sport"
          >
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SPORT_ORDER.map(sport => {
                const option = getSportConfig(sport);
                const isSelected = selectedSport === sport;
                return (
                  <button
                    key={sport}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      onSportChange(sport);
                      setSportPickerOpen(false);
                      setPositionPickerOpen(false);
                    }}
                    className="rounded-xl px-3 py-2 text-left text-sm"
                    style={{
                      backgroundColor: isSelected ? `${option.accents.primary}24` : 'rgba(5, 12, 16, 0.66)',
                      border: `1px solid ${isSelected ? `${option.accents.primary}cc` : `${theme.textColor}2b`}`,
                      color: theme.textColor,
                    }}
                  >
                    {option.displayName}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {positionPickerOpen && (
          <section
            className="rounded-2xl p-3"
            style={{ backgroundColor: 'rgba(5, 12, 16, 0.88)', border: `1px solid ${theme.textColor}2b` }}
            aria-label="Change position"
          >
            <p className="mb-2 px-1 text-[11px] uppercase tracking-[0.14em]" style={{ color: theme.textColor, opacity: 0.68 }}>
              Position / role
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {positions.map(option => {
                const isSelected = position === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handlePositionChange(option.id)}
                    className="rounded-xl px-3 py-2 text-left text-sm"
                    style={{
                      backgroundColor: isSelected ? `${sportConfig.accents.primary}24` : 'rgba(5, 12, 16, 0.66)',
                      border: `1px solid ${isSelected ? `${sportConfig.accents.primary}cc` : `${theme.textColor}2b`}`,
                      color: theme.textColor,
                    }}
                  >
                    <span className="block font-semibold">{option.shortLabel}</span>
                    {option.label !== option.shortLabel && (
                      <span className="mt-0.5 block text-[11px] opacity-70">{option.label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {showNightReminder && (
          <section
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'rgba(8, 12, 20, 0.86)', border: '1px solid rgba(148, 163, 184, 0.6)' }}
            aria-live="polite"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm" style={{ color: theme.textColor, opacity: 0.9 }}>
                Bedtime window started. Keep stimulation low and wrap phone time quickly.
              </p>
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

        {isNightGuardrailActive && view === 'dashboard' && (
          <section
            className="rounded-2xl p-4"
            style={{ backgroundColor: 'rgba(6, 12, 18, 0.9)', border: '1px solid rgba(148, 163, 184, 0.45)' }}
          >
            <p className="text-xs uppercase tracking-[0.15em]" style={{ color: theme.textColor, opacity: 0.68 }}>
              Low-stimulation option
            </p>
            <p className="mt-1 text-sm" style={{ color: theme.textColor, opacity: 0.86 }}>
              Competition-eve mode is on. Use a calm check instead of a high-arousal warm-up.
            </p>
            <JungleButton onClick={handleStartLowStimulusSession} className="mt-3 w-full sm:w-auto px-5 py-2.5 text-sm">
              Start low-stimulation session
            </JungleButton>
          </section>
        )}

        {view === 'dashboard' && (
          <>
            <section className="rounded-3xl p-4 sm:p-5" style={cardStyle} aria-label="Today's GameSpeed">
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: sportConfig.accents.secondary }}>
                Today&apos;s GameSpeed
              </p>
              {hasBaseline ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {todayStatus.lastReadinessScore !== null && (
                    <div className="rounded-2xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)' }}>
                      <p className="text-[10px] uppercase tracking-[0.14em] opacity-65" style={{ color: theme.textColor }}>
                        Last readiness
                      </p>
                      <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: theme.targetColor }}>
                        {todayStatus.lastReadinessScore}
                      </p>
                    </div>
                  )}
                  {todayStatus.lastBenchmarkScore !== null && (
                    <div className="rounded-2xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)' }}>
                      <p className="text-[10px] uppercase tracking-[0.14em] opacity-65" style={{ color: theme.textColor }}>
                        Baseline score
                      </p>
                      <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: theme.textColor }}>
                        {todayStatus.lastBenchmarkScore}
                      </p>
                    </div>
                  )}
                  {todayStatus.lastMedianReactionTimeMs !== null && (
                    <div className="rounded-2xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)' }}>
                      <p className="text-[10px] uppercase tracking-[0.14em] opacity-65" style={{ color: theme.textColor }}>
                        Median RT
                      </p>
                      <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: theme.textColor }}>
                        {todayStatus.lastMedianReactionTimeMs}
                        <span className="ml-1 text-xs font-semibold opacity-70">ms</span>
                      </p>
                    </div>
                  )}
                  <div className="rounded-2xl px-3 py-2.5" style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)' }}>
                    <p className="text-[10px] uppercase tracking-[0.14em] opacity-65" style={{ color: theme.textColor }}>
                      Streak
                    </p>
                    <p className="mt-1 text-2xl font-extrabold tabular-nums" style={{ color: theme.textColor }}>
                      {todayStatus.streakDays}
                      <span className="ml-1 text-xs font-semibold opacity-70">days</span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl p-4" style={{ backgroundColor: 'rgba(2, 8, 12, 0.78)' }}>
                  <p className="text-xs uppercase tracking-[0.16em] font-semibold" style={{ color: theme.targetColor }}>
                    Your instinct profile is empty
                  </p>
                  <p className="mt-2 text-sm" style={{ color: theme.textColor, opacity: 0.8 }}>
                    No baseline session is on this device yet. Run baseline before treating any number as readiness.
                  </p>
                  <JungleButton onClick={handleRunBaseline} className="mt-4 w-full min-h-12 px-5 py-3 text-base">
                    Run Baseline
                  </JungleButton>
                </div>
              )}
              {todayStatus.lastRoundAt && (
                <p className="mt-3 text-xs" style={{ color: theme.textColor, opacity: 0.62 }}>
                  Last session {formatSessionAge(todayStatus.lastRoundAt)}
                  {todayStatus.todayRoundCount > 0 ? ` · ${todayStatus.todayRoundCount} today` : ''}
                </p>
              )}
            </section>

            <section className="rounded-3xl p-4 sm:p-5" style={{ backgroundColor: 'rgba(6, 12, 18, 0.8)', border: `1px solid ${theme.textColor}2d` }}>
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: theme.textColor, opacity: 0.72 }}>
                Session context
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {TRAINING_CONTEXT_ORDER.map(context => {
                  const isActive = trainingContext === context;
                  return (
                    <button
                      key={context}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => handleTrainingContextChange(context)}
                      className="min-h-11 rounded-xl px-2 py-2 text-xs font-semibold sm:text-sm"
                      style={{
                        color: theme.textColor,
                        backgroundColor: isActive ? `${theme.targetColor}22` : 'rgba(2, 8, 12, 0.76)',
                        border: `1px solid ${isActive ? `${theme.targetColor}bb` : `${theme.textColor}2d`}`,
                      }}
                    >
                      {TRAINING_CONTEXT_LABELS[context]}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl p-4 sm:p-5" style={cardStyle} aria-label="GameSpeed Prime">
              <p className="text-[11px] uppercase tracking-[0.18em] font-semibold" style={{ color: sportConfig.accents.secondary }}>
                {primeCard.identityLine}
              </p>
              <h2 className="mt-1 text-xl font-extrabold sm:text-2xl" style={{ color: theme.textColor }}>
                {primeCard.contextHeadline}
              </h2>
              <p className="mt-1 text-2xl font-extrabold tabular-nums sm:text-3xl" style={{ color: theme.targetColor }}>
                {primeCard.minutesLabel}
              </p>
              <p className="mt-2 text-sm" style={{ color: theme.textColor, opacity: 0.78 }}>
                {primeCard.sequenceBlurb}
              </p>
              <ol className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {primeCard.phases.map((phase, index) => (
                  <li
                    key={phase.id}
                    className="rounded-2xl px-3 py-2.5"
                    style={{ backgroundColor: 'rgba(2, 8, 12, 0.7)', border: `1px solid ${theme.textColor}22` }}
                  >
                    <p className="text-[10px] uppercase tracking-[0.14em] opacity-60" style={{ color: theme.textColor }}>
                      {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: theme.textColor }}>
                      {phase.label}
                    </p>
                    <p className="mt-0.5 text-[11px] opacity-70" style={{ color: theme.textColor }}>
                      {phase.experienceName}
                    </p>
                  </li>
                ))}
              </ol>
              <JungleButton onClick={handlePrimeMe} className="mt-4 w-full min-h-14 px-6 py-4 text-lg font-extrabold tracking-wide">
                Prime Me
              </JungleButton>
            </section>

            <PersonalEvolutionPanel evolution={evolution} compact />

            <nav className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Secondary training actions">
              <button
                type="button"
                onClick={() => setView('instincts')}
                className="ui-secondary-button min-h-12 px-4 text-sm"
                style={{ color: theme.textColor, borderColor: `${sportConfig.accents.primary}66` }}
              >
                Train an Instinct
              </button>
              <button
                type="button"
                onClick={handleRunBaseline}
                className="ui-secondary-button min-h-12 px-4 text-sm"
                style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
              >
                Run Benchmark
              </button>
              <button
                type="button"
                onClick={onViewStats}
                className="ui-secondary-button min-h-12 px-4 text-sm"
                style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
              >
                History / Stats
              </button>
            </nav>
          </>
        )}

        {view === 'instincts' && (
          <section className="rounded-3xl p-4 sm:p-6" style={{ backgroundColor: 'rgba(6, 12, 18, 0.84)', border: `1px solid ${theme.textColor}30` }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold" style={{ color: theme.textColor }}>
                Train an Instinct
              </h2>
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="ui-secondary-button min-h-10 px-4 text-sm"
                style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
              >
                Back
              </button>
            </div>
            <GameModeSelector
              onSelectMode={mode => onStart(mode, undefined, sessionOptions())}
              selectedSport={selectedSport}
              unlocks={unlockMap}
              copy={{
                title: `${sportConfig.displayName} instincts`,
                subtitle: 'Standalone instincts stay available. Prime Me runs the sequenced protocol.',
                availableLabel: 'Playable protocols',
                nextReleaseLabel: 'Sport pack roadmap',
                benchmarkCta: 'Run Baseline',
                drillCta: 'Start Readiness Drill',
                benchmarkPillLabel: 'Benchmark',
                drillPillLabel: 'Drill',
                focusLabel: 'Skill focus',
                intensityLabel: 'Session load',
                comingSoonLabel: 'Coming Soon',
              }}
            />
          </section>
        )}

        {view === 'settings' && (
          <section className="rounded-3xl p-4 sm:p-6" style={{ backgroundColor: 'rgba(6, 12, 18, 0.84)', border: `1px solid ${theme.textColor}30` }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold" style={{ color: theme.textColor }}>
                Settings
              </h2>
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="ui-secondary-button min-h-10 px-4 text-sm"
                style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
              >
                Back
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: theme.textColor, opacity: 0.68 }}>
                  Night-before settings
                </p>
                <NightSettingsPanel
                  settings={nightGuardrailSettings}
                  onSettingsChange={onNightGuardrailSettingsChange}
                  isNightGuardrailActive={isNightGuardrailActive}
                  onStartLowStimulusSession={handleStartLowStimulusSession}
                  compact
                />
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: theme.textColor, opacity: 0.68 }}>
                  Gameplay cue intensity
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {(['minimal', 'standard', 'guided'] as CueIntensity[]).map(level => {
                    const isActive = cueIntensity === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => onCueIntensityChange(level)}
                        className="rounded-xl px-3 py-2 text-sm text-left capitalize"
                        style={{
                          color: theme.textColor,
                          backgroundColor: isActive ? `${theme.targetColor}22` : 'rgba(2, 8, 12, 0.76)',
                          border: `1px solid ${isActive ? `${theme.targetColor}bb` : `${theme.textColor}2d`}`,
                        }}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  aria-pressed={hapticsEnabled}
                  onClick={() => onHapticsEnabledChange(!hapticsEnabled)}
                  disabled={!hapticsAvailable}
                  className="mt-2 w-full rounded-xl px-3 py-2 text-sm text-left"
                  style={{
                    color: theme.textColor,
                    opacity: hapticsAvailable ? 1 : 0.58,
                    backgroundColor: hapticsEnabled ? `${theme.targetColor}22` : 'rgba(2, 8, 12, 0.76)',
                    border: `1px solid ${hapticsEnabled ? `${theme.targetColor}bb` : `${theme.textColor}2d`}`,
                  }}
                >
                  Mobile haptics: {hapticsEnabled ? 'On' : 'Off'}
                </button>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: theme.textColor, opacity: 0.68 }}>
                  Sleep check-in
                </p>
                <p className="mt-1 text-xs" style={{ color: theme.textColor, opacity: 0.72 }}>
                  Local only. Not a medical readiness score.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={wentToBedOnTime === 'yes'}
                    onClick={() => setWentToBedOnTime('yes')}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{
                      color: theme.textColor,
                      backgroundColor: wentToBedOnTime === 'yes' ? 'rgba(52, 211, 153, 0.16)' : 'rgba(2, 8, 12, 0.72)',
                      border: `1px solid ${wentToBedOnTime === 'yes' ? 'rgba(52, 211, 153, 0.78)' : `${theme.textColor}30`}`,
                    }}
                  >
                    On time: Yes
                  </button>
                  <button
                    type="button"
                    aria-pressed={wentToBedOnTime === 'no'}
                    onClick={() => setWentToBedOnTime('no')}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{
                      color: theme.textColor,
                      backgroundColor: wentToBedOnTime === 'no' ? 'rgba(248, 113, 113, 0.17)' : 'rgba(2, 8, 12, 0.72)',
                      border: `1px solid ${wentToBedOnTime === 'no' ? 'rgba(248, 113, 113, 0.76)' : `${theme.textColor}30`}`,
                    }}
                  >
                    On time: No
                  </button>
                </div>
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
                <JungleButton onClick={handleSleepCheckInSave} className="mt-3 w-full sm:w-auto px-5 py-2.5 text-sm">
                  Save sleep and readiness
                </JungleButton>
                {savedCheckInNotice && (
                  <p className="mt-2 text-xs" style={{ color: theme.textColor, opacity: 0.72 }}>
                    {savedCheckInNotice}
                  </p>
                )}
                {latestCheckInLabel && (
                  <p className="mt-2 text-xs" style={{ color: theme.textColor, opacity: 0.68 }}>
                    Latest: {latestCheckInLabel}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onOpenCoachMode}
                  className="ui-secondary-button min-h-12 px-4 text-sm"
                  style={{ color: theme.textColor, borderColor: `${theme.targetColor}55` }}
                >
                  Coach Mode
                </button>
                <button
                  type="button"
                  onClick={onOpenRunway}
                  className="ui-secondary-button min-h-12 px-4 text-sm"
                  style={{ color: theme.textColor, borderColor: `${sportConfig.accents.primary}66` }}
                >
                  Pre-Game Runway
                </button>
                <button
                  type="button"
                  onClick={onOpenBenchmarkPage}
                  className="ui-secondary-button min-h-12 px-4 text-sm"
                  style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
                >
                  How scoring works
                </button>
              </div>
            </div>
          </section>
        )}
      </motion.main>
    </div>
  );
};

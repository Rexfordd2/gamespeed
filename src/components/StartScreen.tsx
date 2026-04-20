import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { GameModeType, FirstRunSelection, GameStats, PlayerGoal, PlayerPersona } from '../types/game';
import { JungleBackground } from './JungleBackground';
import { GameModeSelector } from './GameModeSelector';
import { JungleButton } from './JungleButton';
import { CredibilityLayer } from './CredibilityLayer';
import { LandingHero } from './landing/LandingHero';
import { LandingDemoShell } from './landing/LandingDemoShell';
import { LandingWhyItMatters } from './landing/LandingWhyItMatters';
import { LandingSocialProof } from './landing/LandingSocialProof';
import { LandingProgression } from './landing/LandingProgression';
import { LandingFaq } from './landing/LandingFaq';
import { LandingFinalCta } from './landing/LandingFinalCta';
import { landingContent } from '../content/landingContent';
import {
  getDailyStreak,
  getFriendLeaderboard,
  getModeUnlockMap,
  getProgressDisciplineNote,
  getWeeklyChallenge,
} from '../utils/progression';
import { getLandingExperimentAssignment } from '../config/landingExperiment';
import { trackConversionEvent } from '../lib/analytics';

interface StartScreenProps {
  onStart: (mode: GameModeType, firstRunSelection?: FirstRunSelection) => void;
  onViewStats: () => void;
  isFirstRun: boolean;
  stats: GameStats;
  playerName: string;
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

export const StartScreen = ({ onStart, onViewStats, isFirstRun, stats, playerName }: StartScreenProps) => {
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
  const demoSectionRef = useRef<HTMLElement | null>(null);
  const onboardingSectionRef = useRef<HTMLElement | null>(null);

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
        className="relative z-10 mx-auto flex min-h-[calc(100dvh-2.5rem)] w-full max-w-5xl flex-col gap-6 py-4 sm:gap-8 sm:py-6"
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

        <section
          ref={onboardingSectionRef}
          className="rounded-3xl p-4 sm:p-6 md:p-8 backdrop-blur-md"
          style={{
            backgroundColor: 'rgba(6, 12, 18, 0.76)',
            border: `1px solid ${theme.targetColor}44`,
            boxShadow: '0 20px 52px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: theme.textColor }}>
            {isFirstRun ? 'Start in 60 seconds' : 'Welcome back'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.textColor, opacity: 0.82 }}>
            {isFirstRun
              ? 'Pick your role and one training goal. Your first 60-second test starts instantly with no setup screen.'
              : 'Run a quick benchmark or jump straight into a drill.'}
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
                      {option === 'athlete' ? 'Field / court / match play' : 'Controller / mouse / keyboard'}
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
              ? 'Hint: pick the role that best matches where you compete most.'
              : !goal
                ? 'Hint: choose one focus area now. You can switch goals any time after this test.'
                : 'Hint: your baseline is exactly 60 seconds. Stay smooth and accurate.'}
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
            Choose Your Drill
          </h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: theme.textColor, opacity: 0.76 }}>
            Prefer to skip onboarding? Start any drill immediately.
          </p>
          <div className="mt-4">
            <GameModeSelector onSelectMode={mode => onStart(mode)} unlocks={unlockMap} />
          </div>
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
              Leaderboard Shell
            </h2>
            <span className="text-[11px] uppercase tracking-[0.18em]" style={{ color: theme.textColor, opacity: 0.62 }}>
              best quick tap score
            </span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.12em]" style={{ color: theme.textColor, opacity: 0.56 }}>
            Placeholder rankings for launch shell
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

        <LandingSocialProof content={landingContent.socialProof} />
        <CredibilityLayer />
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

        <section className="flex justify-center">
          <button
            type="button"
            onClick={onViewStats}
            className="ui-secondary-button min-h-12 px-6 text-sm sm:text-base"
            style={{ color: theme.textColor, borderColor: `${theme.textColor}44` }}
          >
            Compare My Score
          </button>
        </section>
      </motion.main>
    </div>
  );
};
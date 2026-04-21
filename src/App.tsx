import { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { jungleTheme } from './themes/jungle';
import { AudioManager } from './components/AudioManager';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { EndScreen } from './components/EndScreen';
import { StatsScreen } from './components/StatsScreen';
import { AudioToggle } from './components/AudioToggle';
import { BenchmarkPage } from './components/BenchmarkPage';
import { PreGameRunway } from './components/PreGameRunway';
import { CoachMode } from './components/CoachMode';
import {
  FirstRunSelection,
  GameStats,
  GameModeType,
  GameState,
  GameResult,
} from './types/game';
import { resolvePlayableMode } from './utils/gameModes';
import { loadStats, recordRound } from './utils/sessionStats';
import { createClientRoundId, syncRoundToCloud } from './utils/roundSync';
import { useAuth } from './context/AuthContext';
import { RoundProgressDelta, getDailyStreak, getRoundProgressDelta } from './utils/progression';
import { trackConversionEvent } from './lib/analytics';
import { getLandingExperimentAssignment } from './config/landingExperiment';
import { SportType, loadSelectedSport, saveSelectedSport } from './config/sports';
import {
  NightGuardrailSettings,
  acknowledgeNightBeforeReminder,
  getNextBedtime,
  getNextReminderDelayMs,
  loadNightGuardrailSettings,
  saveNightGuardrailSettings,
  shouldTriggerInAppReminder,
  shouldUseLowStimulusMode,
} from './utils/nightGuardrail';

const FIRST_RUN_COMPLETE_STORAGE_KEY = 'gamespeed_first_run_complete_v1';
const BENCHMARK_ROUTE_PATH = '/benchmark';
const RUNWAY_ROUTE_PATH = '/runway';
type PublicRoute = 'home' | 'benchmark' | 'runway';

const getPublicRouteFromPath = (pathname: string): PublicRoute => {
  const normalizedPath = pathname.toLowerCase();
  if (normalizedPath === BENCHMARK_ROUTE_PATH) return 'benchmark';
  if (normalizedPath === RUNWAY_ROUTE_PATH) return 'runway';
  return 'home';
};

const loadFirstRunComplete = () => {
  try {
    return localStorage.getItem(FIRST_RUN_COMPLETE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const App = () => {
  const { user, profile } = useAuth();
  const landingExperiment = useMemo(() => getLandingExperimentAssignment(), []);
  const [publicRoute, setPublicRoute] = useState<PublicRoute>(() =>
    typeof window === 'undefined' ? 'home' : getPublicRouteFromPath(window.location.pathname),
  );
  const [gameState, setGameState] = useState<GameState>('start');
  const [selectedMode, setSelectedMode] = useState<GameModeType>('quickTap');
  const [selectedSport, setSelectedSport] = useState<SportType>(loadSelectedSport);
  const [firstRunSelection, setFirstRunSelection] = useState<FirstRunSelection | null>(null);
  const [lastRoundSelection, setLastRoundSelection] = useState<FirstRunSelection | null>(null);
  const [isFirstRunComplete, setIsFirstRunComplete] = useState<boolean>(loadFirstRunComplete);
  const [showPostFirstSessionChecklist, setShowPostFirstSessionChecklist] = useState(false);
  const [statsSnapshot, setStatsSnapshot] = useState<GameStats>(() => loadStats());
  const [nightGuardrailSettings, setNightGuardrailSettings] = useState<NightGuardrailSettings>(
    loadNightGuardrailSettings,
  );
  const [showNightReminder, setShowNightReminder] = useState(false);
  const [clockMs, setClockMs] = useState(() => Date.now());
  const [activeSessionOptions, setActiveSessionOptions] = useState<{
    lowStimulus: boolean;
    includeRoutine: boolean;
  }>({
    lowStimulus: false,
    includeRoutine: false,
  });
  const [totalRoundsCompleted, setTotalRoundsCompleted] = useState<number>(statsSnapshot.rounds.length);
  const [roundProgressDelta, setRoundProgressDelta] = useState<RoundProgressDelta | null>(null);
  const [gameResult, setGameResult] = useState<GameResult>({
    score: 0,
    misses: 0,
    bestStreak: 0,
    mode: 'quickTap',
    modeName: 'Quick Tap',
  });
  const hasTrackedReturnVisit = useRef(false);
  const hadAuthenticatedUser = useRef<boolean>(!!user);
  const isNightGuardrailActive = shouldUseLowStimulusMode(nightGuardrailSettings, new Date(clockMs));

  const handleGameStart = (
    mode: GameModeType,
    nextFirstRunSelection?: FirstRunSelection,
    options?: { lowStimulus?: boolean; includeRoutine?: boolean },
  ) => {
    const shouldForceLowStimulus = shouldUseLowStimulusMode(
      nightGuardrailSettings,
      new Date(clockMs),
    );
    const nextSessionOptions = shouldForceLowStimulus
      ? {
          lowStimulus: true,
          includeRoutine: nightGuardrailSettings.includeBreathingRoutine,
        }
      : {
          lowStimulus: !!options?.lowStimulus,
          includeRoutine: !!options?.includeRoutine,
        };

    trackConversionEvent('test_start', {
      source: 'app_transition',
      mode: shouldForceLowStimulus ? 'reactionBenchmark' : mode,
      sport: selectedSport,
      firstRun: !isFirstRunComplete,
      experimentVariant: landingExperiment.id,
      persona: nextFirstRunSelection?.persona ?? null,
      goal: nextFirstRunSelection?.goal ?? null,
      lowStimulus: nextSessionOptions.lowStimulus,
    });

    const startMode = shouldForceLowStimulus ? 'reactionBenchmark' : mode;
    const isStartingFirstTest = !isFirstRunComplete && startMode === 'reactionBenchmark';
    if (isStartingFirstTest) {
      trackConversionEvent('first_test_start', {
        source: 'app_transition',
        mode: startMode,
        sport: selectedSport,
        experimentVariant: landingExperiment.id,
        persona: nextFirstRunSelection?.persona ?? null,
        goal: nextFirstRunSelection?.goal ?? null,
      });
    }
    setSelectedMode(resolvePlayableMode(startMode));
    setActiveSessionOptions(nextSessionOptions);
    setFirstRunSelection(nextFirstRunSelection ?? null);
    setGameState('playing');
  };

  const handleGameOver = (result: GameResult) => {
    const isFirstCompletedSession = !isFirstRunComplete;
    const previousStats = loadStats();
    const previousPb = previousStats.pbs[result.mode];
    const clientRoundId = createClientRoundId();
    const storedRound = recordRound(result, { clientRoundId });
    const nextStats = loadStats();
    const previousStreak = getDailyStreak(previousStats);
    const nextStreak = getDailyStreak(nextStats);
    setGameResult(result);
    setRoundProgressDelta(getRoundProgressDelta(result, previousPb));
    setStatsSnapshot(nextStats);
    setLastRoundSelection(firstRunSelection);
    setTotalRoundsCompleted(nextStats.rounds.length);
    setShowPostFirstSessionChecklist(isFirstCompletedSession);
    setGameState('end');
    setFirstRunSelection(null);

    trackConversionEvent('test_completion', {
      mode: result.mode,
      sport: selectedSport,
      score: result.score,
      misses: result.misses,
      bestStreak: result.bestStreak,
      firstRun: isFirstCompletedSession,
      experimentVariant: landingExperiment.id,
      persona: firstRunSelection?.persona ?? null,
      goal: firstRunSelection?.goal ?? null,
    });

    if (isFirstCompletedSession) {
      setIsFirstRunComplete(true);
      trackConversionEvent('first_test_completion', {
        mode: result.mode,
        sport: selectedSport,
        score: result.score,
        misses: result.misses,
        bestStreak: result.bestStreak,
        experimentVariant: landingExperiment.id,
        persona: firstRunSelection?.persona ?? null,
        goal: firstRunSelection?.goal ?? null,
      });
      try {
        localStorage.setItem(FIRST_RUN_COMPLETE_STORAGE_KEY, '1');
      } catch {
        // Ignore storage failures (private mode / quota).
      }
    }

    if (previousStreak === 0 && nextStreak >= 1) {
      trackConversionEvent('streak_start', {
        streakDays: nextStreak,
        sport: selectedSport,
        totalRoundsCompleted: nextStats.rounds.length,
        experimentVariant: landingExperiment.id,
      });
    }

    if (user) {
      void syncRoundToCloud({
        userId: user.id,
        round: storedRound,
      });
    }
  };

  const handlePlayAgain = () => {
    setShowPostFirstSessionChecklist(false);
    setGameState('playing');
  };

  const handleMainMenu = () => {
    setShowPostFirstSessionChecklist(false);
    setActiveSessionOptions({
      lowStimulus: false,
      includeRoutine: false,
    });
    setGameState('start');
  };

  const handleViewStats = () => {
    setStatsSnapshot(loadStats());
    setGameState('stats');
  };

  const handleSportChange = (sport: SportType) => {
    setSelectedSport(sport);
    saveSelectedSport(sport);
  };

  const handleCloseStats = () => {
    setGameState('start');
  };

  const handleNightGuardrailSettingsChange = (nextSettings: NightGuardrailSettings) => {
    setNightGuardrailSettings(nextSettings);
    saveNightGuardrailSettings(nextSettings);
  };

  const navigateToPublicRoute = (nextRoute: PublicRoute) => {
    if (typeof window === 'undefined') return;
    const nextPathname =
      nextRoute === 'benchmark'
        ? BENCHMARK_ROUTE_PATH
        : nextRoute === 'runway'
          ? RUNWAY_ROUTE_PATH
          : '/';
    if (window.location.pathname !== nextPathname) {
      window.history.pushState({}, '', nextPathname);
    }
    setPublicRoute(nextRoute);
  };

  const handleOpenBenchmarkPage = () => {
    navigateToPublicRoute('benchmark');
  };

  const handleReturnHome = () => {
    navigateToPublicRoute('home');
  };

  const handleOpenRunway = () => {
    navigateToPublicRoute('runway');
  };

  const handleOpenCoachMode = () => {
    setGameState('coach');
  };

  useEffect(() => {
    const isPlaying = gameState === 'playing';
    document.body.classList.toggle('gameplay-scroll-lock', isPlaying);
    return () => {
      document.body.classList.remove('gameplay-scroll-lock');
    };
  }, [gameState]);

  useEffect(() => {
    const onPopState = () => {
      setPublicRoute(getPublicRouteFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setClockMs(Date.now());
    }, 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    const delayMs = getNextReminderDelayMs(nightGuardrailSettings, new Date(clockMs));
    if (delayMs === null) {
      return;
    }

    const timerId = window.setTimeout(() => {
      const now = new Date();
      if (!shouldTriggerInAppReminder(nightGuardrailSettings, now)) {
        return;
      }
      setShowNightReminder(true);
      acknowledgeNightBeforeReminder(getNextBedtime(nightGuardrailSettings.targetBedtime, now));
      setClockMs(now.getTime());
    }, delayMs);

    return () => window.clearTimeout(timerId);
  }, [clockMs, nightGuardrailSettings]);

  useEffect(() => {
    if (gameState !== 'start') {
      document.title = 'GameSpeed';
      return;
    }
    if (publicRoute === 'benchmark') {
      document.title = 'GameSpeed Benchmark Methodology';
      return;
    }
    if (publicRoute === 'runway') {
      document.title = 'GameSpeed Pre-Game Runway';
      return;
    }
    document.title = 'GameSpeed';
  }, [gameState, publicRoute]);

  useEffect(() => {
    if (hasTrackedReturnVisit.current) {
      return;
    }
    if (!isFirstRunComplete && statsSnapshot.rounds.length === 0) {
      return;
    }
    hasTrackedReturnVisit.current = true;
    trackConversionEvent('return_visit', {
      roundsCompleted: statsSnapshot.rounds.length,
      sport: selectedSport,
      firstRunComplete: isFirstRunComplete,
      experimentVariant: landingExperiment.id,
    });
  }, [isFirstRunComplete, landingExperiment.id, selectedSport, statsSnapshot.rounds.length]);

  useEffect(() => {
    const signedInNow = !!user;
    if (!hadAuthenticatedUser.current && signedInNow && totalRoundsCompleted > 0) {
      trackConversionEvent('signup_after_first_session', {
        totalRoundsCompleted,
        sport: selectedSport,
        firstRunComplete: isFirstRunComplete,
        experimentVariant: landingExperiment.id,
      });
    }
    hadAuthenticatedUser.current = signedInNow;
  }, [isFirstRunComplete, landingExperiment.id, selectedSport, totalRoundsCompleted, user]);

  return (
    <ThemeProvider theme={jungleTheme}>
      <AudioManager>
        <AudioToggle />
        {gameState === 'start' && (
          <>
            {publicRoute === 'benchmark' ? (
              <BenchmarkPage
                onBackToHome={handleReturnHome}
                onStartBenchmark={() => handleGameStart('reactionBenchmark')}
              />
            ) : publicRoute === 'runway' ? (
              <PreGameRunway
                selectedSport={selectedSport}
                onBackToHome={handleReturnHome}
              />
            ) : (
              <StartScreen
                onStart={handleGameStart}
                selectedSport={selectedSport}
                onSportChange={handleSportChange}
                onViewStats={handleViewStats}
                onOpenBenchmarkPage={handleOpenBenchmarkPage}
                onOpenRunway={handleOpenRunway}
                onOpenCoachMode={handleOpenCoachMode}
                isFirstRun={!isFirstRunComplete}
                stats={statsSnapshot}
                playerName={profile?.display_name || user?.email?.split('@')[0] || 'You'}
                nightGuardrailSettings={nightGuardrailSettings}
                onNightGuardrailSettingsChange={handleNightGuardrailSettingsChange}
                showNightReminder={showNightReminder}
                onDismissNightReminder={() => setShowNightReminder(false)}
                isNightGuardrailActive={isNightGuardrailActive}
              />
            )}
          </>
        )}
        {gameState === 'playing' && (
          <Game
            mode={selectedMode}
            selectedSport={selectedSport}
            onGameOver={handleGameOver}
            onMainMenu={handleMainMenu}
            lowStimulusMode={activeSessionOptions.lowStimulus}
            includeBreathingRoutine={activeSessionOptions.includeRoutine}
          />
        )}
        {gameState === 'end' && (
          <EndScreen
            result={gameResult}
            onPlayAgain={handlePlayAgain}
            onMainMenu={handleMainMenu}
            onViewStats={handleViewStats}
            firstRunSelection={lastRoundSelection}
            onStartMode={handleGameStart}
            showOnboardingChecklist={showPostFirstSessionChecklist}
            showDeferredAccountPrompt={!user}
            isSignedIn={!!user}
            totalRoundsCompleted={totalRoundsCompleted}
            stats={statsSnapshot}
            roundProgressDelta={roundProgressDelta}
            playerName={profile?.display_name || user?.email?.split('@')[0] || 'You'}
          />
        )}
        {gameState === 'stats' && (
          <StatsScreen
            onClose={handleCloseStats}
            stats={statsSnapshot}
            playerName={profile?.display_name || user?.email?.split('@')[0] || 'You'}
          />
        )}
        {gameState === 'coach' && <CoachMode onBack={handleMainMenu} />}
      </AudioManager>
    </ThemeProvider>
  );
};

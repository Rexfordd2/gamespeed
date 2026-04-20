import { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { jungleTheme } from './themes/jungle';
import { AudioManager } from './components/AudioManager';
import { StartScreen } from './components/StartScreen';
import { Game } from './components/Game';
import { EndScreen } from './components/EndScreen';
import { StatsScreen } from './components/StatsScreen';
import { AudioToggle } from './components/AudioToggle';
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

const FIRST_RUN_COMPLETE_STORAGE_KEY = 'gamespeed_first_run_complete_v1';

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
  const [gameState, setGameState] = useState<GameState>('start');
  const [selectedMode, setSelectedMode] = useState<GameModeType>('quickTap');
  const [firstRunSelection, setFirstRunSelection] = useState<FirstRunSelection | null>(null);
  const [lastRoundSelection, setLastRoundSelection] = useState<FirstRunSelection | null>(null);
  const [isFirstRunComplete, setIsFirstRunComplete] = useState<boolean>(loadFirstRunComplete);
  const [showPostFirstSessionChecklist, setShowPostFirstSessionChecklist] = useState(false);
  const [statsSnapshot, setStatsSnapshot] = useState<GameStats>(() => loadStats());
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

  const handleGameStart = (
    mode: GameModeType,
    nextFirstRunSelection?: FirstRunSelection,
  ) => {
    trackConversionEvent('test_start', {
      source: 'app_transition',
      mode,
      firstRun: !isFirstRunComplete,
      experimentVariant: landingExperiment.id,
      persona: nextFirstRunSelection?.persona ?? null,
      goal: nextFirstRunSelection?.goal ?? null,
    });

    const isStartingFirstTest = !isFirstRunComplete && mode === 'reactionBenchmark';
    if (isStartingFirstTest) {
      trackConversionEvent('first_test_start', {
        source: 'app_transition',
        mode,
        experimentVariant: landingExperiment.id,
        persona: nextFirstRunSelection?.persona ?? null,
        goal: nextFirstRunSelection?.goal ?? null,
      });
    }
    setSelectedMode(resolvePlayableMode(mode));
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
    setGameState('start');
  };

  const handleViewStats = () => {
    setStatsSnapshot(loadStats());
    setGameState('stats');
  };

  const handleCloseStats = () => {
    setGameState('start');
  };

  useEffect(() => {
    const isPlaying = gameState === 'playing';
    document.body.classList.toggle('gameplay-scroll-lock', isPlaying);
    return () => {
      document.body.classList.remove('gameplay-scroll-lock');
    };
  }, [gameState]);

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
      firstRunComplete: isFirstRunComplete,
      experimentVariant: landingExperiment.id,
    });
  }, [isFirstRunComplete, landingExperiment.id, statsSnapshot.rounds.length]);

  useEffect(() => {
    const signedInNow = !!user;
    if (!hadAuthenticatedUser.current && signedInNow && totalRoundsCompleted > 0) {
      trackConversionEvent('signup_after_first_session', {
        totalRoundsCompleted,
        firstRunComplete: isFirstRunComplete,
        experimentVariant: landingExperiment.id,
      });
    }
    hadAuthenticatedUser.current = signedInNow;
  }, [isFirstRunComplete, landingExperiment.id, totalRoundsCompleted, user]);

  return (
    <ThemeProvider theme={jungleTheme}>
      <AudioManager>
        <AudioToggle />
        {gameState === 'start' && (
          <StartScreen
            onStart={handleGameStart}
            onViewStats={handleViewStats}
            isFirstRun={!isFirstRunComplete}
            stats={statsSnapshot}
            playerName={profile?.display_name || user?.email?.split('@')[0] || 'You'}
          />
        )}
        {gameState === 'playing' && (
          <Game
            mode={selectedMode}
            onGameOver={handleGameOver}
            onMainMenu={handleMainMenu}
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
      </AudioManager>
    </ThemeProvider>
  );
};

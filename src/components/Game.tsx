import { useState, useEffect, useCallback, useRef } from 'react';
import { Target as TargetType, GameModeType, GameResult } from '../types/game';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from './AudioManager';
import { gameModes, resolvePlayableMode } from '../utils/gameModes';
import { GameHeader } from './GameHeader';
import { Target } from './Target';
import { JungleButton } from './JungleButton';

interface GameProps {
  mode?: GameModeType;
  onGameOver: (result: GameResult) => void;
  onMainMenu: () => void;
}

const ROUND_SECONDS = 60;
const ROUND_MS = ROUND_SECONDS * 1000;
const LOOP_TICK_MS = 50;
const PLAYFIELD_TOP_OFFSET = 'max(96px, calc(env(safe-area-inset-top, 0px) + 82px))';
const TARGET_SAFE_TOP_PERCENT = 18;
const TARGET_SAFE_BOTTOM_PERCENT = 7;
const TARGET_BOUNDS_RANGE = 100 - TARGET_SAFE_TOP_PERCENT - TARGET_SAFE_BOTTOM_PERCENT;

export const Game = ({ mode = 'quickTap', onGameOver, onMainMenu }: GameProps) => {
  const activeMode = resolvePlayableMode(mode);

  const { theme } = useTheme();
  const { playEffect, startBackgroundMusic, stopBackgroundMusic } = useAudio();

  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [missFeedbackId, setMissFeedbackId] = useState(0);
  const [, setBestStreak] = useState(0);
  const screenSizeRef = useRef({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const targetsRef = useRef<TargetType[]>([]);
  const scoreRef = useRef(0);
  const missesRef = useRef(0);
  const streakRef = useRef(0);
  const bestStreakRef = useRef(0);
  const isPausedRef = useRef(false);
  const gameOverFiredRef = useRef(false);
  const roundEndsAtRef = useRef(Date.now() + ROUND_MS);
  const remainingMsRef = useRef(ROUND_MS);
  const nextSpawnAtRef = useRef(Date.now());

  const keepTargetsInPlayfield = useCallback((targetsToAdjust: TargetType[]) => {
    return targetsToAdjust.map(target => ({
      ...target,
      y: TARGET_SAFE_TOP_PERCENT + (target.y / 100) * TARGET_BOUNDS_RANGE,
    }));
  }, []);

  useEffect(() => {
    const onResize = () => {
      screenSizeRef.current = {
        width: window.innerWidth,
        height: window.innerHeight,
      };
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    startBackgroundMusic();
    return () => {
      stopBackgroundMusic();
    };
  }, [startBackgroundMusic, stopBackgroundMusic]);

  useEffect(() => {
    if (isPaused) {
      stopBackgroundMusic();
    } else {
      startBackgroundMusic();
    }
  }, [isPaused, startBackgroundMusic, stopBackgroundMusic]);

  const finishGame = useCallback(
    (trigger: 'timeout' | 'quit') => {
      if (gameOverFiredRef.current) return;
      gameOverFiredRef.current = true;
      if (trigger === 'timeout') {
        playEffect('success');
      }

      const gameMode = gameModes[activeMode];
      onGameOver({
        score: scoreRef.current,
        misses: missesRef.current,
        bestStreak: bestStreakRef.current,
        mode: activeMode,
        modeName: gameMode.name,
      });
    },
    [activeMode, onGameOver, playEffect],
  );

  useEffect(() => {
    targetsRef.current = [];
    scoreRef.current = 0;
    missesRef.current = 0;
    streakRef.current = 0;
    bestStreakRef.current = 0;
    isPausedRef.current = false;
    gameOverFiredRef.current = false;
    remainingMsRef.current = ROUND_MS;
    roundEndsAtRef.current = Date.now() + ROUND_MS;
    nextSpawnAtRef.current = Date.now();

    setTargets([]);
    setTimeLeft(ROUND_SECONDS);
    setScore(0);
    setMisses(0);
    setIsPaused(false);
    setStreak(0);
    setBestStreak(0);
  }, [activeMode]);

  useEffect(() => {
    const gameMode = gameModes[activeMode];
    const interval = window.setInterval(() => {
      if (gameOverFiredRef.current || isPausedRef.current) {
        return;
      }

      const now = Date.now();
      const remainingMs = Math.max(0, roundEndsAtRef.current - now);
      remainingMsRef.current = remainingMs;

      const nextTimeLeft = Math.ceil(remainingMs / 1000);
      setTimeLeft(prev => (prev === nextTimeLeft ? prev : nextTimeLeft));

      const currentTargets = targetsRef.current;
      const filteredTargets = currentTargets.filter(
        target => now - target.createdAt < target.lifespan * 1000,
      );
      const expiredCount = currentTargets.length - filteredTargets.length;
      const aliveTargets = expiredCount > 0 ? filteredTargets : currentTargets;

      if (expiredCount > 0) {
        playEffect('miss');
        setMissFeedbackId(prev => prev + 1);
        missesRef.current += expiredCount;
        setMisses(prev => prev + expiredCount);
        if (streakRef.current !== 0) {
          streakRef.current = 0;
          setStreak(0);
        }
      }

      let nextTargets = aliveTargets;
      if (now >= nextSpawnAtRef.current && remainingMs > 0) {
        const generatedTargets = gameMode.generateTargets({
          screenSize: screenSizeRef.current,
          existingTargets: aliveTargets,
          currentTime: now,
          maxTargets: gameMode.config.maxTargets,
          targetLifespan: gameMode.config.targetLifespan,
        });
        const hasNewTarget = generatedTargets.some(
          generatedTarget =>
            !aliveTargets.some(existingTarget => existingTarget.id === generatedTarget.id),
        );
        nextTargets = hasNewTarget
          ? keepTargetsInPlayfield(generatedTargets)
          : generatedTargets;
        nextSpawnAtRef.current = now + gameMode.config.targetInterval;
      }

      if (nextTargets !== currentTargets) {
        targetsRef.current = nextTargets;
        setTargets(nextTargets);
      }

      if (remainingMs <= 0) {
        setTimeLeft(0);
        finishGame('timeout');
      }
    }, LOOP_TICK_MS);

    return () => window.clearInterval(interval);
  }, [activeMode, finishGame, keepTargetsInPlayfield, playEffect]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    missesRef.current = misses;
  }, [misses]);

  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  const handleTargetClick = useCallback(
    (targetId: string) => {
      if (isPausedRef.current || gameOverFiredRef.current) return;
      if (!targetsRef.current.some(target => target.id === targetId)) return;

      scoreRef.current += 1;
      setScore(prev => prev + 1);
      streakRef.current += 1;
      setStreak(streakRef.current);
      if (streakRef.current > bestStreakRef.current) {
        bestStreakRef.current = streakRef.current;
        setBestStreak(bestStreakRef.current);
      }
      playEffect('hit');

      setTargets(prev => {
        const next = prev.filter(target => target.id !== targetId);
        targetsRef.current = next;
        return next;
      });
    },
    [playEffect],
  );

  const togglePause = useCallback(() => {
    if (gameOverFiredRef.current) return;

    setIsPaused(prev => {
      const nextPaused = !prev;
      isPausedRef.current = nextPaused;

      if (nextPaused) {
        remainingMsRef.current = Math.max(0, roundEndsAtRef.current - Date.now());
        setTimeLeft(Math.ceil(remainingMsRef.current / 1000));
      } else {
        roundEndsAtRef.current = Date.now() + remainingMsRef.current;
      }

      return nextPaused;
    });
  }, []);

  const handleQuit = useCallback(() => {
    if (window.confirm('Quit this round and return to main menu?')) {
      onMainMenu();
    }
  }, [onMainMenu]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.repeat || gameOverFiredRef.current) return;
      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        togglePause();
        return;
      }
      if (event.key === 'Escape' && isPausedRef.current) {
        event.preventDefault();
        togglePause();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [togglePause]);

  const gameMode = gameModes[activeMode];

  return (
    <div
      className="game-container relative w-full overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor, height: '100dvh' }}
    >
      <GameHeader
        score={score}
        streak={streak}
        timeLeft={timeLeft}
        totalTime={ROUND_SECONDS}
        modeName={gameMode.name}
        onPause={togglePause}
        onMainMenu={handleQuit}
        isPaused={isPaused}
      />

      <div
        className="absolute left-0 right-0 bottom-0"
        style={{ top: PLAYFIELD_TOP_OFFSET }}
        aria-label="Gameplay area"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.22) 100%)',
          }}
        />
        {missFeedbackId > 0 && <div key={missFeedbackId} className="miss-feedback-overlay" />}
        {targets.map(target => (
          <Target
            key={`${target.id}-${target.createdAt}`}
            target={target}
            onClick={() => handleTargetClick(target.id)}
          />
        ))}
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', zIndex: 100 }}
        >
          <div
            className="w-full max-w-sm mx-6 p-8 rounded-2xl flex flex-col items-center gap-6 shadow-2xl"
            style={{
              backgroundColor: theme.backgroundColor,
              border: `2px solid ${theme.targetColor}60`,
            }}
          >
            <h2
              className="text-3xl font-bold tracking-wide"
              style={{ color: theme.textColor }}
            >
              Paused
            </h2>
            <p className="text-sm text-center" style={{ color: `${theme.textColor}CC` }}>
              Press <kbd className="px-1.5 py-0.5 rounded bg-black/30">P</kbd> to resume quickly.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <JungleButton onClick={togglePause} className="w-full py-4 text-lg">
                Resume
              </JungleButton>
              <button
                onClick={handleQuit}
                className="ui-secondary-button w-full py-3"
                style={{
                  color: theme.textColor,
                  borderColor: `${theme.textColor}40`,
                }}
              >
                Quit to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

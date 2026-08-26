import { useState, useEffect, useCallback, useRef } from 'react';
import { CueIntensity, Target as TargetType, GameModeType, GameResult } from '../types/game';
import { useTheme } from '../context/ThemeContext';
import { useAudio } from './AudioManager';
import { SportType, getSportPack } from '../config/sports';
import { gameModes, resolvePlayableMode } from '../utils/gameModes';
import {
  calculateHoldProgress,
  getHoldVisualPhase,
  isWithinHoldRadius,
  HoldVisualPhase,
} from '../utils/holdTracking';
import {
  generateSequenceTargets,
  getSequenceLengthForSuccesses,
  getSequencePreviewStepMs,
  SEQUENCE_MIN_LENGTH,
} from '../modes/sequenceMemory';
import { scaleMsByStreak, scaleSecondsByStreak } from '../utils/streakScaling';
import { getSwipeCueLabel, getHoldTrackCueLabel, getSequenceCueLabels } from '../utils/modeCueLanguage';
import { getSwipeTimingVerdict, getSwipeTimingWindow } from '../utils/modeMechanics';
import { deriveReadinessMetrics } from '../utils/readinessMetrics';
import { GameHeader } from './GameHeader';
import { Target } from './Target';
import { SchulteGridBoard } from './SchulteGridBoard';
import { CaimanControlBoard } from './CaimanControlBoard';
import { JungleButton } from './JungleButton';
import { SportModeCueKey, getSportPackAssets } from '../config/sportPacks';
import { GameplayCueOverlay } from './GameplayCueOverlay';
import { GameplayCueType, getGameplayCueSet, isCueTimingVisible } from '../utils/gameplayCues';
import { getModeManifest, resolveModeRoundSeconds } from '../config/modeManifest';
import { triggerHapticCue } from '../utils/haptics';
import { resolveSharedVisualPath } from '../config/assetRegistry';
import { SchulteBoard, SchulteRoundAccumulator } from '../types/schulte';
import {
  absorbSchulteBoard,
  createSchulteAccumulator,
  deriveSchulteMetrics,
  generateSchulteBoard,
  selectSchulteCell,
  tickSchulteBoard,
} from '../utils/schulteGrid';
import { getSchulteConfigForBoard } from '../modes/schulteScan';
import { GoNoGoOutcome, GoNoGoRoundState } from '../types/goNoGo';
import {
  createGoNoGoRound,
  deriveGoNoGoMetrics,
  respondGoNoGo,
  shiftGoNoGoPhase,
  tickGoNoGo,
} from '../utils/goNoGoEngine';
import { getGoNoGoConfigForLadder } from '../modes/goNoGo';

interface GameProps {
  mode?: GameModeType;
  selectedSport: SportType;
  onGameOver: (result: GameResult) => void;
  onMainMenu: () => void;
  lowStimulusMode?: boolean;
  includeBreathingRoutine?: boolean;
  cueIntensity?: CueIntensity;
  hapticsEnabled?: boolean;
  roundSecondsOverride?: number;
  primeSession?: boolean;
}

const DEFAULT_ROUND_SECONDS = 60;
const LOOP_TICK_MS = 50;
const HOLD_BREAK_FEEDBACK_MS = 210;
const SEQUENCE_SUCCESS_FEEDBACK_MS = 520;
const SEQUENCE_FAILURE_FEEDBACK_MS = 720;
const MIN_SPAWN_INTERVAL_MS = 120;
const MIN_TARGET_LIFESPAN_SECONDS = 0.3;
const MIN_SEQUENCE_PREVIEW_STEP_MS = 240;
const MIN_SEQUENCE_FEEDBACK_MS = 220;
const LOW_STIM_ROUTINE_PHASE_SECONDS = 45;
const MISS_FEEDBACK_COOLDOWN_MS = 180;
const PLAYFIELD_TOP_OFFSET = 'max(96px, calc(env(safe-area-inset-top, 0px) + 82px))';
const TARGET_SAFE_TOP_PERCENT = 18;
const TARGET_SAFE_BOTTOM_PERCENT = 7;
const TARGET_BOUNDS_RANGE = 100 - TARGET_SAFE_TOP_PERCENT - TARGET_SAFE_BOTTOM_PERCENT;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toPlayfieldY = (value: number) => TARGET_SAFE_TOP_PERCENT + (value / 100) * TARGET_BOUNDS_RANGE;

type HoldVisualState = {
  phase: HoldVisualPhase;
  progress: number;
};

type HoldTrackingState = {
  targetId: string | null;
  pointerId: number | null;
  pointerX: number;
  pointerY: number;
  heldMs: number;
  decisionReactionMs: number;
  lastTickAt: number;
};

type SequencePhase = 'preview' | 'input' | 'feedback';
type SequenceFeedback = 'success' | 'failure' | null;
type SwipeTimingFeedback = 'early' | 'late' | null;
type OverlayCueEvent = {
  id: number;
  text: string;
  type: GameplayCueType;
} | null;

export const Game = ({
  mode = 'quickTap',
  selectedSport,
  onGameOver,
  onMainMenu,
  lowStimulusMode = false,
  includeBreathingRoutine = false,
  cueIntensity = 'standard',
  hapticsEnabled = false,
  roundSecondsOverride,
  primeSession = false,
}: GameProps) => {
  const activeMode = resolvePlayableMode(mode);
  const modeManifest = getModeManifest(activeMode);
  const isSwipeMode = modeManifest.gameplayMechanicType === 'swipe';
  const isHoldMode = modeManifest.gameplayMechanicType === 'hold';
  const isSequenceMode = modeManifest.targetRendererKey === 'sequenceTargets';
  const isSchulteMode = modeManifest.targetRendererKey === 'schulteGrid';
  const isGoNoGoMode = modeManifest.targetRendererKey === 'goNoGoStimulus';
  const modeAudioHooks = modeManifest.audioCueHooks;
  const sequencePhaseCues = modeAudioHooks.sequencePhase;
  const holdStartCue = modeAudioHooks.onHoldStart ?? 'hold-lock';
  const ROUND_SECONDS =
    roundSecondsOverride && roundSecondsOverride > 0
      ? roundSecondsOverride
      : resolveModeRoundSeconds(activeMode) ?? gameModes[activeMode].config.roundSeconds ?? DEFAULT_ROUND_SECONDS;
  const ROUND_MS = ROUND_SECONDS * 1000;

  const { theme } = useTheme();
  const { playEffect, playCue, startBackgroundMusic, stopBackgroundMusic } = useAudio();
  const sportPack = getSportPack(selectedSport);
  const sportAssets = getSportPackAssets(sportPack);
  const stimulusIconByVariant = {
    standard: sportAssets.targetIcon,
    contrast: resolveSharedVisualPath('stimulus-contrast', 'icons/target-primate.svg'),
    peripheral: resolveSharedVisualPath('stimulus-peripheral', 'icons/target-primate.svg'),
    calm: resolveSharedVisualPath('stimulus-calm', 'icons/target-primate.svg'),
  } as const;
  const mappedModeCues = sportPack.audioCueMap?.mode;
  const resolveModeCue = useCallback(
    (defaultCue: SportModeCueKey) => mappedModeCues?.[defaultCue] ?? defaultCue,
    [mappedModeCues],
  );

  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [streak, setStreak] = useState(0);
  const [missFeedbackId, setMissFeedbackId] = useState(0);
  const [holdVisualByTarget, setHoldVisualByTarget] = useState<Record<string, HoldVisualState>>({});
  const [sequencePhase, setSequencePhase] = useState<SequencePhase>('preview');
  const [sequenceFeedback, setSequenceFeedback] = useState<SequenceFeedback>(null);
  const [sequencePreviewStep, setSequencePreviewStep] = useState(0);
  const [sequenceInputStep, setSequenceInputStep] = useState(0);
  const [sequenceLength, setSequenceLength] = useState(SEQUENCE_MIN_LENGTH);
  const [swipeTimingFeedback, setSwipeTimingFeedback] = useState<SwipeTimingFeedback>(null);
  const [preRoundCueVisible, setPreRoundCueVisible] = useState(true);
  const [phaseCueEvent, setPhaseCueEvent] = useState<OverlayCueEvent>(null);
  const [streakCueEvent, setStreakCueEvent] = useState<OverlayCueEvent>(null);
  const [routineStep, setRoutineStep] = useState<'breathing' | 'gaze' | null>(
    lowStimulusMode && includeBreathingRoutine ? 'breathing' : null,
  );
  const [routineSecondsLeft, setRoutineSecondsLeft] = useState(LOW_STIM_ROUTINE_PHASE_SECONDS);
  const [schulteBoard, setSchulteBoard] = useState<SchulteBoard | null>(null);
  const [goNoGoRound, setGoNoGoRound] = useState<GoNoGoRoundState | null>(null);
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
  const playfieldRef = useRef<HTMLDivElement | null>(null);
  const holdTrackingRef = useRef<HoldTrackingState>({
    targetId: null,
    pointerId: null,
    pointerX: 0,
    pointerY: 0,
    heldMs: 0,
    decisionReactionMs: 0,
    lastTickAt: 0,
  });
  const reactionTimesRef = useRef<number[]>([]);
  const attemptsRef = useRef(0);
  const lateDecisionsRef = useRef(0);
  const falseStartsRef = useRef(0);
  const streakRunsRef = useRef<number[]>([]);
  const holdBreakUntilRef = useRef<Record<string, number>>({});
  const sequencePhaseRef = useRef<SequencePhase>('preview');
  const sequenceFeedbackRef = useRef<SequenceFeedback>(null);
  const sequencePreviewStepRef = useRef(0);
  const sequenceInputStepRef = useRef(0);
  const sequenceLengthRef = useRef(SEQUENCE_MIN_LENGTH);
  const sequenceSuccessesRef = useRef(0);
  const sequenceOrderRef = useRef<string[]>([]);
  const sequencePhaseEndsAtRef = useRef(0);
  const sequencePhaseRemainingMsRef = useRef(0);
  const swipeFeedbackTimeoutRef = useRef<number | null>(null);
  const lastMissFeedbackAtRef = useRef(0);
  const isRoutineActive = routineStep !== null;
  const sequenceCueLabelsRef = useRef<string[]>([]);
  const cueEventCounterRef = useRef(0);
  const phaseCueTimeoutRef = useRef<number | null>(null);
  const streakCueTimeoutRef = useRef<number | null>(null);
  const prevStreakRef = useRef(0);
  const prevMissesRef = useRef(0);
  const prevPhaseCueKeyRef = useRef('');
  const schulteBoardRef = useRef<SchulteBoard | null>(null);
  const schulteRoundRef = useRef<SchulteRoundAccumulator | null>(null);
  const goNoGoRoundRef = useRef<GoNoGoRoundState | null>(null);
  const goNoGoPhaseRemainingMsRef = useRef(0);
  const fireHaptic = useCallback(
    (cue: 'hit' | 'miss' | 'streak' | 'start' | 'complete') => {
      triggerHapticCue(cue, { enabled: hapticsEnabled, lowStimulus: lowStimulusMode });
    },
    [hapticsEnabled, lowStimulusMode],
  );

  const triggerMissFeedback = useCallback(() => {
    const now = Date.now();
    if (now - lastMissFeedbackAtRef.current < MISS_FEEDBACK_COOLDOWN_MS) {
      return;
    }
    lastMissFeedbackAtRef.current = now;
    setMissFeedbackId(prev => prev + 1);
  }, []);

  const beginSchulteBoard = useCallback(
    (now: number, boardsCompleted: number) => {
      const config = getSchulteConfigForBoard(boardsCompleted, { prime: primeSession });
      const board = generateSchulteBoard(config, now);
      schulteBoardRef.current = board;
      setSchulteBoard(board);
      if (!schulteRoundRef.current) {
        schulteRoundRef.current = createSchulteAccumulator(config, now);
      } else {
        schulteRoundRef.current.lastConfig = config;
      }
    },
    [primeSession],
  );

  const beginGoNoGoRound = useCallback(
    (now: number) => {
      const config = getGoNoGoConfigForLadder(0, { prime: primeSession });
      const round = createGoNoGoRound(config, now);
      goNoGoRoundRef.current = round;
      goNoGoPhaseRemainingMsRef.current = Math.max(0, round.phaseEndsAtMs - now);
      setGoNoGoRound(round);
    },
    [primeSession],
  );

  const applyGoNoGoOutcome = useCallback(
    (outcome: GoNoGoOutcome) => {
      if (outcome === 'ignoredSpam') {
        return;
      }
      if (outcome === 'premature') {
        falseStartsRef.current += 1;
        if (streakRef.current !== 0) {
          streakRunsRef.current.push(streakRef.current);
          streakRef.current = 0;
          setStreak(0);
        }
        playEffect('miss');
        fireHaptic('miss');
        return;
      }

      attemptsRef.current += 1;
      if (outcome === 'correctGo' || outcome === 'correctInhibition') {
        playEffect('hit');
        fireHaptic('hit');
        scoreRef.current += 1;
        setScore(prev => prev + 1);
        const nextStreak = streakRef.current + 1;
        streakRef.current = nextStreak;
        setStreak(nextStreak);
        if (nextStreak > bestStreakRef.current) {
          bestStreakRef.current = nextStreak;
          setBestStreak(nextStreak);
        }
        const latestRt = goNoGoRoundRef.current?.accumulator.goReactionTimesMs.slice(-1)[0];
        if (outcome === 'correctGo' && latestRt !== undefined) {
          reactionTimesRef.current.push(latestRt);
        }
        return;
      }

      playEffect('miss');
      fireHaptic('miss');
      triggerMissFeedback();
      missesRef.current += 1;
      setMisses(prev => prev + 1);
      if (streakRef.current !== 0) {
        streakRunsRef.current.push(streakRef.current);
        streakRef.current = 0;
        setStreak(0);
      }
      if (outcome === 'missedGo') {
        lateDecisionsRef.current += 1;
      }
      if (outcome === 'falsePositive') {
        falseStartsRef.current += 1;
      }
    },
    [fireHaptic, playEffect, triggerMissFeedback],
  );

  const keepTargetsInPlayfield = useCallback((targetsToAdjust: TargetType[]) => {
    return targetsToAdjust.map(target => ({
      ...target,
      y: toPlayfieldY(target.y),
      movement: target.movement
        ? {
            ...target.movement,
            fromY: toPlayfieldY(target.movement.fromY),
            toY: toPlayfieldY(target.movement.toY),
          }
        : undefined,
    }));
  }, []);

  const updateSwipeTargetsForTime = useCallback((targetsToMove: TargetType[], now: number) => {
    return targetsToMove.map(target => {
      if (!target.movement) return target;
      const ageMs = Math.max(0, now - target.createdAt);
      const lifespanMs = Math.max(1, target.lifespan * 1000);
      const progress = clamp(ageMs / lifespanMs, 0, 1);

      return {
        ...target,
        x: target.movement.fromX + (target.movement.toX - target.movement.fromX) * progress,
        y: target.movement.fromY + (target.movement.toY - target.movement.fromY) * progress,
      };
    });
  }, []);

  const updateHoldTargetsForTime = useCallback((targetsToMove: TargetType[], now: number) => {
    return targetsToMove.map(target => {
      if (!target.movement) return target;
      const ageMs = Math.max(0, now - target.createdAt);
      const lifespanMs = Math.max(1, target.lifespan * 1000);
      const loopProgress = (ageMs / lifespanMs) * 2;
      const pingPongProgress = loopProgress <= 1 ? loopProgress : Math.max(0, 2 - loopProgress);
      return {
        ...target,
        x: target.movement.fromX + (target.movement.toX - target.movement.fromX) * pingPongProgress,
        y: target.movement.fromY + (target.movement.toY - target.movement.fromY) * pingPongProgress,
      };
    });
  }, []);

  const setHoldVisual = useCallback((targetId: string, phase: HoldVisualPhase, progress: number) => {
    setHoldVisualByTarget(prev => {
      const existing = prev[targetId];
      if (existing && existing.phase === phase && Math.abs(existing.progress - progress) < 0.015) {
        return prev;
      }
      return {
        ...prev,
        [targetId]: { phase, progress },
      };
    });
  }, []);

  const clearHoldVisual = useCallback((targetId: string) => {
    setHoldVisualByTarget(prev => {
      if (!(targetId in prev)) return prev;
      const next = { ...prev };
      delete next[targetId];
      return next;
    });
  }, []);

  const clearHoldTrackingState = useCallback(() => {
    holdTrackingRef.current = {
      targetId: null,
      pointerId: null,
      pointerX: 0,
      pointerY: 0,
      heldMs: 0,
      decisionReactionMs: 0,
      lastTickAt: 0,
    };
  }, []);

  const updateSequencePhase = useCallback((phase: SequencePhase) => {
    sequencePhaseRef.current = phase;
    setSequencePhase(phase);
  }, []);

  const updateSequenceFeedback = useCallback((feedback: SequenceFeedback) => {
    sequenceFeedbackRef.current = feedback;
    setSequenceFeedback(feedback);
  }, []);

  const updateSequencePreviewStep = useCallback((step: number) => {
    sequencePreviewStepRef.current = step;
    setSequencePreviewStep(step);
  }, []);

  const updateSequenceInputStep = useCallback((step: number) => {
    sequenceInputStepRef.current = step;
    setSequenceInputStep(step);
  }, []);

  const updateSequenceLength = useCallback((length: number) => {
    sequenceLengthRef.current = length;
    setSequenceLength(length);
  }, []);

  const startSequenceRound = useCallback(
    (now: number, nextLength: number) => {
      const streakScaledPreviewMs = scaleMsByStreak(
        getSequencePreviewStepMs(screenSizeRef.current.width),
        streakRef.current,
        MIN_SEQUENCE_PREVIEW_STEP_MS,
      );
      const generated = keepTargetsInPlayfield(
        generateSequenceTargets({
          screenSize: screenSizeRef.current,
          sequenceLength: nextLength,
          currentTime: now,
          targetLifespan: 120,
        }),
      );
      const cueLabels = getSequenceCueLabels(selectedSport, nextLength);
      sequenceCueLabelsRef.current = cueLabels;
      const labeledTargets = generated.map((target, index) => ({
        ...target,
        cueLabel: cueLabels[index] ?? `cue ${index + 1}`,
      }));
      targetsRef.current = labeledTargets;
      setTargets(labeledTargets);
      sequenceOrderRef.current = labeledTargets.map(target => target.id);
      updateSequenceLength(nextLength);
      updateSequencePreviewStep(0);
      updateSequenceInputStep(0);
      updateSequenceFeedback(null);
      updateSequencePhase('preview');
      sequencePhaseEndsAtRef.current = now + streakScaledPreviewMs;
      sequencePhaseRemainingMsRef.current = Math.max(0, sequencePhaseEndsAtRef.current - now);
      playCue('mode', resolveModeCue(sequencePhaseCues?.preview ?? 'sequence-preview'));
    },
    [
      keepTargetsInPlayfield,
      updateSequenceFeedback,
      updateSequenceInputStep,
      updateSequenceLength,
      updateSequencePhase,
      updateSequencePreviewStep,
      playCue,
      selectedSport,
      resolveModeCue,
      sequencePhaseCues?.preview,
    ],
  );

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
    if (!lowStimulusMode) {
      startBackgroundMusic();
    }
    return () => {
      stopBackgroundMusic();
    };
  }, [lowStimulusMode, startBackgroundMusic, stopBackgroundMusic]);

  useEffect(() => {
    if (isPaused || lowStimulusMode) {
      stopBackgroundMusic();
    } else {
      startBackgroundMusic();
    }
  }, [isPaused, lowStimulusMode, startBackgroundMusic, stopBackgroundMusic]);

  useEffect(
    () => () => {
      if (swipeFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(swipeFeedbackTimeoutRef.current);
      }
      if (phaseCueTimeoutRef.current !== null) {
        window.clearTimeout(phaseCueTimeoutRef.current);
      }
      if (streakCueTimeoutRef.current !== null) {
        window.clearTimeout(streakCueTimeoutRef.current);
      }
    },
    [],
  );

  const finishGame = useCallback(
    (trigger: 'timeout' | 'quit') => {
      if (gameOverFiredRef.current) return;
      gameOverFiredRef.current = true;
      if (trigger === 'timeout') {
        playEffect('success');
        fireHaptic('complete');
      }

      const gameMode = gameModes[activeMode];

      let medianReactionTimeMs: number | undefined;
      let benchmarkScore: number | undefined;
      if (activeMode === 'reactionBenchmark') {
        const rts = reactionTimesRef.current;
        if (rts.length > 0) {
          const sorted = [...rts].sort((a, b) => a - b);
          const mid = Math.floor(sorted.length / 2);
          medianReactionTimeMs =
            sorted.length % 2 === 0
              ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
              : sorted[mid];
        }
        const totalAttempts = scoreRef.current + missesRef.current;
        const hitRate = totalAttempts > 0 ? scoreRef.current / totalAttempts : 0;
        // Score = 60% accuracy component + 40% speed component.
        // Speed component peaks at RT <= 200ms and reaches 0 at RT >= 600ms.
        benchmarkScore = Math.round(
          hitRate * 60 +
            (medianReactionTimeMs !== undefined
              ? Math.max(0, ((600 - medianReactionTimeMs) / 600) * 40)
              : 0),
        );
      }

      if (streakRef.current > 0) {
        streakRunsRef.current.push(streakRef.current);
      }

      const readinessMetrics = deriveReadinessMetrics({
        score: scoreRef.current,
        misses: missesRef.current,
        totalAttempts: attemptsRef.current,
        lateDecisions: lateDecisionsRef.current,
        falseStarts: falseStartsRef.current,
        reactionTimesMs: reactionTimesRef.current,
        streakRuns: streakRunsRef.current.length > 0 ? streakRunsRef.current : [bestStreakRef.current],
      });

      let schulteMetrics;
      if (activeMode === 'schulteScan' && schulteRoundRef.current) {
        const currentBoard = schulteBoardRef.current;
        const absorbed =
          currentBoard && currentBoard.correct + currentBoard.errors > 0
            ? absorbSchulteBoard(schulteRoundRef.current, currentBoard, currentBoard.phase === 'complete')
            : schulteRoundRef.current;
        schulteMetrics = deriveSchulteMetrics({
          accumulator: absorbed,
          endedAtMs: Date.now(),
        });
        if (schulteMetrics.averageTransitionMs) {
          medianReactionTimeMs = schulteMetrics.averageTransitionMs;
        }
      }

      let goNoGoMetrics;
      if (activeMode === 'goNoGo' && goNoGoRoundRef.current) {
        goNoGoMetrics = deriveGoNoGoMetrics(goNoGoRoundRef.current.accumulator);
        if (goNoGoMetrics.averageGoReactionMs) {
          medianReactionTimeMs = goNoGoMetrics.averageGoReactionMs;
        }
      }

      onGameOver({
        score: scoreRef.current,
        misses: missesRef.current,
        bestStreak: bestStreakRef.current,
        mode: activeMode,
        modeName: gameMode.name,
        sport: selectedSport,
        totalAttempts: attemptsRef.current,
        lateDecisions: lateDecisionsRef.current,
        streakRuns: streakRunsRef.current,
        reactionTimesMs:
          activeMode === 'reactionBenchmark' ? [...reactionTimesRef.current] : undefined,
        medianReactionTimeMs,
        benchmarkScore,
        readinessMetrics,
        schulteMetrics,
        goNoGoMetrics,
      });
    },
    [activeMode, fireHaptic, onGameOver, playEffect, selectedSport],
  );

  useEffect(() => {
    targetsRef.current = [];
    scoreRef.current = 0;
    missesRef.current = 0;
    streakRef.current = 0;
    bestStreakRef.current = 0;
    isPausedRef.current = false;
    gameOverFiredRef.current = false;
    attemptsRef.current = 0;
    lateDecisionsRef.current = 0;
    falseStartsRef.current = 0;
    streakRunsRef.current = [];
    const resetRoundSecs = ROUND_SECONDS;
    const resetRoundMs = resetRoundSecs * 1000;
    remainingMsRef.current = resetRoundMs;
    roundEndsAtRef.current = Date.now() + resetRoundMs;
    nextSpawnAtRef.current = Date.now();
    holdBreakUntilRef.current = {};
    clearHoldTrackingState();
    reactionTimesRef.current = [];
    sequenceOrderRef.current = [];
    sequenceSuccessesRef.current = 0;
    sequencePhaseEndsAtRef.current = 0;
    sequencePhaseRemainingMsRef.current = 0;
    sequencePhaseRef.current = 'preview';
    sequenceFeedbackRef.current = null;
    sequencePreviewStepRef.current = 0;
    sequenceInputStepRef.current = 0;
    sequenceLengthRef.current = SEQUENCE_MIN_LENGTH;
    sequenceCueLabelsRef.current = [];
    cueEventCounterRef.current = 0;
    prevStreakRef.current = 0;
    prevMissesRef.current = 0;
    prevPhaseCueKeyRef.current = '';
    schulteBoardRef.current = null;
    schulteRoundRef.current = null;
    setSchulteBoard(null);
    goNoGoRoundRef.current = null;
    goNoGoPhaseRemainingMsRef.current = 0;
    setGoNoGoRound(null);
    if (swipeFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(swipeFeedbackTimeoutRef.current);
      swipeFeedbackTimeoutRef.current = null;
    }
    if (phaseCueTimeoutRef.current !== null) {
      window.clearTimeout(phaseCueTimeoutRef.current);
      phaseCueTimeoutRef.current = null;
    }
    if (streakCueTimeoutRef.current !== null) {
      window.clearTimeout(streakCueTimeoutRef.current);
      streakCueTimeoutRef.current = null;
    }

    setTargets([]);
    setTimeLeft(resetRoundSecs);
    setScore(0);
    setMisses(0);
    setIsPaused(false);
    setStreak(0);
    setBestStreak(0);
    setHoldVisualByTarget({});
    setSequencePhase('preview');
    setSequenceFeedback(null);
    setSequencePreviewStep(0);
    setSequenceInputStep(0);
    setSequenceLength(SEQUENCE_MIN_LENGTH);
    setSwipeTimingFeedback(null);
    setPreRoundCueVisible(true);
    setPhaseCueEvent(null);
    setStreakCueEvent(null);
    setRoutineStep(lowStimulusMode && includeBreathingRoutine ? 'breathing' : null);
    setRoutineSecondsLeft(LOW_STIM_ROUTINE_PHASE_SECONDS);
    fireHaptic('start');
    if (isSchulteMode) {
      beginSchulteBoard(Date.now(), 0);
    }
    if (isGoNoGoMode) {
      beginGoNoGoRound(Date.now());
    }
  }, [ROUND_SECONDS, activeMode, beginGoNoGoRound, beginSchulteBoard, clearHoldTrackingState, fireHaptic, includeBreathingRoutine, isGoNoGoMode, isSchulteMode, lowStimulusMode]);

  useEffect(() => {
    if (!isRoutineActive) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRoutineSecondsLeft(prev => {
        if (prev > 1) {
          return prev - 1;
        }
        if (routineStep === 'breathing') {
          setRoutineStep('gaze');
          return LOW_STIM_ROUTINE_PHASE_SECONDS;
        }
        setRoutineStep(null);
        roundEndsAtRef.current = Date.now() + remainingMsRef.current;
        return 0;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isRoutineActive, routineStep]);

  useEffect(() => {
    const gameMode = gameModes[activeMode];
    const interval = window.setInterval(() => {
      if (gameOverFiredRef.current || isPausedRef.current) {
        return;
      }
      if (isRoutineActive) {
        return;
      }

      const now = Date.now();
      const remainingMs = Math.max(0, roundEndsAtRef.current - now);
      remainingMsRef.current = remainingMs;

      const nextTimeLeft = Math.ceil(remainingMs / 1000);
      setTimeLeft(prev => (prev === nextTimeLeft ? prev : nextTimeLeft));

      if (isSchulteMode) {
        const currentBoard = schulteBoardRef.current;
        if (currentBoard) {
          const ticked = tickSchulteBoard(currentBoard, now);
          if (ticked !== currentBoard) {
            schulteBoardRef.current = ticked;
            setSchulteBoard(ticked);
          }
        }
        if (remainingMs <= 0) {
          setTimeLeft(0);
          finishGame('timeout');
        }
        return;
      }

      if (isGoNoGoMode) {
        const currentRound = goNoGoRoundRef.current;
        if (currentRound) {
          const ticked = tickGoNoGo(currentRound, now);
          let nextState = ticked.state;
          if (nextState.phase === 'isi' && currentRound.phase === 'feedback') {
            const nextConfig = getGoNoGoConfigForLadder(nextState.accumulator.trialsResolved, {
              prime: primeSession,
            });
            nextState = {
              ...nextState,
              config: nextConfig,
              accumulator: { ...nextState.accumulator, lastConfig: nextConfig },
            };
          }
          goNoGoRoundRef.current = nextState;
          goNoGoPhaseRemainingMsRef.current = Math.max(0, nextState.phaseEndsAtMs - now);
          if (nextState !== currentRound) {
            setGoNoGoRound(nextState);
          }
          if (ticked.outcome) {
            applyGoNoGoOutcome(ticked.outcome);
          }
        }
        if (remainingMs <= 0) {
          setTimeLeft(0);
          finishGame('timeout');
        }
        return;
      }

      const currentTargets = targetsRef.current;
      let nextTargets = currentTargets;
      const streakScaledIntervalMs = scaleMsByStreak(
        gameMode.config.targetInterval,
        streakRef.current,
        MIN_SPAWN_INTERVAL_MS,
      );
      const streakScaledLifespanSeconds = scaleSecondsByStreak(
        gameMode.config.targetLifespan,
        streakRef.current,
        MIN_TARGET_LIFESPAN_SECONDS,
      );

      if (isSequenceMode) {
        if (sequencePhaseRef.current === 'feedback' && now >= sequencePhaseEndsAtRef.current) {
          const nextLength =
            sequenceFeedbackRef.current === 'success'
              ? getSequenceLengthForSuccesses(sequenceSuccessesRef.current)
              : sequenceLengthRef.current;
          startSequenceRound(now, nextLength);
          nextTargets = targetsRef.current;
        } else if (
          (currentTargets.length === 0 || sequenceOrderRef.current.length === 0) &&
          sequencePhaseRef.current !== 'feedback'
        ) {
          startSequenceRound(now, sequenceLengthRef.current);
          nextTargets = targetsRef.current;
        } else if (sequencePhaseRef.current === 'preview') {
          if (now >= sequencePhaseEndsAtRef.current) {
            const nextStep = sequencePreviewStepRef.current + 1;
            if (nextStep >= sequenceOrderRef.current.length) {
              updateSequencePhase('input');
              updateSequencePreviewStep(sequenceOrderRef.current.length - 1);
              updateSequenceInputStep(0);
              sequencePhaseEndsAtRef.current = 0;
              sequencePhaseRemainingMsRef.current = 0;
              playCue('mode', resolveModeCue(sequencePhaseCues?.input ?? 'sequence-input'));
            } else {
              updateSequencePreviewStep(nextStep);
              sequencePhaseEndsAtRef.current =
                now +
                scaleMsByStreak(
                  getSequencePreviewStepMs(screenSizeRef.current.width),
                  streakRef.current,
                  MIN_SEQUENCE_PREVIEW_STEP_MS,
                );
              sequencePhaseRemainingMsRef.current = Math.max(0, sequencePhaseEndsAtRef.current - now);
            }
          }
        }
      } else {
        const filteredTargets = currentTargets.filter(
          target => now - target.createdAt < target.lifespan * 1000,
        );
        const expiredCount = currentTargets.length - filteredTargets.length;
        const aliveTargets = expiredCount > 0 ? filteredTargets : currentTargets;

        if (expiredCount > 0) {
          playEffect('miss');
          fireHaptic('miss');
          triggerMissFeedback();
          attemptsRef.current += expiredCount;
          lateDecisionsRef.current += expiredCount;
          missesRef.current += expiredCount;
          setMisses(prev => prev + expiredCount);
          if (streakRef.current !== 0) {
            streakRunsRef.current.push(streakRef.current);
            streakRef.current = 0;
            setStreak(0);
          }
        }

        nextTargets = aliveTargets;
        if (now >= nextSpawnAtRef.current && remainingMs > 0) {
          const generatedTargets = gameMode.generateTargets({
            screenSize: screenSizeRef.current,
            existingTargets: aliveTargets,
            currentTime: now,
            maxTargets: gameMode.config.maxTargets,
            targetLifespan: streakScaledLifespanSeconds,
          });
          const hasNewTarget = generatedTargets.some(
            generatedTarget =>
              !aliveTargets.some(existingTarget => existingTarget.id === generatedTarget.id),
          );
          nextTargets = hasNewTarget
            ? keepTargetsInPlayfield(generatedTargets)
            : generatedTargets;
          if (hasNewTarget && isSwipeMode && modeAudioHooks.onSwipeSpawnByDirection) {
            const newestTarget = nextTargets[nextTargets.length - 1];
            if (newestTarget?.swipeDirection) {
              playCue('mode', resolveModeCue(`swipe-${newestTarget.swipeDirection}` as SportModeCueKey));
            }
          }
          nextSpawnAtRef.current = now + streakScaledIntervalMs;
        }
      }

      if (isSwipeMode && nextTargets.length > 0) {
        nextTargets = updateSwipeTargetsForTime(nextTargets, now);
      }
      if (isHoldMode && nextTargets.length > 0) {
        nextTargets = updateHoldTargetsForTime(nextTargets, now);
      }

      if (isHoldMode) {
        const holdState = holdTrackingRef.current;
        if (holdState.targetId && holdState.pointerId !== null) {
          const trackedTarget = nextTargets.find(target => target.id === holdState.targetId);
          const playfieldRect = playfieldRef.current?.getBoundingClientRect();
          if (!trackedTarget || !playfieldRect || !trackedTarget.hold) {
            clearHoldVisual(holdState.targetId);
            clearHoldTrackingState();
          } else {
            const targetCenter = {
              x: playfieldRect.left + (trackedTarget.x / 100) * playfieldRect.width,
              y: playfieldRect.top + (trackedTarget.y / 100) * playfieldRect.height,
            };
            const pointer = { x: holdState.pointerX, y: holdState.pointerY };
            const locked = isWithinHoldRadius(pointer, targetCenter, trackedTarget.hold.breakRadiusPx);

            if (!locked) {
              const failedTargetId = holdState.targetId;
              holdBreakUntilRef.current[failedTargetId] = now + HOLD_BREAK_FEEDBACK_MS;
              setHoldVisual(failedTargetId, 'broken', calculateHoldProgress(holdState.heldMs, trackedTarget.hold.requiredMs));
              playEffect('miss');
              fireHaptic('miss');
              triggerMissFeedback();
              attemptsRef.current += 1;
              falseStartsRef.current += 1;
              missesRef.current += 1;
              setMisses(prev => prev + 1);
              if (streakRef.current !== 0) {
                streakRunsRef.current.push(streakRef.current);
                streakRef.current = 0;
                setStreak(0);
              }
              window.setTimeout(() => {
                setTargets(prev => {
                  const next = prev.filter(target => target.id !== failedTargetId);
                  targetsRef.current = next;
                  return next;
                });
                clearHoldVisual(failedTargetId);
                delete holdBreakUntilRef.current[failedTargetId];
              }, HOLD_BREAK_FEEDBACK_MS);
              clearHoldTrackingState();
            } else {
              const elapsedMs = Math.max(0, now - holdState.lastTickAt);
              holdState.heldMs += elapsedMs;
              holdState.lastTickAt = now;
              const holdProgress = calculateHoldProgress(holdState.heldMs, trackedTarget.hold.requiredMs);
              const phase = getHoldVisualPhase({
                isTracking: true,
                progress: holdProgress,
                isBroken: false,
              });
              setHoldVisual(trackedTarget.id, phase, holdProgress);

              if (holdProgress >= 1) {
                if (holdState.decisionReactionMs > 0) {
                  reactionTimesRef.current.push(holdState.decisionReactionMs);
                }
                attemptsRef.current += 1;
                scoreRef.current += 1;
                setScore(prev => prev + 1);
                streakRef.current += 1;
                setStreak(streakRef.current);
                if (streakRef.current > 0 && streakRef.current % 4 === 0) {
                  fireHaptic('streak');
                }
                if (streakRef.current > bestStreakRef.current) {
                  bestStreakRef.current = streakRef.current;
                  setBestStreak(bestStreakRef.current);
                }
                playEffect('hit');
                fireHaptic('hit');
                const completedTargetId = trackedTarget.id;
                setTargets(prev => {
                  const next = prev.filter(target => target.id !== completedTargetId);
                  targetsRef.current = next;
                  return next;
                });
                clearHoldVisual(completedTargetId);
                clearHoldTrackingState();
              }
            }
          }
        }

        for (const target of nextTargets) {
          if (!target.hold) continue;
          if (holdTrackingRef.current.targetId === target.id || holdBreakUntilRef.current[target.id] > now) {
            continue;
          }
          setHoldVisual(target.id, 'idle', 0);
        }
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
  }, [
    activeMode,
    clearHoldTrackingState,
    clearHoldVisual,
    finishGame,
    applyGoNoGoOutcome,
    primeSession,
    isHoldMode,
    isGoNoGoMode,
    isSchulteMode,
    isSequenceMode,
    isSwipeMode,
    modeAudioHooks.onSwipeSpawnByDirection,
    fireHaptic,
    keepTargetsInPlayfield,
    playEffect,
    playCue,
    resolveModeCue,
    sequencePhaseCues?.input,
    startSequenceRound,
    setHoldVisual,
    updateSequenceInputStep,
    updateSequencePhase,
    updateSequencePreviewStep,
    updateHoldTargetsForTime,
    updateSwipeTargetsForTime,
    isRoutineActive,
    triggerMissFeedback,
  ]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    missesRef.current = misses;
  }, [misses]);

  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  useEffect(() => {
    sequencePhaseRef.current = sequencePhase;
  }, [sequencePhase]);

  useEffect(() => {
    sequenceFeedbackRef.current = sequenceFeedback;
  }, [sequenceFeedback]);

  useEffect(() => {
    sequencePreviewStepRef.current = sequencePreviewStep;
  }, [sequencePreviewStep]);

  useEffect(() => {
    sequenceInputStepRef.current = sequenceInputStep;
  }, [sequenceInputStep]);

  useEffect(() => {
    sequenceLengthRef.current = sequenceLength;
  }, [sequenceLength]);

  const pushPhaseCue = useCallback(
    (text: string, type: GameplayCueType) => {
      if (!isCueTimingVisible(cueIntensity, 'phaseTriggered')) return;
      cueEventCounterRef.current += 1;
      setPhaseCueEvent({ id: cueEventCounterRef.current, text, type });
      if (phaseCueTimeoutRef.current !== null) {
        window.clearTimeout(phaseCueTimeoutRef.current);
      }
      phaseCueTimeoutRef.current = window.setTimeout(() => {
        setPhaseCueEvent(current => (current && current.id === cueEventCounterRef.current ? null : current));
        phaseCueTimeoutRef.current = null;
      }, cueIntensity === 'guided' ? 2300 : 1800);
    },
    [cueIntensity],
  );

  const pushStreakCue = useCallback(
    (text: string, type: GameplayCueType) => {
      if (!isCueTimingVisible(cueIntensity, 'streakTriggered')) return;
      cueEventCounterRef.current += 1;
      setStreakCueEvent({ id: cueEventCounterRef.current, text, type });
      if (streakCueTimeoutRef.current !== null) {
        window.clearTimeout(streakCueTimeoutRef.current);
      }
      streakCueTimeoutRef.current = window.setTimeout(() => {
        setStreakCueEvent(current => (current && current.id === cueEventCounterRef.current ? null : current));
        streakCueTimeoutRef.current = null;
      }, 2100);
    },
    [cueIntensity],
  );

  useEffect(() => {
    if (!isCueTimingVisible(cueIntensity, 'preRound')) {
      setPreRoundCueVisible(false);
      return;
    }
    setPreRoundCueVisible(true);
    const timeoutId = window.setTimeout(() => {
      setPreRoundCueVisible(false);
    }, cueIntensity === 'guided' ? 2600 : 1800);
    return () => window.clearTimeout(timeoutId);
  }, [activeMode, cueIntensity]);

  const handleTargetClick = useCallback(
    (targetId: string) => {
      if (isPausedRef.current || gameOverFiredRef.current) return;
      const hitTarget = targetsRef.current.find(target => target.id === targetId);
      if (!hitTarget) return;

      if (isSwipeMode) {
        const elapsedMs = Date.now() - hitTarget.createdAt;
        const swipeTiming = getSwipeTimingWindow(
          Math.max(1, hitTarget.lifespan * 1000),
          screenSizeRef.current.width,
        );
        const timingVerdict = getSwipeTimingVerdict(elapsedMs, swipeTiming);
        if (timingVerdict !== 'on-time') {
          setSwipeTimingFeedback(timingVerdict);
          if (swipeFeedbackTimeoutRef.current !== null) {
            window.clearTimeout(swipeFeedbackTimeoutRef.current);
          }
          swipeFeedbackTimeoutRef.current = window.setTimeout(() => {
            setSwipeTimingFeedback(null);
            swipeFeedbackTimeoutRef.current = null;
          }, 240);
          playEffect('miss');
          fireHaptic('miss');
          triggerMissFeedback();
          attemptsRef.current += 1;
          falseStartsRef.current += 1;
          if (timingVerdict === 'late') {
            lateDecisionsRef.current += 1;
          }
          missesRef.current += 1;
          setMisses(prev => prev + 1);
          if (streakRef.current !== 0) {
            streakRunsRef.current.push(streakRef.current);
            streakRef.current = 0;
            setStreak(0);
          }
          setTargets(prev => {
            const next = prev.filter(target => target.id !== targetId);
            targetsRef.current = next;
            return next;
          });
          return;
        }
      }

      if (isSequenceMode) {
        if (sequencePhaseRef.current !== 'input') return;

        const expectedTargetId = sequenceOrderRef.current[sequenceInputStepRef.current];
        if (targetId !== expectedTargetId) {
          playEffect('miss');
          fireHaptic('miss');
          triggerMissFeedback();
          attemptsRef.current += 1;
          falseStartsRef.current += 1;
          missesRef.current += 1;
          setMisses(prev => prev + 1);
          if (streakRef.current !== 0) {
            streakRunsRef.current.push(streakRef.current);
            streakRef.current = 0;
            setStreak(0);
          }
          updateSequenceFeedback('failure');
          updateSequencePhase('feedback');
          playCue('mode', resolveModeCue(sequencePhaseCues?.failure ?? 'sequence-fail'));
          const failureFeedbackMs = scaleMsByStreak(
            SEQUENCE_FAILURE_FEEDBACK_MS,
            streakRef.current,
            MIN_SEQUENCE_FEEDBACK_MS,
          );
          sequencePhaseEndsAtRef.current = Date.now() + failureFeedbackMs;
          sequencePhaseRemainingMsRef.current = failureFeedbackMs;
          return;
        }

        reactionTimesRef.current.push(Date.now() - hitTarget.createdAt);
        attemptsRef.current += 1;
        scoreRef.current += 1;
        setScore(prev => prev + 1);
        streakRef.current += 1;
        setStreak(streakRef.current);
        if (streakRef.current > 0 && streakRef.current % 4 === 0) {
          fireHaptic('streak');
        }
        if (streakRef.current > bestStreakRef.current) {
          bestStreakRef.current = streakRef.current;
          setBestStreak(bestStreakRef.current);
        }
        playEffect('hit');
        fireHaptic('hit');

        const nextInputStep = sequenceInputStepRef.current + 1;
        updateSequenceInputStep(nextInputStep);
        setTargets(prev => {
          const next = prev.filter(target => target.id !== targetId);
          targetsRef.current = next;
          return next;
        });

        if (nextInputStep >= sequenceOrderRef.current.length) {
          sequenceSuccessesRef.current += 1;
          updateSequenceFeedback('success');
          updateSequencePhase('feedback');
          playCue('mode', resolveModeCue(sequencePhaseCues?.success ?? 'sequence-success'));
          const successFeedbackMs = scaleMsByStreak(
            SEQUENCE_SUCCESS_FEEDBACK_MS,
            streakRef.current,
            MIN_SEQUENCE_FEEDBACK_MS,
          );
          sequencePhaseEndsAtRef.current = Date.now() + successFeedbackMs;
          sequencePhaseRemainingMsRef.current = successFeedbackMs;
        }
        return;
      }

      reactionTimesRef.current.push(Date.now() - hitTarget.createdAt);
      attemptsRef.current += 1;
      scoreRef.current += 1;
      setScore(prev => prev + 1);
      streakRef.current += 1;
      setStreak(streakRef.current);
      if (streakRef.current > 0 && streakRef.current % 4 === 0) {
        fireHaptic('streak');
      }
      if (streakRef.current > bestStreakRef.current) {
        bestStreakRef.current = streakRef.current;
        setBestStreak(bestStreakRef.current);
      }
      playEffect('hit');
      fireHaptic('hit');

      setTargets(prev => {
        const next = prev.filter(target => target.id !== targetId);
        targetsRef.current = next;
        return next;
      });
    },
    [
      isSequenceMode,
      isSwipeMode,
      fireHaptic,
      playCue,
      playEffect,
      resolveModeCue,
      sequencePhaseCues?.failure,
      sequencePhaseCues?.success,
      triggerMissFeedback,
      updateSequenceFeedback,
      updateSequenceInputStep,
      updateSequencePhase,
    ],
  );

  const handleSwipeAttemptFail = useCallback(
    (targetId: string) => {
      if (isPausedRef.current || gameOverFiredRef.current || activeMode !== 'swipeStrike') return;
      if (!targetsRef.current.some(target => target.id === targetId)) return;

      setSwipeTimingFeedback(null);
      if (swipeFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(swipeFeedbackTimeoutRef.current);
      }
      swipeFeedbackTimeoutRef.current = window.setTimeout(() => {
        setSwipeTimingFeedback(null);
        swipeFeedbackTimeoutRef.current = null;
      }, 220);

      playEffect('miss');
      fireHaptic('miss');
      triggerMissFeedback();
      attemptsRef.current += 1;
      falseStartsRef.current += 1;
      missesRef.current += 1;
      setMisses(prev => prev + 1);
      if (streakRef.current !== 0) {
        streakRunsRef.current.push(streakRef.current);
        streakRef.current = 0;
        setStreak(0);
      }

      setTargets(prev => {
        const next = prev.filter(target => target.id !== targetId);
        targetsRef.current = next;
        return next;
      });
    },
    [activeMode, fireHaptic, playEffect, triggerMissFeedback],
  );

  const handleSchulteSelect = useCallback(
    (cellId: string) => {
      if (isPausedRef.current || gameOverFiredRef.current) return;
      const current = schulteBoardRef.current;
      if (!current) return;
      const now = Date.now();
      const { board, outcome } = selectSchulteCell(current, cellId, now);
      schulteBoardRef.current = board;
      setSchulteBoard(board);

      if (outcome === 'locked' || outcome === 'ignored') {
        return;
      }

      attemptsRef.current += 1;
      if (outcome === 'error') {
        playEffect('miss');
        fireHaptic('miss');
        triggerMissFeedback();
        missesRef.current += 1;
        setMisses(prev => prev + 1);
        if (streakRef.current !== 0) {
          streakRunsRef.current.push(streakRef.current);
          streakRef.current = 0;
          setStreak(0);
        }
        return;
      }

      playEffect('hit');
      fireHaptic('hit');
      scoreRef.current += 1;
      setScore(prev => prev + 1);
      const nextStreak = streakRef.current + 1;
      streakRef.current = nextStreak;
      setStreak(nextStreak);
      if (nextStreak > bestStreakRef.current) {
        bestStreakRef.current = nextStreak;
        setBestStreak(nextStreak);
      }
      if (board.lastCorrectAtMs !== null) {
        reactionTimesRef.current.push(board.transitionsMs[board.transitionsMs.length - 1] ?? 0);
      }

      if (outcome === 'complete' && schulteRoundRef.current) {
        schulteRoundRef.current = absorbSchulteBoard(schulteRoundRef.current, board, true);
        fireHaptic('streak');
        beginSchulteBoard(now, schulteRoundRef.current.boardsCompleted);
      }
    },
    [beginSchulteBoard, fireHaptic, playEffect, triggerMissFeedback],
  );

  const handleGoNoGoRespond = useCallback(() => {
    if (isPausedRef.current || gameOverFiredRef.current) return;
    const current = goNoGoRoundRef.current;
    if (!current) return;
    const now = Date.now();
    const { state, outcome } = respondGoNoGo(current, now);
    goNoGoRoundRef.current = state;
    goNoGoPhaseRemainingMsRef.current = Math.max(0, state.phaseEndsAtMs - now);
    setGoNoGoRound(state);
    applyGoNoGoOutcome(outcome);
  }, [applyGoNoGoOutcome]);

  const togglePause = useCallback(() => {
    if (gameOverFiredRef.current) return;

    setIsPaused(prev => {
      const nextPaused = !prev;
      isPausedRef.current = nextPaused;

      if (nextPaused) {
        const trackedTargetId = holdTrackingRef.current.targetId;
        if (trackedTargetId) {
          clearHoldVisual(trackedTargetId);
        }
        clearHoldTrackingState();
        remainingMsRef.current = Math.max(0, roundEndsAtRef.current - Date.now());
        if (isSequenceMode && sequencePhaseEndsAtRef.current > 0) {
          sequencePhaseRemainingMsRef.current = Math.max(0, sequencePhaseEndsAtRef.current - Date.now());
        }
        if (isGoNoGoMode && goNoGoRoundRef.current) {
          goNoGoPhaseRemainingMsRef.current = Math.max(
            0,
            goNoGoRoundRef.current.phaseEndsAtMs - Date.now(),
          );
        }
        setTimeLeft(Math.ceil(remainingMsRef.current / 1000));
      } else {
        roundEndsAtRef.current = Date.now() + remainingMsRef.current;
        if (isSequenceMode && sequencePhaseRef.current !== 'input') {
          sequencePhaseEndsAtRef.current = Date.now() + sequencePhaseRemainingMsRef.current;
        }
        if (isGoNoGoMode && goNoGoRoundRef.current) {
          const shifted = shiftGoNoGoPhase(
            goNoGoRoundRef.current,
            goNoGoPhaseRemainingMsRef.current,
            Date.now(),
          );
          goNoGoRoundRef.current = shifted;
          setGoNoGoRound(shifted);
        }
      }

      return nextPaused;
    });
  }, [clearHoldTrackingState, clearHoldVisual, isGoNoGoMode, isSequenceMode]);

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

  const handleHoldPointerStart = useCallback(
    ({ targetId, pointerId, x, y }: { targetId: string; pointerId: number; x: number; y: number }) => {
      if (isPausedRef.current || gameOverFiredRef.current || activeMode !== 'holdTrack') return;
      if (!targetsRef.current.some(target => target.id === targetId)) return;
      holdTrackingRef.current = {
        targetId,
        pointerId,
        pointerX: x,
        pointerY: y,
        heldMs: 0,
        decisionReactionMs: Math.max(0, Date.now() - (targetsRef.current.find(target => target.id === targetId)?.createdAt ?? Date.now())),
        lastTickAt: Date.now(),
      };
      setHoldVisual(targetId, 'arming', 0);
      playCue('mode', resolveModeCue(holdStartCue));
    },
    [activeMode, holdStartCue, playCue, resolveModeCue, setHoldVisual],
  );

  const handleHoldPointerMove = useCallback(({ pointerId, x, y }: { pointerId: number; x: number; y: number }) => {
    const tracking = holdTrackingRef.current;
    if (tracking.pointerId === null || tracking.pointerId !== pointerId) return;
    tracking.pointerX = x;
    tracking.pointerY = y;
  }, []);

  const handleHoldPointerEnd = useCallback(
    ({ pointerId }: { pointerId: number }) => {
      if (isPausedRef.current || gameOverFiredRef.current || activeMode !== 'holdTrack') return;
      const tracking = holdTrackingRef.current;
      if (tracking.pointerId === null) return;
      if (pointerId !== tracking.pointerId) return;

      const target = targetsRef.current.find(t => t.id === tracking.targetId);
      const targetId = tracking.targetId;
      if (!target || !targetId || !target.hold) {
        clearHoldTrackingState();
        return;
      }

      holdBreakUntilRef.current[targetId] = Date.now() + HOLD_BREAK_FEEDBACK_MS;
      setHoldVisual(targetId, 'broken', calculateHoldProgress(tracking.heldMs, target.hold.requiredMs));
      playEffect('miss');
      fireHaptic('miss');
      triggerMissFeedback();
      attemptsRef.current += 1;
      falseStartsRef.current += 1;
      missesRef.current += 1;
      setMisses(prev => prev + 1);
      if (streakRef.current !== 0) {
        streakRunsRef.current.push(streakRef.current);
        streakRef.current = 0;
        setStreak(0);
      }
      window.setTimeout(() => {
        setTargets(prev => {
          const next = prev.filter(item => item.id !== targetId);
          targetsRef.current = next;
          return next;
        });
        clearHoldVisual(targetId);
        delete holdBreakUntilRef.current[targetId];
      }, HOLD_BREAK_FEEDBACK_MS);
      clearHoldTrackingState();
    },
    [activeMode, clearHoldTrackingState, clearHoldVisual, fireHaptic, playEffect, setHoldVisual, triggerMissFeedback],
  );

  useEffect(() => {
    const onWindowPointerMove = (event: PointerEvent) => {
      handleHoldPointerMove({
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
      });
    };
    const onWindowPointerEnd = (event: PointerEvent) => {
      handleHoldPointerEnd({ pointerId: event.pointerId });
    };
    window.addEventListener('pointermove', onWindowPointerMove);
    window.addEventListener('pointerup', onWindowPointerEnd);
    window.addEventListener('pointercancel', onWindowPointerEnd);
    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerEnd);
      window.removeEventListener('pointercancel', onWindowPointerEnd);
    };
  }, [handleHoldPointerEnd, handleHoldPointerMove]);

  const gameMode = gameModes[activeMode];
  const isBenchmarkMode = gameMode.category === 'benchmark';
  const sequenceExpectedTargetId = sequenceOrderRef.current[sequenceInputStep];
  const activeSwipeTarget = isSwipeMode ? targets[0] : undefined;
  const swipeCueLabel =
    activeSwipeTarget?.swipeDirection && isSwipeMode
      ? getSwipeCueLabel(selectedSport, activeSwipeTarget.swipeDirection)
      : null;
  const holdCueLabel = isHoldMode ? getHoldTrackCueLabel(selectedSport) : null;
  const cueSet = getGameplayCueSet(selectedSport, activeMode);
  const holdIsActive = Object.values(holdVisualByTarget).some(
    holdState => holdState.phase === 'arming' || holdState.phase === 'locked',
  );

  const phaseCueKey =
    isSequenceMode
      ? `${sequencePhase}:${sequenceFeedback ?? 'none'}`
      : isSwipeMode
        ? `swipe:${activeSwipeTarget?.swipeDirection ?? 'none'}`
        : isHoldMode
          ? `hold:${holdIsActive ? 'active' : targets.length > 0 ? 'ready' : 'none'}`
          : `${activeMode}:${targets.length > 0 ? 'engaged' : 'idle'}`;

  useEffect(() => {
    if (!isCueTimingVisible(cueIntensity, 'phaseTriggered')) {
      setPhaseCueEvent(null);
      prevPhaseCueKeyRef.current = phaseCueKey;
      return;
    }
    if (prevPhaseCueKeyRef.current === phaseCueKey) {
      return;
    }
    prevPhaseCueKeyRef.current = phaseCueKey;

    if (isSequenceMode) {
      if (sequencePhase === 'preview') {
        pushPhaseCue(cueSet.focus, 'focus');
        return;
      }
      if (sequencePhase === 'input') {
        pushPhaseCue(cueSet.tactical, 'tactical');
        return;
      }
      if (sequenceFeedback === 'failure') {
        pushPhaseCue(cueSet.reset, 'reset');
        return;
      }
      if (sequenceFeedback === 'success') {
        pushPhaseCue(cueSet.tactical, 'tactical');
      }
      return;
    }

    if (isSwipeMode && swipeCueLabel) {
      pushPhaseCue(`Directional cue: ${swipeCueLabel}`, 'tactical');
      return;
    }

    if (isHoldMode && holdCueLabel) {
      pushPhaseCue(holdIsActive ? `Maintain lock: ${holdCueLabel}` : cueSet.focus, holdIsActive ? 'tactical' : 'focus');
      return;
    }

    if (targets.length > 0) {
      pushPhaseCue(cueSet.focus, 'focus');
    }
  }, [
    activeMode,
    cueIntensity,
    cueSet.focus,
    cueSet.reset,
    cueSet.tactical,
    holdCueLabel,
    holdIsActive,
    isHoldMode,
    isSequenceMode,
    isSwipeMode,
    phaseCueKey,
    pushPhaseCue,
    sequenceFeedback,
    sequencePhase,
    swipeCueLabel,
    targets.length,
  ]);

  useEffect(() => {
    const previousStreak = prevStreakRef.current;
    const previousMisses = prevMissesRef.current;
    prevStreakRef.current = streak;
    prevMissesRef.current = misses;

    if (!isCueTimingVisible(cueIntensity, 'streakTriggered')) {
      setStreakCueEvent(null);
      return;
    }

    if (streak > previousStreak && streak > 0 && streak % 4 === 0) {
      pushStreakCue(`Streak ${streak}. ${cueSet.tactical}`, 'tactical');
      return;
    }

    if (misses > previousMisses) {
      pushStreakCue(cueSet.reset, 'reset');
    }
  }, [cueIntensity, cueSet.reset, cueSet.tactical, misses, pushStreakCue, streak]);

  return (
    <div
      className={`game-container relative w-full overflow-hidden ${lowStimulusMode ? 'game-low-stimulus' : ''}`}
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
        reducedMotion={lowStimulusMode}
        labels={{
          score: sportPack.hudLabels.score,
          streak: sportPack.hudLabels.streak,
        }}
      />

      <div
        ref={playfieldRef}
        className="absolute left-0 right-0 bottom-0"
        style={{ top: PLAYFIELD_TOP_OFFSET }}
        aria-label="Gameplay area"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              lowStimulusMode
                ? 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.45) 100%)'
                : 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.22) 100%)',
          }}
        />
        {lowStimulusMode && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: 'rgba(3, 6, 12, 0.28)', zIndex: 10 }}
          />
        )}
        {missFeedbackId > 0 && <div key={missFeedbackId} className="miss-feedback-overlay" />}
        <div className="absolute left-3 top-3 z-[13] pointer-events-none">
          <div
            className="rounded-lg px-2.5 py-1.5 text-[10px] uppercase tracking-[0.14em]"
            style={{
              backgroundColor: 'rgba(4, 12, 12, 0.78)',
              border: `1px solid ${isBenchmarkMode ? '#38bdf8' : theme.targetColor}88`,
              color: theme.textColor,
            }}
          >
            {isBenchmarkMode
              ? sportPack.hudLabels.benchmarkProtocol
              : sportPack.hudLabels.drillProtocol}
          </div>
        </div>
        <GameplayCueOverlay
          cueIntensity={cueIntensity}
          cueSet={cueSet}
          preRoundCueText={preRoundCueVisible ? cueSet.focus : null}
          phaseCue={phaseCueEvent ? { text: phaseCueEvent.text, type: phaseCueEvent.type } : null}
          streakCue={streakCueEvent ? { text: streakCueEvent.text, type: streakCueEvent.type } : null}
          lowStimulusMode={lowStimulusMode}
        />
        {isSwipeMode && swipeTimingFeedback && (
          <div className="absolute inset-x-0 top-[max(58px,calc(env(safe-area-inset-top,0px)+48px))] z-[15] pointer-events-none px-3 sm:px-4">
            <div
              className="mx-auto max-w-sm rounded-xl px-3 py-1.5 text-center"
              style={{
                backgroundColor: 'rgba(12, 5, 5, 0.78)',
                border: '1px solid rgba(248, 113, 113, 0.65)',
                color: '#fca5a5',
              }}
            >
              <p className="text-xs">
                {swipeTimingFeedback === 'early' ? 'Too early. Let the cue settle.' : 'Too late. Commit sooner.'}
              </p>
            </div>
          </div>
        )}
        {isSequenceMode && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none rounded-xl px-3 py-2 text-center"
              style={{
                top: 'max(12px, env(safe-area-inset-top, 0px))',
                backgroundColor: 'rgba(4, 12, 12, 0.78)',
                border:
                  sequenceFeedback === 'failure'
                    ? '1px solid rgba(248, 113, 113, 0.75)'
                    : sequenceFeedback === 'success'
                      ? '1px solid rgba(74, 222, 128, 0.75)'
                      : `1px solid ${theme.targetColor}88`,
                color:
                  sequenceFeedback === 'failure'
                    ? '#fecaca'
                    : sequenceFeedback === 'success'
                      ? '#bbf7d0'
                      : theme.textColor,
                minWidth: 'min(84vw, 300px)',
                zIndex: 14,
              }}
              aria-live="polite"
            >
              <p className="text-xs uppercase tracking-[0.16em] opacity-75">
                {sequencePhase === 'preview'
                  ? `Watch sequence ${Math.min(sequencePreviewStep + 1, sequenceLength)}/${sequenceLength}`
                  : sequencePhase === 'input'
                    ? `Repeat step ${Math.min(sequenceInputStep + 1, sequenceLength)}/${sequenceLength}`
                    : sequenceFeedback === 'success'
                      ? 'Sequence complete'
                      : 'Wrong order'}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {sequencePhase === 'preview'
                  ? 'Memorize the cue language order.'
                  : sequencePhase === 'input'
                    ? 'Tap the same cues in order.'
                    : sequenceFeedback === 'success'
                      ? 'Clean execution. Next sequence loading...'
                      : 'Order break. Reset and try again.'}
              </p>
              {sequenceCueLabelsRef.current.length > 0 && (
                <p className="mt-1 text-[11px] opacity-75">
                  Pattern: {sequenceCueLabelsRef.current.join(' -> ')}
                </p>
              )}
            </div>
          </div>
        )}
        {isGoNoGoMode && goNoGoRound ? (
          <CaimanControlBoard
            round={goNoGoRound}
            disabled={isPaused}
            reducedMotion={lowStimulusMode}
            lowStimulus={lowStimulusMode}
            accentColor={theme.targetColor}
            textColor={theme.textColor}
            onRespond={handleGoNoGoRespond}
          />
        ) : isSchulteMode && schulteBoard ? (
          <SchulteGridBoard
            board={schulteBoard}
            disabled={isPaused}
            reducedMotion={lowStimulusMode}
            lowStimulus={lowStimulusMode}
            accentColor={theme.targetColor}
            textColor={theme.textColor}
            onSelectCell={handleSchulteSelect}
          />
        ) : isSequenceMode
          ? targets.map(target => {
              const orderIndex = sequenceOrderRef.current.findIndex(id => id === target.id);
              const isPreviewFocus =
                sequencePhase === 'preview' &&
                sequenceOrderRef.current[sequencePreviewStep] === target.id;
              const isInputFocus = sequencePhase === 'input' && sequenceExpectedTargetId === target.id;
              const showSequenceNumber = sequencePhase === 'preview';

              return (
                <button
                  key={`${target.id}-${target.createdAt}`}
                  type="button"
                  aria-label="Sequence target"
                  data-sequence-step={orderIndex}
                  onClick={() => handleTargetClick(target.id)}
                  disabled={sequencePhase !== 'input'}
                  className="absolute flex items-center justify-center rounded-full font-extrabold pointer-events-auto"
                  style={{
                    left: `${target.x}%`,
                    top: `${target.y}%`,
                    width: 'clamp(58px, 8.8vw, 84px)',
                    height: 'clamp(58px, 8.8vw, 84px)',
                    transform: 'translate(-50%, -50%)',
                    border: isPreviewFocus
                      ? `3px solid ${theme.targetColor}`
                      : isInputFocus
                        ? '3px solid #fde047'
                        : `2px solid ${theme.targetColor}99`,
                    backgroundColor: isPreviewFocus
                      ? `${theme.targetColor}2f`
                      : sequenceFeedback === 'failure'
                        ? 'rgba(239, 68, 68, 0.25)'
                        : sequenceFeedback === 'success'
                          ? 'rgba(34, 197, 94, 0.24)'
                          : 'rgba(3, 10, 12, 0.74)',
                    boxShadow: isPreviewFocus
                      ? `0 0 26px ${theme.targetColor}80`
                      : isInputFocus
                        ? '0 0 24px rgba(253, 224, 71, 0.62)'
                        : '0 0 15px rgba(0,0,0,0.45)',
                    color: theme.textColor,
                    zIndex: isPreviewFocus ? 15 : 12,
                    transition:
                      'transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease, background-color 120ms ease',
                    opacity: sequencePhase === 'preview' && !isPreviewFocus ? 0.55 : 1,
                    cursor: sequencePhase === 'input' ? 'pointer' : 'default',
                  }}
                >
                  {showSequenceNumber ? (
                    <span
                      className="text-[10px] sm:text-xs uppercase font-bold tracking-[0.1em] px-2 text-center"
                      style={{ textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
                    >
                      {target.cueLabel ?? `cue ${orderIndex + 1}`}
                    </span>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: isInputFocus ? '#fde047' : `${theme.textColor}66`,
                        boxShadow: isInputFocus ? '0 0 12px rgba(253, 224, 71, 0.7)' : 'none',
                      }}
                    />
                  )}
                </button>
              );
            })
          : targets.map(target => (
              <Target
                key={`${target.id}-${target.createdAt}`}
                target={target}
                interactionMode={
                  isSwipeMode ? 'swipe' : isHoldMode ? 'hold' : 'tap'
                }
                targetIconPath={stimulusIconByVariant[target.stimulusVariant ?? 'standard']}
                targetIconFallbackPath={sportAssets.targetIconFallback}
                onActivate={() => handleTargetClick(target.id)}
                onSwipeAttemptFail={() => handleSwipeAttemptFail(target.id)}
                holdVisualState={holdVisualByTarget[target.id]}
                onHoldPointerStart={handleHoldPointerStart}
                onHoldPointerMove={handleHoldPointerMove}
                onHoldPointerEnd={handleHoldPointerEnd}
              />
            ))}
      </div>

      {/* Pause overlay */}
      {isRoutineActive && (
        <div
          className="absolute inset-0 z-[120] flex items-center justify-center px-5"
          style={{ backgroundColor: 'rgba(2, 6, 10, 0.86)', backdropFilter: 'blur(4px)' }}
          aria-live="polite"
        >
          <div
            className="w-full max-w-md rounded-2xl border p-6"
            style={{
              borderColor: `${theme.textColor}40`,
              backgroundColor: 'rgba(3, 10, 14, 0.84)',
              color: theme.textColor,
            }}
          >
            <p className="text-[11px] uppercase tracking-[0.15em] opacity-70">Low-stimulation routine</p>
            <h2 className="mt-2 text-2xl font-bold">
              {routineStep === 'breathing' ? 'Breathing reset' : 'Gaze stabilization'}
            </h2>
            <p className="mt-2 text-sm opacity-78">
              {routineStep === 'breathing'
                ? 'Breathe slowly: 4 seconds in, 4 seconds out.'
                : 'Keep your eyes steady on one point, then softly widen focus.'}
            </p>
            <p className="mt-4 text-3xl font-extrabold tabular-nums">{routineSecondsLeft}s</p>
            <button
              type="button"
              onClick={() => {
                setRoutineStep(null);
                roundEndsAtRef.current = Date.now() + remainingMsRef.current;
              }}
              className="ui-secondary-button mt-4 min-h-11 px-4 text-sm"
              style={{ color: theme.textColor, borderColor: `${theme.textColor}45` }}
            >
              Skip routine
            </button>
          </div>
        </div>
      )}
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

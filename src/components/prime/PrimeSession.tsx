import { useCallback, useEffect, useMemo, useState } from 'react';
import { CueIntensity, GameResult, SessionOptions } from '../../types/game';
import { PrimeContext, PrimeEngineState, PrimeSessionRecord, PrimeSummaryMetrics } from '../../types/prime';
import { SportType } from '../../config/sports';
import { getPrimeExecutableSteps, getPrimeProtocol, GAMESPEED_PRIME_PROTOCOL_ID } from '../../config/primeProtocols';
import { makePrimeRecipeId, resolvePrimeProtocol } from '../../config/primeRecipes';
import { loadAthletePosition } from '../../config/athletePositions';
import {
  cancelPrimeSession,
  completeCurrentPrimeStep,
  createPrimeSession,
  getCurrentPrimeStep,
  getPrimeProgress,
  isPrimeStepSkippable,
  skipCurrentPrimeStep,
  startCurrentPrimeStep,
} from '../../utils/primeEngine';
import { buildPrimeSummary } from '../../utils/primeMetrics';
import { getCompletedPrimeSessions, recordPrimeSession } from '../../utils/primePersistence';
import { Game } from '../Game';
import { PrimeStepTransition } from './PrimeStepTransition';
import { PrimeSummary } from './PrimeSummary';
import { PhysicalCueSession } from '../physical/PhysicalCueSession';
import { getPhysicalCueModule } from '../../config/physicalCueModules';
import { PhysicalCueMetrics } from '../../types/physicalCue';

interface PrimeSessionProps {
  context: PrimeContext;
  selectedSport: SportType;
  sessionOptions: SessionOptions;
  cueIntensity: CueIntensity;
  hapticsEnabled: boolean;
  lowStimulus: boolean;
  onPersistStep: (input: {
    result: GameResult;
    sessionId: string;
    protocolId: string;
    stepId: string;
  }) => void;
  onComplete: (session: PrimeSessionRecord) => void;
  onCancel: (session: PrimeSessionRecord | null) => void;
}

const formatElapsed = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mediaQuery.matches);
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

const persistEngineSession = (
  state: PrimeEngineState,
  status: 'completed' | 'cancelled',
  endedAt: number,
  summary: PrimeSummaryMetrics,
): PrimeSessionRecord => {
  const protocol = getPrimeProtocol(state.protocolId);
  const record: PrimeSessionRecord = {
    id: state.sessionId,
    ts: endedAt,
    protocolId: protocol.id,
    protocolName: protocol.name,
    recipeId: state.recipeId,
    context: state.context,
    sport: state.sport,
    position: state.position,
    status,
    startedAt: state.startedAt,
    endedAt,
    totalDurationMs: Math.max(0, endedAt - state.startedAt),
    stepResults: state.results,
    summary,
  };
  recordPrimeSession(record);
  return record;
};

export const PrimeSession = ({
  context,
  selectedSport,
  sessionOptions,
  cueIntensity,
  hapticsEnabled,
  lowStimulus,
  onPersistStep,
  onComplete,
  onCancel,
}: PrimeSessionProps) => {
  const [position] = useState(() => loadAthletePosition(selectedSport));
  const protocol = useMemo(
    () => resolvePrimeProtocol({ sport: selectedSport, position, context }),
    [selectedSport, position, context],
  );
  const reducedMotion = usePrefersReducedMotion();
  const [engine, setEngine] = useState<PrimeEngineState>(() =>
    createPrimeSession({
      protocol,
      context,
      sport: selectedSport,
      position,
      recipeId:
        protocol.id === GAMESPEED_PRIME_PROTOCOL_ID
          ? makePrimeRecipeId(selectedSport, position, context)
          : protocol.id,
      lowStimulus,
    }),
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [summary, setSummary] = useState<PrimeSummaryMetrics | null>(null);

  useEffect(() => {
    const timerId = window.setInterval(() => setNowMs(Date.now()), 250);
    return () => window.clearInterval(timerId);
  }, []);

  const step = getCurrentPrimeStep(engine, protocol);
  const executableSteps = getPrimeExecutableSteps(protocol);
  const progress = getPrimeProgress(engine, nowMs);
  const currentExecutableIndex = Math.min(
    executableSteps.findIndex(item => item.id === step?.id) + 1,
    executableSteps.length,
  );

  const finishSession = useCallback(
    (nextState: PrimeEngineState, status: 'completed' | 'cancelled') => {
      const endedAt = Date.now();
      const nextSummary = buildPrimeSummary({
        protocol,
        stepResults: nextState.results,
        totalDurationMs: endedAt - nextState.startedAt,
        previousSessions: getCompletedPrimeSessions().filter(session => session.id !== nextState.sessionId),
      });
      const record = persistEngineSession(nextState, status, endedAt, nextSummary);
      if (status === 'completed') {
        setSummary(nextSummary);
        setEngine(nextState);
        onComplete(record);
        return;
      }
      onCancel(record);
    },
    [onCancel, onComplete, protocol],
  );

  const handleCancelFromTransition = () => {
    if (engine.phase === 'summary') {
      onCancel(null);
      return;
    }
    if (typeof window !== 'undefined' && !window.confirm('Leave Prime and return home?')) {
      return;
    }
    const nextState = cancelPrimeSession(engine, Date.now());
    finishSession(nextState, 'cancelled');
  };

  const handleCancelFromGame = () => {
    const nextState = cancelPrimeSession(engine, Date.now());
    finishSession(nextState, 'cancelled');
  };

  const handleBeginStep = () => {
    setEngine(startCurrentPrimeStep(engine, Date.now()));
  };

  const handleSkip = () => {
    const nextState = skipCurrentPrimeStep(engine, Date.now());
    if (nextState.phase === 'summary') {
      finishSession(nextState, 'completed');
      return;
    }
    setEngine(nextState);
  };

  const handlePhysicalCueComplete = (metrics: PhysicalCueMetrics) => {
    const nextState = completeCurrentPrimeStep(engine, Date.now(), undefined, metrics);
    if (nextState.phase === 'summary') {
      finishSession(nextState, 'completed');
      return;
    }
    setEngine(nextState);
  };

  const handleMovementComplete = () => {
    const nextState = completeCurrentPrimeStep(engine, Date.now());
    if (nextState.phase === 'summary') {
      finishSession(nextState, 'completed');
      return;
    }
    setEngine(nextState);
  };

  const handleDrillComplete = (result: GameResult) => {
    const current = getCurrentPrimeStep(engine, protocol);
    if (current?.modeId && result.mode) {
      onPersistStep({
        result,
        sessionId: engine.sessionId,
        protocolId: engine.protocolId,
        stepId: current.id,
      });
    }
    const nextState = completeCurrentPrimeStep(engine, Date.now(), result);
    if (nextState.phase === 'summary') {
      finishSession(nextState, 'completed');
      return;
    }
    setEngine(nextState);
  };

  const handleSummaryDone = () => {
    onCancel(null);
  };

  if (engine.phase === 'summary' && summary) {
    return <PrimeSummary protocolName={protocol.name} recipeIdentity={engine.recipeId} summary={summary} onDone={handleSummaryDone} />;
  }

  if (!step) {
    return null;
  }

  if (engine.phase === 'running' && step.kind === 'drill' && step.modeId) {
    return (
      <Game
        key={`${engine.sessionId}-${step.id}`}
        mode={step.modeId}
        selectedSport={selectedSport}
        onGameOver={handleDrillComplete}
        onMainMenu={handleCancelFromGame}
        lowStimulusMode={lowStimulus || !!sessionOptions.lowStimulus}
        includeBreathingRoutine={false}
        cueIntensity={cueIntensity}
        hapticsEnabled={hapticsEnabled}
        roundSecondsOverride={step.durationSeconds}
        primeSession
      />
    );
  }

  if (engine.phase === 'running' && step.kind === 'physicalCue') {
    const cueModule = getPhysicalCueModule(step.physicalCueModuleId);
    if (!cueModule) {
      return null;
    }
    return (
      <PhysicalCueSession
        module={cueModule}
        hapticsEnabled={hapticsEnabled}
        lowStimulus={lowStimulus || !!sessionOptions.lowStimulus}
        reducedMotion={reducedMotion || lowStimulus}
        onComplete={handlePhysicalCueComplete}
        onCancel={handleCancelFromGame}
      />
    );
  }

  const isMovementRunning = engine.phase === 'running' && step.kind === 'movement';

  return (
    <PrimeStepTransition
      step={step}
      stepNumber={Math.max(1, currentExecutableIndex)}
      totalSteps={executableSteps.length}
      elapsedLabel={formatElapsed(progress.elapsedMs)}
      progressPercent={progress.percent}
      reducedMotion={reducedMotion || lowStimulus}
      canSkip={engine.phase === 'transition' && isPrimeStepSkippable(step)}
      primaryLabel={isMovementRunning ? 'Done' : 'Begin'}
      onPrimary={isMovementRunning ? handleMovementComplete : handleBeginStep}
      onSkip={engine.phase === 'transition' && isPrimeStepSkippable(step) ? handleSkip : undefined}
      onCancel={handleCancelFromTransition}
    />
  );
};

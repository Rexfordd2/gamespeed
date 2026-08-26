import { GameModeType, GameResult, GameStats, ReadinessMetrics } from '../types/game';
import { getAnimalInstinct } from '../config/animalInstincts';
import { RoundProgressDelta } from './progression';

export interface PerformanceRead {
  headline: string;
  whatThisTrains: string;
  coachRead: string;
  disclaimer: string;
}

const pickResultsLine = (
  mode: GameModeType,
  readiness: ReadinessMetrics | undefined,
  delta: RoundProgressDelta | null,
) => {
  const instinct = getAnimalInstinct(mode);
  const score = readiness?.readinessScore ?? 0;
  if (delta?.newPb || score >= 80) return instinct.resultsLines.strong;
  if (score >= 55) return instinct.resultsLines.mixed;
  return instinct.resultsLines.weak;
};

const pickCoachLine = (
  mode: GameModeType,
  readiness: ReadinessMetrics | undefined,
  delta: RoundProgressDelta | null,
) => {
  const instinct = getAnimalInstinct(mode);
  if (!readiness) return instinct.coachLines.default;

  const lateHeavy = readiness.lateDecisionRatePct >= 20;
  const missHeavy = readiness.missRatePct >= 25;
  const consistent = readiness.consistencyPct >= 70;
  const enduranceDrop =
    (delta?.accuracyDelta ?? 0) < -8 || (delta?.streakDelta ?? 0) < -2 || lateHeavy;

  if (mode === 'peripheralPulse' && missHeavy) return instinct.coachLines.peripheralMiss;
  if (mode === 'sequenceMemory' && missHeavy) return instinct.coachLines.sequenceBreak;
  if (mode === 'calmFocus' && consistent) return instinct.coachLines.calm;
  if (enduranceDrop) return instinct.coachLines.enduranceDrop;
  if (consistent || (delta?.newPb ?? false)) return instinct.coachLines.lockedIn;
  return instinct.coachLines.default;
};

export const buildPerformanceRead = ({
  result,
  roundProgressDelta,
}: {
  result: GameResult;
  stats: GameStats;
  roundProgressDelta: RoundProgressDelta | null;
}): PerformanceRead => {
  const instinct = getAnimalInstinct(result.mode);
  const readiness = result.readinessMetrics;
  const comparison =
    roundProgressDelta?.medianRtDelta !== null && roundProgressDelta?.medianRtDelta !== undefined
      ? roundProgressDelta.medianRtDelta > 0
        ? `Your average reaction improved ${roundProgressDelta.medianRtDelta} ms from your previous ${instinct.experienceName} session.`
        : roundProgressDelta.medianRtDelta < 0
          ? `Your average reaction slowed ${Math.abs(roundProgressDelta.medianRtDelta)} ms versus your previous ${instinct.experienceName} session.`
          : `Reaction timing matched your previous ${instinct.experienceName} session.`
      : roundProgressDelta
        ? `Score ${roundProgressDelta.scoreDelta >= 0 ? '+' : ''}${roundProgressDelta.scoreDelta} and accuracy ${roundProgressDelta.accuracyDelta >= 0 ? '+' : ''}${roundProgressDelta.accuracyDelta}% versus your prior best signals.`
        : 'Complete another session to compare against your own baseline.';

  return {
    headline: pickResultsLine(result.mode, readiness, roundProgressDelta),
    whatThisTrains: `${instinct.whatThisTrains} ${comparison}`,
    coachRead: pickCoachLine(result.mode, readiness, roundProgressDelta),
    disclaimer:
      'GameSpeed Score is a training performance metric, not a medical or neurological diagnosis.',
  };
};

export const getSubScoreVisibility = (mode: GameModeType) => ({
  reaction: true,
  vision: true,
  control: true,
  memory: mode === 'sequenceMemory',
  awareness: mode === 'peripheralPulse' || mode === 'multiTarget',
});

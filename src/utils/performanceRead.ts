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
) => {
  const instinct = getAnimalInstinct(mode);
  if (!readiness) return instinct.coachLines.default;

  const lateHeavy = readiness.lateDecisionRatePct >= 20;
  const missHeavy = readiness.missRatePct >= 25;
  const consistent = readiness.consistencyPct >= 70;
  if (mode === 'peripheralPulse' && missHeavy) return instinct.coachLines.peripheralMiss;
  if (mode === 'sequenceMemory' && missHeavy) return instinct.coachLines.sequenceBreak;
  if (mode === 'calmFocus' && consistent) return instinct.coachLines.calm;
  // Aggregate misses do not establish a decline within the round.
  if (lateHeavy) return `${readiness.lateDecisionRatePct}% of attempts were late. Repeat the drill and focus on responding before the cue expires.`;
  if (consistent) return instinct.coachLines.lockedIn;
  return instinct.coachLines.default;
};

export const buildPerformanceRead = ({
  result,
  stats,
  roundProgressDelta,
}: {
  result: GameResult;
  stats: GameStats;
  roundProgressDelta: RoundProgressDelta | null;
}): PerformanceRead => {
  const instinct = getAnimalInstinct(result.mode);
  const readiness = result.readinessMetrics;
  // EndScreen receives history after the current round has been saved.
  const hasPriorRound = stats.rounds.filter(round => round.mode === result.mode).length > 1;
  const comparisonDelta = hasPriorRound ? roundProgressDelta : null;
  const enoughHits = result.score >= 2;
  const comparison =
    comparisonDelta?.medianRtDelta !== null && comparisonDelta?.medianRtDelta !== undefined
      ? comparisonDelta.medianRtDelta > 0
        ? `Your median reaction improved ${comparisonDelta.medianRtDelta} ms from your previous ${instinct.experienceName} personal best.`
        : comparisonDelta.medianRtDelta < 0
          ? `Your median reaction was ${Math.abs(comparisonDelta.medianRtDelta)} ms slower than your previous ${instinct.experienceName} personal best.`
          : `Median reaction timing matched your previous ${instinct.experienceName} personal best.`
      : comparisonDelta
        ? `Score ${comparisonDelta.scoreDelta >= 0 ? '+' : ''}${comparisonDelta.scoreDelta} and accuracy ${comparisonDelta.accuracyDelta >= 0 ? '+' : ''}${comparisonDelta.accuracyDelta} percentage points versus your prior best signals.`
        : 'Complete another session to compare against your own baseline.';

  return {
    headline: enoughHits && hasPriorRound ? pickResultsLine(result.mode, readiness, comparisonDelta) : 'Session recorded.',
    whatThisTrains: `${instinct.whatThisTrains} ${comparison}`,
    coachRead: enoughHits ? pickCoachLine(result.mode, readiness) : 'Fewer than two successful responses were recorded. Repeat the drill before drawing conclusions about your timing or consistency.',
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

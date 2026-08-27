import { PrimeProtocol, PrimeSessionRecord, PrimeStepResult, PrimeSummaryMetrics } from '../types/prime';

const roundToInt = (value: number) => Math.round(value);

const avg = (values: number[]): number | null => {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const accuracyFromResult = (result: PrimeStepResult): number | null => {
  const gameResult = result.gameResult;
  if (!gameResult || result.status !== 'completed') return null;
  const attempts = Math.max(
    gameResult.score + gameResult.misses,
    gameResult.totalAttempts ?? gameResult.score + gameResult.misses,
  );
  if (attempts <= 0) return null;
  return roundToInt((gameResult.score / attempts) * 100);
};

const reactionFromResult = (result: PrimeStepResult): number | null => {
  const metrics = result.gameResult?.readinessMetrics?.reactionTimeMs;
  const median = metrics?.median ?? result.gameResult?.medianReactionTimeMs;
  return typeof median === 'number' && Number.isFinite(median) && median > 0 ? median : null;
};

const consistencyFromResult = (result: PrimeStepResult): number | null => {
  const value = result.gameResult?.readinessMetrics?.consistencyPct;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

const stepLabel = (protocol: PrimeProtocol, stepId: string): string => {
  const step = protocol.steps.find(item => item.id === stepId);
  if (!step) return stepId;
  return `${step.title} · ${step.experienceName}`;
};

export const buildPrimeSummary = ({
  protocol,
  stepResults,
  totalDurationMs,
  previousSessions = [],
}: {
  protocol: PrimeProtocol;
  stepResults: PrimeStepResult[];
  totalDurationMs: number;
  previousSessions?: PrimeSessionRecord[];
}): PrimeSummaryMetrics => {
  const completed = stepResults.filter(result => result.status === 'completed');
  const skipped = stepResults.filter(result => result.status === 'skipped');
  const accuracies = completed
    .map(result => {
      const accuracyPct = accuracyFromResult(result);
      return accuracyPct === null
        ? null
        : { stepId: result.stepId, label: stepLabel(protocol, result.stepId), accuracyPct };
    })
    .filter((value): value is { stepId: string; label: string; accuracyPct: number } => value !== null);

  const strongestArea =
    accuracies.length === 0
      ? null
      : accuracies.reduce((best, item) => (item.accuracyPct > best.accuracyPct ? item : best));
  const areaToRevisit =
    accuracies.length < 2
      ? null
      : accuracies.reduce((worst, item) => (item.accuracyPct < worst.accuracyPct ? item : worst));

  const trackingStep = completed.find(result => result.modeId === 'holdTrack' && result.status === 'completed');
  const physicalCueResult = [...stepResults].reverse().find(result => result.physicalCue);
  const previousSessionsForProtocol = previousSessions
    .filter(session => session.status === 'completed' && session.protocolId === protocol.id)
    .sort((a, b) => a.ts - b.ts);
  const previous = previousSessionsForProtocol[previousSessionsForProtocol.length - 1];

  const averageAccuracyPct = avg(accuracies.map(item => item.accuracyPct));
  const previousAccuracy = previous?.summary.averageAccuracyPct ?? null;
  const durationSeconds = Math.max(0, roundToInt(totalDurationMs / 1000));

  return {
    stepsCompleted: completed.length,
    stepsSkipped: skipped.length,
    totalDurationSeconds: durationSeconds,
    averageAccuracyPct: averageAccuracyPct === null ? null : roundToInt(averageAccuracyPct),
    averageReactionMs: (() => {
      const median = avg(completed.map(reactionFromResult).filter((value): value is number => value !== null));
      return median === null ? null : roundToInt(median);
    })(),
    trackingAccuracyPct: trackingStep ? accuracyFromResult(trackingStep) : null,
    consistencyPct: (() => {
      const median = avg(completed.map(consistencyFromResult).filter((value): value is number => value !== null));
      return median === null ? null : roundToInt(median);
    })(),
    strongestArea,
    areaToRevisit:
      strongestArea && areaToRevisit && areaToRevisit.stepId === strongestArea.stepId ? null : areaToRevisit,
    vsPrevious:
      previous === undefined
        ? null
        : {
            accuracyDeltaPct:
              averageAccuracyPct === null || previousAccuracy === null
                ? null
                : roundToInt(averageAccuracyPct - previousAccuracy),
            durationDeltaSeconds: durationSeconds - previous.summary.totalDurationSeconds,
          },
    physicalCue: physicalCueResult?.physicalCue
      ? {
          cueCount: physicalCueResult.physicalCue.cueCount,
          presentedCueCount: physicalCueResult.physicalCue.presentedCueCount,
          cueIntervalMs: physicalCueResult.physicalCue.cueIntervalMs,
          athleteConfirmed: physicalCueResult.physicalCue.athleteConfirmed,
        }
      : null,
  };
};

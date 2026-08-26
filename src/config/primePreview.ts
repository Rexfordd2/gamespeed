import { PrimeProtocol } from '../types/prime';
import { getPrimeExecutableSteps, resolvePrimeProtocol } from './primeProtocols';

export const formatPrimeDurationLabel = (estimatedSeconds: number) => {
  const minutes = Math.max(1, Math.round(estimatedSeconds / 60));
  return `${minutes} MINUTE PRIME`;
};

export const getPrimePreview = (protocol: PrimeProtocol = resolvePrimeProtocol()) => ({
  durationLabel: formatPrimeDurationLabel(protocol.estimatedSeconds),
  phases: getPrimeExecutableSteps(protocol).map(step => ({
    id: step.id,
    label: step.title,
    summary: step.instruction,
    experienceName: step.experienceName,
  })),
});

const defaultPreview = getPrimePreview();

export const PRIME_PREVIEW_DURATION_LABEL = defaultPreview.durationLabel;
export const PRIME_PREVIEW_PHASES = defaultPreview.phases;

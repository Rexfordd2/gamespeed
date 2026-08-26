import { PrimeProtocol } from '../types/prime';
import { getPrimeExecutableSteps, resolvePrimeProtocol } from './primeProtocols';

export const formatPrimeDurationLabel = (estimatedSeconds: number) => {
  const minutes = Math.max(1, Math.round(estimatedSeconds / 60));
  return `${minutes} MINUTE PRIME`;
};

export const getPrimePreview = (protocol: PrimeProtocol = resolvePrimeProtocol()) => {
  const executable = getPrimeExecutableSteps(protocol);
  const phases = executable.map(step => ({
    id: step.id,
    label: step.title,
    summary: step.instruction,
    experienceName: step.experienceName,
  }));
  const drillLabels = executable
    .filter(step => step.kind === 'drill')
    .map(step => step.title.toLowerCase())
    .join(', ');
  return {
    durationLabel: formatPrimeDurationLabel(protocol.estimatedSeconds),
    phases,
    sequenceBlurb: `sequence: ${drillLabels}, then a short physical ready cue.`,
  };
};

const defaultPreview = getPrimePreview();

export const PRIME_PREVIEW_DURATION_LABEL = defaultPreview.durationLabel;
export const PRIME_PREVIEW_PHASES = defaultPreview.phases;

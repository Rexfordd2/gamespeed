import { PrimeContext, PrimeProtocol } from '../types/prime';
import { SportType } from './sports';
import { getPrimeExecutableSteps } from './primeProtocols';
import {
  formatPrimeContextHeadline,
  formatPrimeIdentityLine,
  resolvePrimeProtocol,
} from './primeRecipes';

export const formatPrimeDurationLabel = (estimatedSeconds: number) => {
  const minutes = Math.max(1, Math.round(estimatedSeconds / 60));
  return `${minutes} MINUTE PRIME`;
};

export const formatPrimeMinutesLabel = (estimatedSeconds: number) => {
  const minutes = Math.max(1, Math.round(estimatedSeconds / 60));
  return `${minutes} MIN`;
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
  const hasMove = executable.some(step => step.kind === 'movement' || step.kind === 'physicalCue');
  return {
    durationLabel: formatPrimeDurationLabel(protocol.estimatedSeconds),
    minutesLabel: formatPrimeMinutesLabel(protocol.estimatedSeconds),
    phases,
    sequenceBlurb: hasMove
      ? `sequence: ${drillLabels}, then a short physical ready cue.`
      : `sequence: ${drillLabels}.`,
  };
};

export const getPrimeHomeCard = ({
  sport,
  position,
  context,
}: {
  sport: SportType;
  position?: string | null;
  context: PrimeContext;
}) => {
  const protocol = resolvePrimeProtocol({ sport, position: position ?? undefined, context });
  const preview = getPrimePreview(protocol);
  return {
    protocol,
    ...preview,
    identityLine: formatPrimeIdentityLine(sport, position),
    contextHeadline: formatPrimeContextHeadline(context),
  };
};

const defaultPreview = getPrimePreview();

export const PRIME_PREVIEW_DURATION_LABEL = defaultPreview.durationLabel;
export const PRIME_PREVIEW_PHASES = defaultPreview.phases;

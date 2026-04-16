import { Target, GenerateTargetsParams } from '../types/game';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const SEQUENCE_MIN_LENGTH = 3;
export const SEQUENCE_MAX_LENGTH = 6;

export const getSequenceLengthForSuccesses = (successfulSequences: number) => {
  const growth = Math.floor(successfulSequences / 2);
  return clamp(SEQUENCE_MIN_LENGTH + growth, SEQUENCE_MIN_LENGTH, SEQUENCE_MAX_LENGTH);
};

export const getSequencePreviewStepMs = (screenWidth: number) => (screenWidth <= 768 ? 900 : 760);

export const generateSequenceTargets = ({
  screenSize,
  sequenceLength,
  currentTime = Date.now(),
  targetLifespan = 120,
}: {
  screenSize: { width: number; height: number };
  sequenceLength: number;
  currentTime?: number;
  targetLifespan?: number;
}): Target[] => {
  const compactViewport = screenSize.width <= 768;
  const xMarginPercent = compactViewport ? 18 : 13;
  const yMarginPercent = compactViewport ? 22 : 17;
  const xRange = 100 - xMarginPercent * 2;
  const yRange = 100 - yMarginPercent * 2;
  const minSpacingPercent = compactViewport ? 20 : 14;
  const targets: Target[] = [];

  const pointIsSpaced = (x: number, y: number) =>
    targets.every(existing => {
      const dx = x - existing.x;
      const dy = y - existing.y;
      return Math.hypot(dx, dy) >= minSpacingPercent;
    });

  for (let i = 0; i < sequenceLength; i++) {
    let x = Math.random() * xRange + xMarginPercent;
    let y = Math.random() * yRange + yMarginPercent;
    for (let attempt = 0; attempt < 24; attempt++) {
      if (pointIsSpaced(x, y)) break;
      x = Math.random() * xRange + xMarginPercent;
      y = Math.random() * yRange + yMarginPercent;
    }

    targets.push({
      id: `sm-${currentTime}-${i}`,
      x,
      y,
      type: 'monkey',
      createdAt: currentTime,
      duration: targetLifespan,
      lifespan: targetLifespan,
    });
  }

  return targets;
};

export const generateTargets = ({
  screenSize,
  existingTargets,
  currentTime = Date.now(),
  maxTargets = 5,
  targetLifespan = 120,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const active = existingTargets.filter(
      t => currentTime - t.createdAt < t.lifespan * 1000,
    );
    if (active.length > 0) return active;
  }

  return generateSequenceTargets({
    screenSize,
    sequenceLength: clamp(maxTargets, SEQUENCE_MIN_LENGTH, SEQUENCE_MAX_LENGTH),
    currentTime,
    targetLifespan,
  });
};

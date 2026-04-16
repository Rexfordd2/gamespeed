import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({
  screenSize,
  existingTargets,
  maxTargets = 1,
  targetLifespan = 1.5,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const now = Date.now();
    const active = existingTargets.filter(
      t => now - t.createdAt < t.lifespan * 1000,
    );
    if (active.length >= maxTargets) return active;
  }

  const now = Date.now();
  const compactViewport = screenSize.width <= 768;
  const xMarginPercent = compactViewport ? 16 : 11;
  const yMarginPercent = 15;
  const xRange = 100 - xMarginPercent * 2;
  const yRange = 100 - yMarginPercent * 2;
  const x = Math.random() * xRange + xMarginPercent;
  const y = Math.random() * yRange + yMarginPercent;

  return [
    {
      id: `qt-${now}`,
      x,
      y,
      type: 'monkey',
      createdAt: now,
      duration: targetLifespan,
      lifespan: targetLifespan,
    },
  ];
};

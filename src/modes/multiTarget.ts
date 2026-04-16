import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({
  screenSize,
  existingTargets,
  maxTargets = 5,
  targetLifespan = 2.5,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const now = Date.now();
    const active = existingTargets.filter(
      t => now - t.createdAt < t.lifespan * 1000,
    );
    if (active.length > 0) return active;
  }

  const now = Date.now();
  const targets: Target[] = [];
  const compactViewport = screenSize.width <= 768;
  const xMarginPercent = compactViewport ? 16 : 11;
  const yMarginPercent = 15;
  const xRange = 100 - xMarginPercent * 2;
  const yRange = 100 - yMarginPercent * 2;
  const minSpacingPercent = compactViewport ? 19 : 13;

  const pointIsSpaced = (x: number, y: number) =>
    targets.every(existing => {
      const dx = x - existing.x;
      const dy = y - existing.y;
      return Math.hypot(dx, dy) >= minSpacingPercent;
    });

  for (let i = 0; i < maxTargets; i++) {
    let x = Math.random() * xRange + xMarginPercent;
    let y = Math.random() * yRange + yMarginPercent;

    for (let attempt = 0; attempt < 20; attempt++) {
      if (pointIsSpaced(x, y)) break;
      x = Math.random() * xRange + xMarginPercent;
      y = Math.random() * yRange + yMarginPercent;
    }

    targets.push({
      id: `mt-${now}-${i}`,
      x,
      y,
      type: 'monkey',
      createdAt: now,
      duration: targetLifespan,
      lifespan: targetLifespan,
    });
  }

  return targets;
};

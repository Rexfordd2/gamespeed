import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({
  screenSize,
  existingTargets,
  currentTime = Date.now(),
  targetLifespan = 3.0,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const active = existingTargets.filter(
      t => currentTime - t.createdAt < t.lifespan * 1000,
    );
    if (active.length > 0) return active;
  }

  const compactViewport = screenSize.width <= 768;
  const xMarginPercent = compactViewport ? 20 : 15;
  const yMarginPercent = compactViewport ? 23 : 18;
  const xRange = 100 - xMarginPercent * 2;
  const yRange = 100 - yMarginPercent * 2;
  const travelDistance = compactViewport ? 22 : 28;
  const centerX = Math.random() * xRange + xMarginPercent;
  const centerY = Math.random() * yRange + yMarginPercent;
  const angle = Math.random() * Math.PI * 2;
  const compactHoldRadius = compactViewport ? 78 : 92;
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const dx = Math.cos(angle) * (travelDistance / 2);
  const dy = Math.sin(angle) * (travelDistance / 2);

  const fromX = clamp(centerX - dx, xMarginPercent, 100 - xMarginPercent);
  const toX = clamp(centerX + dx, xMarginPercent, 100 - xMarginPercent);
  const fromY = clamp(centerY - dy, yMarginPercent, 100 - yMarginPercent);
  const toY = clamp(centerY + dy, yMarginPercent, 100 - yMarginPercent);

  return [
    {
      id: `ht-${currentTime}`,
      x: fromX,
      y: fromY,
      type: 'monkey',
      movement: {
        fromX,
        fromY,
        toX,
        toY,
      },
      hold: {
        requiredMs: compactViewport ? 900 : 850,
        breakRadiusPx: compactHoldRadius,
      },
      createdAt: currentTime,
      duration: targetLifespan,
      lifespan: targetLifespan,
    },
  ];
};

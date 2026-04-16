import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({
  screenSize,
  existingTargets,
  currentTime = Date.now(),
  targetLifespan = 2.0,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const active = existingTargets.filter(
      t => currentTime - t.createdAt < t.lifespan * 1000,
    );
    if (active.length > 0) return active;
  }

  const compactViewport = screenSize.width <= 768;
  const xMarginPercent = compactViewport ? 18 : 14;
  const yMarginPercent = compactViewport ? 20 : 16;
  const xRange = 100 - xMarginPercent * 2;
  const yRange = 100 - yMarginPercent * 2;
  const travelDistance = compactViewport ? 28 : 32;
  const directions = ['left', 'right', 'up', 'down'] as const;
  const swipeDirection = directions[Math.floor(Math.random() * directions.length)];

  const centerX = Math.random() * xRange + xMarginPercent;
  const centerY = Math.random() * yRange + yMarginPercent;
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  let fromX = centerX;
  let toX = centerX;
  let fromY = centerY;
  let toY = centerY;

  if (swipeDirection === 'right') {
    fromX = clamp(centerX - travelDistance / 2, xMarginPercent, 100 - xMarginPercent);
    toX = clamp(centerX + travelDistance / 2, xMarginPercent, 100 - xMarginPercent);
  } else if (swipeDirection === 'left') {
    fromX = clamp(centerX + travelDistance / 2, xMarginPercent, 100 - xMarginPercent);
    toX = clamp(centerX - travelDistance / 2, xMarginPercent, 100 - xMarginPercent);
  } else if (swipeDirection === 'down') {
    fromY = clamp(centerY - travelDistance / 2, yMarginPercent, 100 - yMarginPercent);
    toY = clamp(centerY + travelDistance / 2, yMarginPercent, 100 - yMarginPercent);
  } else {
    fromY = clamp(centerY + travelDistance / 2, yMarginPercent, 100 - yMarginPercent);
    toY = clamp(centerY - travelDistance / 2, yMarginPercent, 100 - yMarginPercent);
  }

  return [
    {
      id: `ss-${currentTime}`,
      x: fromX,
      y: fromY,
      type: 'monkey',
      swipeDirection,
      movement: {
        fromX,
        fromY,
        toX,
        toY,
      },
      createdAt: currentTime,
      duration: targetLifespan,
      lifespan: targetLifespan,
    },
  ];
};

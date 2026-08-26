import { GenerateTargetsParams, Target } from '../types/game';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const generateTargets = ({
  existingTargets,
  currentTime = Date.now(),
  maxTargets = 2,
  targetLifespan = 1.85,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const active = existingTargets.filter(target => currentTime - target.createdAt < target.lifespan * 1000);
    if (active.length > 0) return active;
  }

  const yCenter = 18 + Math.random() * 64;
  const laneOffset = 24 + Math.random() * 7;
  const leftX = clamp(50 - laneOffset, 10, 40);
  const rightX = clamp(50 + laneOffset, 60, 90);
  const count = Math.max(1, Math.min(maxTargets, 3));

  const targets: Target[] = [
    {
      id: `pp-${currentTime}-l`,
      x: leftX,
      y: yCenter,
      type: 'monkey',
      createdAt: currentTime,
      duration: targetLifespan,
      lifespan: targetLifespan,
      stimulusVariant: 'peripheral',
    },
    {
      id: `pp-${currentTime}-r`,
      x: rightX,
      y: yCenter,
      type: 'monkey',
      createdAt: currentTime,
      duration: targetLifespan,
      lifespan: targetLifespan,
      stimulusVariant: 'contrast',
    },
  ];

  if (count === 3) {
    targets.push({
      id: `pp-${currentTime}-c`,
      x: 50,
      y: clamp(yCenter + (Math.random() > 0.5 ? 14 : -14), 16, 86),
      type: 'monkey',
      createdAt: currentTime,
      duration: targetLifespan,
      lifespan: targetLifespan,
      stimulusVariant: 'standard',
    });
  }

  return targets.slice(0, count);
};


import { GenerateTargetsParams, Target } from '../types/game';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const generateTargets = ({
  existingTargets,
  currentTime = Date.now(),
  targetLifespan = 2.6,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const active = existingTargets.filter(target => currentTime - target.createdAt < target.lifespan * 1000);
    if (active.length > 0) return active;
  }

  const x = clamp(45 + (Math.random() - 0.5) * 20, 24, 76);
  const y = clamp(48 + (Math.random() - 0.5) * 16, 24, 82);

  const target: Target = {
    id: `cf-${currentTime}`,
    x,
    y,
    type: 'monkey',
    createdAt: currentTime,
    duration: targetLifespan,
    lifespan: targetLifespan,
    stimulusVariant: 'calm',
  };

  return [target];
};


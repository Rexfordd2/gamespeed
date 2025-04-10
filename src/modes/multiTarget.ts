import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({ screenSize, existingTargets }: GenerateTargetsParams): Target[] => {
  // If we already have enough targets, keep them
  if (existingTargets.length >= 5) {
    return existingTargets;
  }

  const currentTime = Date.now();
  const newTargets = [...existingTargets];

  // Generate new targets up to the maximum
  while (newTargets.length < 5) {
    const x = Math.random() * (screenSize.width - 100);
    const y = Math.random() * (screenSize.height - 100);

    const target: Target = {
      id: `target-${currentTime}-${newTargets.length}`,
      x,
      y,
      type: 'monkey',
      createdAt: currentTime,
      duration: 1.5,
      lifespan: 1.5
    };

    newTargets.push(target);
  }

  return newTargets;
}; 
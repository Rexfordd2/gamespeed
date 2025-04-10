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
    const x = (Math.random() * 80 + 10); // Keep targets within 10-90% of screen width
    const y = (Math.random() * 80 + 10); // Keep targets within 10-90% of screen height

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
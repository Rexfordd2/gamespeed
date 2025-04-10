import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({ screenSize, existingTargets }: GenerateTargetsParams): Target[] => {
  const maxTargets = 5;
  const currentTime = Date.now();
  const newTargets = [...existingTargets];

  // Remove expired targets
  const now = Date.now();
  const activeTargets = newTargets.filter(target => {
    const timeElapsed = now - target.createdAt;
    return timeElapsed < target.lifespan * 1000;
  });

  // Generate new targets up to the maximum
  while (activeTargets.length < maxTargets) {
    const x = (Math.random() * 80 + 10); // Keep targets within 10-90% of screen width
    const y = (Math.random() * 80 + 10); // Keep targets within 10-90% of screen height

    const target: Target = {
      id: `target-${currentTime}-${activeTargets.length}`,
      x,
      y,
      type: 'monkey',
      createdAt: currentTime,
      duration: 1.5,
      lifespan: 1.5
    };

    activeTargets.push(target);
  }

  return activeTargets;
}; 
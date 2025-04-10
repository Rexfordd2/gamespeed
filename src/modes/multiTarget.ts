import { Target } from '../types/game';

interface GenerateTargetsParams {
  screenSize: { width: number; height: number };
  existingTargets: Target[];
}

export const generateTargets = ({ screenSize, existingTargets }: GenerateTargetsParams): Target[] => {
  // Multi target mode allows up to 5 targets at a time
  if (existingTargets.length >= 5) {
    return existingTargets;
  }

  const x = Math.random() * (screenSize.width - 100);
  const y = Math.random() * (screenSize.height - 100);
  const currentTime = Date.now();

  const newTarget: Target = {
    id: `target-${currentTime}`,
    x,
    y,
    type: 'monkey',
    createdAt: currentTime,
    duration: 1.5,
    lifespan: 1.5
  };

  return [...existingTargets, newTarget];
}; 
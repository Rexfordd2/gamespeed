import { Target } from '../types/game';

interface GenerateTargetsParams {
  screenSize: { width: number; height: number };
  existingTargets: Target[];
}

export const generateTargets = ({ screenSize, existingTargets }: GenerateTargetsParams): Target[] => {
  // Multi target mode allows up to 5 targets
  if (existingTargets.length >= 5) {
    return existingTargets;
  }

  const newTarget: Target = {
    id: Math.random().toString(36).substr(2, 9),
    x: Math.random() * (screenSize.width - 100) + 50, // Keep away from edges
    y: Math.random() * (screenSize.height - 100) + 50,
    type: 'monkey',
    createdAt: Date.now(),
    duration: 1500, // 1.5 second lifespan
  };

  return [...existingTargets, newTarget];
}; 
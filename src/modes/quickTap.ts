import { Target } from '../types/game';

interface GenerateTargetsParams {
  screenSize: { width: number; height: number };
  existingTargets: Target[];
}

export const generateTargets = ({ screenSize, existingTargets }: GenerateTargetsParams): Target[] => {
  // Quick tap mode only allows one target at a time
  if (existingTargets.length > 0) {
    return existingTargets;
  }

  const target: Target = {
    id: Math.random().toString(36).substr(2, 9),
    x: Math.random() * (screenSize.width - 100) + 50, // Keep away from edges
    y: Math.random() * (screenSize.height - 100) + 50,
    type: 'monkey',
    createdAt: Date.now(),
    duration: 1000, // 1 second lifespan
  };

  return [target];
}; 
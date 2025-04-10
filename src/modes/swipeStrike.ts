import { Target } from '../types/game';

interface GenerateTargetsParams {
  screenSize: { width: number; height: number };
  existingTargets: Target[];
}

export const generateTargets = ({ screenSize, existingTargets }: GenerateTargetsParams): Target[] => {
  // Swipe strike mode only allows one target at a time
  if (existingTargets.length > 0) {
    return existingTargets;
  }

  const currentTime = Date.now();
  const startX = Math.random() * (screenSize.width - 200) + 100;
  const startY = Math.random() * (screenSize.height - 200) + 100;
  const endX = Math.random() * (screenSize.width - 200) + 100;
  const endY = Math.random() * (screenSize.height - 200) + 100;

  const target: Target = {
    id: `target-${currentTime}`,
    x: startX,
    y: startY,
    type: 'swipe',
    createdAt: currentTime,
    duration: 1.0,
    lifespan: 1.0,
    movement: {
      startX,
      endX,
      startY,
      endY,
      startTime: currentTime,
      duration: 1.0
    }
  };

  return [target];
}; 
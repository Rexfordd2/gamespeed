import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({ screenSize, existingTargets }: GenerateTargetsParams): Target[] => {
  // If we already have targets, keep them
  if (existingTargets.length > 0) {
    return existingTargets;
  }

  const currentTime = Date.now();
  const startX = Math.random() * (screenSize.width - 200) + 100;
  const startY = Math.random() * (screenSize.height - 200) + 100;
  
  // Create a circular or figure-8 movement pattern
  const radius = 100;
  const centerX = startX;
  const centerY = startY;
  const endX = centerX + radius;
  const endY = centerY;

  const target: Target = {
    id: `target-${currentTime}`,
    x: startX,
    y: startY,
    type: 'hold',
    createdAt: currentTime,
    duration: 2.0,
    lifespan: 2.0,
    movement: {
      startX: centerX,
      endX,
      startY: centerY,
      endY,
      startTime: currentTime,
      duration: 2000 // 2 seconds per movement cycle
    }
  };

  return [target];
}; 
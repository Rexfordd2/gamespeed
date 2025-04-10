import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({ screenSize, existingTargets }: GenerateTargetsParams): Target[] => {
  // If we already have targets, keep them
  if (existingTargets.length > 0) {
    return existingTargets;
  }

  const currentTime = Date.now();
  const startX = Math.random() < 0.5 ? -10 : 110; // Start from outside the screen
  const endX = startX < 0 ? 110 : -10; // Move to the other side
  const y = Math.random() * 80 + 10; // Keep vertical position within 10-90%

  const target: Target = {
    id: `target-${currentTime}`,
    x: startX,
    y,
    type: 'swipe',
    createdAt: currentTime,
    duration: 1.0,
    lifespan: 1.0,
    movement: {
      startX,
      endX,
      startY: y,
      endY: y,
      startTime: currentTime,
      duration: 2000 // 2 seconds to cross the screen
    }
  };

  return [target];
}; 
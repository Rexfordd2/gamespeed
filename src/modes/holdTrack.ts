import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({ screenSize, existingTargets }: GenerateTargetsParams): Target[] => {
  // If we already have a target, keep it
  if (existingTargets.length > 0) {
    // Check if target has expired
    const now = Date.now();
    const activeTargets = existingTargets.filter(target => {
      const timeElapsed = now - target.createdAt;
      return timeElapsed < target.lifespan * 1000;
    });

    if (activeTargets.length > 0) {
      return activeTargets;
    }
  }

  // Generate a new target
  const currentTime = Date.now();
  const centerX = Math.random() * 60 + 20; // Keep center within 20-80% of screen width
  const centerY = Math.random() * 60 + 20; // Keep center within 20-80% of screen height
  
  // Create a circular movement pattern
  const radius = 10; // 10% of screen size
  const endX = centerX + radius;
  const endY = centerY;

  const target: Target = {
    id: `target-${currentTime}`,
    x: centerX,
    y: centerY,
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
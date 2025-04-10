import { Target } from '../types/game';

interface GenerateTargetsParams {
  screenSize: { width: number; height: number };
  existingTargets: Target[];
  currentTime: number;
}

export const generateTargets = ({ screenSize, existingTargets, currentTime }: GenerateTargetsParams): Target[] => {
  // Only allow one target at a time
  if (existingTargets.length > 0) {
    return existingTargets;
  }

  // Randomly choose path type (horizontal or vertical)
  const isHorizontal = Math.random() > 0.5;
  let startX, startY, endX, endY;

  if (isHorizontal) {
    // Horizontal path (left to right)
    startX = -100;
    startY = Math.random() * (screenSize.height - 200) + 100;
    endX = screenSize.width + 100;
    endY = startY;
  } else {
    // Vertical path (top to bottom)
    startX = Math.random() * (screenSize.width - 200) + 100;
    startY = -100;
    endX = startX;
    endY = screenSize.height + 100;
  }

  const duration = 3000 + Math.random() * 1000; // Random duration between 3 and 4 seconds

  const target: Target = {
    id: Math.random().toString(36).substr(2, 9),
    x: startX,
    y: startY,
    type: 'hold',
    createdAt: currentTime,
    duration,
    movement: {
      startX,
      endX,
      startY,
      endY,
      startTime: currentTime,
      duration,
    },
  };

  return [target];
}; 
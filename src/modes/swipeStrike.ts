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

  // Randomly choose direction (left to right, right to left, top to bottom, or bottom to top)
  const direction = Math.floor(Math.random() * 4);
  let startX, startY, endX, endY;

  switch (direction) {
    case 0: // Left to right
      startX = -100;
      startY = Math.random() * (screenSize.height - 200) + 100;
      endX = screenSize.width + 100;
      endY = startY;
      break;
    case 1: // Right to left
      startX = screenSize.width + 100;
      startY = Math.random() * (screenSize.height - 200) + 100;
      endX = -100;
      endY = startY;
      break;
    case 2: // Top to bottom
      startX = Math.random() * (screenSize.width - 200) + 100;
      startY = -100;
      endX = startX;
      endY = screenSize.height + 100;
      break;
    case 3: // Bottom to top
      startX = Math.random() * (screenSize.width - 200) + 100;
      startY = screenSize.height + 100;
      endX = startX;
      endY = -100;
      break;
    default:
      startX = -100;
      startY = screenSize.height / 2;
      endX = screenSize.width + 100;
      endY = screenSize.height / 2;
  }

  const duration = 1500 + Math.random() * 1000; // Random duration between 1.5 and 2.5 seconds

  const target: Target = {
    id: Math.random().toString(36).substr(2, 9),
    x: startX,
    y: startY,
    type: 'swipe',
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
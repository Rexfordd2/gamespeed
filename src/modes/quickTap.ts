import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({ screenSize }: GenerateTargetsParams): Target[] => {
  const x = (Math.random() * 80 + 10); // Keep targets within 10-90% of screen width
  const y = (Math.random() * 80 + 10); // Keep targets within 10-90% of screen height
  const currentTime = Date.now();

  const target: Target = {
    id: `target-${currentTime}`,
    x,
    y,
    type: 'monkey',
    createdAt: currentTime,
    duration: 1.5,
    lifespan: 1.5
  };

  return [target];
}; 
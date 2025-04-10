import { Target, GenerateTargetsParams } from '../types/game';

export const generateTargets = ({ screenSize }: GenerateTargetsParams): Target[] => {
  const x = Math.random() * (screenSize.width - 100);
  const y = Math.random() * (screenSize.height - 100);
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
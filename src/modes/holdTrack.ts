import { Target, GenerateTargetsParams } from '../types/game';

// Locked for v1 — mode is marked comingSoon in the registry.
export const generateTargets = ({
  existingTargets,
  targetLifespan = 3.0,
}: GenerateTargetsParams): Target[] => {
  if (existingTargets.length > 0) {
    const now = Date.now();
    const active = existingTargets.filter(
      t => now - t.createdAt < t.lifespan * 1000,
    );
    if (active.length > 0) return active;
  }

  const now = Date.now();
  return [
    {
      id: `ht-${now}`,
      x: Math.random() * 80 + 10,
      y: Math.random() * 75 + 15,
      type: 'monkey',
      createdAt: now,
      duration: targetLifespan,
      lifespan: targetLifespan,
    },
  ];
};
